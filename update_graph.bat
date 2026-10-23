@echo off
setlocal

echo [Graphify] Starting incremental knowledge graph update...

set "PYTHON_CMD="
if exist "graphify-out\.graphify_python" (
    set /p PYTHON_CMD=<"graphify-out\.graphify_python"
)

if "%PYTHON_CMD%"=="" (
    set "PYTHON_CMD=python"
)

echo [Graphify] Using Python: %PYTHON_CMD%
echo [Graphify] Re-extracting changed code and updating graph (5-10s)...

"%PYTHON_CMD%" -m graphify update .

if errorlevel 1 (
    echo.
    echo [Graphify] [ERROR] Update failed with errorlevel %errorlevel%.
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo [Graphify] Knowledge graph update complete!
echo  - Interactive Web: graphify-out\graph.html
echo  - Audit Report:    graphify-out\GRAPH_REPORT.md
echo  - Raw Data:        graphify-out\graph.json
echo ========================================================
exit /b 0
