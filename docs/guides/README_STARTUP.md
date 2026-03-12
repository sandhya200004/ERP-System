# TriVerse ERP - Quick Start Guide

## Starting the Application

### Option 1: Double-Click Startup (Easiest)
1. Double-click `start-servers.bat` in the project root
2. Two command windows will open (Backend & Frontend)
3. Wait for both servers to start (~15-30 seconds)
4. Press any key to open the application in your browser
5. **Keep both command windows open while using the app**

### Option 2: Manual Startup
1. **Start Backend:**
   ```powershell
   cd "N:\PROJECTS\TriVerse ERP\backend"
   npm run start:dev
   ```

2. **Start Frontend** (in a new terminal):
   ```powershell
   cd "N:\PROJECTS\TriVerse ERP\frontend"
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

## Login Credentials

- **Email:** veerajmatnale@triverse.com
- **Password:** admin123

## Server URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **API Documentation:** http://localhost:3000/api/docs

## Stopping the Application

- Close the Backend and Frontend command windows
- Or press `Ctrl+C` in each terminal window

## Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Run: `netstat -ano | findstr :3000`
- Kill the process if needed

### Frontend won't start
- Check if port 5173 is already in use
- Run: `netstat -ano | findstr :5173`
- Kill the process if needed

### Login not working
- Ensure both Backend AND Frontend servers are running
- Check that Backend shows: "🚀 TriVerse ERP Backend running on http://localhost:3000"
- Clear browser cache and try again

## Need Help?

Check the main [README.md](./README.md) for detailed documentation.
