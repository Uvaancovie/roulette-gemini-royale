# Render Deployment Instructions

## 🚀 Deploy Backend to Render

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Configure Render deployment"
git push origin main
```

### Step 2: Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select this repository
4. Configure:
   - **Name**: `covies-casino-api`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: (leave blank)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Plan**: Free

### Step 3: Add Environment Variables

In Render service settings, add these environment variables:

```
MONGO_URI = mongodb+srv://uvaancovenden:way2flymillionaire@2nd.aq0pult.mongodb.net/covies-casino
JWT_SECRET = covies-casino-ultra-secure-jwt-secret-key-2025-roulette-royale-ZA
VITE_GEMINI_API_KEY = AIzaSyDwfU1wjNsinTkkpy0tNcQNpSbvGhpe6cI
NODE_ENV = production
```

### Step 4: Deploy

Click **"Create Web Service"** - Render will automatically build and deploy!

---

## 🌐 After Backend is Live

### Your backend URL will be:
```
https://covies-casino-api.onrender.com
```

### Update Frontend CORS (if needed)

If your Vercel domain is different, update `server/index.js` line 13:
```javascript
origin: [
  'http://localhost:3000',
  'https://YOUR-ACTUAL-DOMAIN.vercel.app' // Add your real domain here
],
```

---

## 🎯 Deploy Frontend to Vercel

```bash
vercel --prod
```

Vercel will automatically detect Vite and deploy your frontend.

---

## ⚡ Keep Render Service Awake (Free Tier)

Free tier sleeps after 15 minutes of inactivity. Use one of these:

### Option 1: UptimeRobot (Recommended)
1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Create a monitor:
   - Type: HTTP(s)
   - URL: `https://covies-casino-api.onrender.com/api/ai-health`
   - Interval: 5 minutes

### Option 2: Cron-job.org
1. Sign up at [cron-job.org](https://cron-job.org)
2. Create a cron job to ping your health endpoint every 14 minutes

---

## 📊 Testing

Test your backend:
```bash
curl https://covies-casino-api.onrender.com/api/ai-health
```

Should return:
```json
{
  "apiKeyAvailable": true,
  "mongooseConnected": true
}
```

---

## 🔄 Auto-Deploy

Render will automatically redeploy when you push to `main` branch:
```bash
git add .
git commit -m "Update backend"
git push origin main
```

---

## 📝 Notes

- **First request**: May take 30-50 seconds if service was sleeping
- **Cold starts**: ~30 seconds after 15 minutes of inactivity (free tier)
- **Build time**: ~2-3 minutes
- **Health check**: `/api/ai-health` keeps service monitored

---

## 🆘 Troubleshooting

### MongoDB Connection Fails
- Check MONGO_URI has database name: `.../covies-casino`
- Verify MongoDB Atlas allows connections from `0.0.0.0/0`

### CORS Errors
- Update allowed origins in `server/index.js`
- Ensure your Vercel domain is added to the list

### Service Won't Start
- Check logs in Render dashboard
- Verify all environment variables are set
- Ensure `node server/index.js` works locally

---

## ✅ Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create Render web service
- [ ] Add all environment variables
- [ ] Wait for first deploy to complete
- [ ] Test API endpoint
- [ ] Update frontend if Vercel domain changed
- [ ] Deploy frontend to Vercel
- [ ] Set up UptimeRobot to keep service awake
- [ ] Test full app end-to-end

**Your backend will be live at**: `https://covies-casino-api.onrender.com` 🎉
