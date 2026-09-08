# Offer Sensei

**"Should you give this offer?"** — a small idea-checker that helps a grocery store owner decide whether a discount actually makes financial sense, before they commit to it.

This is not a high-end app. It is deliberately a small, single-purpose web app built around one simple but valuable idea: **check the offer before you give it.**

---

## The idea in one example

A grocery store sells milk for Rs 50. Milk costs the store Rs 48, so the profit on one bottle is just Rs 2.

The owner wants to say *"20% off on milk."*

- Customer pays **Rs 40**.
- The store **loses Rs 8 on every sale**.

Most offer tools ask: *"Will customers like this offer?"*
Offer Sensei asks the question nobody asks first: **"Can the business afford it?"**

So instead of filling forms, the owner just types what they're thinking, and the app answers with a clear, honest verdict:

- "What about 20% off on milk?"
- "Can I give Rs 20 off on juice?"
- "I want to clear old stock. Which product can I discount?"

> Concept: a shopkeeper should never have to do profit math in their head. The idea of this app is to put a trustworthy "offer checker" between the owner's idea and the shop's money.

## How it works

```
Owner's question (plain words)
              │
              ▼
   AI understands what the owner meant
   (which product? how much off? which customers?)
              │
              ▼
   Backend does ALL the money math (deterministic truth)
              │
              ▼
            Verdict:  GOOD  |  RISKY  |  LOSS
              │
              ▼
   AI explains the numbers in plain English
   and suggests a smarter alternative
```

### The verdict rules (backend decides, not the AI)

| Situation | Verdict |
|---|---|
| New profit goes negative | **LOSS** — "not recommended" |
| New profit is zero, or more than half the profit is lost | **RISKY** |
| Otherwise | **GOOD** — "financially OK" |

The backend also computes the *maximum safe discount* for each product, so the reply can say things like *"milk can survive at most a 4% discount before losing money."*

### AI vs backend — the one rule we never break

- The **AI** reads words, extracts what the owner means, and explains results.
- The **backend** owns every rupee sign. All prices, profits, margins and verdicts are computed by `analysisService.js`.

The AI never calculates money. If the AI hallucinates a number, the backend simply doesn't use it. This keeps the financial advice honest and testable.

## Built-in features

- A simple dashboard: your **products** and your **saved offers** on one screen.
- Add products with just the selling price and cost price; the margin % is shown automatically.
- A floating **"Ask AI"** button opens a chat where the owner asks in their own words.
- For every idea the backend shows a verdict badge, a money table, and a plain-English explanation, with a **Save this offer** button.
- Saved offers are listed with their verdict; anything can be deleted behind a **Yes/No confirmation**.
- The app works even with no internet AI: a built-in **mock AI** does the same job offline, and a small chip honestly shows whether you're talking to *Gemini* or the *mock*.

## Tech stack

| Layer | What we used |
|---|---|
| Frontend | React 18 + Vite (JavaScript) |
| Backend | Node.js + Express (ES Modules) |
| Database | PostgreSQL on Neon Tech (cloud) |
| ORM | Sequelize |
| AI | Google Gemini (REST via `fetch`) with an offline mock fallback |

## Folder structure

```
backend/
  src/
    config/
      database.js          Sequelize connection to Neon Postgres
    models/                Business, Product, CustomerGroup, Offer (+ relations)
    services/
      analysisService.js   THE math: profits, margins, verdicts, safe limits
      aiService.js         Gemini + mock AI (extract, explain, recommend)
      businessService.js   picks the default shop (no logins yet)
    controllers/           logic for products, offers, groups and the AI ask
    routes/                HTTP routes (products, offers, customer-groups, ai)
    seed.js                fills the DB with sample data
    server.js              backend entry point
frontend/
  src/
    api.js                 tiny fetch wrappers for the backend
    App.jsx                the main dashboard screen
    main.jsx               app entry point
    styles.css             all styling (design tokens, components)
    components/
      AskAI.jsx            the chat drawer
      AnalysisCard.jsx     verdict badge + money table + save button
      ProductsView.jsx     add / delete products with margin chips
      OffersView.jsx       saved offers table
      ConfirmModal.jsx     custom Yes/No dialog before deletes
      icons.jsx            small inline SVG icons (no emoji)
```

## How to run it

Requirements: **Node 18+** and a **PostgreSQL** connection string (Neon works).

```bash
# 1. Backend  (localhost:8000)
cd backend
cp .env.example .env          # add DATABASE_URL, optionally GEMINI_API_KEY
npm install
npm run seed                  # sample business, products, customer groups
npm run dev

# 2. Frontend  (localhost:5173)
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** and try asking:

- "Is 10% off on biscuits a good idea?"
- "Give 20% off on milk to inactive customers"
- "Can I give Rs 20 off on juice?"

Sample seeded products: Milk (Rs 50 / Rs 48), Biscuits (Rs 50 / Rs 30), Juice (Rs 100 / Rs 60), Chocolate (Rs 60 / Rs 38).

> `AI_MODE` in `backend/.env`: `auto` (Gemini if a key exists, else mock), `gemini` (always real API), or `mock` (always offline).

## Video demo

<video src="https://drive.google.com/file/d/14Mu848nBn_ztzxceGme0PYHznlLp7KUu/view?usp=drivesdk" width="100%" controls></video>


## Tests

A full manual/automated test pass lives in **[TEST-REPORT.md](TEST-REPORT.md)** — 87 cases covering the API, the money math, the AI endpoint and the UI flows.