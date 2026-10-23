# SmartNatureWind_v002 지식 그래프 증분 업데이트 스크립트 (PowerShell)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "[Graphify] SmartNatureWind_v002 지식 그래프 증분 업데이트 시작..." -ForegroundColor Cyan

$pythonExe = "python"
if (Test-Path "graphify-out\.graphify_python") {
    $pythonExe = (Get-Content "graphify-out\.graphify_python" -Raw).Trim()
}

Write-Host "[Graphify] Python 실행자: $pythonExe" -ForegroundColor DarkGray
Write-Host "[Graphify] 변경된 코드 분석 및 그래프 갱신 중 (약 5~10초 소요)..." -ForegroundColor Yellow

$proc = Start-Process -FilePath $pythonExe -ArgumentList "-m", "graphify", "update", "." -NoNewWindow -PassThru -Wait

if ($proc.ExitCode -eq 0) {
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
