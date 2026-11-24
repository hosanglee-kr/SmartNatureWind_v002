@echo off
chcp 65001 > nul
REM ============================================================================
REM File   : update_graph.bat
REM Goal   : Incremental update of SmartNatureWind_v002 Graphify knowledge graph
REM Flow   :
REM   1. Prefer Python path in graphify-out\.graphify_python (fallback: python)
REM   2. Run "python -m graphify update ." (AST-only for C++/Python/JS, no API cost)
REM   3. Run "python tools\graphify_sync_docs.py" (sync contract_doc_0203/*.md, AGENTS.md, README.md)
REM   4. Outputs:
REM      - graphify-out\graph.html      : Interactive web visualization
REM      - graphify-out\GRAPH_REPORT.md : Architecture/community summary report
REM      - graphify-out\graph.json      : Raw graph data for agent queries
REM ============================================================================
setlocal

echo [Graphify] Starting incremental knowledge graph update...

REM [1] Resolve Python interpreter (.graphify_python first, fallback to python)
set "PYTHON_CMD="
if exist "graphify-out\.graphify_python" (
    set /p PYTHON_CMD=<"graphify-out\.graphify_python"
)

if "%PYTHON_CMD%"=="" (
    set "PYTHON_CMD=python"
)

echo [Graphify] Using Python: %PYTHON_CMD%
echo [Graphify] Re-extracting changed code and updating graph (5-10s)...

REM [2] AST based incremental update (C++, Python, Frontend JS)
"%PYTHON_CMD%" -m graphify update . --force

REM [3] Propagate failure exit code
if errorlevel 1 (
    echo.
    echo [Graphify] [ERROR] Update failed with errorlevel %errorlevel%.
    exit /b %errorlevel%
)

REM [4] Sync Markdown docs locally (contract_doc_0203, AGENTS.md, README.md)
echo [Graphify] Syncing markdown docs (contract_doc_0203, AGENTS.md, README.md)...
"%PYTHON_CMD%" tools\graphify_sync_docs.py
if errorlevel 1 (
    echo.
    echo [Graphify] [ERROR] Markdown sync failed with errorlevel %errorlevel%.
    exit /b %errorlevel%
)

REM [5] Done summary
echo.
echo ========================================================
echo [Graphify] Knowledge graph update complete!
echo  - Interactive Web: graphify-out\graph.html
echo  - Audit Report:    graphify-out\GRAPH_REPORT.md
echo  - Raw Data:        graphify-out\graph.json
echo ========================================================
exit /b 0
