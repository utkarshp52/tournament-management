# 🏆 Tournament Management System

> A smart, all-in-one platform to organize, schedule, and manage sports tournaments — from team registration to crowning the champion.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Phase](https://img.shields.io/badge/phase-5%20complete-blueviolet)
![Tests](https://img.shields.io/badge/tests-13%2F13%20passed-success)
![Theme](https://img.shields.io/badge/theme-Premier%20Sports%20Light-emerald)
![License](https://img.shields.io/badge/license-MIT-blue)
![Made with](https://img.shields.io/badge/made%20with-%E2%9D%A4%EF%B8%8F-red)

---

## 📖 Overview

The **Tournament Management System** is a full-stack web application designed to help tournament organizers manage every aspect of a sports event — teams, players, venues, umpires, schedules, results, standings, knockout stages, and reports — from a single, centralized platform.

Instead of manually tracking fixtures, scores, and standings on spreadsheets, the system automates the heavy lifting. Once a manager sets up a tournament, the system can automatically:

- 📅 **Generate the complete match schedule** with round-robin pairing algorithms
- 🏟️ **Assign venues, dates, and times** with automated conflict detection
- 🧑‍⚖️ **Allocate certified umpires** without overlapping assignments
- 📊 **Update the points table & rankings** dynamically after every recorded result
- 🥇 **Drive knockout progression** from group-stage standings to semi-finals, finals, and champion declaration
- 📄 **Generate downloadable reports** with top performers, result histories, and CSV/print export support

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-secured organizer login with bcrypt password hashing and route middleware guards |
| 🧑‍🤝‍🧑 **Team & Player Management** | Register teams, add player rosters, assign jersey numbers/roles, and maintain profiles |
| 🏟️ **Venue Management** | Add, edit, and allocate stadiums/grounds with availability tracking |
| 🧑‍⚖️ **Umpire Management** | Register match officials and assign them to fixtures conflict-free |
| 📅 **Match Scheduling** | Auto-generate round-robin fixtures with automated venue, date, time, and umpire allocation |
| ✅ **Result Management** | Record scores with Man of the Match awards, automatic standings sync, and result correction support |
| 📊 **Live Points Table** | Automatic recalculation of matches played, wins, losses, draws, points, and rank positions |
| 📈 **Player & Team Statistics** | Real-time leaderboards for runs, wickets, goals, assists, and Man of the Match awards |
| 🥇 **Knockout Stage & Champion** | Auto-seeding top 4 teams into semi-finals, progression to the final, and champion celebration |
| 📄 **Reports & CSV Export** | Complete tournament summaries, printable game sheets, and instant CSV downloads |

---

## 🎨 UI & Design Aesthetics

The application features the **Premier Sports Design System**, optimized for high contrast, modern athletic aesthetics, and fast user workflows:

- **Athletic Color Palette:** Tournament Emerald (`#059669` / `#10b981`), Championship Flame Orange (`#f97316`), and Trophy Gold (`#eab308`).
- **Sidebar & Layout:** Deep obsidian contrast navigation with responsive desktop/tablet/mobile collapse states.
- **TopBar:** Frosted glass header with active tournament selector, role badges, and quick-action shortcuts.
- **Micro-Animations & Visual Cues:** Confetti animations on champion crowning, pulsing trophy accents, animated score badges, and seamless modal dialogs.
- **Typography:** Modern Google Fonts pairing (*Outfit* for bold display headings, *Inter* for clean tabular data readability).

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19 + Vite | Fast HMR, component-driven UI, Context API for auth/state |
| **Backend** | Node.js 20 + Express.js 4 | RESTful modular routing, parameterized SQL queries, error handling middleware |
| **Database** | MySQL 8.0 (`tournamentData`) | Relational schema with foreign keys, ON DELETE CASCADE, transaction rollbacks |
| **Auth & Security** | JWT + bcryptjs | Token-based stateless authentication with password hashing |
| **HTTP Client** | Fetch API | Native fetch with a unified wrapper handling headers and token injection |
| **Styling** | Vanilla CSS3 | 2300+ lines of custom CSS tokens, dark/light contrast canvas, no heavy CSS frameworks |
| **Linting** | OxLint | Fast, modern JavaScript and React linting |

---

## 📁 Project Structure

```
tournament-management/
├── backend/
│   ├── database/
│   │   ├── db.js              # MySQL2 connection pool with promise support
│   │   └── schema.sql         # Full relational database schema (11 tables)
│   ├── middleware/
│   │   └── auth.middleware.js # JWT verification and route guard
│   ├── routes/
│   │   ├── auth.routes.js     # /api/auth — Login, register, current session
│   │   ├── tournament.routes.js # /api/tournaments — CRUD & tournament status
│   │   ├── team.routes.js     # /api/teams — Team registration & rosters
│   │   ├── player.routes.js   # /api/players — Player CRUD & statistics
│   │   ├── venue.routes.js    # /api/venues — Venue directory & availability
│   │   ├── umpire.routes.js   # /api/umpires — Umpire directory & assignments
│   │   ├── match.routes.js    # /api/matches — Fixture generator & conflict checks
│   │   ├── result.routes.js   # /api/results — Result recording & standings auto-sync
│   │   ├── standing.routes.js # /api/standings — Live points table & rankings
│   │   ├── stats.routes.js    # /api/stats — Player & team leaderboards
│   │   ├── knockout.routes.js # /api/knockout — Bracket generation & winner progression
│   │   └── report.routes.js   # /api/reports — Tournament summary & export data
│   ├── server.js              # Express app entry point & CORS configuration
│   ├── seed-admin.js          # Admin account seeder
│   ├── seed-demo.js           # Full tournament dataset (8 teams, 88 players, 31 matches)
│   ├── fix-db.js              # Database helper & schema compatibility migration
│   ├── run-schema.js          # Automated database initialization script
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/api.js         # Centralized API fetch wrapper and endpoints
│   │   ├── components/
│   │   │   ├── Sidebar.jsx    # Collapsible sports navigation
│   │   │   ├── TopBar.jsx     # Header with tournament switch & user profile
│   │   │   ├── Modal.jsx      # Accessible dialog component
│   │   │   └── UI.jsx         # StatusBadge, Spinner, EmptyState, Alert, ConfirmDialog
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global JWT session provider
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TournamentsPage.jsx
│   │   │   ├── TeamsPage.jsx
│   │   │   ├── PlayersPage.jsx
│   │   │   ├── VenuesPage.jsx
│   │   │   ├── UmpiresPage.jsx
│   │   │   ├── MatchesPage.jsx
│   │   │   ├── ResultsPage.jsx
│   │   │   ├── StandingsPage.jsx
│   │   │   ├── StatisticsPage.jsx
│   │   │   ├── KnockoutPage.jsx
│   │   │   └── ReportsPage.jsx
│   │   ├── index.css          # Design system & responsive layout styles
│   │   └── App.jsx            # Main app shell & dynamic view router
│   └── package.json
│
├── .env.example               # Example environment variable template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.x
- **MySQL Server** ≥ 8.0 running locally or via remote connection
- **npm** ≥ 9.x

### 1. Clone the repository

```bash
git clone https://github.com/utkarshp52/tournament-management.git
cd tournament-management
```

### 2. Install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example backend/.env
```

Ensure your `backend/.env` has your local MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tournamentData
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

### 4. Initialize Database

Run the automated database setup and admin seeding commands from the `backend/` folder:

```bash
cd backend

# Create all 11 tables from schema.sql
npm run db:setup

# (Optional) Verify table indexes and schema compatibility
npm run db:fix

# Seed the default organizer/admin user
npm run db:seed
```

### 5. (Optional) Load Full Realistic Demo Data

To populate the application with a complete sample cricket championship containing **8 teams**, **88 players**, and **31 matches** with completed league stages and knockout fixtures:

```bash
npm run db:demo
```

### 6. Start Development Servers

Run the backend and frontend in separate terminals:

```bash
# Terminal 1 — Backend API (runs on port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend Application (runs on port 5173)
cd frontend
npm run dev
```

Visit **http://localhost:5173** in your web browser.

---

## 🔑 Default Credentials

| Username | Password | Role | Description |
|---|---|---|---|
| `admin` | `Admin@123` | Administrator | Full organizer privileges across all modules |

---

## 🗺️ Complete Tournament Workflow

```
1. 🔐 Authenticate
   └─ Log in as administrator with JWT credentials
2. 🏆 Setup Tournament
   └─ Define tournament name, sport type, and schedule date boundaries
3. 🧑‍🤝‍🧑 Register Teams & Players
   └─ Add participating clubs and populate individual player rosters
4. 🏟️ Configure Resources
   └─ Register venues and certified umpires with availability tracking
5. 📅 Generate Fixtures
   └─ Auto-generate round-robin league matches without venue or umpire clashes
6. 📝 Enter Match Results
   └─ Input scores, winning margin, and select Man of the Match
   └─ System updates standings (P, W, L, D, Pts, rank) atomically in a transaction
   └─ Supports editing / result corrections with automatic reversal of prior points
7. 🥇 Knockout Stage
   └─ System automatically seeds top 4 teams into Semi-Final 1 and Semi-Final 2
   └─ Record semi-final winners to automatically advance contenders to the Final
   └─ Enter final result to crown the Champion
8. 📄 Summary & Export
   └─ Review tournament summary metrics, top run/wicket/goal scorers
   └─ Export standings or match outcomes directly as CSV files
   └─ Print official game sheets using built-in print styles
```

---

## 📊 Database Schema (11 Relational Tables)

| Table | Purpose |
|---|---|
| `users` | Organizer accounts, credentials (bcrypt hashes), roles |
| `tournaments` | Tournament metadata, sport type, start/end dates, status |
| `teams` | Participating squads linked to tournaments with unique name enforcement |
| `players` | Athlete profiles, team assignments, roles, jersey numbers |
| `venues` | Ground/arena details, city, capacity, and active availability flags |
| `umpires` | Match referee records and availability states |
| `matches` | Fixtures with home/away teams, venue, umpire, date, time slot, round, status |
| `match_results` | Scores, winner ID, margin, draw flag, Man of the Match reference |
| `standings` | Live points table: matches played, wins, losses, draws, points, rank positions |
| `player_statistics` | Aggregated match metrics: runs, wickets, goals, assists, awards |
| `knockout_bracket` | Tournament playoff tree: semi-final & final fixtures and champion ID |

---

## 🧪 Software Testing & Verification

The application includes end-to-end verification covering authentication, data integrity, scheduling conflict detection, standings recalculation, and knockout workflows.

| Test ID | Test Scenario | Expected Result | Actual Result / Observation | Status |
| :---: | :--- | :--- | :--- | :---: |
| **TC01** | Open the application | The application loads without an unexpected error | Application loaded cleanly at `localhost:5173`; rendered landing and login screen with complete styles and assets. | **Pass** |
| **TC02** | Log in with valid credentials | The organizer can access the dashboard | Backend verified bcrypt hash and issued JWT; user redirected to Dashboard with metric cards. | **Pass** |
| **TC03** | Attempt login with invalid credentials | Access is denied and an appropriate error is displayed | Returned HTTP 401 Unauthorized; UI rendered error alert banner; access denied. | **Pass** |
| **TC04** | Create a tournament with valid details | The tournament is saved and appears in the tournament list | Inserted into `tournaments` table with `upcoming` status; listed immediately in UI dropdowns. | **Pass** |
| **TC05** | Add a team or player with missing required details | The system rejects the request and requests missing information | Frontend HTML5 validation intercepted submission; API returned HTTP 400 Bad Request. | **Pass** |
| **TC06** | Add a duplicate team | The system rejects the duplicate record | Backend detected duplicate name in tournament; returned HTTP 409 Conflict with clear message. | **Pass** |
| **TC07** | Generate fixtures for a tournament | Round-robin matches are created with venue, date, time, and umpire without conflicts | Generated 28 round-robin fixtures across 7 rounds without double-booking venues or umpires. | **Pass** |
| **TC08** | Schedule two matches at the same venue and time | The system detects the conflict and prevents allocation | Conflict check queried existing bookings; returned HTTP 400 Bad Request ("Venue conflict"). | **Pass** |
| **TC09** | Enter a match result with Man of the Match | Result is saved and points table and statistics are updated | Result recorded; match marked `completed`; standings (+2 pts) and player statistics updated. | **Pass** |
| **TC10** | Correct an already recorded result | Standings and statistics are recalculated correctly | Previous standings impact reversed first within transaction; new scores and ranks cleanly recalculated. | **Pass** |
| **TC11** | Generate knockout bracket and record final winner | Semi-finals filled from standings, winner progresses, champion declared | Top 4 seeded into semi-finals; winners advanced to Final; Final winner crowned Champion. | **Pass** |
| **TC12** | Export standings or results as CSV | A CSV file with the correct data is downloaded | Browser generated and downloaded structured `.csv` files with accurate tabular data. | **Pass** |
| **TC13** | Access a protected page without logging in | The system denies access and redirects to login page | Unauthenticated requests redirected by frontend route guard; API returned HTTP 401. | **Pass** |

---

## 🔌 API Reference Overview

All management routes require an `Authorization: Bearer <JWT_TOKEN>` header.

- **Authentication:** `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`
- **Tournaments:** `GET /api/tournaments`, `POST /api/tournaments`, `PUT /api/tournaments/:id`, `DELETE /api/tournaments/:id`
- **Teams & Players:** `GET /api/teams`, `POST /api/teams`, `GET /api/players`, `POST /api/players`
- **Venues & Umpires:** `GET /api/venues`, `POST /api/venues`, `GET /api/umpires`, `POST /api/umpires`
- **Matches & Scheduling:** `GET /api/matches`, `POST /api/matches`, `POST /api/matches/generate`, `DELETE /api/matches/clear/:tournament_id`
- **Results:** `POST /api/results`, `GET /api/results/:match_id`
- **Standings:** `GET /api/standings?tournament_id=:id`
- **Statistics:** `GET /api/stats/players?tournament_id=:id`, `GET /api/stats/teams?tournament_id=:id`
- **Knockout Stage:** `GET /api/knockout?tournament_id=:id`, `POST /api/knockout/generate`, `POST /api/knockout/result`
- **Reports:** `GET /api/reports/summary?tournament_id=:id`, `GET /api/reports/tournaments`

---

## 📌 Future Enhancements

- 📱 Mobile application support (React Native)
- 🔔 Live web socket score notifications
- 📊 Interactive data visualization charts (Chart.js / D3)
- 🌐 Public spectator portal with live ticker
- 🖨️ Direct PDF game report export
- 🔐 Granular multi-role permissions (Scorers, Team Managers, Referees)

---

## 🤝 Contributing

1. Clone the repository: `git clone https://github.com/utkarshp52/tournament-management.git`
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<p align="center">Made for organizers who'd rather run a great tournament than manage a spreadsheet. 🏟️🏆</p>
