# Backend Deployment Guide

## The Problem

The `bittensor` Python library uses **multiprocessing** which is **not compatible with serverless environments** like:
- ❌ Vercel Serverless Functions (AWS Lambda)
- ❌ AWS Lambda directly
- ❌ Netlify Functions
- ❌ Google Cloud Functions (without workarounds)

## Recommended Deployment Options

### Option 1: Railway (Recommended ⭐)
**Best for**: Quick deployment with minimal config

1. **Push your code to GitHub** (if not already)
   ```bash
   git add railway.toml nixpacks.toml
   git commit -m "Add Railway config"
   git push
   ```

2. **Create Railway account**: https://railway.app

3. **Deploy**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your `alpha-bet` repository
   - Railway will automatically detect the config files ✅

4. **Wait for deployment** (~2-3 minutes)

5. **Get your URL**:
   - Go to Settings → Networking
   - Click "Generate Domain"
   - Copy URL (e.g., `https://your-app.up.railway.app`)

6. **Test it**:
   - Visit `https://your-url.railway.app/api/subnets`
   - Should return subnet data!

**Configuration files**:
- ✅ `railway.toml` - Railway-specific config (already created)
- ✅ `nixpacks.toml` - Build configuration (already created)

**Pros:**
- ✅ Free $5 credit monthly
- ✅ Auto-deploys from GitHub
- ✅ Supports long-running processes
- ✅ Simple setup - just 2 config files

**Cost**: Free tier covers development, ~$5/month for production

---

### Option 2: Fly.io
**Best for**: Global edge deployment

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create `Dockerfile`** in `backend/`:
   ```dockerfile
   FROM python:3.12-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
   ```

3. **Deploy**:
   ```bash
   cd backend
   fly launch
   fly deploy
   ```

**Pros:**
- ✅ Global CDN
- ✅ Free tier available
- ✅ Fast deploys
- ✅ Auto-scaling

---

### Option 3: DigitalOcean App Platform
**Best for**: Traditional app hosting

1. **Connect GitHub repo**
2. **Configure**:
   - Source: `backend/` directory
   - Build command: `pip install -r requirements.txt`
   - Run command: `uvicorn app.main:app --host 0.0.0.0 --port 8080`
3. **Deploy**

**Cost**: $5-12/month

---

### Option 4: Self-Hosted VPS
**Best for**: Full control, cost-effective for high traffic

**Services**: DigitalOcean, Linode, Vultr, Hetzner

1. **Setup server** (Ubuntu 22.04 LTS)
2. **Install dependencies**:
   ```bash
   sudo apt update
   sudo apt install python3.12 python3-pip nginx
   ```

3. **Deploy with systemd**:
   ```bash
   cd /opt/alpha-bet-backend
   pip3 install -r requirements.txt
   
   # Create systemd service
   sudo nano /etc/systemd/system/alphabet-api.service
   ```

4. **Service file**:
   ```ini
   [Unit]
   Description=AlphaBet API
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/opt/alpha-bet-backend
   ExecStart=/usr/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

5. **Start service**:
   ```bash
   sudo systemctl start alphabet-api
   sudo systemctl enable alphabet-api
   ```

6. **Setup Nginx reverse proxy**:
   ```nginx
   server {
       listen 80;
       server_name api.yoursite.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

---

## Frontend Configuration

After deploying backend, update your frontend:

### `.env.local` (local development)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Vercel Environment Variables (production)
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.railway.app
```

---

## Vercel Workaround (Not Recommended)

If you **must** use Vercel, try this experimental approach:

### 1. Use External Bittensor RPC
Instead of running bittensor locally, query a public RPC:

```python
# Replace bittensor client with HTTP requests
import httpx

async def get_subnet_data(netuid: int):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://public-bittensor-rpc.com/subnet/{netuid}"
        )
        return response.json()
```

### 2. Separate Microservice
Deploy bittensor client as separate service on Railway, call it from Vercel function.

---

## Testing Backend Locally

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Visit: http://localhost:8000/docs

---

## Monitoring & Logs

### Railway
- View logs in dashboard
- Auto-restarts on crashes

### Fly.io
```bash
fly logs
fly status
```

### Self-hosted
```bash
sudo journalctl -u alphabet-api -f
```

---

## Cost Comparison

| Platform | Free Tier | Paid (Low Traffic) | Paid (High Traffic) |
|----------|-----------|-------------------|---------------------|
| Railway | $5 credit | ~$5/mo | ~$20-50/mo |
| Fly.io | 3 small VMs | ~$0-5/mo | ~$10-30/mo |
| DigitalOcean | No | $5-12/mo | $12-50/mo |
| VPS (Hetzner) | No | €4/mo (~$4.40) | €10-20/mo |
| Vercel Serverless | ❌ Won't work | ❌ Won't work | ❌ Won't work |

---

## Recommended Setup

**Development**: Local FastAPI server
**Production**: Railway (easiest) or Fly.io (best performance)
**Enterprise**: Self-hosted VPS with load balancer

---

## Troubleshooting

### "No such file or directory" (multiprocessing error)
- ✅ **Solution**: Deploy to non-serverless platform (Railway, Fly.io, VPS)

### Slow Bittensor RPC calls
- ✅ Enable caching (already implemented)
- ✅ Use connection pooling
- ✅ Consider running local Bittensor node

### Backend not accessible from frontend
- ✅ Check CORS settings in `main.py`
- ✅ Verify `NEXT_PUBLIC_BACKEND_URL` is correct
- ✅ Ensure backend is actually running

---

## Security Notes

1. **Don't commit** `.env` files
2. **Enable rate limiting** for production
3. **Use HTTPS** in production (Railway/Fly.io handle this automatically)
4. **Rotate API keys** if using Bittensor API instead of SDK
5. **Monitor costs** - RPC calls can add up

---

## Next Steps

1. Choose deployment platform
2. Deploy backend
3. Get backend URL
4. Update frontend environment variables
5. Test end-to-end
6. Monitor performance

For Railway (quickest):
1. Go to railway.app
2. New Project → Deploy from GitHub repo
3. Select `alpha-bet/backend` directory
4. Get Railway URL
5. Add to Vercel env vars ✅

