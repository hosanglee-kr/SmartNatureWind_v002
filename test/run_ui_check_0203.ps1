<#
.SYNOPSIS
    SmartNatureWind v0203 - PC 및 안드로이드 웹 UI E2E Playwright 검증 스크립트
.DESCRIPTION
    데스크톱(1280x800) 및 안드로이드(Pixel 7, 412x915) 환경에서 Playwright를 구동하여
    반응형 레이아웃, 대시보드 3탭, 모바일 드로어/바텀내비, 콘솔 에러를 정밀 점검합니다.
.EXAMPLE
    .\test\run_ui_check_0203.ps1
    .\test\run_ui_check_0203.ps1 -Port 8899 -Headless
#>
[CmdletBinding()]
param (
    [int]$Port = 8899,
    [switch]$Headless = $true
)

$scriptPath = Join-Path $PSScriptRoot "e2e_ui_browser_check_0203.cjs"
$argsList = @($scriptPath, "--port", $Port)
if ($Headless) {
    $argsList += "--headless"
}

Write-Host ">>> [SNW v0203] PC & Android Web UI E2E Playwright 테스트 시작..." -ForegroundColor Cyan
& node $argsList
exit $LASTEXITCODE

