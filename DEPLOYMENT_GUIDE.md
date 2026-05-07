# Complete Deployment Guide

## 🚨 **IMPORTANT: Why You're Getting 503 Errors**

Your frontend is deployed on Vercel, but your Flask backend with ML models **cannot run on Vercel** because:
- Vercel has strict time limits (60-900 seconds)
- ML models need 4+ GB RAM (Vercel max: 3GB)
- No GPU support on Vercel
- Cold starts would timeout

## ✅ **Solution: Deploy Backend Separately**

We'll deploy your backend to a platform that supports ML workloads, then connect it to your Vercel frontend.

---

## 🎯 **Option 1: Deploy to Render.com (Recommended - Free & Easy)**

### **Step 1: Prepare Your Repository**
All necessary files are already created:
- `backend/requirements.txt` - Python dependencies
- `backend/runtime.txt` - Python version
- `backend/Dockerfile` - Container configuration
- `backend/.env.example` - Environment variables template

### **Step 2: Deploy to Render**

1. **Go to [render.com](https://render.com) and sign up**

2. **Create a New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Choose your repository

3. **Configure the Service:**
   ```
   Name: scientific-insight-backend
   Region: Choose closest to you
   Branch: main
   Root Directory: backend
   Runtime: Docker
   Build Command: (leave empty - using Docker)
   Start Command: (leave empty - defined in Dockerfile)
   ```

4. **Choose Instance Type:**
   - **Free tier**: Good for testing (may sleep after inactivity)
   - **Paid tier** ($7/month): Always on, better for production

5. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable" and add:
   ```
   FLASK_ENV=production
   FLASK_DEBUG=False
   UPLOAD_FOLDER=/tmp/uploads
   MAX_CONTENT_LENGTH=50000000
   TRANSFORMERS_CACHE=/tmp/transformers_cache
   ```

6. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for build and deployment
   - You'll get a URL like: `https://scientific-insight-backend.onrender.com`

### **Step 3: Connect Frontend to Backend**

1. **Go to Vercel Dashboard:**
   - Select your project: `scientific-insight-generation-using-steel`
   - Go to "Settings" → "Environment Variables"

2. **Add Environment Variable:**
   ```
   Key: VITE_API_URL
   Value: https://scientific-insight-backend.onrender.com
   ```

3. **Redeploy Frontend:**
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - Wait for deployment to complete

### **Step 4: Test**
Visit your Vercel URL and test the application!

---

## 🎯 **Option 2: Deploy to Railway.app (Also Free)**

### **Step 1: Sign up at [railway.app](https://railway.app)**

### **Step 2: Deploy Backend**
1. Click "New Project"
2. Choose "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect it's a Python project
5. Set root directory to `backend`

### **Step 3: Configure**
1. Go to your service settings
2. Add environment variables (same as Render)
3. Railway will automatically deploy

### **Step 4: Get URL and Connect**
1. Click "Settings" → "Domains" to get your public URL
2. Update Vercel environment variable with this URL
3. Redeploy frontend

---

## 🎯 **Option 3: Deploy to Hugging Face Spaces (Free GPU)**

### **Step 1: Create a Space**
1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click "Create new Space"
3. Choose:
   - Space name: `scientific-insight-backend`
   - License: MIT
   - SDK: Docker
   - Hardware: CPU (free) or GPU (paid)

### **Step 2: Push Your Code**
```bash
# Install Hugging Face CLI
pip install huggingface_hub

# Login
huggingface-cli login

# Create repo and push
cd backend
git init
git add .
git commit -m "Initial commit"

# Push to Hugging Face
huggingface-cli repo create scientific-insight-backend --type space --space_sdk docker
git remote add origin https://huggingface.co/spaces/YOUR_USERNAME/scientific-insight-backend
git push origin main
```

### **Step 3: Configure and Connect**
1. Go to your Space settings
2. Add environment variables
3. Wait for deployment
4. Get your Space URL
5. Update Vercel environment variable
6. Redeploy frontend

---

## 🔧 **Troubleshooting**

### **Backend Not Starting?**
1. Check logs in your deployment platform
2. Common issues:
   - Missing dependencies in `requirements.txt`
   - Incorrect Python version
   - Model download failures (check internet connectivity)

### **503 Errors Persist?**
1. **Check backend health:**
   ```
   https://your-backend-url.com/api/health
   ```
2. **Check CORS:**
   - Backend logs should show if CORS is blocking requests
   - Verify your Vercel URL is in the allowed origins list

3. **Check Environment Variables:**
   - Ensure `VITE_API_URL` is set correctly in Vercel
   - No trailing slash in the URL!

### **Slow Response Times?**
- ML models take time to load (cold start)
- First request after inactivity will be slow (1-2 minutes)
- Consider using a paid tier for always-on service

### **Memory Errors?**
- Your models need 4+ GB RAM
- Upgrade to a paid tier with more memory
- Or optimize models (use smaller versions)

---

## 📊 **Expected Costs**

| Platform | Free Tier | Paid Tier | Recommended For |
|----------|-----------|-----------|-----------------|
| **Render** | ✅ (with sleep) | $7/month | Best overall |
| **Railway** | ✅ $5 credit/month | Pay as you go | Good alternative |
| **Hugging Face** | ✅ CPU | $9+/month for GPU | ML-focused |

---

## 🚀 **Quick Start Commands**

### **Test Locally First:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python app.py
```

### **Deploy to Render:**
1. Push code to GitHub
2. Follow Option 1 steps above
3. Update Vercel environment variable
4. Redeploy frontend

---

## ✅ **Final Checklist**

- [ ] Backend deployed and accessible via public URL
- [ ] `/api/health` endpoint returns 200
- [ ] Vercel environment variable `VITE_API_URL` set
- [ ] Frontend redeployed after setting environment variable
- [ ] CORS allows your Vercel domain
- [ ] Test all endpoints work

---

## 🆘 **Need Help?**

If you encounter issues:
1. Check backend logs in deployment platform
2. Check Vercel function logs
3. Test backend directly: `curl https://your-backend-url/api/health`
4. Verify environment variables are set correctly

**Your deployment URL structure:**
- Frontend: `https://scientific-insight-generation-using-steel.vercel.app`
- Backend: `https://your-backend.onrender.com` (or Railway/Hugging Face)

The frontend will automatically call the backend via the `VITE_API_URL` environment variable!