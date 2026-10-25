# FamFinance 🛡️ — Private Family Finance, Cards, Bills & AI Advisor

A self-hosted personal finance platform built specifically for a **family of 6**, designed for 100% privacy and zero monthly subscription fees.

---

## ✨ Features Included

1. **Family Member Switcher (6 Profiles)**
   * Built-in support for Dad, Mom, College student, High School teen, and 2 kids.
   * Switch views with one click to see individual spending or whole-household totals.

2. **Connected Cards & Bank Accounts**
   * Link credit cards, debit cards, and checking accounts.
   * Tracks credit card balances, limits, utilization rates, minimum payments, due dates, and **APR interest rates**.
   * One-click Plaid sandbox simulator + manual card entry.

3. **Household Bills & Utilities Tracker**
   * Pre-configured tracking for essential household bills: **PG&E (Electric/Gas)**, **City of Fresno Water & Sewer**, **Xfinity Internet**, **T-Mobile (6-line family plan)**, **Netflix 4K**, and **Gaming passes (Nintendo, Spotify)**.
   * Due-date alerts ("Due Soon", "Paid", "Upcoming").
   * **AI E-Bill Scanner:** Paste or forward statement text to automatically extract the biller name, amount, and due date.

4. **Auto-Categorized Purchases**
   * Automatically recognizes and tags purchases:
     * ⚡ **Utilities** (PG&E, Fresno Water, Xfinity, T-Mobile)
     * 📺 **Subscriptions** (Netflix, Spotify, Hulu, Disney+)
     * 🎮 **Gaming** (Roblox, Steam, Nintendo eShop, Minecraft)
     * 🛒 **Groceries** (Costco, Trader Joe's)
     * 🍔 **Dining** (In-N-Out, DoorDash, Chipotle)
     * ⛽ **Transportation** (Chevron, Shell)

5. **AI Financial Advisor**
   * Interactive chat powered by **Gemini 2.5** (with a built-in deterministic financial reasoning engine fallback if no API key is set).
   * **Avalanche Method:** Calculates mathematically which credit card has the highest APR and gives a dollar-by-dollar payoff strategy.
   * **Snowball Method:** Suggests which card to knock out first for fast psychological wins.
   * **Cash Buffer Safety Check:** Verifies if your checking account covers upcoming bills.
   * **Subscription & Gaming Audit:** Flags kid spending on Roblox/Steam and redundant streaming tiers.

---

## 🚀 How to Run

### Quick Start (Single Command)
The server serves both the API and the React frontend on port `5000`:
```bash
cd "C:\Users\zkid1\.gemini\antigravity\scratch\family-finance-app"
npm start
```
Then open: **`http://localhost:5000`** in your browser.

### Development Mode (with Live Hot-Reloading)
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Vite React Frontend (runs on port 3000)
npm run client
```

---

## 📱 How to Open on Your Family's Phones (PWA)

To let your family access it from their iPhones or Android devices on home Wi-Fi:
1. Find your computer's local IP address (e.g., in PowerShell: `ipconfig` -> `IPv4 Address: 192.168.1.150`).
2. Have family members visit **`http://192.168.1.150:5000`** in Safari (iOS) or Chrome (Android).
3. Tap the browser share button and choose **"Add to Home Screen"**.
4. The app installs as a full-screen, native-feeling app on their phones!

---

## 🔑 Optional Configuration (`server/.env`)

Edit `server/.env`:
```ini
# Add your Google Gemini API Key for dynamic reasoning
GEMINI_API_KEY=your_key_here

# Add Plaid Credentials (free up to 100 live accounts in Development tier)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
```
