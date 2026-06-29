# 🏆 CivicPulse AI — Hackathon Edition

**CivicPulse AI** is a state-of-the-art, gamified community reporting, tracking, and resolution platform. Built on the **MERN Stack** (MongoDB, Express, React, Node.js) and powered by **Google Gemini 2.5 Flash** (via the Google AI Studio SDK), it solves community problems like potholes, garbage accumulation, and broken streetlights through citizen consensus and automated validation.

---

## ✨ Hackathon Highlights (Why This Wins)

1. **Multimodal AI Auto-reporting:** Citizens take a photo and upload it. The Gemini AI automatically generates a concise title, selects the correct category, writes a description, sets the severity tier (with written justification), and gives safety recommendations—reducing reporting friction to zero!
2. **Double-Blind Resolution Audit:** Municipal authorities claim they fixed a pothole? They must upload a photo of the completed work. CivicPulse's backend sends the original issue image and the resolution image to Gemini to verify if the work was actually completed, preventing fraudulent ticket closures.
3. **Algorithmic Spatial Hotspot Prediction:** The analytics engine clusters active reports within proximity and alerts municipal workers to geographical hotspots, enabling predictive planning rather than reactive cleanup.
4. **Core-Loop Citizen Gamification:** Citizen engagement is incentivized by awarding **XP (Experience Points)**, calculating **Levels**, and unlocking **Badges** (e.g., *Spotter*, *Civic Guard*, *Trustworthy Verifier*, *City Hero*) for reporting and validating reports.

---

## 🛠️ Technology Stack

* **Frontend:** React.js (Vite), React Router v6, Leaflet Maps (react-leaflet), Chart.js (react-chartjs-2), Lucide Icons.
* **Backend:** Node.js, Express, Multer (image storage), JWT (authentication), BcryptJS (password hashing).
* **Database:** MongoDB (via Mongoose).
* **AI Engine:** Google Gemini AI Node SDK (`@google/genai`).

---

## 🚀 Local Quickstart Guide

### 1. Prerequisite Setup
* Make sure you have **Node.js** (v18+) and **MongoDB** (local community server or Atlas URI) installed.
* Get your free Gemini API Key from **[Google AI Studio](https://aistudio.google.com/)**.

### 2. Configure Backend
1. Open the `/backend` directory.
2. Edit the `.env` file and populate it:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_signing_secret
   GEMINI_API_KEY=your_google_ai_studio_api_key
   ```
3. Run:
   ```bash
   npm install
   npm run start
   ```

### 3. Configure Frontend
1. Open the `/frontend` directory.
2. Verify dependency installation and run the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## 🌐 Production Deployment Guide (Step-by-Step)

To deploy the app so judges can test it live:

### Step 1: Deploy MongoDB Database
1. Create a free account at **[MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database)**.
2. Create a shared cluster and database.
3. Obtain your connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/civicpulse?retryWrites=true&w=majority`
4. Whitelist IP access to `0.0.0.0/24` (access from anywhere) so production hosting providers can read/write data.

### Step 2: Deploy Backend API (Render / Railway / Render RECOMMENDED)
1. Commit the project to a **GitHub repository**.
2. Create an account at **[Render.com](https://render.com/)**.
3. Create a **New Web Service** and link your GitHub repository.
4. Set the **Root Directory** to `backend`.
5. Set the **Build Command** to `npm install`.
6. Set the **Start Command** to `npm start`.
7. Under **Environment Variables**, add:
   * `PORT` = `5000`
   * `MONGODB_URI` = *(Your MongoDB Atlas URI from Step 1)*
   * `JWT_SECRET` = *(Some secure random string)*
   * `GEMINI_API_KEY` = *(Your API Key from Google AI Studio)*
8. Click **Deploy**. Copy the resulting service URL (e.g. `https://civicpulse-backend.onrender.com`).

### Step 3: Connect Frontend to Backend URL
1. In the frontend, the API base URL is specified in `frontend/src/context/GlobalContext.jsx` at the top:
   ```javascript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```
2. Replace `'http://localhost:5000/api'` with your Render URL:
   ```javascript
   const API_BASE_URL = 'https://civicpulse-backend.onrender.com/api';
   ```
3. Save changes and commit them to your repository.

### Step 4: Deploy Frontend (Vercel / Netlify / Vercel RECOMMENDED)
1. Go to **[Vercel.com](https://vercel.com/)** and import your GitHub repository.
2. Set the **Root Directory** to `frontend`.
3. Set the Framework Preset to **Vite**.
4. Click **Deploy**. Vercel will automatically compile, optimize, and serve your React application globally.
