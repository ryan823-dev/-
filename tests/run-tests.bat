@echo off
REM ============================================
REM VertaX 自动化测试运行脚本
REM ============================================

echo.
echo ==========================================
echo   VertaX 自动化测试套件
echo ==========================================
echo.

REM 检查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    exit /b 1
)

REM 检查 Playwright
npx playwright --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Playwright 未安装，正在安装...
    call npm install -D playwright @playwright/test
    call npx playwright install chromium
)

echo [信息] 开始运行测试...
echo.

REM 创建截图目录
if not exist "tests\screenshots" mkdir "tests\screenshots"

REM 运行测试
echo [信息] 运行端到端测试...
npx playwright test --project=chromium --headed

echo.
echo ==========================================
echo   测试完成
echo ==========================================
echo.
echo [提示] 测试报告位置：tests\playwright-report\index.html
echo [提示] 截图位置：tests\screenshots\
echo.

pause
