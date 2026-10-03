/**
 * seed-demo.js
 * ─────────────────────────────────────────────────────────────
 * Phase 5 — Tournament Management System Demo Data Seeder
 *
 * Seeds a complete, end-to-end cricket tournament:
 *   • 1 tournament  (IPL Premier League 2026)
 *   • 8 teams       (with coach & city)
 *   • 11 players    per team  (88 total)
 *   • 4 venues
 *   • 4 umpires
 *   • 28 fixtures   (round-robin group stage)
 *   • 28 results    + standings update
 *   • 2 semi-finals + 1 final (knockout bracket)
 *   • Player statistics
 *
 * Usage:  node seed-demo.js
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const db = require('./database/db');
const bcrypt = require('bcryptjs');

// ── helpers ──────────────────────────────────────────────────
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

// ── Demo data ────────────────────────────────────────────────
const TOURNAMENT = {
  name: 'IPL Premier League 2026',
  sport_type: 'Cricket',
  start_date: '2026-03-22',
  end_date: '2026-05-26',
  location: 'India',
  description: 'The most-awaited cricket tournament of 2026 — eight powerhouse franchises battle for the coveted IPL trophy through 28 group-stage fixtures, semi-finals, and the grand final.',
  format: 'league_knockout',
  status: 'completed',
  max_teams: 8,
};

const TEAMS = [
  { name: 'Mumbai Blasters',     short_name: 'MB',  home_city: 'Mumbai',    coach_name: 'Anil Mehta'    },
  { name: 'Delhi Dynamos',       short_name: 'DD',  home_city: 'Delhi',     coach_name: 'Rajesh Sharma' },
  { name: 'Bangalore Strikers',  short_name: 'BS',  home_city: 'Bangalore', coach_name: 'Priya Reddy'   },
  { name: 'Chennai Kings',       short_name: 'CK',  home_city: 'Chennai',   coach_name: 'Suresh Kumar'  },
  { name: 'Kolkata Tigers',      short_name: 'KT',  home_city: 'Kolkata',   coach_name: 'Mihir Bose'    },
  { name: 'Hyderabad Hawks',     short_name: 'HH',  home_city: 'Hyderabad', coach_name: 'Venkat Rao'    },
  { name: 'Rajasthan Royals XI', short_name: 'RR',  home_city: 'Jaipur',    coach_name: 'Arjun Singh'   },
  { name: 'Punjab Lions',        short_name: 'PL',  home_city: 'Chandigarh',coach_name: 'Harpreet Gill' },
];

const VENUES = [
  { name: 'Wankhede Stadium',         city: 'Mumbai',    capacity: 33000 },
  { name: 'M. Chinnaswamy Stadium',   city: 'Bangalore', capacity: 40000 },
  { name: 'Eden Gardens',             city: 'Kolkata',   capacity: 66000 },
  { name: 'MA Chidambaram Stadium',   city: 'Chennai',   capacity: 38000 },
];

const UMPIRES = [
  { full_name: 'Amar Sharma',    nationality: 'Indian',    experience_years: 12 },
  { full_name: 'Ravi Patel',     nationality: 'Indian',    experience_years: 8  },
  { full_name: 'Sunil Verma',    nationality: 'Indian',    experience_years: 15 },
  { full_name: 'Kiran Desai',    nationality: 'Indian',    experience_years: 10 },
];

const POSITIONS = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper', 'Opening Batsman'];

// Realistic player name pool
const FIRST_NAMES = ['Arjun','Rohan','Vikram','Rahul','Sachin','Virat','MS','Rohit','Shikhar','KL','Jasprit','Bhuvneshwar','Ravindra','Ravichandran','Yuzvendra','Kuldeep','Hardik','Krunal','Suryakumar','Ishan','Prithvi','Devdutt','Shubman','Sanju','Deepak'];
const LAST_NAMES  = ['Sharma','Kohli','Dhawan','Rahul','Bumrah','Kumar','Jadeja','Ashwin','Chahal','Pandya','Iyer','Pant','Shaw','Padikkal','Gill','Samson','Chahar','Siraj','Sundar','Kishan','Reddy','Rao','Singh','Verma','Patel'];

const genPlayerName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;

// ── Seeder ────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting demo data seed…\n');

  // 0. Ensure admin user exists
  const passHash = await bcrypt.hash('Admin@123', 10);
  await db.execute(
    `INSERT IGNORE INTO users (username, email, password_hash, role, full_name)
     VALUES ('admin','admin@tournament.com',?,'admin','Tournament Administrator')`,
    [passHash]
  );
  const [[adminRow]] = await db.execute(`SELECT user_id FROM users WHERE username='admin'`);
  const adminId = adminRow.user_id;

  // 1. Create tournament
  console.log('🏆  Creating tournament…');
  const [tResult] = await db.execute(
    `INSERT INTO tournaments (name,sport_type,start_date,end_date,location,description,format,status,max_teams,organizer_id)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [TOURNAMENT.name, TOURNAMENT.sport_type, TOURNAMENT.start_date, TOURNAMENT.end_date,
     TOURNAMENT.location, TOURNAMENT.description, TOURNAMENT.format, TOURNAMENT.status,
     TOURNAMENT.max_teams, adminId]
  );
  const tid = tResult.insertId;
  console.log(`   → tournament_id = ${tid}`);

  // 2. Create venues
  console.log('🏟️   Creating venues…');
  const venueIds = [];
  for (const v of VENUES) {
    const [r] = await db.execute(
      `INSERT INTO venues (tournament_id,name,city,capacity,is_available) VALUES (?,?,?,?,1)`,
      [tid, v.name, v.city, v.capacity]
    );
    venueIds.push(r.insertId);
  }

  // 3. Create umpires
  console.log('🧑‍⚖️  Creating umpires…');
  const umpireIds = [];
  for (const u of UMPIRES) {
    const [r] = await db.execute(
      `INSERT INTO umpires (tournament_id,full_name,nationality,experience_years,is_available) VALUES (?,?,?,?,1)`,
      [tid, u.full_name, u.nationality, u.experience_years]
    );
    umpireIds.push(r.insertId);
  }

  // 4. Create teams + players + standings
  console.log('🧑‍🤝‍🧑 Creating teams and players…');
  const teamIds = [];
  for (const t of TEAMS) {
    const [r] = await db.execute(
      `INSERT INTO teams (tournament_id,name,short_name,home_city,coach_name) VALUES (?,?,?,?,?)`,
      [tid, t.name, t.short_name, t.home_city, t.coach_name]
    );
    const teamId = r.insertId;
    teamIds.push(teamId);

    // 11 players per team
    const used_jerseys = new Set();
    for (let p = 0; p < 11; p++) {
      let jersey = rnd(1, 99);
      while (used_jerseys.has(jersey)) jersey = rnd(1, 99);
      used_jerseys.add(jersey);
      await db.execute(
        `INSERT INTO players (team_id,tournament_id,full_name,jersey_number,position,nationality)
         VALUES (?,?,?,?,?,?)`,
        [teamId, tid, genPlayerName(), jersey, pick(POSITIONS), 'Indian']
      );
    }

    // Initialize standings row
    await db.execute(
      `INSERT IGNORE INTO standings (tournament_id,team_id) VALUES (?,?)`,
      [tid, teamId]
    );
  }

  // 5. Generate round-robin fixtures (28 matches)
  console.log('📅  Generating fixtures…');
  const matchIds = [];
  let matchDate = TOURNAMENT.start_date;
  let matchNum  = 1;

  for (let i = 0; i < teamIds.length; i++) {
    for (let j = i + 1; j < teamIds.length; j++) {
      const venueId  = pick(venueIds);
      const umpireId = pick(umpireIds);
      const [mr] = await db.execute(
        `INSERT INTO matches (tournament_id,home_team_id,away_team_id,venue_id,umpire_id,match_date,match_time,round,match_number,status)
         VALUES (?,?,?,?,?,?,'14:30:00','Group Stage',?,'scheduled')`,
        [tid, teamIds[i], teamIds[j], venueId, umpireId, matchDate, matchNum]
      );
      matchIds.push({ matchId: mr.insertId, homeId: teamIds[i], awayId: teamIds[j] });
      matchDate = addDays(matchDate, 1);
      matchNum++;
    }
  }
  console.log(`   → ${matchIds.length} fixtures created`);

  // 6. Simulate results and update standings
  console.log('✅  Simulating match results…');

  // Weighted wins so teams have realistic spread: MB highest, PL lowest
  const winWeights = { 0: 0.75, 1: 0.65, 2: 0.70, 3: 0.68, 4: 0.60, 5: 0.55, 6: 0.52, 7: 0.45 };

  for (const { matchId, homeId, awayId } of matchIds) {
    const homeIdx = teamIds.indexOf(homeId);
    const homeAdvantage = winWeights[homeIdx] ?? 0.5;
    const rand = Math.random();

    let winnerId  = null;
    let isDraw    = false;
    const homeScore = `${rnd(140, 220)}/${rnd(4, 9)} (${rnd(17, 20)}.${rnd(0,5)} ov)`;
    const awayScore = `${rnd(100, 215)}/${rnd(4, 10)} (${rnd(15, 20)}.${rnd(0,5)} ov)`;

    if (rand < 0.04) {
      isDraw = true;                      // 4% draw
    } else if (rand < homeAdvantage) {
      winnerId = homeId;
    } else {
      winnerId = awayId;
    }

    // Insert result
    const [resRow] = await db.execute(
      `INSERT INTO match_results (match_id,winner_team_id,home_score,away_score,is_draw,result_notes)
       VALUES (?,?,?,?,?,?)`,
      [matchId, winnerId, homeScore, awayScore, isDraw ? 1 : 0,
       isDraw ? 'Match tied' : `Won by ${rnd(1, 50)} runs`]
    );

    // Update match status
    await db.execute(`UPDATE matches SET status='completed' WHERE match_id=?`, [matchId]);

    // Update standings
    if (isDraw) {
      await db.execute(
        `UPDATE standings SET matches_played=matches_played+1, draws=draws+1, points=points+1 WHERE tournament_id=? AND team_id=?`,
        [tid, homeId]
      );
      await db.execute(
        `UPDATE standings SET matches_played=matches_played+1, draws=draws+1, points=points+1 WHERE tournament_id=? AND team_id=?`,
        [tid, awayId]
      );
    } else {
      const loserId = winnerId === homeId ? awayId : homeId;
      await db.execute(
        `UPDATE standings SET matches_played=matches_played+1, wins=wins+1, points=points+2 WHERE tournament_id=? AND team_id=?`,
        [tid, winnerId]
      );
      await db.execute(
        `UPDATE standings SET matches_played=matches_played+1, losses=losses+1 WHERE tournament_id=? AND team_id=?`,
        [tid, loserId]
      );
    }
  }

  // 7. Seed player statistics
  console.log('📈  Seeding player statistics…');
  for (const teamId of teamIds) {
    const [players] = await db.execute(`SELECT player_id FROM players WHERE team_id=?`, [teamId]);
    for (const { player_id } of players) {
      await db.execute(
        `INSERT IGNORE INTO player_statistics
         (player_id,tournament_id,matches_played,runs_scored,balls_faced,fifties,hundreds,
          wickets_taken,overs_bowled,runs_conceded,catches,man_of_match_count,goals_scored,assists)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          player_id, tid,
          rnd(5, 14),
          rnd(0, 450),    // runs
          rnd(10, 500),   // balls
          rnd(0, 5),      // 50s
          rnd(0, 2),      // 100s
          rnd(0, 15),     // wickets
          (rnd(0, 40) / 10).toFixed(1),   // overs
          rnd(0, 300),    // runs conceded
          rnd(0, 8),      // catches
          rnd(0, 3),      // MOM
          0, 0,
        ]
      );
    }
  }

  // 8. Generate knockout bracket (top 4)
  console.log('🥊  Generating knockout bracket…');

  // Get top 4 teams by points
  const [top4] = await db.execute(
    `SELECT team_id FROM standings WHERE tournament_id=?
     ORDER BY points DESC, wins DESC LIMIT 4`, [tid]
  );
  const [t1, t2, t3, t4] = top4.map((r) => r.team_id);

  // Semi-final 1: 1st vs 4th
  const sf1Date = addDays(matchDate, 2);
  const [sf1Match] = await db.execute(
    `INSERT INTO matches (tournament_id,home_team_id,away_team_id,venue_id,umpire_id,match_date,match_time,round,match_number,status)
     VALUES (?,?,?,?,?,?,'14:00:00','Semi-Final 1',29,'completed')`,
    [tid, t1, t4, venueIds[2], umpireIds[0], sf1Date]
  );
  const sf1Winner = Math.random() > 0.4 ? t1 : t4;

  const [sf1Bracket] = await db.execute(
    `INSERT INTO knockout_bracket (tournament_id,stage,match_id,team1_id,team2_id,winner_id,bracket_order)
     VALUES (?,?,?,?,?,?,1)`,
    [tid, 'semi_final', sf1Match.insertId, t1, t4, sf1Winner]
  );
  await db.execute(
    `INSERT INTO match_results (match_id,winner_team_id,home_score,away_score,is_draw,result_notes)
     VALUES (?,?,?,?,0,'Won by ${rnd(10,45)} runs')`,
    [sf1Match.insertId, sf1Winner,
     `${rnd(155,215)}/${rnd(4,8)} (20 ov)`,
     `${rnd(120,195)}/${rnd(5,10)} (20 ov)`]
  );

  // Semi-final 2: 2nd vs 3rd
  const sf2Date = addDays(sf1Date, 1);
  const [sf2Match] = await db.execute(
    `INSERT INTO matches (tournament_id,home_team_id,away_team_id,venue_id,umpire_id,match_date,match_time,round,match_number,status)
     VALUES (?,?,?,?,?,?,'20:00:00','Semi-Final 2',30,'completed')`,
    [tid, t2, t3, venueIds[0], umpireIds[1], sf2Date]
  );
  const sf2Winner = Math.random() > 0.4 ? t2 : t3;

  await db.execute(
    `INSERT INTO knockout_bracket (tournament_id,stage,match_id,team1_id,team2_id,winner_id,bracket_order)
     VALUES (?,?,?,?,?,?,2)`,
    [tid, 'semi_final', sf2Match.insertId, t2, t3, sf2Winner]
  );
  await db.execute(
    `INSERT INTO match_results (match_id,winner_team_id,home_score,away_score,is_draw,result_notes)
     VALUES (?,?,?,?,0,'Won by ${rnd(5,35)} runs')`,
    [sf2Match.insertId, sf2Winner,
     `${rnd(160,220)}/${rnd(3,7)} (20 ov)`,
     `${rnd(125,200)}/${rnd(6,10)} (20 ov)`]
  );

  // Final
  const finalDate = addDays(sf2Date, 4);
  const [finalMatch] = await db.execute(
    `INSERT INTO matches (tournament_id,home_team_id,away_team_id,venue_id,umpire_id,match_date,match_time,round,match_number,status)
     VALUES (?,?,?,?,?,?,'19:30:00','Final',31,'completed')`,
    [tid, sf1Winner, sf2Winner, venueIds[2], umpireIds[2], finalDate]
  );
  const champion = Math.random() > 0.45 ? sf1Winner : sf2Winner;

  await db.execute(
    `INSERT INTO knockout_bracket (tournament_id,stage,match_id,team1_id,team2_id,winner_id,bracket_order)
     VALUES (?,?,?,?,?,?,1)`,
    [tid, 'final', finalMatch.insertId, sf1Winner, sf2Winner, champion]
  );
  await db.execute(
    `INSERT INTO match_results (match_id,winner_team_id,home_score,away_score,is_draw,result_notes)
     VALUES (?,?,?,?,0,'Champions crowned!')`,
    [finalMatch.insertId, champion,
     `${rnd(170,225)}/${rnd(3,7)} (20 ov)`,
     `${rnd(140,210)}/${rnd(6,10)} (20 ov)`]
  );

  // 9. Retrieve champion name for the summary
  const [[champ]] = await db.execute(`SELECT name FROM teams WHERE team_id=?`, [champion]);
  console.log(`\n🏆  Champion: ${champ.name}`);

  // Done
  console.log(`
╔═══════════════════════════════════════════════════════╗
║        ✅  DEMO SEED COMPLETE                         ║
╠═══════════════════════════════════════════════════════╣
║  Tournament : ${TOURNAMENT.name.padEnd(38)} ║
║  Teams      : 8                                       ║
║  Players    : ~88                                     ║
║  Venues     : 4                                       ║
║  Umpires    : 4                                       ║
║  Matches    : 31 (28 group + 2 semis + 1 final)       ║
║  Champion   : ${champ.name.padEnd(38)} ║
╚═══════════════════════════════════════════════════════╝

👉  Log in at http://localhost:5173  (admin / Admin@123)
👉  Go to Reports → select "${TOURNAMENT.name}"
  `);

  await db.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
