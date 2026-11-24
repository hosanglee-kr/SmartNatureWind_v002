# 보안 및 비밀키 비노출 규칙

1. **파일 열람·검색 금지**: `src/v0203/.env/.gemini_key` 및 `.pio/` 내 빌드 바이너리(`littlefs.bin`)는 어떤 에이전트(Antigravity, Claude Code 등)도 `read_file`, `grep`, `cat`, `type`, `Get-Content` 등으로 읽거나 검색하지 않는다.
2. **명령 실행·API·로그 노출 금지**:
   - 터미널(`run_command`)에서 `.gemini_key` 내용이나 `AIza...` 패턴을 출력할 수 있는 명령을 실행하지 않는다.
   - 보드 REST API(`GET /api/v001/system` 등) 응답에 `geminiApiKey`가 포함될 수 있는 경우 전체 JSON을 그대로 출력하지 않고, 상태 확인이 필요하면 키 필드를 마스킹하거나 제외한다.
   - `pio_gzip_0203.py` 등 빌드 스크립트에서도 키 값 자체는 절대 로그에 출력하지 않는다.
3. **대화창 출력 금지**: 어떤 상황에서도 실제 API 키 문자열을 대화창·아티팩트·커밋 메시지에 출력하지 않는다.
4. **템플릿 참조**: 구조 확인이 필요할 때는 공개 템플릿인 `src/v0203/.env/.gemini_key.example`만 참조한다.
