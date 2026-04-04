@echo off
REM ============================================
REM VertaX 测试环境检查脚本
REM ============================================

echo.
echo ==========================================
echo   VertaX 测试环境检查
echo ==========================================
echo.

REM 检查 Node.js
echo [1/5] 检查 Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js
    echo [解决] 请先安装 Node.js: https://nodejs.org/
    exit /b 1
)
echo [✓] Node.js 已安装: 
node --version
echo.

REM 检查 npm
echo [2/5] 检查 npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 npm
    exit /b 1
)
echo [✓] npm 已安装: 
npm --version
echo.

REM 检查 Playwright
echo [3/5] 检查 Playwright...
npx playwright --version >nul 2>&1
if errorlevel 1 (
    echo [警告] Playwright 未安装
    echo [提示] 将自动安装 Playwright...
    call npm install -D playwright @playwright/test
    call npx playwright install chromium
) else (
    echo [✓] Playwright 已安装:
    npx playwright --version
)
echo.

REM 检查端口占用
echo [4/5] 检查开发服务器...
netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [警告] 未在 3000 端口检测到开发服务器
    echo [提示] 请先启动开发服务器:
    echo        npm run dev
    echo.
    echo [问题] 是否继续运行测试？(Y/N)
    set /p CONTINUE="输入选择："
    if /i not "%CONTINUE%"=="Y" exit /b 1
) else (
    echo [✓] 检测到开发服务器运行在 3000 端口
)
echo.

REM 检查测试目录
echo [5/5] 检查测试目录...
if not exist "tests\e2e" (
    echo [错误] 测试目录不存在
    exit /b 1
)
echo [✓] 测试目录存在
if not exist "tests\screenshots" mkdir "tests\screenshots"
echo [✓] 截图目录已创建
echo.

echo ==========================================
echo   环境检查完成 ✓
echo ==========================================
echo.
echo [提示] 如果看到警告，请先解决以下问题:
echo   1. 如未安装 Playwright，将自动安装
echo   2. 如开发服务器未运行，请先执行：npm run dev
echo.
echo [下一步] 运行测试:
echo   .\tests\run-tests.bat
echo   或
echo   npx playwright test
echo.

pause
