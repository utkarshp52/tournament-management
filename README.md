# 🏆 Tournament Management System

> A smart, all-in-one platform to organize, schedule, and manage sports tournaments — from team registration to crowning the champion.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Made with](https://img.shields.io/badge/made%20with-%E2%9D%A4%EF%B8%8F-red)

---

## 📖 Overview

The **Tournament Management System** is a software application designed to help tournament organizers manage every aspect of a sports event — teams, players, venues, umpires, schedules, and rules — from a single, centralized platform.

Instead of manually tracking fixtures, scores, and standings on spreadsheets, the system automates the heavy lifting. For example, once a manager enters **5 teams**, the system can automatically:

- 📅 Generate the complete match schedule
- 🏟️ Assign venues, dates, and times
- 🧑‍⚖️ Allocate umpires to matches
- 📊 Update the points table, rankings, wins/losses, and player statistics after every result

The system also manages the tournament's progression through **semi-finals, finals, and the eventual winner**, based purely on match outcomes — reducing manual effort, eliminating scheduling conflicts, and keeping all tournament data organized in one place.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧑‍🤝‍🧑 **Team & Player Management** | Register teams, add player rosters, and maintain player profiles |
| 🏟️ **Venue Management** | Add, edit, and allocate venues for matches |
| 🧑‍⚖️ **Umpire Management** | Assign and manage umpires across fixtures |
| 📅 **Match Scheduling** | Auto-generate fixtures, dates, times, and avoid conflicts |
| ✅ **Match Result Management** | Record results and trigger automatic table/stat updates |
| 📊 **Points Table** | Real-time standings, wins, losses, and rankings |
| 📈 **Player/Team Statistics** | Track performance metrics across the tournament |
| 🥇 **Knockout/Final Management** | Automatic semi-final and final bracket progression |
| 🏆 **Tournament Winner & Reports** | Final results, summaries, and downloadable reports |

---

## 🧩 System Modules

```
Tournament Management System
│
├── 1. Team & Player Management
├── 2. Venue Management
├── 3. Umpire Management
├── 4. Match Scheduling
├── 5. Match Result Management
├── 6. Points Table
├── 7. Player/Team Statistics
├── 8. Knockout/Final Management
└── 9. Tournament Winner & Reports
```

---

## ⚙️ How It Works

1. **Setup** — The tournament manager enters team details, player rosters, venues, umpires, and tournament rules.
2. **Scheduling** — The system automatically generates match fixtures, assigning venues, dates, times, and umpires to avoid conflicts.
3. **Match Day** — After each match, the manager enters the result.
4. **Auto Updates** — The system instantly updates the points table, team rankings, wins/losses, and individual player statistics.
5. **Knockout Stage** — Based on standings, the system automatically manages semi-finals and finals.
6. **Champion Declared** — The tournament winner is determined, and final reports are generated.

---

## 🎯 Benefits

- ⏱️ **Saves time** by automating scheduling and statistics
- 🚫 **Avoids conflicts** in venue, date, and umpire allocation
- 📂 **Centralizes data** — no more scattered spreadsheets
- 🔄 **Real-time updates** to standings and stats after every match
- 📄 **Transparent reporting** for organizers, teams, and spectators

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite (JavaScript) |
| **Backend** | Node.js + Express.js |
| **Database** | MySQL 8.0 (Database: `tournamentData`) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **HTTP Client** | Fetch API (native) |
| **Styling** | Vanilla CSS (custom design system) |

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/tournament-management-system.git

# Navigate to the project directory
cd tournament-management-system

# Install dependencies
# (add your install command here, e.g. npm install / pip install -r requirements.txt)

# Run the application
# (add your run command here)
```

---

## 📌 Future Enhancements

- 📱 Mobile app support
- 🔔 Live score notifications
- 📊 Advanced analytics dashboards
- 🌐 Public tournament portal for fans

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork this repository, raise issues, or submit pull requests to improve the system.

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use and modify it for your own tournaments.

---

<p align="center">Made for organizers who'd rather run a great tournament than manage a spreadsheet. 🏟️</p>
