# Quick Start Guide

## 5 Minute Setup

### 1. Install Node.js
Download from: https://nodejs.org/ (choose LTS version)

### 2. Open Terminal/PowerShell
Navigate to your project folder

### 3. Run These Commands

```bash
npm install
```

Wait for it to finish...

```bash
node setup.js
```

You'll see a success message!

```bash
npm start
```

### 4. Open Browser
Go to: **http://localhost:3000**

### 5. Login
- **Email**: admin@school.com
- **Password**: admin123

### Done! 🎉

---

## What to Do Next

### Mark Attendance
1. Click **📋 Attendance**
2. Select a Class
3. Click Present/Absent/Leave for each student
4. Click **Save Attendance**

### Record Marks
1. Click **📊 Marks**
2. Select Class, Subject, Test Name
3. Enter marks for each student
4. Click **Save All Marks**

### Setup Your Data
1. Click **⚙️ Manage**
2. Add Teachers, Classes, Students
3. Setup Timetable

### View Reports
1. Click **📈 Reports**
2. Select a student
3. See attendance % and marks

---

## Stop the Server

Press **Ctrl+C** in the Terminal

---

## Problems?

### npm: not found
→ Node.js not installed. Download from https://nodejs.org/

### Port 3000 in use
→ Change port in server.js (line 9): `const PORT = 3001`

### Can't open http://localhost:3000
→ Check if "npm start" is still running in Terminal

### Start fresh
→ Delete `sunday_school.db` and run `node setup.js` again

---

## Need Help?

Read the full **README.md** file for detailed information!
