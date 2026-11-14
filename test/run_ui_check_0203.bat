@echo off
rem ============================================================================
rem SmartNatureWind v0203 - PC / Android Web UI Playwright E2E Runner
rem ============================================================================

set SCRIPT_DIR=%~dp0
node "%SCRIPT_DIR%e2e_ui_browser_check_0203.cjs" %*

