-- ============================================================
-- Tournament Management System - Database Schema
-- Database: defaultdb
-- Phase 1 - ER Design & Database Foundation
-- ============================================================

CREATE DATABASE IF NOT EXISTS defaultdb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE defaultdb;

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
  team_id         INT           AUTO_INCREMENT PRIMARY KEY,
  tournament_id   INT           NOT NULL,
  name            VARCHAR(100)  NOT NULL,
  short_name      VARCHAR(10),
  logo_url        VARCHAR(500),
  coach_name      VARCHAR(100),
  contact_email   VARCHAR(100),
  home_city       VARCHAR(100),
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE
);

-- ============================================================
-- 4. PLAYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS players (
  player_id       INT           AUTO_INCREMENT PRIMARY KEY,
  team_id         INT           NOT NULL,
  first_name      VARCHAR(50)   NOT NULL,
  last_name       VARCHAR(50)   NOT NULL,
  jersey_number   INT,
  role            ENUM('batsman','bowler','all_rounder','wicket_keeper','forward','midfielder','defender','goalkeeper','player') DEFAULT 'player',
  date_of_birth   DATE,
  email           VARCHAR(100),
  phone           VARCHAR(20),
  is_captain      BOOLEAN       DEFAULT FALSE,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- ============================================================
-- 5. VENUES
-- ============================================================
CREATE TABLE IF NOT EXISTS venues (
  venue_id        INT           AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  city            VARCHAR(100),
  capacity        INT,
  address         TEXT,
  is_active       BOOLEAN       DEFAULT TRUE,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 6. UMPIRES / OFFICIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS umpires (
  umpire_id       INT           AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100)  NOT NULL,
  email           VARCHAR(100),
  phone           VARCHAR(20),
  experience_years INT          DEFAULT 0,
  certification_level ENUM('national','international','state','club') DEFAULT 'club',
  is_available    BOOLEAN       DEFAULT TRUE,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. MATCHES / SCHEDULE
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
  match_id        INT           AUTO_INCREMENT PRIMARY KEY,
  tournament_id   INT           NOT NULL,
  round_number    INT           DEFAULT 1,
  match_number    INT,
  home_team_id    INT           NOT NULL,
  away_team_id    INT           NOT NULL,
  venue_id        INT,
  umpire_id       INT,
  match_date      DATE          NOT NULL,
  match_time      TIME,
  status          ENUM('scheduled','ongoing','completed','cancelled','abandoned') NOT NULL DEFAULT 'scheduled',
  stage           ENUM('group','quarter_final','semi_final','final') DEFAULT 'group',
  notes           TEXT,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  FOREIGN KEY (home_team_id)  REFERENCES teams(team_id)       ON DELETE CASCADE,
  FOREIGN KEY (away_team_id)  REFERENCES teams(team_id)       ON DELETE CASCADE,
  FOREIGN KEY (venue_id)      REFERENCES venues(venue_id)     ON DELETE SET NULL,
  FOREIGN KEY (umpire_id)     REFERENCES umpires(umpire_id)   ON DELETE SET NULL,
  CONSTRAINT chk_different_teams CHECK (home_team_id <> away_team_id)
);

-- ============================================================
-- 8. MATCH RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS match_results (
  result_id       INT           AUTO_INCREMENT PRIMARY KEY,
  match_id        INT           NOT NULL UNIQUE,
  winner_team_id  INT,
  loser_team_id   INT,
  is_draw         BOOLEAN       DEFAULT FALSE,
  home_score      INT           DEFAULT 0,
  away_score      INT           DEFAULT 0,
  home_wickets    INT           DEFAULT 0,
  away_wickets    INT           DEFAULT 0,
  home_overs      DECIMAL(4,1)  DEFAULT 0.0,
  away_overs      DECIMAL(4,1)  DEFAULT 0.0,
  result_description VARCHAR(255),
  man_of_the_match_id INT,
  recorded_by     INT,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id)            REFERENCES matches(match_id)       ON DELETE CASCADE,
  FOREIGN KEY (winner_team_id)      REFERENCES teams(team_id)         ON DELETE SET NULL,
  FOREIGN KEY (loser_team_id)       REFERENCES teams(team_id)         ON DELETE SET NULL,
  FOREIGN KEY (man_of_the_match_id) REFERENCES players(player_id)     ON DELETE SET NULL,
  FOREIGN KEY (recorded_by)         REFERENCES users(user_id)          ON DELETE SET NULL
);

-- ============================================================
-- 9. STANDINGS / POINTS TABLE
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
  net_run_rate    DECIMAL(8,4)  DEFAULT 0.0000,
  goals_for       INT           DEFAULT 0,
  goals_against   INT           DEFAULT 0,
  rank_position   INT,
  updated_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  FOREIGN KEY (team_id)       REFERENCES teams(team_id)             ON DELETE CASCADE,
  UNIQUE KEY uq_tournament_team (tournament_id, team_id)
);

-- ============================================================
-- 10. PLAYER MATCH STATS
-- ============================================================
CREATE TABLE IF NOT EXISTS player_match_stats (
  stat_id         INT           AUTO_INCREMENT PRIMARY KEY,
  match_id        INT           NOT NULL,
  player_id       INT           NOT NULL,
  team_id         INT           NOT NULL,
  runs_scored     INT           DEFAULT 0,
  balls_faced     INT           DEFAULT 0,
  fours           INT           DEFAULT 0,
  sixes           INT           DEFAULT 0,
  strike_rate     DECIMAL(6,2)  DEFAULT 0.00,
  overs_bowled    DECIMAL(4,1)  DEFAULT 0.0,
  runs_conceded   INT           DEFAULT 0,
  wickets_taken   INT           DEFAULT 0,
  maidens         INT           DEFAULT 0,
  economy_rate    DECIMAL(6,2)  DEFAULT 0.00,
  catches         INT           DEFAULT 0,
  stumpings       INT           DEFAULT 0,
  run_outs        INT           DEFAULT 0,
  goals           INT           DEFAULT 0,
  assists         INT           DEFAULT 0,
  yellow_cards    INT           DEFAULT 0,
  red_cards       INT           DEFAULT 0,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (match_id)  REFERENCES matches(match_id)   ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(player_id)  ON DELETE CASCADE,
  FOREIGN KEY (team_id)   REFERENCES teams(team_id)     ON DELETE CASCADE,
  UNIQUE KEY uq_player_match (player_id, match_id)
);

-- ============================================================
-- 11. KNOCKOUT STAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS knockout_stages (
  stage_id        INT           AUTO_INCREMENT PRIMARY KEY,
  tournament_id   INT           NOT NULL,
  stage_type      ENUM('quarter_final','semi_final','final','third_place') NOT NULL,
  match_id        INT           UNIQUE,
  bracket_position INT          DEFAULT 1,
  next_stage_id   INT,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
  FOREIGN KEY (match_id)      REFERENCES matches(match_id)          ON DELETE CASCADE,
  FOREIGN KEY (next_stage_id) REFERENCES knockout_stages(stage_id)  ON DELETE SET NULL
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
  '$2a$10$p.6ztgNPEmNwmmzZxILXauXxtj9jhJiSu7WjIMkPGpBn.JRx3buzK',
  'admin',
  'Tournament Administrator'
) ON DUPLICATE KEY UPDATE password_hash = '$2a$10$p.6ztgNPEmNwmmzZxILXauXxtj9jhJiSu7WjIMkPGpBn.JRx3buzK';
