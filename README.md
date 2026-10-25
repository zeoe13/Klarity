# Klarity 🛡️ — Clear Finances & AI Guidance for the Whole Family
### Deployed with **Vercel** + **Supabase** (100% Free Tier)

A private, cloud-hosted financial management website built specifically for a **family of 6**, with credit/debit card tracking, utility bills (PG&E, Fresno Water, Xfinity, T-Mobile), purchase auto-categorization, and an AI Financial Advisor.

---

## 🚀 Step 1: Deploy to Vercel (1-Click or GitHub)

### Method A: Via GitHub & Vercel Dashboard (Easiest)
1. Push this folder to a private or public GitHub repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/family-finance.git
   git branch -M main
   git push -u origin main
   ```
2. Go to **[vercel.com](https://vercel.com)** and log in (or create a free account).
3. Click **"Add New..." ➔ "Project"**.
4. Select your `family-finance` repository and click **Deploy**.
5. Vercel will automatically build the site and give you a live HTTPS link like:
   `https://family-finance-yourname.vercel.app`

---

## 🗄️ Step 2: Connect Supabase Cloud Database (Free)

1. Go to **[supabase.com](https://supabase.com)** and create a free account / project.
2. In your Supabase dashboard, click **SQL Editor** on the left menu.
3. Open [`supabase/schema.sql`](supabase/schema.sql) from this project, copy the full contents, paste it into the Supabase SQL editor, and click **Run**.
   * *This creates the `family_members`, `accounts`, `bills`, and `transactions` tables with Row-Level Security and pre-seeds your family's data.*
4. Go to **Project Settings ➔ API** in Supabase and copy:
   * **Project URL**
   * **Project API Keys (`anon` public and `service_role` secret)**
5. In your **Vercel Dashboard ➔ Settings ➔ Environment Variables**, add:
   * `SUPABASE_URL` = your Project URL
   * `SUPABASE_SERVICE_ROLE_KEY` = your secret key
   * `GEMINI_API_KEY` = (Optional) your free key from [aistudio.google.com](https://aistudio.google.com)
6. Click **Redeploy** on Vercel. Now your whole family connects to your live Supabase cloud database!

---

## 📱 Step 3: Put It on Your Family's Phones

Once deployed to Vercel:
1. Send the live Vercel URL (e.g. `https://family-finance-yourname.vercel.app`) to your family.
2. On **iPhone (Safari)**: Tap the Share button ➔ **"Add to Home Screen"**.
3. On **Android (Chrome)**: Tap the 3 dots ➔ **"Install app"** or **"Add to Home screen"**.
4. It behaves just like a native app with an app icon on everyone's phone!

---

## 💻 Local Testing & Development

If you want to run it locally on your computer before deploying:
```bash
# Install dependencies
npm install

# Start local server (running on http://localhost:5000)
npm start
```
