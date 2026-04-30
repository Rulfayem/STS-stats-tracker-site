# STS1 Stats Tracker

A community-driven stats tracking web app for **Slay the Spire 1**. Users can upload their run files, view community statistics for each character, and show off on their profile page.

**Live Site:** [sts1statstracker.vercel.app](https://sts1statstracker.vercel.app)  
**GitHub:** [github.com/Rulfayem/STS-stats-tracker-site](https://github.com/Rulfayem/STS-stats-tracker-site)  
**Author:** Alfaim Hassan

---

## What the App Does

- Users upload their Slay the Spire `.run` files to contribute their run data to the community
- Each character (Ironclad, The Silent, Defect, Watcher) has a dedicated stats page displaying crucial statistics, such as the most picked cards, highest winrate cards, and an Act 4 leaderboard
- Card images and descriptions are fetched from the **Spire Codex external API**
- Users have a personal profile page showing their overall stats, win rates per character, and customizable banner and profile picture
- Authentication is handled via **Firebase Auth** (Email/Password)

---

## Tech Stack

### Frontend
- **React** (with Vite)
- **React Router** — client-side routing
- **React Bootstrap** — UI components
- **Firebase** — authentication, Firestore (user profiles), Storage (images)
- **Axios** — HTTP requests

### Backend
- **Node.js + Express** — REST API server
- **Neon (PostgreSQL)** — database for run data and favourites
- **pg** — PostgreSQL client
- **dotenv** — environment variable management
- **cors** — cross-origin request handling

### External Services
- **Firebase Auth** — user authentication
- **Firebase Firestore** — storing user profile data (username, profile picture URL, banner URL)
- **Firebase Storage** — storing profile banner and profile picture images
- **Neon** — PostgreSQL database (run history, favourites)
- **Spire Codex API** — fetching card images and descriptions (`https://spire-codex.com/api/cards`)
- **Vercel** — frontend hosting
- **Render** — backend hosting

---

## Features

- **User Authentication** — Sign up and log in with email and password via Firebase Auth - certain features require login
- **Run File Upload** — Drag and drop single files, multiple files, or even entire folders of `.run` files. Duplicate runs are automatically detected and ignored
- **Community Stats Pages** — Each character page displays the most picked cards and highest winrate cards calculated from all uploaded community runs, with card art and descriptions from the Spire Codex API
- **Act 4 Leaderboard** — Top 5 players with the highest Act 4 clear-rate per character, with clickable links to their profiles
- **Profile Page** — Displays a user's total runs, wins, losses, overall win rate, total playtime, and win rate broken down by character
- **Profile Customisation** — Users can upload a custom banner image and profile picture, with a live preview before saving
- **Responsive Design** — Works on both desktop and mobile screens

---

## API Endpoints

### Runs
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/runs` | Save a new run to the database |
| GET | `/api/runs/:character` | Get all runs for a specific character |
| GET | `/api/runs/user/:user_id` | Get all runs uploaded by a specific user |

### Favourites
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/favourites` | Add a new favourite card or relic |
| GET | `/api/favourites/:user_id` | Get all favourites for a user |
| PUT | `/api/favourites/:id` | Update a favourite item |
| DELETE | `/api/favourites/:id` | Delete a favourite item |

---

## Environment Variables

### Frontend (`.env`)
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_API_URL=
```

### Backend (`backend/.env`)
```
DATABASE_URL=
PORT=5000
```

---

## Running Locally

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
npm run dev
```

---

## Deployment

- **Frontend** is deployed on **Vercel** — auto-deploys on every push to the main branch
- **Backend** is deployed on **Render** — auto-deploys on every push to the main branch

---

## External API

This project uses the **Spire Codex API** (`https://spire-codex.com/api/cards`) to fetch card names, descriptions, and card art for display on the character stats pages and profile favourites section. Cards not found in the API fall back to a placeholder image.