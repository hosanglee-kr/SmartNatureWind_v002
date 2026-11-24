<#
.SYNOPSIS
    SmartNatureWind_v002 지식 그래프(Graphify) 증분 업데이트 스크립트 (PowerShell)

.DESCRIPTION
    1. UTF-8 콘솔 출력을 설정하여 한글 로그 깨짐을 방지합니다.
    2. graphify-out\.graphify_python 파일에 지정된 Python 인터프리터를 우선 사용하고,
       파일이 없을 경우 시스템 PATH의 기본 python을 사용합니다.
    3. `python -m graphify update .`를 실행해 마지막 빌드 이후 변경된 코드만
       AST 기반으로 증분 재추출하여 그래프를 갱신합니다 (LLM API 호출 없음).
    4. 생성/갱신 산출물:
       - graphify-out\graph.html      : 브라우저용 인터랙티브 그래프 시각화
       - graphify-out\GRAPH_REPORT.md : 아키텍처/커뮤니티 분석 요약 보고서
       - graphify-out\graph.json      : 에이전트 질의(graphify query/path/explain)용 데이터

.EXAMPLE
    .\update_graph.ps1
#>
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "[Graphify] SmartNatureWind_v002 지식 그래프 증분 업데이트 시작..." -ForegroundColor Cyan

# [1] Python 인터프리터 경로 결정 (.graphify_python 우선, 없으면 기본 python 폴백)
$pythonExe = "python"
if (Test-Path "graphify-out\.graphify_python") {
    $pythonExe = (Get-Content "graphify-out\.graphify_python" -Raw).Trim()
}

Write-Host "[Graphify] Python 실행자: $pythonExe" -ForegroundColor DarkGray
Write-Host "[Graphify] 변경된 코드 분석 및 그래프 갱신 중 (약 5~10초 소요)..." -ForegroundColor Yellow

# [2] AST 기반 증분 그래프 업데이트 실행 (코드: C++, Python, 프론트엔드 JS)
$proc = Start-Process -FilePath $pythonExe -ArgumentList "-m", "graphify", "update", ".", "--force" -NoNewWindow -PassThru -Wait

# [3] 결과 출력 및 종료 코드 전파
if ($proc.ExitCode -eq 0) {
    # [3.5] 마크다운 문서(계약 문서, AGENTS.md, README.md) 로컬 파싱 동기화
    Write-Host "[Graphify] 마크다운 문서(계약 문서, AGENTS.md, README.md) 동기화 중..." -ForegroundColor Yellow
    & $pythonExe "tools\graphify_sync_docs.py"

    Write-Host "`n========================================================" -ForegroundColor Green
    Write-Host "[Graphify] 지식 그래프 업데이트 완료!" -ForegroundColor Green
    Write-Host " - 웹 시각화: graphify-out\graph.html (브라우저에서 열기)" -ForegroundColor White
    Write-Host " - 분석 보고서: graphify-out\GRAPH_REPORT.md" -ForegroundColor White
    Write-Host " - 그래프 데이터: graphify-out\graph.json" -ForegroundColor White
    Write-Host "========================================================" -ForegroundColor Green
} else {
    Write-Host "`n[Graphify] [ERROR] 업데이트 실패 (종료 코드: $($proc.ExitCode))" -ForegroundColor Red
    exit $proc.ExitCode
}
