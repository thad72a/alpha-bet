# Railway Backend Deployment - Quick Start

## Why Railway?

Your backend uses the `bittensor` Python library which requires multiprocessing. This **won't work on Vercel** (serverless). Railway provides a persistent server environment where it works perfectly.

---

## 2-Minute Deployment

### Step 1: Push Config Files

I've created two config files that tell Railway how to run your backend:
- `railway.toml` - Deployment configuration
- `nixpacks.toml` - Build instructions

Push them to GitHub:

```bash
git add railway.toml nixpacks.toml backend/
git commit -m "Add Railway backend config"
git push
```

### Step 2: Deploy on Railway

1. Go to **https://railway.app**
2. Sign up/login (use GitHub for easy connection)
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose your `alpha-bet` repository
6. Railway automatically detects the config and starts building ✅

### Step 3: Get Your Backend URL

After deployment completes (~2-3 minutes):

1. In your Railway project, go to **Settings**
2. Click **Networking** tab
3. Click **"Generate Domain"**
4. Copy the URL (looks like: `https://alpha-bet-backend-production.up.railway.app`)

### Step 4: Configure Frontend

#### Local Development (`.env.local`):
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

#### Vercel Production:
1. Go to your project on Vercel
2. Settings → Environment Variables
3. Add variable:
   - **Key**: `NEXT_PUBLIC_BACKEND_URL`
   - **Value**: Your Railway URL (from Step 3)
   - **Environment**: Production, Preview, Development
4. Redeploy your frontend

### Step 5: Test It!

Visit your Railway URL + `/api/subnets`:
```
https://your-app.up.railway.app/api/subnets
```

You should see JSON data with Bittensor subnet information! 🎉

---

## Cost

- **Free tier**: $5 credit per month
- **Development**: Usually stays within free tier
- **Production**: ~$5-10/month depending on usage
- **First month**: Free!

---

## What Railway Does

The config files tell Railway to:

1. **Install Python 3.12** ✅
2. **Navigate to `backend/` directory** ✅
3. **Install requirements** (`pip install -r requirements.txt`) ✅
4. **Start FastAPI server** (`uvicorn app.main:app`) ✅
5. **Auto-restart** on crashes ✅
6. **Auto-deploy** on GitHub pushes ✅

---

## Troubleshooting

### Build Failed
- Check Railway logs in the deployment view
- Verify `requirements.txt` is in `backend/` directory
- Try redeploying (sometimes first build fails)

### Backend Not Responding
- Check if service is running (Railway dashboard shows status)
- Try "Restart" in Railway dashboard
- Check logs for errors

### Frontend Can't Connect
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly in Vercel
- Make sure URL doesn't have trailing slash
- Redeploy frontend after adding env var

### CORS Errors
Already configured in `backend/app/main.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    ...
)
```

---

## Monitoring

### View Logs
In Railway dashboard → Select your project → View logs in real-time

### Check Status
Railway dashboard shows:
- ✅ Service running
- ⚠️ Service crashed
- 🔄 Deploying

### Usage & Costs
Settings → Usage - Shows credit used and estimate

---

## Auto-Deployment

Once connected, Railway automatically deploys when you push to GitHub:

```bash
# Make changes to backend
git add backend/
git commit -m "Update API"
git push

# Railway automatically deploys! 🚀
```

---

## Alternative: Fly.io

If Railway doesn't work for you, Fly.io is another great option:

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy
cd backend
fly launch
fly deploy
```

See `backend/DEPLOYMENT_GUIDE.md` for full instructions.

---

## Summary

✅ **Frontend**: Vercel (works great)  
✅ **Backend**: Railway (bittensor needs persistent server)  
✅ **Database**: Supabase (for comments, charts)  
✅ **Blockchain**: Bittensor network (via Railway backend)

Total setup time: ~5 minutes  
Total cost: Free tier, or ~$5-10/mo for production  

---

## Next Steps

1. ✅ Deploy backend on Railway
2. ✅ Get Railway URL
3. ✅ Add to Vercel env vars
4. ✅ Redeploy frontend
5. ✅ Test end-to-end
6. 🎉 You're live!

