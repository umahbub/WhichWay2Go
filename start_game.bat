@echo off
echo ============================================================
echo Starting Which Way to Go! (K2G Online Board Game)
echo ============================================================
echo.
echo Launching local game server at http://localhost:8000 ...
echo Press Ctrl+C in this terminal window to stop the server when done.
echo.
start http://localhost:8000
python -m http.server 8000
pause
