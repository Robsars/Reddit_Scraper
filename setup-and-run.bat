@echo off
setlocal enabledelayedexpansion

echo === Reddit Explorer setup & run ===

REM 1) Ensure .env exists
if not exist ".env" (
  if exist ".env.example" (
    echo Creating .env from .env.example
    copy /Y .env.example .env >NUL
  ) else (
    echo .env and .env.example not found. Please create .env and set DATABASE_URL.
    exit /b 1
  )
)

REM 2) Ensure Node.js 20 is available (fallback to local .tools if missing)
for /f "tokens=*" %%v in ('node -v 2^>NUL') do set NODEVER=%%v
echo Detected Node: !NODEVER!
echo !NODEVER! | findstr /r /c:"^v2[0-9]" >NUL
if errorlevel 1 (
  echo Node 20+ not found. Bootstrapping local Node 20...
  set "TOOLS_DIR=.tools"
  set "NODE_DIR=%TOOLS_DIR%\node"
  if not exist "%TOOLS_DIR%" mkdir "%TOOLS_DIR%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "^$ErrorActionPreference='Stop'; ^
    $url='https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip'; ^
    $out='%CD%\%TOOLS_DIR%\node.zip'; ^
    Invoke-WebRequest $url -OutFile $out; ^
    if (Test-Path '%CD%\%NODE_DIR%') { Remove-Item -Recurse -Force '%CD%\%NODE_DIR%' }; ^
    Expand-Archive -Path $out -DestinationPath '%CD%\%TOOLS_DIR%' -Force; ^
    if (Test-Path '%CD%\%TOOLS_DIR%\node-v20.12.2-win-x64') { Move-Item -Force '%CD%\%TOOLS_DIR%\node-v20.12.2-win-x64' '%CD%\%NODE_DIR%' }; ^
    Remove-Item -Force $out"
  if exist "%NODE_DIR%\node.exe" (
    set "PATH=%CD%\%NODE_DIR%;%CD%\%NODE_DIR%\node_modules\npm\bin;%PATH%"
    for /f "tokens=*" %%v in ('"%NODE_DIR%\node.exe" -v') do set NODEVER=%%v
    echo Using local Node: !NODEVER!
  ) else (
    echo Failed to bootstrap local Node. Please install Node 20.x and retry.
    exit /b 1
  )
)

REM 3) Prefer PNPM if available, else fallback to NPM
set PKG=pnpm
pnpm -v >NUL 2>&1
if errorlevel 1 (
  set PKG=npm
)
echo Package manager: %PKG%

REM 4) Install dependencies
if /I "%PKG%"=="pnpm" (
  call pnpm install || goto :fail
  set EXEC=pnpm
) else (
  call npm install || goto :fail
  set EXEC=npm
)

REM 5) Prisma generate and migrate (uses DATABASE_URL from .env)
echo Running Prisma generate & migrate...
call npx prisma generate || goto :fail
call npx prisma migrate dev --name init --skip-seed || goto :fail

REM 6) Start dev server and open browser
echo Starting dev server on http://localhost:3000
start "Reddit Explorer" http://localhost:3000
call %EXEC% run dev
goto :eof

:fail
echo.
pause
echo Setup failed. Please review the errors above.

exit /b 1

pause 

