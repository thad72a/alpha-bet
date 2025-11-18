# AlphaBet Backend API

FastAPI backend for fetching Bittensor subnet data.

## ⚠️ IMPORTANT: Deployment Limitation

**This backend CANNOT run on Vercel serverless functions** due to the `bittensor` library using multiprocessing.

✅ **Use instead**: Railway, Fly.io, DigitalOcean App Platform, or VPS  
📖 **See**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions

---

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Server

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Test API

Visit: http://localhost:8000/docs

---

## API Endpoints

### `GET /api/subnets`
Returns all Bittensor subnets with price and metadata.

**Response:**
```json
{
  "1": {
    "netuid": 1,
    "subnet_name": "Text Prompting",
    "price": 123.45,
    "tao_in_emission": 1000.0,
    ...
  },
  ...
}
```

### `GET /api/subnet/{netuid}`
Returns detailed info for a specific subnet.

**Example:** `GET /api/subnet/1`

---

## Configuration

### Environment Variables (Optional)

```env
BT_NETWORK=finney  # or 'testnet', 'local'
BT_LOGGING_NO_QUEUE=1  # Disable multiprocessing in logging
```

---

## Caching

Built-in TTL cache (30 seconds) to reduce RPC load:
- Subnets list: 30s
- Individual subnet info: 30s per netuid

---

## Development

### Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app
│   ├── routers/
│   │   └── subnets.py       # Subnet endpoints
│   └── services/
│       └── bittensor_client.py  # Bittensor SDK wrapper
├── requirements.txt
└── README.md
```

### Adding New Endpoints

1. Create router in `app/routers/`
2. Add to `app/main.py`:
   ```python
   from app.routers.my_router import router as my_router
   app.include_router(my_router, prefix="/api")
   ```

---

## Deployment

### Railway (Recommended - 2 minutes)

1. **Push config files** (if not already):
   ```bash
   git add railway.toml nixpacks.toml
   git commit -m "Add Railway config"
   git push
   ```

2. Go to [railway.app](https://railway.app) and create account

3. **New Project** → Deploy from GitHub → Select your repo

4. Railway builds automatically using the config files ✅

5. **Generate domain**: Settings → Networking → Generate Domain

6. **Done!** Copy your Railway URL

**Config files** (already created):
- `railway.toml` - Tells Railway to run backend
- `nixpacks.toml` - Python build configuration

### Frontend Configuration

Update your frontend `.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-app.railway.app
```

Or in Vercel dashboard:
- Settings → Environment Variables
- Add: `NEXT_PUBLIC_BACKEND_URL`
- Value: Your Railway URL

---

## Troubleshooting

### Import Error: multiprocessing

**Error:**
```
FileNotFoundError: [Errno 2] No such file or directory
(multiprocessing.SemLock error)
```

**Solution:** This happens on Vercel/Lambda. Deploy to Railway/Fly.io instead.

The code now includes lazy loading to minimize this, but bittensor fundamentally needs a persistent process.

### Slow Response Times

**Cause:** Bittensor RPC calls can be slow  
**Solution:**
- Caching is already enabled (30s TTL)
- Consider running local Bittensor node
- Use connection pooling

### CORS Errors

Frontend can't reach backend.

**Check:**
1. CORS is enabled in `main.py` (already configured)
2. Backend URL is correct in frontend env
3. Backend is actually running

---

## Production Considerations

### Performance
- ✅ Caching implemented (30s TTL)
- ⚠️ Consider adding Redis for distributed caching
- ⚠️ Add rate limiting for public APIs

### Security
- ✅ CORS configured for specific origins
- ⚠️ Add API key authentication for sensitive endpoints
- ⚠️ Enable HTTPS (Railway/Fly.io do this automatically)

### Monitoring
- Add logging (already has basic logging)
- Consider Sentry for error tracking
- Monitor RPC call latency

---

## FAQ

**Q: Can I use Vercel?**  
A: No, bittensor uses multiprocessing which doesn't work on serverless.

**Q: What's the cheapest option?**  
A: Fly.io free tier or Hetzner VPS (~$4/mo).

**Q: Do I need a Bittensor node?**  
A: No, the SDK connects to public RPC. But running your own node improves performance.

**Q: How do I update the backend?**  
A: Push to GitHub, Railway/Fly.io auto-deploys.

---

## License

MIT
