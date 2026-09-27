-- ============================================================
-- Tournament Management System - Database Schema
-- Database: tournamentData
-- Phase 1 - ER Design & Database Foundation
-- ============================================================

CREATE DATABASE IF NOT EXISTS tournamentData
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tournamentData;

-- ============================================================
-- 1. USERS / ORGANIZERS (Authentication)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  user_id      INT           AUTO_INCREMENT PRIMARY KEY,
  username     VARCHAR(50)   NOT NULL UNIQUE,
  email        VARCHAR(100)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role         ENUM('admin','organizer','viewer') NOT NULL DEFAULT 'organizer',
  full_name    VARCHAR(100),
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. TOURNAMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tournaments (
  tournament_id   INT           AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  sport_type      VARCHAR(50)   NOT NULL DEFAULT 'Generic',
  start_date      DATE          NOT NULL,
  end_date        DATE          NOT NULL,
  location        VARCHAR(200),
  description     TEXT,
  format          ENUM('league','knockout','league_knockout') NOT NULL DEFAULT 'league_knockout',
  status          ENUM('upcoming','ongoing','completed','cancelled') NOT NULL DEFAULT 'upcoming',
  max_teams       INT           NOT NULL DEFAULT 8,
  organizer_id    INT,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ============================================================
-- 3. TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  team_id        INT           AUTO_INCREMENT PRIMARY KEY,
  tournament_id  INT           NOT NULL,
  name           VARCHAR(100)  NOT NULL,
  short_name     VARCHAR(10),
  logo_url       VARCHAR(255),
  home_city      VARCHAR(100),
  coach_name     VARCHAR(100),
  captain_id     INT,                      -- FK set after players table
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  UNIQUE KEY uq_team_tournament (name, tournament_id)
);

-- ============================================================
-- 4. PLAYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  player_id      INT           AUTO_INCREMENT PRIMARY KEY,
  team_id        INT           NOT NULL,
  tournament_id  INT           NOT NULL,
  full_name      VARCHAR(100)  NOT NULL,
  jersey_number  INT,
  position       VARCHAR(50),           -- e.g. Batsman, Bowler, All-rounder, Goalkeeper, etc.
  date_of_birth  DATE,
  nationality    VARCHAR(50),
  is_active      BOOLEAN       DEFAULT TRUE,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id)       REFERENCES teams(team_id)           ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  UNIQUE KEY uq_jersey_team (jersey_number, team_id)
);

-- Back-fill captain FK on teams
ALTER TABLE teams
  ADD CONSTRAINT fk_captain FOREIGN KEY (captain_id) REFERENCES players(player_id) ON DELETE SET NULL;

-- ============================================================
-- 5. VENUES
-- ============================================================
CREATE TABLE IF NOT EXISTS venues (
  venue_id       INT           AUTO_INCREMENT PRIMARY KEY,
  tournament_id  INT           NOT NULL,
  name           VARCHAR(150)  NOT NULL,
  city           VARCHAR(100),
  country        VARCHAR(100)  DEFAULT 'India',
  capacity       INT,
  address        TEXT,
  is_available   BOOLEAN       DEFAULT TRUE,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE
);

-- ============================================================
-- 6. UMPIRES
-- ============================================================
CREATE TABLE IF NOT EXISTS umpires (
  umpire_id      INT           AUTO_INCREMENT PRIMARY KEY,
  tournament_id  INT           NOT NULL,
  full_name      VARCHAR(100)  NOT NULL,
  nationality    VARCHAR(50),
  experience_years INT         DEFAULT 0,
  email          VARCHAR(100),
  phone          VARCHAR(20),
  is_available   BOOLEAN       DEFAULT TRUE,
  created_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE
);

-- ============================================================
-- 7. MATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  match_id         INT           AUTO_INCREMENT PRIMARY KEY,
  tournament_id    INT           NOT NULL,
  home_team_id     INT           NOT NULL,
  away_team_id     INT           NOT NULL,
  venue_id         INT,
  umpire_id        INT,
  match_date       DATE          NOT NULL,
  match_time       TIME,
  round            VARCHAR(50)   NOT NULL DEFAULT 'Group Stage',
                                 -- 'Group Stage', 'Semi-Final 1', 'Semi-Final 2', 'Final'
  match_number     INT,
  status           ENUM('scheduled','ongoing','completed','postponed','cancelled')
                                 NOT NULL DEFAULT 'scheduled',
  notes            TEXT,
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  FOREIGN KEY (home_team_id)  REFERENCES teams(team_id)            ON DELETE CASCADE,
  FOREIGN KEY (away_team_id)  REFERENCES teams(team_id)            ON DELETE CASCADE,
  FOREIGN KEY (venue_id)      REFERENCES venues(venue_id)          ON DELETE SET NULL,
  FOREIGN KEY (umpire_id)     REFERENCES umpires(umpire_id)        ON DELETE SET NULL,
  CHECK (home_team_id <> away_team_id)
);

-- ============================================================
-- 8. MATCH RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS match_results (
  result_id         INT           AUTO_INCREMENT PRIMARY KEY,
  match_id          INT           NOT NULL UNIQUE,
  winner_team_id    INT,                    -- NULL = draw/no result
  home_score        VARCHAR(50),            -- flexible: "245/8 (50 ov)" or "3"
  away_score        VARCHAR(50),
  margin            VARCHAR(100),           -- e.g. "7 wickets" or "2 goals"
  is_draw           BOOLEAN       DEFAULT FALSE,
  man_of_match_id   INT,                    -- player_id
  result_notes      TEXT,
  recorded_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id)          REFERENCES matches(match_id)     ON DELETE CASCADE,
  FOREIGN KEY (winner_team_id)    REFERENCES teams(team_id)        ON DELETE SET NULL,
  FOREIGN KEY (man_of_match_id)   REFERENCES players(player_id)    ON DELETE SET NULL
);

-- ============================================================
-- 9. POINTS TABLE / STANDINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS standings (
  standing_id     INT           AUTO_INCREMENT PRIMARY KEY,
  tournament_id   INT           NOT NULL,
  team_id         INT           NOT NULL,
  matches_played  INT           DEFAULT 0,
  wins            INT           DEFAULT 0,
  losses          INT           DEFAULT 0,
  draws           INT           DEFAULT 0,
  points          INT           DEFAULT 0,
  net_run_rate    DECIMAL(8,4)  DEFAULT 0.0000,    -- sport-specific
  goals_for       INT           DEFAULT 0,
  goals_against   INT           DEFAULT 0,
  rank            INT,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  FOREIGN KEY (team_id)       REFERENCES teams(team_id)            ON DELETE CASCADE,
  UNIQUE KEY uq_standing (tournament_id, team_id)
);

-- ============================================================
-- 10. PLAYER STATISTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS player_statistics (
  stat_id           INT           AUTO_INCREMENT PRIMARY KEY,
  player_id         INT           NOT NULL,
  tournament_id     INT           NOT NULL,
  matches_played    INT           DEFAULT 0,
  -- Generic sport stats (can be extended)
  goals_scored      INT           DEFAULT 0,
  assists           INT           DEFAULT 0,
  yellow_cards      INT           DEFAULT 0,
  red_cards         INT           DEFAULT 0,
  -- Cricket-specific (nullable for non-cricket)
  runs_scored       INT           DEFAULT 0,
  balls_faced       INT           DEFAULT 0,
  fifties           INT           DEFAULT 0,
  hundreds          INT           DEFAULT 0,
  wickets_taken     INT           DEFAULT 0,
  overs_bowled      DECIMAL(5,1)  DEFAULT 0.0,
  runs_conceded     INT           DEFAULT 0,
  catches           INT           DEFAULT 0,
  man_of_match_count INT          DEFAULT 0,
  updated_at        TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id)     REFERENCES players(player_id)        ON DELETE CASCADE,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  UNIQUE KEY uq_player_tournament_stat (player_id, tournament_id)
);

-- ============================================================
-- 11. KNOCKOUT BRACKET
-- ============================================================
CREATE TABLE IF NOT EXISTS knockout_bracket (
  bracket_id      INT           AUTO_INCREMENT PRIMARY KEY,
  tournament_id   INT           NOT NULL,
  stage           ENUM('semi_final','final') NOT NULL,
  match_id        INT,                          -- links to matches table
  team1_id        INT,
  team2_id        INT,
  winner_id       INT,
  bracket_order   INT           DEFAULT 1,      -- 1 or 2 for semi-finals
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  FOREIGN KEY (match_id)      REFERENCES matches(match_id)          ON DELETE SET NULL,
  FOREIGN KEY (team1_id)      REFERENCES teams(team_id)             ON DELETE SET NULL,
  FOREIGN KEY (team2_id)      REFERENCES teams(team_id)             ON DELETE SET NULL,
  FOREIGN KEY (winner_id)     REFERENCES teams(team_id)             ON DELETE SET NULL
);

-- ============================================================
-- INDEXES for Performance
-- ============================================================
CREATE INDEX idx_matches_tournament  ON matches(tournament_id);
CREATE INDEX idx_matches_date        ON matches(match_date);
CREATE INDEX idx_matches_status      ON matches(status);
CREATE INDEX idx_standings_points    ON standings(tournament_id, points DESC);
CREATE INDEX idx_players_team        ON players(team_id);
CREATE INDEX idx_results_match       ON match_results(match_id);

-- ============================================================
-- DEFAULT ADMIN USER (password: Admin@123)
-- Hash generated with bcrypt rounds=10
-- ============================================================
INSERT INTO users (username, email, password_hash, role, full_name)
VALUES (
  'admin',
  'admin@tournament.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- Admin@123
  'admin',
  'Tournament Administrator'
) ON DUPLICATE KEY UPDATE user_id = user_id;
