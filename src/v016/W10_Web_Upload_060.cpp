/*
 * ------------------------------------------------------
 * 소스명 : W10_Web_Upload_060.cpp
 * 모듈 약어 : W10
 * 모듈명 : Smart Nature Wind Web API (v029) - Upload/OTA Implementation
 * ------------------------------------------------------
 * 기능 요약:
 * - LittleFS 파일 업로드 및 OTA 펌웨어 업데이트 라우팅 구현
 * ------------------------------------------------------
 * [구현 규칙]
 * - 항상 소스 시작 주석 부분 체계 유지 및 내용 업데이트
 * - 소스 시작 주석 부분 구현규칙, 코드네이밍규칙 내용 그대로 유지, 수정금지
 * - ArduinoJson v7.x.x 사용 (v6 이하 사용 금지)
 * - JsonDocument 단일 타입만 사용
 * - createNestedArray/Object/containsKey 사용 금지
 * - memset + strlcpy 기반 안전 초기화
 * - 주석/필드명은 JSON 구조와 동일하게 유지
 * ------------------------------------------------------
 * [코드 네이밍 규칙]
 * - 전역 상수,매크로      : G_모듈약어_ 접두사
 * - 전역 변수             : g_모듈약어_ 접두사
 * - 전역 함수             : 모듈약어_ 접두사
 * - type                  : T_모듈약어_ 접두사
 * - typedef               : _t  접미사
 * - enum 상수             : EN_모듈약어_ 접두사
 * - 구조체                : ST_모듈약어_ 접두사
 * - 클래스명              : CL_모듈약어_ 접두사
 * - 클래스 private 멤버   : _ 접두사
 * - 클래스 멤버(함수/변수) : 모듈약어 접두사 미사용
 * - 클래스 정적 멤버      : s_ 접두사
 * ------------------------------------------------------
 */

#include "W10_Web_060.h"



// ------------------------------------------------------
// 안전한 파일명 추출 (경로 탐색 차단)
// ------------------------------------------------------
static String extractSafeFileName(const String& p_raw) {
    // 1. 마지막 '/' 또는 '\' 이후만 파일명으로 사용
    int lastSlash = max(p_raw.lastIndexOf('/'), p_raw.lastIndexOf('\\'));
    String name = (lastSlash >= 0) ? p_raw.substring(lastSlash + 1) : p_raw;

    // 2. ".." 제거 (디렉토리 탐색 방지)
    name.replace("..", "");

    // 3. 선행 '.' 제거 (숨김 파일 방지)
    while (name.startsWith(".")) {
        name = name.substring(1);
    }

    // 4. 빈 문자열이면 기본 이름
    if (name.isEmpty()) {
        name = "uploaded_file.bin";
    }

    return name;
}


// ------------------------------------------------------
// 파일 저장 경로를 결정하는 내부 함수 (클래스 내부에 정의)
// ------------------------------------------------------

String CL_W10_WebAPI::getUploadPath(const String& p_filename) {
    String v_safeName = extractSafeFileName(p_filename);

    // 확장자 추출
    int v_dotIndex = v_safeName.lastIndexOf('.');
    String v_folderPath;

    if (v_dotIndex > 0) {
        String v_ext = v_safeName.substring(v_dotIndex + 1);
        v_ext.toLowerCase();

        if (v_ext == "json") {
            v_folderPath = W10_Const::PATH_STATIC_JSON;     // "/json"
        } else if (v_ext == "html" || v_ext == "js" || v_ext == "css") {
            v_folderPath = W10_Const::PATH_STATIC_HTML;     // "/html_v2" (또는 "/html_v3")
        } else {
            v_folderPath = "";  // 기타 확장자는 루트
        }
    }

    return v_folderPath + "/" + v_safeName;
}


// ------------------------------------------------------
// /upload (LittleFS 파일 업로드)
// ------------------------------------------------------

void CL_W10_WebAPI::routeUpload() {
    s_server->on(
        W10_Const::HTTP_API_FILE_UPLOAD,
        HTTP_POST,
        // ─── 완료 핸들러 ───
        [](AsyncWebServerRequest* p_request) {
            if (!checkApiKey(p_request)) {
                p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
                return;
            }

            JsonDocument v_resp;
            if (s_uploadError || !s_upFile) {
                v_resp["done"]  = false;
                v_resp["error"] = "upload failed: " + (s_uploadError ? "write error" : "file not open");
                sendJson(p_request, v_resp, 500);
            } else {
                s_upFile.close();
                v_resp["done"] = true;
                v_resp["size"] = s_uploadTotal;
                sendJson(p_request, v_resp, 200);
            }

            // 상태 초기화
            s_uploadError = false;
            s_uploadTotal = 0;
        },

        // ─── 청크 핸들러 ───
        [](AsyncWebServerRequest* p_request, const String& p_filename, size_t p_index, uint8_t* p_data, size_t p_len, bool p_final) {
            if (!checkApiKey(p_request)) return;

            // ─── 첫 청크: 파일 열기 ───
            if (p_index == 0) {
                // 동시 업로드 방지
                if (s_upFile && s_upFile.available()) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] Upload rejected: concurrent upload");
                    s_uploadError = true;
                    return;
                }

                // 크기 제한 확인
                if (p_request->contentLength() > G_W10_MAX_UPLOAD_SIZE) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] Upload rejected: size %u exceeds limit", p_request->contentLength());
                    s_uploadError = true;
                    return;
                }

                // 안전한 파일명으로 저장 경로 결정
                String finalPath = getUploadPath(p_filename);

                // 여유 공간 확인
                if (LittleFS.usedBytes() + p_request->contentLength() > LittleFS.totalBytes()) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] Upload rejected: insufficient space");
                    s_uploadError = true;
                    return;
                }
                
                // 기존 파일 삭제
                if (LittleFS.exists(finalPath)) {
                    LittleFS.remove(finalPath);
                    CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Replacing existing file: %s", finalPath.c_str());
                }

                s_upFile = LittleFS.open(finalPath, "w");
                if (!s_upFile) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] Failed to open file for writing: %s", finalPath.c_str());
                    s_uploadError = true;
                    return;
                }

                s_uploadError = false;
                s_uploadTotal = 0;
                CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Upload started: %s → %s (%u bytes)",
                                   p_filename.c_str(), finalPath.c_str(), p_request->contentLength());
            }

            // ─── 쓰기 ───
            if (!s_uploadError && s_upFile && p_len > 0) {
                size_t written = s_upFile.write(p_data, p_len);
                if (written != p_len) {
                    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] Write error: %u/%u bytes", written, p_len);
                    s_uploadError = true;
                } else {
                    s_uploadTotal += written;
                }
            }

            // ─── 마지막 청크: 파일 닫기 (완료 핸들러에서 최종 처리) ───
            if (p_final && s_upFile) {
                // 완료 핸들러에서 닫고 응답하므로 여기서는 닫지 않음
                CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] Upload finished: %s (%u bytes total)", p_filename.c_str(), s_uploadTotal);
            }
        });
}


// ------------------------------------------------------
// /update (OTA 펌웨어 업데이트)
// ------------------------------------------------------
void CL_W10_WebAPI::routeUpdate() {
	s_server->on(
		W10_Const::HTTP_API_FW_UPDATE,	// "/update",
		HTTP_POST,
		[](AsyncWebServerRequest* p_request) {
			if (!checkApiKey(p_request)) {
				p_request->send(401, "application/json", "{\"error\":\"unauthorized\"}");
				return;
			}
			if (Update.hasError()) {
				String v_errMsg = "{\"ota\":\"fail\", \"error\":\"" + String(Update.errorString()) + "\"}";
				CL_W10_WebAPI::sendText(p_request, v_errMsg, 500);
			} else {
				CL_W10_WebAPI::sendText(p_request, "{\"ota\":\"ok\"}");
				delay(300);
				ESP.restart();
			}
		},
		[](AsyncWebServerRequest* p_request, const String&, size_t p_index, uint8_t* p_data, size_t p_len, bool p_final) {
			if (!checkApiKey(p_request))
				return;

			if (p_index == 0) {
				if (!Update.begin(UPDATE_SIZE_UNKNOWN)) {
					CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] OTA begin failed: %s", Update.errorString());
				}
			}

			if (p_len > 0) {
				Update.write(p_data, p_len);
			}

			if (p_final) {
				if (Update.end(true)) {
					CL_D10_Logger::log(EN_L10_LOG_INFO, "[W10] OTA finished successfully");
				} else {
					CL_D10_Logger::log(EN_L10_LOG_ERROR, "[W10] OTA end failed: %s", Update.errorString());
				}
			}
		});
}

