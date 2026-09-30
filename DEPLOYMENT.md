# Deployment Guide - Free Hosting Options

Deploy your Sunday School Management System online for free!

## Option 1: Railway (Recommended - Easiest)

Railway is the easiest free option to deploy Node.js apps.

### Step 1: Create Railway Account
1. Go to https://railway.app/
2. Click "Start Project"
3. Sign up with GitHub (free account needed)

### Step 2: Create GitHub Repository
1. Go to https://github.com/new
2. Create a new repository
3. Name it: `sunday-school-app`
4. Click "Create repository"

### Step 3: Upload Your Code to GitHub
Using Git (install from https://git-scm.com/):

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sunday-school-app.git
git push -u origin main
```

### Step 4: Deploy on Railway
1. Go back to Railway dashboard
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Choose your `sunday-school-app` repository
5. Railway will automatically detect and deploy!

### Step 5: Access Your App
- Railway will give you a URL like: `yourapp-production.up.railway.app`
- Share this URL with teachers to access from anywhere!

---

## Option 2: Render (Also Easy)

### Step 1: Create Account
1. Go to https://render.com/
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Create New Web Service
1. Click "New" → "Web Service"
2. Select your GitHub repository
3. Fill in:
   - **Name**: sunday-school-app
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 3: Deploy
- Click "Create Web Service"
- Wait 2-3 minutes for deployment
- You'll get a public URL!

---

## Option 3: Vercel (For Advanced Users)

Vercel is great but requires some configuration for backend.

1. Go to https://vercel.com/
2. Import your GitHub repository
3. Add environment variables if needed
4. Deploy!

---

## Option 4: Run on Your Own Computer (Always Free)

If you prefer to keep it local and simple:

1. Keep the app on your computer
2. Run `npm start` whenever needed
3. Teachers access via: `http://YOUR_COMPUTER_IP:3000`
4. To find your IP:
   - Windows: Open CMD, type `ipconfig`, look for IPv4 Address
   - Mac: System Preferences → Network → IP Address

Then teachers use: `http://192.168.x.x:3000` (replace with your IP)

---

## Comparison

| Option | Cost | Setup Time | Uptime | Easiness |
|--------|------|-----------|--------|----------|
| Railway | Free | 15 min | 99.9% | Easy |
| Render | Free | 10 min | 99% | Easy |
| Vercel | Free | 20 min | 99.9% | Medium |
| Local Computer | Free | 0 min | Depends on PC | Very Easy |

---

## After Deployment

### Database Management
- Your SQLite database will be on the server
- Data persists across restarts
- Make regular backups (download the .db file)

### Adding More Users
- Login with admin account
- Go to ⚙️ Manage → Teachers tab
- Add new teachers with emails and passwords

### Accessing from Multiple Devices
Once deployed online, all teachers can access from:
- Computers
- Tablets
- Phones (mobile-friendly interface)
- Any device with internet and a browser

### Troubleshooting Deployment

**App crashes on startup**
- Check logs on Railway/Render dashboard
- Make sure package.json is correct
- Verify Node version compatibility

**Database errors**
- Check if write permissions are available
- Re-upload the app
- Contact support if issue persists

**Can't connect**
- Check if URL is correct
- Clear browser cache (Ctrl+Shift+Delete)
- Wait 5 minutes after deployment

---

## Backup Your Data

Important: Always keep backups!

### Before Deployment
```bash
cp sunday_school.db sunday_school.db.backup
```

### From Cloud
- Download the database file from server
- Store in safe location
- Keep local backup

---

## Scaling Up Later

If you need to:
- Add more features
- Handle more users
- Use a real database (PostgreSQL)

You can upgrade to paid plans or migrate to AWS/Azure (still have free tiers).

---

## Recommended: Use Railway

Railway is currently the easiest and best for this use case:
1. Free tier is generous
2. Easy GitHub integration
3. Good uptime
4. Simple deployment
5. Built-in database support

---

## Questions?

If deployment seems complicated, stick with Option 4 (Local Computer):
- Keep it simple
- No internet dependency risk
- Same functionality
- Just need to have your PC running

Both work great - choose what's comfortable for your situation!
