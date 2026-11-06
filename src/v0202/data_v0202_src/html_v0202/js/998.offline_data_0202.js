/* ---- 998.offline_data_0202.js ---- */
window.SNW = window.SNW || {};
(function(SNW) {
    'use strict';
    /* __AUTO_INJECT_CACHE_START__ */
    // [주의] 아래 DEFAULT_CACHE는 pio_gzip_0202.py 빌드 시 data_v0202_src/json/*.json에서 자동 주입됩니다.
    const DEFAULT_CACHE = {
        "system": {
                "meta": {
                        "version": "FW_2.0.1",
                        "deviceName": "WindScape_2540_v001",
                        "lastUpdate": "2025-10-24T13:00:00+09:00"
                },
                "system": {
                        "logging": {
                                "level": "INFO",
                                "maxEntries": 300
                        },
                        "webSocket": {
                                "wsChConfig": [
                                        {
                                                "chIdx": 0,
                                                "chName": "state",
                                                "chIntervalMs": 800,
                                                "priority": 0
                                        },
                                        {
                                                "chIdx": 1,
                                                "chName": "metrics",
                                                "chIntervalMs": 1500,
                                                "priority": 1
                                        },
                                        {
                                                "chIdx": 2,
                                                "chName": "chart",
                                                "chIntervalMs": 1200,
                                                "priority": 2
                                        },
                                        {
                                                "chIdx": 3,
                                                "chName": "summary",
                                                "chIntervalMs": 1500,
                                                "priority": 3
                                        }
                                ],
                                "wsEtcConfig": {
                                        "chartLargeBytes": 3500,
                                        "chartThrottleMul": 2,
                                        "wsCleanupMs": 10000
                                }
                        }
                },
                "hw": {
                        "fanPwm": {
                                "pin": 6,
                                "channel": 0,
                                "freq": 25000,
                                "res": 10
                        },
                        "fanConfig": {
                                "startPercentMin": 18,
                                "comfortPercentMin": 22,
                                "comfortPercentMax": 65,
                                "hardPercentMax": 90
                        },
                        "pir": {
                                "enabled": true,
                                "pin": 13,
                                "debounceSec": 5,
                                "holdSec": 120
                        },
                        "tempHum": {
                                "enabled": true,
                                "type": "DHT22",
                                "pin": 17,
                                "intervalSec": 30
                        },
                        "led": {
                                "pin": 48,
                                "numPixels": 1,
                                "defaultBrightness": 20
                        }
                },
                "security": {
                        "apiKey": "",
                        "geminiApiKey": ""
                },
                "timeCfg": {
                        "ntpServer": "pool.ntp.org",
                        "timezone": "Asia/Seoul",
                        "syncIntervalMin": 60
                }
        },
        "wifi": {
                "wifi": {
                        "wifiMode": 2,
                        "wifiModeDesc": "0:AP, 1:STA, 2: AP+STA",
                        "ap": {
                                "ssid": "NatureWind",
                                "pass": "2540"
                        },
                        "sta": [
                                {
                                        "ssid": "AP-12-1106",
                                        "pass": "7743#49c"
                                },
                                {
                                        "ssid": "U+Net3CA8",
                                        "pass": "A8A5KCFD6#"
                                },
                                {
                                        "ssid": "GalNote10-2540",
                                        "pass": "91932542"
                                },
                                {
                                        "ssid": "LSITC_WIFI_AP",
                                        "pass": "1234554321"
                                }
                        ]
                }
        },
        "motion": {
                "motion": {
                        "jsonFile": "cfg_motion_0202.json",
                        "pir": {
                                "enabled": true,
                                "holdSec": 120
                        },
                        "timing": {
                                "simIntervalMs": 500,
                                "gustIntervalMs": 2000,
                                "thermalIntervalMs": 3000
                        },
                        "sim": {
                                "presetCode": "OCEAN",
                                "styleCode": "BALANCE",
                                "fanPowerEnabled": true,
                                "intensity": 70.0,
                                "variability": 50.0,
                                "gustFreq": 45.0,
                                "fanLimit": 90.0,
                                "minFan": 10.0,
                                "turbSigma": 0.5,
                                "turbLenScale": 40.0,
                                "thermalStrength": 2.0,
                                "thermalRadius": 18.0
                        }
                }
        },
        "schedules": {
                "version": "0202",
                "jsonFile": "cfg_schedules_0202.json",
                "schedules": [
                        {
                                "schId": 1,
                                "schNo": 10,
                                "name": "Morning Cool Breeze",
                                "enabled": true,
                                "repeatSegments": true,
                                "repeatCount": 1,
                                "period": {
                                        "enabled": true,
                                        "days": [
                                                1,
                                                1,
                                                1,
                                                1,
                                                1,
                                                1,
                                                1
                                        ],
                                        "startTime": "08:00",
                                        "endTime": "12:00"
                                },
                                "segments": [
                                        {
                                                "segId": 1,
                                                "segNo": 10,
                                                "onMinutes": 20,
                                                "offMinutes": 10,
                                                "mode": "PRESET",
                                                "presetCode": "HARBOR_BREEZE",
                                                "styleCode": "BALANCE",
                                                "override": {
                                                        "enabled": true,
                                                        "windIntensity": 70.0,
                                                        "windVariability": 50.0,
                                                        "gustFrequency": 45.0
                                                }
                                        },
                                        {
                                                "segId": 2,
                                                "segNo": 20,
                                                "onMinutes": 15,
                                                "offMinutes": 5,
                                                "mode": "FIXED",
                                                "fixedSpeed": 55.0
                                        }
                                ],
                                "autoOff": {
                                        "timer": {
                                                "enabled": false,
                                                "minutes": 0
                                        },
                                        "offTime": {
                                                "enabled": false,
                                                "time": "00:00"
                                        },
                                        "offTemp": {
                                                "enabled": false,
                                                "temp": 0.0
                                        }
                                },
                                "motion": {
                                        "pir": {
                                                "enabled": true,
                                                "holdSec": 120
                                        }
                                }
                        },
                        {
                                "schId": 2,
                                "schNo": 20,
                                "name": "Evening Comfort",
                                "enabled": true,
                                "repeatSegments": true,
                                "repeatCount": 1,
                                "period": {
                                        "enabled": true,
                                        "days": [
                                                1,
                                                1,
                                                1,
                                                1,
                                                1,
                                                1,
                                                1
                                        ],
                                        "startTime": "19:00",
                                        "endTime": "23:00"
                                },
                                "segments": [
                                        {
                                                "segId": 1,
                                                "segNo": 10,
                                                "onMinutes": 25,
                                                "offMinutes": 10,
                                                "mode": "PRESET",
                                                "presetCode": "COUNTRY_BREEZE",
                                                "styleCode": "RELAX",
                                                "override": {
                                                        "enabled": true,
                                                        "windIntensity": 45.0,
                                                        "windVariability": 30.0,
                                                        "gustFrequency": 20.0
                                                }
                                        }
                                ],
                                "autoOff": {
                                        "timer": {
                                                "enabled": false,
                                                "minutes": 0
                                        },
                                        "offTime": {
                                                "enabled": false,
                                                "time": "00:00"
                                        },
                                        "offTemp": {
                                                "enabled": false,
                                                "temp": 0.0
                                        }
                                },
                                "motion": {
                                        "pir": {
                                                "enabled": true,
                                                "holdSec": 120
                                        }
                                }
                        },
                        {
                                "schId": 3,
                                "schNo": 30,
                                "name": "Night Sleep",
                                "enabled": true,
                                "repeatSegments": true,
                                "repeatCount": 1,
                                "period": {
                                        "enabled": true,
                                        "days": [
                                                1,
                                                1,
                                                1,
                                                1,
                                                1,
                                                1,
                                                1
                                        ],
                                        "startTime": "23:00",
                                        "endTime": "07:00"
                                },
                                "segments": [
                                        {
                                                "segId": 1,
                                                "segNo": 10,
                                                "onMinutes": 180,
                                                "offMinutes": 0,
                                                "mode": "PRESET",
                                                "presetCode": "OCEAN",
                                                "styleCode": "SLEEP",
                                                "override": {
                                                        "enabled": true,
                                                        "windIntensity": 30.0,
                                                        "windVariability": 20.0,
                                                        "gustFrequency": 10.0
                                                }
                                        },
                                        {
                                                "segId": 2,
                                                "segNo": 20,
                                                "onMinutes": 120,
                                                "offMinutes": 0,
                                                "mode": "PRESET",
                                                "presetCode": "FOREST_CANOPY",
                                                "styleCode": "SLEEP",
                                                "override": {
                                                        "enabled": true,
                                                        "windIntensity": 25.0,
                                                        "windVariability": 15.0,
                                                        "gustFrequency": 5.0
                                                }
                                        }
                                ],
                                "autoOff": {
                                        "timer": {
                                                "enabled": true,
                                                "minutes": 480
                                        },
                                        "offTime": {
                                                "enabled": true,
                                                "time": "06:30"
                                        },
                                        "offTemp": {
                                                "enabled": true,
                                                "temp": 26.0
                                        }
                                },
                                "motion": {
                                        "pir": {
                                                "enabled": true,
                                                "holdSec": 300
                                        }
                                }
                        }
                ]
        },
        "userProfiles": {
                "userProfiles": {
                        "version": "0202",
                        "jsonFile": "cfg_userProfile_0202.json",
                        "profiles": [
                                {
                                        "profileId": 1,
                                        "profileNo": 10,
                                        "name": "수면모드",
                                        "enabled": true,
                                        "repeatSegments": true,
                                        "repeatCount": 1,
                                        "segments": [
                                                {
                                                        "segId": 1,
                                                        "segNo": 10,
                                                        "onMinutes": 40,
                                                        "offMinutes": 0,
                                                        "mode": "PRESET",
                                                        "presetCode": "OCEAN",
                                                        "styleCode": "SLEEP",
                                                        "override": {
                                                                "enabled": true,
                                                                "windIntensity": 35.0,
                                                                "windVariability": 20.0,
                                                                "gustFrequency": 15.0
                                                        }
                                                },
                                                {
                                                        "segId": 2,
                                                        "segNo": 20,
                                                        "onMinutes": 120,
                                                        "offMinutes": 0,
                                                        "mode": "PRESET",
                                                        "presetCode": "FOREST_CANOPY",
                                                        "styleCode": "SLEEP",
                                                        "override": {
                                                                "enabled": true,
                                                                "windIntensity": 25.0,
                                                                "windVariability": 15.0,
                                                                "gustFrequency": 10.0
                                                        }
                                                },
                                                {
                                                        "segId": 3,
                                                        "segNo": 30,
                                                        "onMinutes": 90,
                                                        "offMinutes": 0,
                                                        "mode": "FIXED",
                                                        "fixedSpeed": 45.0
                                                }
                                        ],
                                        "autoOff": {
                                                "timer": {
                                                        "enabled": true,
                                                        "minutes": 240
                                                },
                                                "offTime": {
                                                        "enabled": true,
                                                        "time": "05:00"
                                                },
                                                "offTemp": {
                                                        "enabled": true,
                                                        "temp": 26.0
                                                }
                                        },
                                        "motion": {
                                                "pir": {
                                                        "enabled": false
                                                }
                                        }
                                },
                                {
                                        "profileId": 2,
                                        "profileNo": 20,
                                        "name": "집중모드",
                                        "enabled": true,
                                        "repeatSegments": true,
                                        "repeatCount": 2,
                                        "segments": [
                                                {
                                                        "segId": 1,
                                                        "segNo": 10,
                                                        "onMinutes": 60,
                                                        "offMinutes": 0,
                                                        "mode": "PRESET",
                                                        "presetCode": "URBAN_SUNSET",
                                                        "styleCode": "FOCUS",
                                                        "override": {
                                                                "enabled": true,
                                                                "windIntensity": 55.0,
                                                                "windVariability": 30.0,
                                                                "gustFrequency": 25.0
                                                        }
                                                }
                                        ],
                                        "autoOff": {
                                                "timer": {
                                                        "enabled": true,
                                                        "minutes": 180
                                                },
                                                "offTime": {
                                                        "enabled": false
                                                },
                                                "offTemp": {
                                                        "enabled": false
                                                }
                                        },
                                        "motion": {
                                                "pir": {
                                                        "enabled": true,
                                                        "holdSec": 300
                                                }
                                        }
                                },
                                {
                                        "profileId": 3,
                                        "profileNo": 30,
                                        "name": "휴식모드",
                                        "enabled": true,
                                        "repeatSegments": true,
                                        "repeatCount": 2,
                                        "segments": [
                                                {
                                                        "segId": 1,
                                                        "segNo": 10,
                                                        "onMinutes": 45,
                                                        "offMinutes": 15,
                                                        "mode": "PRESET",
                                                        "presetCode": "HARBOR_BREEZE",
                                                        "styleCode": "RELAX",
                                                        "override": {
                                                                "enabled": true,
                                                                "windIntensity": 45.0,
                                                                "windVariability": 35.0,
                                                                "gustFrequency": 20.0
                                                        }
                                                }
                                        ],
                                        "autoOff": {
                                                "timer": {
                                                        "enabled": false,
                                                        "minutes": 0
                                                },
                                                "offTime": {
                                                        "enabled": false
                                                },
                                                "offTemp": {
                                                        "enabled": false
                                                }
                                        },
                                        "motion": {
                                                "pir": {
                                                        "enabled": true,
                                                        "holdSec": 180
                                                }
                                        }
                                },
                                {
                                        "profileId": 4,
                                        "profileNo": 40,
                                        "name": "환기모드",
                                        "enabled": true,
                                        "repeatSegments": false,
                                        "repeatCount": 0,
                                        "segments": [
                                                {
                                                        "segId": 1,
                                                        "segNo": 10,
                                                        "onMinutes": 20,
                                                        "offMinutes": 5,
                                                        "mode": "PRESET",
                                                        "presetCode": "PLAINS",
                                                        "styleCode": "BALANCE",
                                                        "override": {
                                                                "enabled": true,
                                                                "windIntensity": 60.0,
                                                                "windVariability": 50.0,
                                                                "gustFrequency": 40.0
                                                        }
                                                }
                                        ],
                                        "autoOff": {
                                                "timer": {
                                                        "enabled": false,
                                                        "minutes": 0
                                                },
                                                "offTime": {
                                                        "enabled": false
                                                },
                                                "offTemp": {
                                                        "enabled": false
                                                }
                                        },
                                        "motion": {
                                                "pir": {
                                                        "enabled": false
                                                }
                                        }
                                },
                                {
                                        "profileId": 5,
                                        "profileNo": 50,
                                        "name": "활동모드",
                                        "enabled": true,
                                        "repeatSegments": true,
                                        "repeatCount": 3,
                                        "segments": [
                                                {
                                                        "segId": 1,
                                                        "segNo": 10,
                                                        "onMinutes": 30,
                                                        "offMinutes": 10,
                                                        "mode": "PRESET",
                                                        "presetCode": "MOUNTAIN",
                                                        "styleCode": "ACTIVE",
                                                        "override": {
                                                                "enabled": true,
                                                                "windIntensity": 85.0,
                                                                "windVariability": 70.0,
                                                                "gustFrequency": 65.0
                                                        }
                                                }
                                        ],
                                        "autoOff": {
                                                "timer": {
                                                        "enabled": false,
                                                        "minutes": 0
                                                },
                                                "offTime": {
                                                        "enabled": false
                                                },
                                                "offTemp": {
                                                        "enabled": false
                                                }
                                        },
                                        "motion": {
                                                "pir": {
                                                        "enabled": true,
                                                        "holdSec": 150
                                                }
                                        }
                                },
                                {
                                        "profileId": 6,
                                        "profileNo": 60,
                                        "name": "사용자 정의",
                                        "enabled": false,
                                        "repeatSegments": false,
                                        "repeatCount": 0,
                                        "segments": [],
                                        "autoOff": {
                                                "timer": {
                                                        "enabled": false,
                                                        "minutes": 0
                                                },
                                                "offTime": {
                                                        "enabled": false
                                                },
                                                "offTemp": {
                                                        "enabled": false
                                                }
                                        },
                                        "motion": {
                                                "pir": {
                                                        "enabled": false
                                                }
                                        }
                                }
                        ]
                }
        },
        "windDict": {
                "windDict": {
                        "version": "0202",
                        "jsonFile": "cfg_windDict_0202.json",
                        "presets": [
                                {
                                        "idx": 0,
                                        "name": "Ocean Breeze",
                                        "code": "OCEAN",
                                        "factors": {
                                                "windIntensity": 70,
                                                "gustFrequency": 50,
                                                "windVariability": 55,
                                                "fanLimit": 95,
                                                "minFan": 12,
                                                "turbulenceLengthScale": 42,
                                                "turbulenceIntensitySigma": 0.55,
                                                "thermalBubbleStrength": 2.2,
                                                "thermalBubbleRadius": 20,
                                                "baseMinWind": 1.8,
                                                "baseMaxWind": 5.5,
                                                "gustProbBase": 0.04,
                                                "gustStrengthMax": 2.1,
                                                "thermalFreqBase": 0.022
                                        }
                                },
                                {
                                        "idx": 1,
                                        "name": "Country Breeze",
                                        "code": "COUNTRY_BREEZE",
                                        "factors": {
                                                "windIntensity": 55,
                                                "gustFrequency": 30,
                                                "windVariability": 40,
                                                "fanLimit": 90,
                                                "minFan": 10,
                                                "turbulenceLengthScale": 38,
                                                "turbulenceIntensitySigma": 0.4,
                                                "thermalBubbleStrength": 1.8,
                                                "thermalBubbleRadius": 16,
                                                "baseMinWind": 0.7,
                                                "baseMaxWind": 3.4,
                                                "gustProbBase": 0.006,
                                                "gustStrengthMax": 1.35,
                                                "thermalFreqBase": 0.015
                                        }
                                },
                                {
                                        "idx": 2,
                                        "name": "Mediterranean",
                                        "code": "MEDITERRANEAN",
                                        "factors": {
                                                "windIntensity": 65,
                                                "gustFrequency": 38,
                                                "windVariability": 50,
                                                "fanLimit": 92,
                                                "minFan": 10,
                                                "turbulenceLengthScale": 35,
                                                "turbulenceIntensitySigma": 0.48,
                                                "thermalBubbleStrength": 1.9,
                                                "thermalBubbleRadius": 18,
                                                "baseMinWind": 1.6,
                                                "baseMaxWind": 3.8,
                                                "gustProbBase": 0.012,
                                                "gustStrengthMax": 1.55,
                                                "thermalFreqBase": 0.035
                                        }
                                },
                                {
                                        "idx": 3,
                                        "name": "Mountain",
                                        "code": "MOUNTAIN",
                                        "factors": {
                                                "windIntensity": 80,
                                                "gustFrequency": 55,
                                                "windVariability": 65,
                                                "fanLimit": 96,
                                                "minFan": 14,
                                                "turbulenceLengthScale": 45,
                                                "turbulenceIntensitySigma": 0.65,
                                                "thermalBubbleStrength": 2.5,
                                                "thermalBubbleRadius": 20,
                                                "baseMinWind": 2.2,
                                                "baseMaxWind": 7.5,
                                                "gustProbBase": 0.045,
                                                "gustStrengthMax": 2.2,
                                                "thermalFreqBase": 0.028
                                        }
                                },
                                {
                                        "idx": 4,
                                        "name": "Plains",
                                        "code": "PLAINS",
                                        "factors": {
                                                "windIntensity": 85,
                                                "gustFrequency": 70,
                                                "windVariability": 75,
                                                "fanLimit": 100,
                                                "minFan": 20,
                                                "turbulenceLengthScale": 50,
                                                "turbulenceIntensitySigma": 0.7,
                                                "thermalBubbleStrength": 2.1,
                                                "thermalBubbleRadius": 25,
                                                "baseMinWind": 4,
                                                "baseMaxWind": 8.8,
                                                "gustProbBase": 0.07,
                                                "gustStrengthMax": 2.4,
                                                "thermalFreqBase": 0.018
                                        }
                                },
                                {
                                        "idx": 5,
                                        "name": "Harbor Breeze",
                                        "code": "HARBOR_BREEZE",
                                        "factors": {
                                                "windIntensity": 68,
                                                "gustFrequency": 45,
                                                "windVariability": 50,
                                                "fanLimit": 92,
                                                "minFan": 12,
                                                "turbulenceLengthScale": 40,
                                                "turbulenceIntensitySigma": 0.5,
                                                "thermalBubbleStrength": 2.3,
                                                "thermalBubbleRadius": 17,
                                                "baseMinWind": 2.25,
                                                "baseMaxWind": 5.35,
                                                "gustProbBase": 0.025,
                                                "gustStrengthMax": 1.8,
                                                "thermalFreqBase": 0.026
                                        }
                                },
                                {
                                        "idx": 6,
                                        "name": "Forest Canopy",
                                        "code": "FOREST_CANOPY",
                                        "factors": {
                                                "windIntensity": 40,
                                                "gustFrequency": 25,
                                                "windVariability": 30,
                                                "fanLimit": 85,
                                                "minFan": 8,
                                                "turbulenceLengthScale": 34,
                                                "turbulenceIntensitySigma": 0.35,
                                                "thermalBubbleStrength": 1.5,
                                                "thermalBubbleRadius": 14,
                                                "baseMinWind": 1.35,
                                                "baseMaxWind": 4,
                                                "gustProbBase": 0.01,
                                                "gustStrengthMax": 1.5,
                                                "thermalFreqBase": 0.012
                                        }
                                },
                                {
                                        "idx": 7,
                                        "name": "Urban Sunset",
                                        "code": "URBAN_SUNSET",
                                        "factors": {
                                                "windIntensity": 60,
                                                "gustFrequency": 50,
                                                "windVariability": 45,
                                                "fanLimit": 92,
                                                "minFan": 10,
                                                "turbulenceLengthScale": 36,
                                                "turbulenceIntensitySigma": 0.55,
                                                "thermalBubbleStrength": 2,
                                                "thermalBubbleRadius": 16,
                                                "baseMinWind": 1.8,
                                                "baseMaxWind": 4.9,
                                                "gustProbBase": 0.03,
                                                "gustStrengthMax": 2,
                                                "thermalFreqBase": 0.02
                                        }
                                },
                                {
                                        "idx": 8,
                                        "name": "Tropical Rain",
                                        "code": "TROPICAL_RAIN",
                                        "factors": {
                                                "windIntensity": 80,
                                                "gustFrequency": 60,
                                                "windVariability": 65,
                                                "fanLimit": 98,
                                                "minFan": 15,
                                                "turbulenceLengthScale": 45,
                                                "turbulenceIntensitySigma": 0.6,
                                                "thermalBubbleStrength": 2.4,
                                                "thermalBubbleRadius": 22,
                                                "baseMinWind": 3.15,
                                                "baseMaxWind": 8.05,
                                                "gustProbBase": 0.06,
                                                "gustStrengthMax": 2.2,
                                                "thermalFreqBase": 0.038
                                        }
                                },
                                {
                                        "idx": 9,
                                        "name": "Desert Night",
                                        "code": "DESERT_NIGHT",
                                        "factors": {
                                                "windIntensity": 45,
                                                "gustFrequency": 20,
                                                "windVariability": 30,
                                                "fanLimit": 85,
                                                "minFan": 8,
                                                "turbulenceLengthScale": 30,
                                                "turbulenceIntensitySigma": 0.3,
                                                "thermalBubbleStrength": 1.2,
                                                "thermalBubbleRadius": 10,
                                                "baseMinWind": 0.9,
                                                "baseMaxWind": 3.1,
                                                "gustProbBase": 0.005,
                                                "gustStrengthMax": 1.3,
                                                "thermalFreqBase": 0.008
                                        }
                                }
                        ],
                        "styles": [
                                {
                                        "idx": 0,
                                        "name": "Balance",
                                        "code": "BALANCE",
                                        "factors": {
                                                "intensityFactor": 1,
                                                "variabilityFactor": 1,
                                                "gustFactor": 1,
                                                "thermalFactor": 1
                                        }
                                },
                                {
                                        "idx": 1,
                                        "name": "Active",
                                        "code": "ACTIVE",
                                        "factors": {
                                                "intensityFactor": 1.25,
                                                "variabilityFactor": 1.2,
                                                "gustFactor": 1.3,
                                                "thermalFactor": 1.1
                                        }
                                },
                                {
                                        "idx": 2,
                                        "name": "Focus",
                                        "code": "FOCUS",
                                        "factors": {
                                                "intensityFactor": 1.05,
                                                "variabilityFactor": 0.8,
                                                "gustFactor": 0.85,
                                                "thermalFactor": 0.9
                                        }
                                },
                                {
                                        "idx": 3,
                                        "name": "Relax",
                                        "code": "RELAX",
                                        "factors": {
                                                "intensityFactor": 0.8,
                                                "variabilityFactor": 0.85,
                                                "gustFactor": 0.7,
                                                "thermalFactor": 1.1
                                        }
                                },
                                {
                                        "idx": 4,
                                        "name": "Sleep",
                                        "code": "SLEEP",
                                        "factors": {
                                                "intensityFactor": 0.65,
                                                "variabilityFactor": 0.6,
                                                "gustFactor": 0.4,
                                                "thermalFactor": 0.9
                                        }
                                }
                        ]
                }
        },
        "nvsSpec": {
                "nvsSpec": {
                        "version": "0202",
                        "jsonFile": "cfg_nvsSpec_0202.json",
                        "namespace": "SNW",
                        "entries": [
                                {
                                        "key": "run_mode",
                                        "type": "uint8",
                                        "defaultValue": "0"
                                },
                                {
                                        "key": "run_src",
                                        "type": "uint8",
                                        "defaultValue": "0"
                                },
                                {
                                        "key": "sched_no",
                                        "type": "int16",
                                        "defaultValue": "-1"
                                },
                                {
                                        "key": "uprofile_no",
                                        "type": "int16",
                                        "defaultValue": "-1"
                                },
                                {
                                        "key": "autoOff_en",
                                        "type": "uint8",
                                        "defaultValue": "0"
                                },
                                {
                                        "key": "autoOff_min",
                                        "type": "uint32",
                                        "defaultValue": "0"
                                },
                                {
                                        "key": "ovr_en",
                                        "type": "uint8",
                                        "defaultValue": "0"
                                },
                                {
                                        "key": "ovr_mode",
                                        "type": "uint8",
                                        "defaultValue": "0"
                                },
                                {
                                        "key": "ovr_fixed",
                                        "type": "float",
                                        "defaultValue": "0.0"
                                },
                                {
                                        "key": "ovr_preset",
                                        "type": "string",
                                        "defaultValue": ""
                                },
                                {
                                        "key": "ovr_style",
                                        "type": "string",
                                        "defaultValue": ""
                                }
                        ]
                }
        },
        "webPage": {
                "pages": [
                        {
                                "uri": "/index.html",
                                "path": "/html_v0202/index.html",
                                "label": "Smart Nature Wind",
                                "enable": true,
                                "isMain": true,
                                "order": 10,
                                "pageAssets": [
                                        {
                                                "uri": "/P000_common_0202.css",
                                                "path": "/html_v0202/P000_common_0202.css"
                                        },
                                        {
                                                "uri": "/P010_bundle_0202.js",
                                                "path": "/html_v0202/P010_bundle_0202.js"
                                        }
                                ]
                        }
                ],
                "reDirect": [
                        {
                                "uriFrom": "/",
                                "uriTo": "/index.html"
                        },
                        {
                                "uriFrom": "/dashboard",
                                "uriTo": "/index.html#/dashboard"
                        },
                        {
                                "uriFrom": "/chart",
                                "uriTo": "/index.html#/chart"
                        },
                        {
                                "uriFrom": "/schedule",
                                "uriTo": "/index.html#/schedule"
                        },
                        {
                                "uriFrom": "/profiles",
                                "uriTo": "/index.html#/profiles"
                        },
                        {
                                "uriFrom": "/sensors",
                                "uriTo": "/index.html#/sensors"
                        },
                        {
                                "uriFrom": "/settings",
                                "uriTo": "/index.html#/settings"
                        },
                        {
                                "uriFrom": "/network",
                                "uriTo": "/index.html#/network"
                        },
                        {
                                "uriFrom": "/logs",
                                "uriTo": "/index.html#/logs"
                        },
                        {
                                "uriFrom": "/diagnostics",
                                "uriTo": "/index.html#/diagnostics"
                        },
                        {
                                "uriFrom": "/firmware",
                                "uriTo": "/index.html#/firmware"
                        },
                        {
                                "uriFrom": "/ai",
                                "uriTo": "/index.html#/ai"
                        },
                        {
                                "uriFrom": "/info",
                                "uriTo": "/index.html#/info"
                        }
                ],
                "assets": []
        }
};
    /* __AUTO_INJECT_CACHE_END__ */
    SNW.OFFLINE_DEFAULT_CACHE = DEFAULT_CACHE;
})(window.SNW);
