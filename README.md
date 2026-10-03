# 🏆 Tournament Management System

> A smart, all-in-one platform to organize, schedule, and manage sports tournaments — from team registration to crowning the champion.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Phase](https://img.shields.io/badge/phase-5%20complete-blueviolet)
![License](https://img.shields.io/badge/license-MIT-blue)
![Made with](https://img.shields.io/badge/made%20with-%E2%9D%A4%EF%B8%8F-red)

---

## 📖 Overview

The **Tournament Management System** is a full-stack web application designed to help tournament organizers manage every aspect of a sports event — teams, players, venues, umpires, schedules, results, standings, knockout stages, and reports — from a single, centralized platform.

Instead of manually tracking fixtures, scores, and standings on spreadsheets, the system automates the heavy lifting. Once a manager sets up a tournament, the system can automatically:

- 📅 Generate the complete match schedule
- 🏟️ Assign venues, dates, and times without conflicts
- 🧑‍⚖️ Allocate umpires to matches
- 📊 Update the points table, rankings, wins/losses, and player statistics after every result
- 🥇 Manage semi-finals and finals based on standings
- 📄 Generate downloadable tournament reports with champion declaration

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Authentication** | JWT-secured organizer login with role-based access |
| 🧑‍🤝‍🧑 **Team & Player Management** | Register teams, add player rosters, and maintain player profiles |
| 🏟️ **Venue Management** | Add, edit, and allocate venues for matches |
| 🧑‍⚖️ **Umpire Management** | Assign and manage umpires across fixtures |
| 📅 **Match Scheduling** | Auto-generate round-robin fixtures with conflict-free venue/umpire allocation |
| ✅ **Match Result Management** | Record results and trigger automatic standings/stat updates (with correction support) |
| 📊 **Points Table** | Live standings, wins, losses, draws, points, and win percentage |
| 📈 **Player/Team Statistics** | Track runs, wickets, goals, assists, Man of the Match awards |
| 🥇 **Knockout Bracket** | Automatic semi-final + final progression, winner recording, champion declaration |
| 📄 **Reports & Export** | Tournament summary, top performers, all results, CSV export, and print support |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite (JavaScript) |
| **Backend** | Node.js 20 + Express.js 4 |
| **Database** | MySQL 8.0 (database: `tournamentData`) |
| **Auth** | JWT (`jsonwebtoken`) + `bcryptjs` |
| **HTTP Client** | Fetch API (native, no Axios) |
| **Styling** | Vanilla CSS — custom design system with dark mode, CSS variables, Inter + Outfit fonts |
| **Linting** | OxLint |

---

## 📁 Project Structure

```
tournament-management/
├── backend/
│   ├── database/
│   │   ├── db.js              # MySQL2 connection pool
│   │   └── schema.sql         # Full database schema (11 tables)
│   ├── middleware/
│   │   └── auth.middleware.js # JWT verification
│   ├── routes/
│   │   ├── auth.routes.js     # Login / register / me
│   │   ├── tournament.routes.js
│   │   ├── team.routes.js
│   │   ├── player.routes.js
│   │   ├── venue.routes.js
│   │   ├── umpire.routes.js
│   │   ├── match.routes.js    # Schedule + fixture generation
│   │   ├── result.routes.js   # Results + standings auto-update
│   │   ├── standing.routes.js
│   │   ├── stats.routes.js    # Player & team stats + leaderboard
│   │   ├── knockout.routes.js # Bracket generation + winner recording
│   │   └── report.routes.js   # Full tournament summary (Phase 5)
│   ├── server.js
│   ├── seed-admin.js          # Creates default admin user
│   ├── seed-demo.js           # Full demo dataset seeder (Phase 5)
│   ├── run-schema.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/api.js         # Centralized fetch wrapper + all API namespaces
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TopBar.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── UI.jsx         # Spinner, EmptyState, StatusBadge, Alert, ConfirmDialog
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TournamentsPage.jsx
│   │   │   ├── TeamsPage.jsx
│   │   │   ├── PlayersPage.jsx
│   │   │   ├── VenuesPage.jsx
│   │   │   ├── UmpiresPage.jsx
│   │   │   ├── MatchesPage.jsx    # Fixture gen + status management
│   │   │   ├── ResultsPage.jsx    # Result entry with MOM selection
│   │   │   ├── StandingsPage.jsx  # Live points table
│   │   │   ├── StatisticsPage.jsx # Player & team stats dashboards
│   │   │   ├── KnockoutPage.jsx   # Bracket + champion declaration
│   │   │   └── ReportsPage.jsx    # Phase 5 — full report + CSV export
│   │   ├── index.css          # Complete design system (2300+ lines)
│   │   └── App.jsx
│   └── package.json
│
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **MySQL** 8.0 running locally (or remotely)

### 1. Clone and install

```bash
git clone https://github.com/utkarshp52/tournament-management.git
cd tournament-management

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# Copy the example env file and fill in your MySQL credentials
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=tournamentData
JWT_SECRET=your_super_secret_key
PORT=5000
```

### 3. Initialize the database

```bash
cd backend
npm run db:setup   # creates all tables from schema.sql
npm run db:seed    # creates the default admin user
```

### 4. (Optional) Load demo data

```bash
npm run db:demo    # seeds a complete cricket tournament with 8 teams, 88 players, 31 matches
```

### 5. Start the servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Default Login

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@123` | Administrator |

---

## 🗺️ End-to-End Workflow

```
1. Login as organizer
2. Create a tournament (Tournaments page)
3. Add Teams → add Players to each team
4. Add Venues and Umpires
5. Generate fixtures (Matches page → Generate Fixtures)
6. Enter match results (Results page)
   └─ Standings auto-update after each result
7. Generate knockout bracket (Knockout page → Generate Bracket)
8. Record semi-final and final winners
9. View champion declaration
10. Open Reports page → view full summary, top performers
    → Export CSV (standings / results)
    → Print report
```

---

## 📊 Database Schema (11 Tables)

```
users              → organizer authentication
tournaments        → tournament configuration
teams              → registered teams
players            → player rosters
venues             → match venues
umpires            → assigned umpires
matches            → scheduled fixtures
match_results      → match outcomes + MOM
standings          → live points table
player_statistics  → individual performance stats
knockout_bracket   → semi-final / final brackets
```

---

## 🧪 Phase Completion

| Phase | Description | Status |
|---|---|---|
| Phase 1 | Planning, UI Foundation, Database Design, Authentication | ✅ Done |
| Phase 2 | Tournament, Team, Player, Venue, Umpire CRUD | ✅ Done |
| Phase 3 | Scheduling, Fixture Generation, Results, Conflict Validation | ✅ Done |
| Phase 4 | Standings, Statistics, Knockout Bracket, Champion | ✅ Done |
| Phase 5 | Reports Module, CSV Export, Demo Data, Documentation | ✅ Done |

---

## 📌 Future Enhancements

- 📱 Mobile app support
- 🔔 Live score notifications
- 📊 Advanced analytics dashboards with charts
- 🌐 Public tournament portal for fans
- 🖨️ PDF report generation
- 🔐 Multi-organizer with role-based permissions

---

## 🤝 Contributing

1. Clone the repository and keep `main` clean.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Implement and test locally.
4. Commit with a clear message.
5. Open a Pull Request into `main`.
6. Another team member reviews before merging.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use and modify it for your own tournaments.

---

<p align="center">Made for organizers who'd rather run a great tournament than manage a spreadsheet. 🏟️</p>
