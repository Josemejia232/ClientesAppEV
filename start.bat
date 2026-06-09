@echo off
echo Iniciando backend...
cd /d "%~dp0backend"
start /B npx tsx src/index.ts
echo Backend iniciado en http://localhost:3004
timeout /t 2 /nobreak >nul
echo Iniciando frontend...
cd /d "%~dp0frontend"
start /B npx vite --host
echo Frontend iniciado en http://localhost:5173
echo.
echo Para detener ambos servidores, cierra esta ventana o usa Ctrl+C
pause
