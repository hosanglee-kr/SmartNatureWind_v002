아래는 “추가 전체 공통함수”만 각각 구현(주석/기능 설명 포함) + 기존코드 패턴 + 적용 예시로 정리한 목록입니다.
(모두 A40_ComFunc 쪽(예: A40_Com_Func_0xx.h/.cpp)에 넣는 전제, C10_ 접두사는 쓰지 않습니다.)


---

1) Cfg_getPathOrNull() — cfg path 선택 + empty 방어 공통

✅ 구현 (주석/기능 설명)

// ------------------------------------------------------
// Cfg_getPathOrNull
//  - cfgMap에 들어있는 파일 경로(char[])가 유효하면 포인터 반환
//  - 비어있으면 nullptr 반환 (호출부에서 로그/리턴정책 결정)
// ------------------------------------------------------
static inline const char* Cfg_getPathOrNull(const char* p_path) {
    if (!p_path) return nullptr;
    if (p_path[0] == '\0') return nullptr;
    return p_path;
}

🧩 기존 코드(반복 패턴)

const char* v_cfgJsonPath = nullptr;
if (s_cfgJsonFileMap.schedules[0] != '\0') v_cfgJsonPath = s_cfgJsonFileMap.schedules;
if (!v_cfgJsonPath) {
    CL_D10_Logger::log(...);
    return false;
}

✅ 적용 예시

const char* v_cfgJsonPath = A40_ComFunc::Cfg_getPathOrNull(s_cfgJsonFileMap.schedules);
if (!v_cfgJsonPath) {
    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] %s: s_cfgJsonFileMap.schedules empty", __func__);
    return false;
}


---

2) Ensure_rootAllocated<T>() — root ptr new(nothrow) + reset 공통

✅ 구현

// ------------------------------------------------------
// Ensure_rootAllocated
//  - root ptr이 nullptr이면 new(nothrow)로 할당 시도
//  - 성공 시 resetFn이 있으면 기본값 초기화까지 수행
//  - 실패 시 false (로그는 호출부에서)
// ------------------------------------------------------
template <typename T>
static inline bool Ensure_rootAllocated(T*& p_ptr, void (*p_resetFn)(T&)) {
    if (p_ptr) return true;

    p_ptr = new (std::nothrow) T();
    if (!p_ptr) return false;

    if (p_resetFn) p_resetFn(*p_ptr);
    return true;
}

🧩 기존 코드

if (!g_A20_config_root.schedules) {
    g_A20_config_root.schedules = new (std::nothrow) ST_A20_SchedulesRoot_t();
    if (!g_A20_config_root.schedules) {
        CL_D10_Logger::log(...);
        return -1;
    }
    A20_resetSchedulesDefault(*g_A20_config_root.schedules);
}

✅ 적용 예시

if (!A40_ComFunc::Ensure_rootAllocated(g_A20_config_root.schedules, A20_resetSchedulesDefault)) {
    CL_D10_Logger::log(EN_L10_LOG_ERROR, "[C10] addSchedule: new failed (out of memory)");
    return -1;
}
ST_A20_SchedulesRoot_t& v_root = *g_A20_config_root.schedules;


---

3) Find_indexById() — “id로 index 찾기” 공통

✅ 구현

// ------------------------------------------------------
// Find_indexById
//  - items[0..count)에서 p_id를 만족하는 인덱스를 반환
//  - getIdFn: item -> uint16_t id 추출 람다/함수
//  - 없으면 -1
// ------------------------------------------------------
template <typename TItem, typename TGetId>
static inline int Find_indexById(const TItem* p_items, uint8_t p_count, TGetId p_getId, uint16_t p_id) {
    if (!p_items) return -1;
    for (uint8_t v_i = 0; v_i < p_count; v_i++) {
        if ((uint16_t)p_getId(p_items[v_i]) == p_id) return (int)v_i;
    }
    return -1;
}

🧩 기존 코드

int v_idx = -1;
for (uint8_t v_i = 0; v_i < v_root.count; v_i++) {
    if (v_root.items[v_i].schId == p_id) { v_idx = (int)v_i; break; }
}
if (v_idx < 0) return false;

✅ 적용 예시 (Schedule)

int v_idx = A40_ComFunc::Find_indexById(
    v_root.items, v_root.count,
    [](const ST_A20_ScheduleItem_t& s){ return s.schId; },
    p_id
);
if (v_idx < 0) return false;

✅ 적용 예시 (UserProfile)

int v_idx = A40_ComFunc::Find_indexById(
    v_root.items, v_root.count,
    [](const ST_A20_UserProfileItem_t& up){ return up.profileId; },
    p_id
);
if (v_idx < 0) return false;


---

4) Delete_shiftLeft() — delete 후 shift-left + count 감소 공통

✅ 구현

// ------------------------------------------------------
// Delete_shiftLeft
//  - p_index 항목 삭제: 뒤 원소들을 1칸씩 앞으로 당김
//  - count를 1 감소
// ------------------------------------------------------
template <typename TItem>
static inline bool Delete_shiftLeft(TItem* p_items, uint8_t& p_count, int p_index) {
    if (!p_items) return false;
    if (p_count == 0) return false;
    if (p_index < 0) return false;
    if ((uint8_t)p_index >= p_count) return false;

    for (uint8_t v_i = (uint8_t)p_index + 1; v_i < p_count; v_i++) {
        p_items[v_i - 1] = p_items[v_i];
    }
    p_count--;
    return true;
}

🧩 기존 코드

for (uint8_t v_i = (uint8_t)v_idx + 1; v_i < v_root.count; v_i++) {
    v_root.items[v_i - 1] = v_root.items[v_i];
}
if (v_root.count > 0) v_root.count--;

✅ 적용 예시

if (!A40_ComFunc::Delete_shiftLeft(v_root.items, v_root.count, v_idx)) return false;
A40_ComFunc::Dirty_setAtomic(_dirty_schedules, s_dirtyflagSpinlock);


---

5) Json_removeKey() — Export 시 doc 잔재 제거 공통

✅ 구현

// ------------------------------------------------------
// Json_removeKey
//  - doc의 root를 JsonObject로 보고 특정 key를 제거(remove)
//  - key가 없거나 root가 object가 아니면 아무것도 하지 않음
// ------------------------------------------------------
static inline void Json_removeKey(JsonDocument& p_doc, const char* p_key) {
    if (!p_key || p_key[0] == '\0') return;
    JsonObject v_root = p_doc.as<JsonObject>();
    if (v_root.isNull()) return;
    v_root.remove(p_key);
}

🧩 기존 코드

JsonObject v_rootTop = d.as<JsonObject>();
v_rootTop.remove("schedules");

✅ 적용 예시

A40_ComFunc::Json_removeKey(d, "schedules");
A40_ComFunc::Json_removeKey(d, "userProfiles");
A40_ComFunc::Json_removeKey(d, "windDict");


---

6) Json_writeAdjust() — adjust 필드 write 공통

✅ 구현

// ------------------------------------------------------
// Json_writeAdjust
//  - segment.adjust 구조체를 JSON object에 기록
// ------------------------------------------------------
static inline void Json_writeAdjust(JsonObject p_adj, const ST_A20_Adjust_t& p_a) {
    p_adj["windIntensity"]            = p_a.windIntensity;
    p_adj["windVariability"]          = p_a.windVariability;
    p_adj["gustFrequency"]            = p_a.gustFrequency;
    p_adj["fanLimit"]                 = p_a.fanLimit;
    p_adj["minFan"]                   = p_a.minFan;
    p_adj["turbulenceLengthScale"]    = p_a.turbulenceLengthScale;
    p_adj["turbulenceIntensitySigma"] = p_a.turbulenceIntensitySigma;
    p_adj["thermalBubbleStrength"]    = p_a.thermalBubbleStrength;
    p_adj["thermalBubbleRadius"]      = p_a.thermalBubbleRadius;
}

🧩 기존 코드

JsonObject adj = jseg["adjust"].to<JsonObject>();
adj["windIntensity"] = sg.adjust.windIntensity;
...

✅ 적용 예시

JsonObject adj = jseg["adjust"].to<JsonObject>();
A40_ComFunc::Json_writeAdjust(adj, sg.adjust);


---

7) Json_writeAutoOff() — autoOff 필드 write 공통

✅ 구현


🧩 기존 코드

JsonObject ao = js["autoOff"].to<JsonObject>();
ao["timer"]["enabled"] = s.autoOff.timer.enabled;
...

✅ 적용 예시

JsonObject ao = js["autoOff"].to<JsonObject>();
A40_ComFunc::Json_writeAutoOff(ao, s.autoOff);


---

8) Json_writeMotion() — motion 필드 write 공통

✅ 구현


🧩 기존 코드

js["motion"]["pir"]["enabled"] = s.motion.pir.enabled;
...

✅ 적용 예시

A40_ComFunc::Json_writeMotion(js, s.motion);
A40_ComFunc::Json_writeMotion(jp, up.motion);


---

(참고) 적용 조합 예시 — saveSchedules 일부가 이렇게 정리됩니다

JsonObject js = d["schedules"][v_i].to<JsonObject>();

js["schId"]          = s.schId;
js["schNo"]          = s.schNo;
js["name"]           = s.name;
js["enabled"]        = s.enabled;
js["repeatSegments"] = s.repeatSegments;
js["repeatCount"]    = s.repeatCount;

for (uint8_t v_d = 0; v_d < 7; v_d++) js["period"]["days"][v_d] = s.period.days[v_d];
js["period"]["startTime"] = s.period.startTime;
js["period"]["endTime"]   = s.period.endTime;

// segments
for (uint8_t v_k = 0; v_k < s.segCount && v_k < A20_Const::MAX_SEGMENTS_PER_SCHEDULE; v_k++) {
    const ST_A20_ScheduleSegment_t& sg = s.segments[v_k];
    JsonObject jseg = js["segments"][v_k].to<JsonObject>();

    jseg["segId"]      = sg.segId;
    jseg["segNo"]      = sg.segNo;
    jseg["onMinutes"]  = sg.onMinutes;
    jseg["offMinutes"] = sg.offMinutes;
    jseg["mode"]       = A20_modeToString(sg.mode);
    jseg["presetCode"] = sg.presetCode;
    jseg["styleCode"]  = sg.styleCode;

    JsonObject adj = jseg["adjust"].to<JsonObject>();
    A40_ComFunc::Json_writeAdjust(adj, sg.adjust);

    jseg["fixedSpeed"] = sg.fixedSpeed;
}

JsonObject ao = js["autoOff"].to<JsonObject>();
A40_ComFunc::Json_writeAutoOff(ao, s.autoOff);

A40_ComFunc::Json_writeMotion(js, s.motion);


---

원하시면 다음 턴에서,

위 공통함수들을 A40_ComFunc 헤더/소스에 실제 추가하는 코드 블록(완성본) +

C10_Config_Schedule_047.cpp의 save/toJson 4개 함수에 대해 치환 패치(diff 스타일)
까지 바로 만들어드릴게요.