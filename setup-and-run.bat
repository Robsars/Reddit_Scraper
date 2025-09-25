@echo off
setlocal

set "LOGFILE=%CD%\setup-and-run.log"
echo [START %DATE% %TIME%] Reddit Explorer setup > "%LOGFILE%"
echo === Reddit Explorer setup ^& run ===

call :log "Step 1: ensure .env"
if not exist ".env" (
  if exist ".env.example" (
    echo Creating .env from .env.example
    call :log "Creating .env from .env.example"
    copy /Y .env.example .env >NUL
  ) else (
    echo .env and .env.example not found. Please create .env and set DATABASE_URL.
    call :log "ERROR: Missing .env and .env.example"
    goto :pause_fail
  )
)

call :log "Step 2: detect Node"
set "NODEVER="
for /f "delims=" %%v in ('node -v 2^>NUL') do set "NODEVER=%%v"
echo Detected Node: %NODEVER%
call :log "Detected Node: %NODEVER%"

set NEED_BOOTSTRAP=0
if "%NODEVER%"=="" set NEED_BOOTSTRAP=1
echo %NODEVER% | findstr /r /c:"^v2[0-9]" >NUL || set NEED_BOOTSTRAP=1
if "%NEED_BOOTSTRAP%"=="1" goto BOOTSTRAP_NODE
goto AFTER_BOOTSTRAP

:BOOTSTRAP_NODE
call :log "Bootstrapping local Node 20"
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
  Remove-Item -Force $out" || goto :pause_fail
if not exist "%NODE_DIR%\node.exe" (
  echo Failed to bootstrap local Node. Please install Node 20.x and retry.
  call :log "ERROR: Failed to bootstrap local Node"
  goto :pause_fail
)
set "PATH=%CD%\%NODE_DIR%;%CD%\%NODE_DIR%\node_modules\npm\bin;%PATH%"
for /f "delims=" %%v in ('"%NODE_DIR%\node.exe" -v') do set "NODEVER=%%v"
echo Using local Node: %NODEVER%
call :log "Using local Node: %NODEVER%"

:AFTER_BOOTSTRAP

call :log "Step 3: select package manager"
set PKG=pnpm
pnpm -v >NUL 2>&1
if errorlevel 1 set PKG=npm
echo Package manager: %PKG%
call :log "Package manager: %PKG%"

call :log "Step 4: install dependencies"
if /I "%PKG%"=="pnpm" (
  call pnpm install || goto :pause_fail
) else (
  call npm install || goto :pause_fail
)

call :log "Step 5: prisma generate & migrate"
REM Prefer binary engine on Windows to reduce DLL locking
set PRISMA_CLIENT_ENGINE_TYPE=binary
call :log "Using PRISMA_CLIENT_ENGINE_TYPE=%PRISMA_CLIENT_ENGINE_TYPE%"
set NPXCMD=npx
where npx >NUL 2>&1 || set NPXCMD=npx.cmd

call :log "Cleaning Prisma cache"
if exist "node_modules\.prisma" (
  attrib -r "node_modules\.prisma\*.*" /s >NUL 2>&1
  rmdir /S /Q "node_modules\.prisma" >NUL 2>&1
)

set RETRIES=0
:gen_try
call %NPXCMD% prisma generate
if "%ERRORLEVEL%"=="0" goto gen_ok
set /a RETRIES=%RETRIES%+1 >NUL
if %RETRIES% GEQ 5 (
  call :log "ERROR: prisma generate failed after %RETRIES% attempts"
  goto :pause_fail
)
call :log "generate failed (attempt %RETRIES%), cleaning and retrying..."
if exist "node_modules\.prisma" (
  attrib -r "node_modules\.prisma\*.*" /s >NUL 2>&1
  rmdir /S /Q "node_modules\.prisma" >NUL 2>&1
)
timeout /t 2 >NUL
goto gen_try
:gen_ok

call %NPXCMD% prisma migrate dev --name init --skip-seed
if not "%ERRORLEVEL%"=="0" (
  call :log "migrate failed, attempting prisma db push"
  call %NPXCMD% prisma db push || goto :pause_fail
)

call :log "Step 6: start dev server"
echo Starting dev server on http://localhost:3000
start "Reddit Explorer" http://localhost:3000
if /I "%PKG%"=="pnpm" (
  call pnpm run dev
) else (
  call npm run dev
)
set EXITCODE=%ERRORLEVEL%
call :log "Dev server exited with code %EXITCODE%"
if not "%EXITCODE%"=="0" (
  echo Dev server exited with code %EXITCODE%. See %LOGFILE% for details.
  goto :pause_fail
)
goto :eof

:log
echo [%DATE% %TIME%] %~1>>"%LOGFILE%"
goto :eof

:pause_fail
echo.
echo Setup failed. See %LOGFILE% for details.
pause
exit /b 1
