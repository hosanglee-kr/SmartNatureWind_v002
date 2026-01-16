자정 넘어감(예: 23:00 ~ 07:00)은 지금 CT10 쪽 코드만 보면 “스케줄 활성 여부” 판단은 findActiveScheduleIndex()에 전부 달려있고, 여기 tickSchedule()에는 자정 처리 로직이 없습니다.
즉 결론은:

자정 넘어감 처리(overnight) 가 findActiveScheduleIndex()(혹은 그 내부에서 사용하는 시간 비교 함수)에서 제대로 안 되어 있으면,

23:00~23:59 구간은 켜지는데

00:00~07:00 구간이 꺼져버리는 버그가 날 가능성이 큽니다.


반대로 findActiveScheduleIndex()가 overnight를 제대로 처리하면 CT10 루프는 그대로 정상 동작합니다.


아래는 검토 포인트 + 정답 로직(권장 구현) 입니다.


---

1) “자정 넘어감”의 정석 판정 로직

현재 시각 nowMin(0~1439), 시작 startMin, 종료 endMin.

일반 구간(같은 날): startMin < endMin

활성: startMin <= nowMin && nowMin < endMin


자정 넘어감(overnight): startMin > endMin

활성: nowMin >= startMin || nowMin < endMin


start == end: 정책 필요

보통 “하루 종일”로 해석하거나, “비활성/잘못된 설정”으로 막음

지금 JSON에 이런 케이스는 없지만, 운영상 정책을 정해두는 게 좋습니다.



이게 findActiveScheduleIndex()에서 반드시 반영돼야 합니다.


---

2) 요일(days[7])도 자정 넘어감에 맞게 판정해야 함 (핵심)

스케줄의 period.days[]가 “어떤 날에 적용되는가”를 의미할 때, overnight는 날짜 경계가 갈라지기 때문에 day 판정도 2가지 방식이 있습니다.

(권장) “시작 시각의 요일을 기준으로 한다” 방식

예: 월요일 23:00 ~ 화요일 07:00

월요일 days[월]=1이면
→ 월 23:00부터 화 07:00까지 살아야 함

구현은 보통 이렇게 합니다:

nowMin이 >= startMin이면 “오늘 요일” 체크

nowMin이 < endMin이면 “어제 요일” 체크 (왜냐면 이 구간은 ‘전날 시작 스케줄’의 연장)



즉 overnight일 때는:

nowMin >= startMin 구간: days[today] == 1

nowMin < endMin 구간: days[yesterday] == 1


이 처리가 없으면 “밤 12시 지나면 days가 바뀌어서 꺼짐” 같은 문제가 생깁니다.


---

3) CT10 관점에서 생길 수 있는 추가 이슈

A) curScheduleIndex 전환 타이밍

자정 넘어감 로직이 잘못되면, 00:00 시점에 findActiveScheduleIndex()가 -1을 반환하면서

curScheduleIndex = -1

tickSchedule() false

tickLoop()에서 sim.stop()로 떨어질 수 있습니다.


B) “여러 스케줄이 겹치면 누구 우선?”

예: 19:0007:00 스케줄이 23:00에 경계 겹침
현재 코드는 findActiveScheduleIndex()가 고르는 “하나”만 실행합니다.

경계값을 [start, end)로 통일하면(종료는 미포함) 겹침이 줄어듭니다.

우선순위(낮은 schNo 우선/높은 schNo 우선/리스트 순서 우선)를 명확히 해야 합니다.



---

4) 체크리스트(당장 확인할 함수)

CT10 코드 기준 “자정 넘어감 처리”는 여기 확인하면 됩니다:

1. findActiveScheduleIndex(ST_A20_SchedulesRoot_t&)

time 비교가 위 overnight 규칙을 쓰는지

day 체크가 “today / yesterday”로 갈라지는지



2. time parsing 함수

"23:00", "07:00"을 분 단위로 안전하게 변환하는지

실패 시 기본값 처리(00:00 등)로 이상 동작하지 않는지



3. start == end 정책


4. [start, end) 경계 통일 여부




---

5) 바로 적용 가능한 권장 판정(의사코드)

findActiveScheduleIndex() 내부에서 스케줄 하나의 활성 판정은 최소 아래 형태여야 합니다.

```cpp
startMin < endMin:

if days[today] && startMin <= nowMin && nowMin < endMin => active


startMin > endMin (overnight):

if (nowMin >= startMin && days[today]) => active

else if (nowMin < endMin && days[yesterday]) => active


startMin == endMin:

```

정책(24h 또는 invalid)




---

원하시면, 당신 프로젝트의 실제 findActiveScheduleIndex() 원문(또는 time/day 판정 함수들) 붙여주시면,
제가 “현재 구현이 overnight + 요일을 제대로 처리하는지”를 정확히 코드 단위로 리뷰해서, 필요한 경우 패치 코드까지 완전체로 만들어드릴게요.



---

===

좋아요. 지금 올려주신 findActiveScheduleIndex()는 “자정 넘어감 시간 구간” 자체는 처리하지만, “요일(days[])” 처리가 자정 넘어감에 맞게 되어 있지 않습니다.
그래서 23:0006:59 구간에서 요일 체크 때문에 꺼질 수 있어요.

그리고 덤으로, checkAutoOff()의 offTime 로직도 하루에 한 번만 트리거가 아니라, 지정 시각 이후 매 분마다 다시 트리거될 수 있는 버그가 있습니다. (>= + “마지막 트리거 minute”만 막는 구조라서 06:30 설정이면 06:30, 06:31, 06:32… 계속 트리거 가능)

아래에 정확히 고쳐야 할 부분을 코드로 제시합니다.


---

1) findActiveScheduleIndex() 자정 넘어감 + 요일 처리 버그

현재 문제

```cpp
// days 체크 (오늘 요일만 체크)
if (v_wday >= 7 || !v_s.period.days[v_wday]) continue;

// cross midnight
if (v_curMin >= v_startMin || v_curMin < v_endMin) return v_i;

```

이러면 예를 들어:

스케줄: 월요일(days[Mon]=1), 23:00~07:00

화요일 01:00에 체크하면

v_wday는 화요일

days[화]가 0이면 continue로 스케줄이 꺼져버림
→ 실제로는 월요일 밤 스케줄이 화요일 새벽까지 이어져야 하는데 OFF



권장 수정(“시작 시각 기준 요일” 방식)

overnight에서 now < end 구간은 어제 요일로 days 체크

now >= start 구간은 오늘 요일로 days 체크


아래처럼 함수 교체/패치하세요.

```cpp
// -*-------------------------------------------------
// find active schedule (FIX: cross-midnight + day mapping)
// --------------------------------------------------
int CL_CT10_ControlManager::findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg) {
    if (p_cfg.count == 0) return -1;

    time_t v_now = time(nullptr);
    struct tm v_tm;
    if (!CT10_localtimeSafe(v_now, v_tm)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] findActiveScheduleIndex: time not synced");
        return -1;
    }

    // Arduino: 0=Sun..6=Sat
    // Config days: 0=Mon..6=Sun 로 쓰는 정책이라면 아래 변환 유지
    uint8_t v_wdayToday = (v_tm.tm_wday == 0) ? 6 : (uint8_t)(v_tm.tm_wday - 1);
    uint8_t v_wdayYday  = (v_wdayToday == 0) ? 6 : (uint8_t)(v_wdayToday - 1);

    uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60 + (uint16_t)v_tm.tm_min;

    for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];
        if (!v_s.enabled) continue;

        uint16_t v_startMin = parseHHMMtoMin(v_s.period.startTime);
        uint16_t v_endMin   = parseHHMMtoMin(v_s.period.endTime);

        if (v_startMin == v_endMin) {
            // 정책: start==end => 항상 OFF (필요시 24h로 변경 가능)
            continue;
        }

        if (v_startMin < v_endMin) {
            // 같은 날 구간: 오늘 요일만 체크
            if (v_wdayToday >= 7 || !v_s.period.days[v_wdayToday]) continue;
            if (v_curMin >= v_startMin && v_curMin < v_endMin) return v_i;
        } else {
            // 자정 넘어감 구간
            // 1) [start..24:00) => 오늘 요일 체크
            if (v_curMin >= v_startMin) {
                if (v_wdayToday < 7 && v_s.period.days[v_wdayToday]) return v_i;
            }
            // 2) [00:00..end) => 어제 요일 체크 (전날 시작 스케줄의 연장)
            if (v_curMin < v_endMin) {
                if (v_wdayYday < 7 && v_s.period.days[v_wdayYday]) return v_i;
            }
        }
    }

    return -1;
}
```

✅ 이걸로 23:00~07:00 + 월요일 체크가 화요일 새벽까지 정상 유지됩니다.


---

2) AutoOff offTime 로직도 “자정 넘어감(일 단위)” 버그 있음

현재 버그

```cpp

// 정책: 지정 시각 "도달 시"부터 트리거(>=)
if (v_curMin >= autoOffRt.offTimeMinutes) {
    s_lastTriggeredMinute = (int32_t)v_curMin;
    return true;
}
```

이러면 offTime=06:30일 때:

06:30에 true

06:31에도 >= 이므로 true (lastTriggeredMinute만 06:30이라 막지 못함)

06:32, 06:33 … 계속 true


즉, **해당 시각 “한 번만”**이 아니라, 그 날 나머지 시간 계속 재발동할 수 있어요.

권장 수정: “하루 1회” 트리거 (dayKey 사용)

“오늘 날짜(YYYY*366 + yday)” 같은 키로 하루 1회 제한

그리고 트리거 조건은 == 또는 “도달” 정책이면 >=도 가능하지만 dayKey로 1회만 막아야 함


아래처럼 바꾸면 안전합니다.

// 2) offTime (RTC) - FIX: 하루 1회 트리거

```cpp
if (autoOffRt.offTimeEnabled) {
    static int32_t s_lastTriggeredDayKey = -1;

    time_t v_t = time(nullptr);
    struct tm v_tm;
    if (!CT10_localtimeSafe(v_t, v_tm)) {
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] AutoOff(offTime) skipped: time not synced");
    } else {
        uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60 + (uint16_t)v_tm.tm_min;

        // dayKey: 연도/연중일 기반 (하루 1회 방어)
        // tm_year: 1900 기준, tm_yday: 0~365
        int32_t v_dayKey = (int32_t)v_tm.tm_year * 400 + (int32_t)v_tm.tm_yday; // 400은 여유 상수

        if (v_dayKey != s_lastTriggeredDayKey) {
            // 정책 선택 1) 정확히 그 분에만 트리거 (권장)
            if (v_curMin == autoOffRt.offTimeMinutes) {
                s_lastTriggeredDayKey = v_dayKey;
                CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff(time %u) triggered",
                                   (unsigned)autoOffRt.offTimeMinutes);
                return true;
            }

            // 정책 선택 2) "도달 시"부터 트리거(>=)를 유지하고 싶다면,
            // 아래처럼 쓰되 dayKey로 1회만 발생하게 해야 함.
            /*
            if (v_curMin >= autoOffRt.offTimeMinutes) {
                s_lastTriggeredDayKey = v_dayKey;
                CL_D10_Logger::log(EN_L10_LOG_INFO, "[CT10] AutoOff(time %u) triggered",
                                   (unsigned)autoOffRt.offTimeMinutes);
                return true;
            }
            */
        }
    }
}
```

---

3) 요약: 지금 코드에서 “자정 넘어감” 관련 결함 2개

1. ✅ Schedule 활성 판정에서 “요일”이 overnight를 고려하지 않음
→ 새벽 구간이 꺼질 수 있음 → 위 패치 필요


2. ✅ AutoOff offTime이 “하루 1회”가 아니라 “분마다 재트리거”될 수 있음
→ dayKey로 1회 방어 필요




---

원하시면 제가 당신 프로젝트의 정책에 맞춰 딱 하나만 골라서 확정해드릴게요:

스케줄 days를 **“시작 시각 기준”**으로 유지(제가 위에 준 방식)

AutoOff offTime을

(A) == “정확히 그 분” 트리거

(B) >= “도달 시” 트리거(단 dayKey로 하루 1회)



지금 운영 안정성 기준으로는 스케줄은 시작요일 기준 + AutoOff는 == 한 번 트리거가 제일 깔끔합니다.




===

```cpp

// --------------------------------------------------
// find active schedule (FULL, with cross-midnight + day rule comments)
//  - 목적: "현재 시각"에 활성화되어야 하는 schedule의 index를 반환
//  - 핵심: 자정 넘어감(start > end) 구간을 "요일(days[])"과 함께 올바르게 판정
//
// [요일 매핑 규칙(현 코드 기준)]
//  - Arduino tm_wday: 0=Sun..6=Sat
//  - Config(period.days[]): 0=Mon..6=Sun  (가정/기존 코드 유지)
//    => 변환: today = (tm_wday==0)?6:(tm_wday-1)
//
// [자정 넘어감 처리 규칙(중요)]
//  - start < end  : 같은 날 구간  (예: 08:00~12:00)
//    -> "오늘 요일"만 days[] 체크
//  - start > end  : 자정 넘어감 구간(overnight) (예: 23:00~07:00)
//    -> 두 구간으로 분리하여 요일을 다르게 체크해야 함
//       A) [start .. 24:00)  : '오늘' 시작분 이상이면 "오늘 요일" days[] 체크
//       B) [00:00 .. end)    : '오늘' 종료분 미만이면 "어제 요일" days[] 체크
//    이유: 23:00~07:00 같은 스케줄은 "전날 밤에 시작"하여 "다음날 새벽"까지 이어지므로
//         새벽 구간(00:00~end)은 schedule의 시작 요일(=어제) 기준으로 활성화되어야 함.
//
// [start==end 정책]
//  - start==end 이면 "항상 OFF"로 취급(현 정책 유지)
//    (필요 시 24시간 ON 정책으로 변경 가능)
//
// 반환:
//  - 활성 schedule index (0..count-1)
//  - 없으면 -1
// --------------------------------------------------
int CL_CT10_ControlManager::findActiveScheduleIndex(const ST_A20_SchedulesRoot_t& p_cfg) {
    // count 0이면 활성 스케줄 없음
    if (p_cfg.count == 0) return -1;

    // 현재 시각 로드
    time_t v_now = time(nullptr);
    struct tm v_tm;
    if (!CT10_localtimeSafe(v_now, v_tm)) {
        // 시간 미동기(부팅 직후/NTP 실패 등)면 스케줄 판정 불가 -> OFF 처리
        CL_D10_Logger::log(EN_L10_LOG_WARN, "[CT10] findActiveScheduleIndex: time not synced");
        return -1;
    }

    // 요일 변환(Arduino -> Config)
    //  - Arduino: 0=Sun..6=Sat
    //  - Config : 0=Mon..6=Sun
    uint8_t v_wdayToday = (v_tm.tm_wday == 0) ? 6 : (uint8_t)(v_tm.tm_wday - 1);

    // 어제 요일(0=Mon..6=Sun 기준)
    //  - Monday(0)의 어제는 Sunday(6)
    uint8_t v_wdayYday = (v_wdayToday == 0) ? 6 : (uint8_t)(v_wdayToday - 1);

    // 현재 분(0..1439)
    uint16_t v_curMin = (uint16_t)v_tm.tm_hour * 60 + (uint16_t)v_tm.tm_min;

    // 스케줄 목록을 순회하며 "현재 활성"을 찾음
    //  - 현재 구현은 "첫 번째로 매칭되는 스케줄"을 반환
    //  - 우선순위가 필요하면 schNo 정렬/우선순위 정책을 여기서 적용하면 됨
    for (int v_i = 0; v_i < (int)p_cfg.count; v_i++) {
        const ST_A20_ScheduleItem_t& v_s = p_cfg.items[v_i];

        // 비활성 스케줄은 제외
        if (!v_s.enabled) continue;

        // 시작/종료 시간 파싱("HH:MM" -> 분)
        //  - 파싱 실패 시 0 반환 가능(현 parse 정책), 운영에서 시간 포맷 검증 권장
        uint16_t v_startMin = parseHHMMtoMin(v_s.period.startTime);
        uint16_t v_endMin   = parseHHMMtoMin(v_s.period.endTime);

        // start==end 정책: 항상 OFF
        if (v_startMin == v_endMin) {
            continue;
        }

        // ------------------------------------------
        // 1) 같은 날 구간(start < end)
        //    예) 08:00~12:00
        //    - 오늘 요일만 days[] 체크
        //    - start <= now < end 이면 활성
        // ------------------------------------------
        if (v_startMin < v_endMin) {
            // days[] 범위/활성 체크
            if (v_wdayToday >= 7 || !v_s.period.days[v_wdayToday]) continue;

            if (v_curMin >= v_startMin && v_curMin < v_endMin) {
                return v_i;
            }
            continue;
        }

        // ------------------------------------------
        // 2) 자정 넘어감 구간(start > end)
        //    예) 23:00~07:00
        //    - 두 구간으로 분리
        //
        //    A) [start .. 24:00)
        //       - now >= start 이면 "오늘 요일"로 체크
        //
        //    B) [00:00 .. end)
        //       - now < end 이면 "어제 요일"로 체크
        //
        //    (주의) 새벽 구간에서는 today가 바뀌기 때문에
        //           days[]를 "어제"로 봐야 전날 시작 스케줄이 이어짐
        // ------------------------------------------
        // A) 밤 구간: now >= start
        if (v_curMin >= v_startMin) {
            if (v_wdayToday < 7 && v_s.period.days[v_wdayToday]) {
                return v_i;
            }
        }

        // B) 새벽 구간: now < end
        if (v_curMin < v_endMin) {
            if (v_wdayYday < 7 && v_s.period.days[v_wdayYday]) {
                return v_i;
            }
        }
    }

    // 어떤 스케줄도 활성 아님
    return -1;
}

```



erDiagram
    USER ||--o{ ORDER : "주문하다"
    ORDER ||--|{ ORDER_ITEM : "포함하다"
    PRODUCT ||--o{ ORDER_ITEM : "판매되다"

    USER {
        long id PK
        string email UK
        string nickname
    }

    ORDER {
        long id PK
        long user_id FK
        datetime order_date
    }

    ORDER_ITEM {
        long id PK
        long order_id FK
        long product_id FK
        int quantity
    }

    PRODUCT {
        long id PK
        string name
        int price
    }
