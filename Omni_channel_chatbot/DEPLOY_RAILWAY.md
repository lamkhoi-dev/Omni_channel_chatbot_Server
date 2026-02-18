# Deploy ChatDesk Backend lên Railway

## 📦 **Bước 1: Chuẩn bị Repository**

1. **Đảm bảo code đã commit:**
```bash
cd C:\An\Omni_channel_chatbot
git add .
git commit -m "Prepare for Railway deployment"
git push
```

2. **Files đã chuẩn bị cho Railway:**
- ✅ `backend/requirements.txt` - Python dependencies
- ✅ `backend/Procfile` - Start command
- ✅ `backend/.railwayignore` - Files to ignore
- ✅ `railway.json` - Railway config (optional)

---

## 🚂 **Bước 2: Deploy lên Railway**

### 2.1. Tạo Project trên Railway

1. Truy cập: https://railway.app/
2. Đăng nhập (GitHub/Google/Email)
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Authorize Railway access vào GitHub
5. Chọn repository: `Omni_channel_chatbot`
6. Railway sẽ tự detect Python project`

### 2.2. Cấu hình Root Directory

⚠️ **Quan trọng:** Railway mặc định build từ root, cần chỉ định `backend/`

1. Click vào project → **Settings**
2. Tìm **"Root Directory"**
3. Điền: `backend`
4. Click **"Save"**

### 2.3. Cấu hình Start Command

Railway tự detect từ `Procfile`, nhưng có thể chỉ định thủ công:

1. Settings → **"Deploy"**
2. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Click **"Save"**

---

## 🗄️ **Bước 3: Thêm PostgreSQL Database**

### Option 1: Railway Postgres (Recommend)

1. Trong project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway tự tạo database và inject `DATABASE_URL` vào env
3. **Lưu ý:** Railway Postgres URL format: `postgresql://user:pass@host:port/dbname`
   - Cần đổi thành: `postgresql+asyncpg://user:pass@host:port/dbname`

**Giải pháp:** Tạo custom env variable `DATABASE_URL` override Railway default:

```
DATABASE_URL=postgresql+asyncpg://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

### Option 2: Dùng PostgreSQL local (Không khuyến khích)

Nếu muốn dùng PostgreSQL local, cần:
1. Cho phép remote connection (edit `pg_hba.conf`)
2. Expose port 5432 ra internet (ngrok hoặc VPN)
3. Điền `DATABASE_URL` với IP public

---

## 🔐 **Bước 4: Cấu hình Environment Variables**

Click **"Variables"** tab, thêm:

### 4.1. Database (nếu dùng Railway Postgres)
```
DATABASE_URL=postgresql+asyncpg://postgres:xxx@containers-us-west-xxx.railway.app:5432/railway
```

### 4.2. JWT Auth
```
SECRET_KEY=super-secret-production-key-change-this-random-string-abc123
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### 4.3. AI / LLM
```
GROQ_API_KEY=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
GROQ_MODEL=llama-3.3-70b-versatile
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

### 4.4. Milvus Cloud
```
MILVUS_URI=https://in03-058e742457efadb.serverless.aws-eu-central-1.cloud.zilliz.com
MILVUS_TOKEN=fe47b56a3e33a56f4186452dca2aa1d7bd75bbd151fbf63da7054bbb81779193bcc47dcc70414d050df9f11328a99ad8d16aa348
```

### 4.5. Facebook
```
FB_APP_ID=1225368912484598
FB_APP_SECRET=ec655be26dcb3baf2d907b7bbfa213a0
FB_VERIFY_TOKEN=chatdesk_verify_token
FB_OAUTH_REDIRECT_URI=https://your-app.up.railway.app/api/channels/facebook/callback
```
⚠️ **Chú ý:** `your-app` sẽ được Railway tạo tự động, copy URL sau khi deploy xong.

### 4.6. CORS
```
CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:5173
```
Thêm domain frontend sau khi deploy. Nếu chưa có frontend production, giữ `http://localhost:5173` để test local.

---

## 🔄 **Bước 5: Chạy Database Migration**

Railway không tự chạy Alembic migration, cần chạy thủ công:

### Option 1: Railway CLI (Recommend)

1. Install Railway CLI:
```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 -useb | iex

# Hoặc dùng npm
npm install -g @railway/cli
```

2. Login:
```bash
railway login
```

3. Link project:
```bash
cd C:\An\Omni_channel_chatbot\backend
railway link
```
Chọn project vừa tạo.

4. Run migration:
```bash
railway run alembic upgrade head
```

### Option 2: Railway Dashboard (Temporary Shell)

1. Vào project → **"..."** (3 dots) → **"Connect"** → **"Terminal"**
2. Trong terminal:
```bash
alembic upgrade head
```

### Option 3: Seed admin qua Railway Shell

```bash
# Connect to Railway shell
railway connect postgres

# Trong psql:
\i seed_admin.sql
```

Hoặc dùng Railway run:
```bash
railway run psql $DATABASE_URL -f seed_admin.sql
```

---

## ✅ **Bước 6: Verify Deployment**

1. **Lấy Railway URL:**
   - Settings → **"Domains"** → Copy `https://your-app.up.railway.app`

2. **Test API:**
   ```bash
   curl https://your-app.up.railway.app/docs
   ```
   Sẽ mở Swagger UI.

3. **Test Health:**
   ```bash
   curl https://your-app.up.railway.app/api/auth/login \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@chatdesk.vn","password":"admin123"}'
   ```

---

## 🔗 **Bước 7: Cập nhật Facebook App**

Sau khi có Railway URL, cần update Facebook App:

### 7.1. OAuth Redirect URI

1. Facebook Developers → **Your App** → **Facebook Login for Business** → **Settings**
2. **Valid OAuth Redirect URIs**, thêm:
   ```
   https://your-app.up.railway.app/api/channels/facebook/callback
   ```
3. **Save Changes**

### 7.2. Webhook URL

1. Facebook App → **Messenger** → **Webhooks**
2. **Edit Callback URL**:
   ```
   https://your-app.up.railway.app/api/webhooks/facebook
   ```
3. **Verify Token**: `chatdesk_verify_token`
4. **Verify and Save**

### 7.3. Update Environment Variable

Quay lại Railway → **Variables**, sửa:
```
FB_OAUTH_REDIRECT_URI=https://your-app.up.railway.app/api/channels/facebook/callback
```

Railway auto-redeploy khi thay đổi env.

---

## 🎯 **Bước 8: Test End-to-End**

### 8.1. Test Admin Login

1. Mở: `https://your-app.up.railway.app/docs`
2. POST `/api/auth/login`:
   ```json
   {
     "email": "admin@chatdesk.vn",
     "password": "admin123"
   }
   ```
3. Copy `access_token`
4. Click **"Authorize"** → Paste token
5. GET `/api/admin/statistics` → Xem thống kê

### 8.2. Test Business Register (từ Frontend local)

1. Update frontend `.env`:
   ```
   VITE_API_URL=https://your-app.up.railway.app
   ```
2. Chạy frontend:
   ```bash
   cd frontend
   npm run dev
   ```
3. Mở http://localhost:5173/register
4. Đăng ký business user mới
5. Kết nối Facebook Page (OAuth)
6. Thêm sản phẩm
7. Test AI chatbot qua Facebook Messenger

---

## 📊 **Bước 9: Monitoring & Logs**

### View Logs
Railway Dashboard → **Deployments** → Click vào deployment → **"View Logs"**

### Common Issues

❌ **`ModuleNotFoundError: No module named 'app'`**
- **Fix:** Kiểm tra Root Directory = `backend`

❌ **`Connection refused` (PostgreSQL)**
- **Fix:** Kiểm tra `DATABASE_URL` có `+asyncpg` và credentials đúng

❌ **`CORS error` từ frontend**
- **Fix:** Thêm frontend domain vào `CORS_ORIGINS`

❌ **Milvus connection timeout**
- **Fix:** Railway free tier có thể bị rate limit, đợi 1 phút rồi thử lại

❌ **Facebook webhook verify failed**
- **Fix:** `FB_VERIFY_TOKEN` phải khớp với Facebook App settings

---

## 💰 **Railway Pricing**

- **Developer Plan (Free)**: $5 credit/month
  - ~500 hours runtime
  - Enough for demo/testing
  - Auto-sleep after inactivity (wake time ~10s)

- **Pro Plan**: $20/month
  - Always-on service
  - Khuyến khích khi production

---

## 🔄 **Auto-Deploy từ GitHub**

Railway tự động deploy mỗi khi push code mới:

```bash
# Sửa code
git add .
git commit -m "Update feature X"
git push

# Railway auto-detect và deploy (~2-3 phút)
```

View deployment status: Railway Dashboard → **Deployments**

---

## 📝 **Quick Commands Reference**

```bash
# Deploy manual (nếu không dùng GitHub auto-deploy)
railway up

# Run migration
railway run alembic upgrade head

# Rollback migration
railway run alembic downgrade -1

# Connect to Postgres
railway connect postgres

# View logs
railway logs

# Open dashboard
railway open

# Environment variables
railway variables
```

---

## 🎉 **Hoàn thành!**

Railway URL: `https://your-app.up.railway.app`

**Endpoints:**
- API Docs: `/docs`
- Admin Login: POST `/api/auth/login`
- Business Register: POST `/api/auth/register`
- Facebook OAuth: GET `/api/channels/facebook/oauth`
- Facebook Webhook: POST `/api/webhooks/facebook`
- WebSocket: `wss://your-app.up.railway.app/ws/{business_id}`

**Next Steps:**
1. Deploy frontend lên Vercel/Netlify
2. Update `CORS_ORIGINS` với frontend production URL
3. Test E2E flow với real users
4. Monitor logs & errors
