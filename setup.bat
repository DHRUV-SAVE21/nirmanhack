@echo off
echo Installing Root Dependencies...
call npm install

echo Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo Installing Backend Dependencies...
pip install -r backend/requirements.txt

echo.
echo All dependencies installed!
echo Run "npm run dev" to start the project.
pause
