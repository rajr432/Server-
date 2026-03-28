/**
 * ╔══════════════════════════════════════════╗
 * ║   Fantasy11 — Dream11 Clone Backend     ║
 * ║   Node.js + Express + JSON DB           ║
 * ╚══════════════════════════════════════════╝
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fantasy11_super_secret_jwt_2025';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════
//  JSON DATABASE
// ═══════════════════════════════════════════
const DB_PATH = './fantasy11_db.json';

function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    const seed = {
      users: {},
      teams: {},
      contests: {},
      transactions: {},
      leaderboards: {}
    };
    // Seed some demo contests
    const c1 = crypto.randomUUID();
    const c2 = crypto.randomUUID();
    const c3 = crypto.randomUUID();
    seed.contests[c1] = {
      id: c1, matchId: 'match_ind_aus', name: 'Mega Contest',
      entryFee: 50, totalSpots: 10000, filled: 3421,
      prizePool: 400000, firstPrize: 100000,
      prizes: [100000,50000,25000,10000,5000],
      participants: [], status: 'open',
      createdAt: new Date().toISOString()
    };
    seed.contests[c2] = {
      id: c2, matchId: 'match_ind_aus', name: 'Small League',
      entryFee: 10, totalSpots: 100, filled: 67,
      prizePool: 800, firstPrize: 300,
      prizes: [300,150,100,80,60],
      participants: [], status: 'open',
      createdAt: new Date().toISOString()
    };
    seed.contests[c3] = {
      id: c3, matchId: 'match_ind_aus', name: 'Head to Head',
      entryFee: 25, totalSpots: 2, filled: 0,
      prizePool: 45, firstPrize: 45,
      prizes: [45], participants: [], status: 'open',
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return initDB();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function saveDB(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

initDB();

// ═══════════════════════════════════════════
//  MOCK CRICKET DATA (ESPN + Demo)
// ═══════════════════════════════════════════
const MOCK_MATCHES = [
  {
    id: 'match_ind_aus',
    name: 'India vs Australia',
    team1: { name: 'India', shortName: 'IND', flag: '🇮🇳' },
    team2: { name: 'Australia', shortName: 'AUS', flag: '🇦🇺' },
    matchType: 'T20I',
    venue: 'Wankhede Stadium, Mumbai',
    dateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
    contestCount: 3,
    teamsCreated: 8923,
    lastDateToJoin: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'match_mi_csk',
    name: 'Mumbai Indians vs Chennai Super Kings',
    team1: { name: 'Mumbai Indians', shortName: 'MI', flag: '💙' },
    team2: { name: 'Chennai Super Kings', shortName: 'CSK', flag: '💛' },
    matchType: 'IPL',
    venue: 'DY Patil Stadium, Mumbai',
    dateTime: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
    contestCount: 5,
    teamsCreated: 45210,
    lastDateToJoin: new Date(Date.now() + 25.5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'match_rcb_kkr',
    name: 'RCB vs Kolkata Knight Riders',
    team1: { name: 'Royal Challengers Bengaluru', shortName: 'RCB', flag: '❤️' },
    team2: { name: 'Kolkata Knight Riders', shortName: 'KKR', flag: '💜' },
    matchType: 'IPL',
    venue: 'Eden Gardens, Kolkata',
    dateTime: new Date(Date.now() + 50 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
    contestCount: 4,
    teamsCreated: 31450,
    lastDateToJoin: new Date(Date.now() + 49.5 * 60 * 60 * 1000).toISOString()
  }
];

const PLAYERS_BY_MATCH = {
  match_ind_aus: [
    // India players
    { id:'p1', name:'Rohit Sharma', team:'IND', role:'BAT', credits:10.5, selectionPct:89.2, points:0, avatar:'RS' },
    { id:'p2', name:'Virat Kohli', team:'IND', role:'BAT', credits:11.0, selectionPct:92.1, points:0, avatar:'VK' },
    { id:'p3', name:'Shubman Gill', team:'IND', role:'BAT', credits:9.5, selectionPct:71.3, points:0, avatar:'SG' },
    { id:'p4', name:'Suryakumar Yadav', team:'IND', role:'BAT', credits:10.0, selectionPct:78.4, points:0, avatar:'SKY' },
    { id:'p5', name:'Hardik Pandya', team:'IND', role:'AR', credits:10.5, selectionPct:85.7, points:0, avatar:'HP' },
    { id:'p6', name:'Ravindra Jadeja', team:'IND', role:'AR', credits:9.5, selectionPct:68.9, points:0, avatar:'RJ' },
    { id:'p7', name:'MS Dhoni', team:'IND', role:'WK', credits:9.0, selectionPct:62.3, points:0, avatar:'MSD' },
    { id:'p8', name:'Jasprit Bumrah', team:'IND', role:'BWL', credits:10.0, selectionPct:81.2, points:0, avatar:'JB' },
    { id:'p9', name:'Mohammed Shami', team:'IND', role:'BWL', credits:9.0, selectionPct:59.8, points:0, avatar:'MS' },
    { id:'p10', name:'Kuldeep Yadav', team:'IND', role:'BWL', credits:8.5, selectionPct:54.1, points:0, avatar:'KY' },
    { id:'p11', name:'Arshdeep Singh', team:'IND', role:'BWL', credits:8.5, selectionPct:48.3, points:0, avatar:'AS' },
    // Australia players
    { id:'p12', name:'David Warner', team:'AUS', role:'BAT', credits:10.0, selectionPct:74.5, points:0, avatar:'DW' },
    { id:'p13', name:'Steve Smith', team:'AUS', role:'BAT', credits:10.5, selectionPct:77.8, points:0, avatar:'SS' },
    { id:'p14', name:'Glenn Maxwell', team:'AUS', role:'AR', credits:10.0, selectionPct:80.2, points:0, avatar:'GM' },
    { id:'p15', name:'Mitchell Starc', team:'AUS', role:'BWL', credits:9.5, selectionPct:69.4, points:0, avatar:'MSt' },
    { id:'p16', name:'Pat Cummins', team:'AUS', role:'BWL', credits:10.0, selectionPct:72.1, points:0, avatar:'PC' },
    { id:'p17', name:'Travis Head', team:'AUS', role:'BAT', credits:9.5, selectionPct:65.3, points:0, avatar:'TH' },
    { id:'p18', name:'Josh Hazlewood', team:'AUS', role:'BWL', credits:9.0, selectionPct:58.7, points:0, avatar:'JH' },
    { id:'p19', name:'Adam Zampa', team:'AUS', role:'BWL', credits:8.5, selectionPct:52.9, points:0, avatar:'AZ' },
    { id:'p20', name:'Matthew Wade', team:'AUS', role:'WK', credits:8.5, selectionPct:45.6, points:0, avatar:'MW' },
    { id:'p21', name:'Cameron Green', team:'AUS', role:'AR', credits:9.0, selectionPct:61.2, points:0, avatar:'CG' },
    { id:'p22', name:'Marcus Stoinis', team:'AUS', role:'AR', credits:9.0, selectionPct:57.8, points:0, avatar:'MSto' },
  ],
  match_mi_csk: [
    { id:'m1', name:'Rohit Sharma', team:'MI', role:'BAT', credits:11.0, selectionPct:91.2, points:0, avatar:'RS' },
    { id:'m2', name:'Ishan Kishan', team:'MI', role:'WK', credits:9.0, selectionPct:68.4, points:0, avatar:'IK' },
    { id:'m3', name:'Suryakumar Yadav', team:'MI', role:'BAT', credits:10.5, selectionPct:85.7, points:0, avatar:'SKY' },
    { id:'m4', name:'Hardik Pandya', team:'MI', role:'AR', credits:10.5, selectionPct:87.3, points:0, avatar:'HP' },
    { id:'m5', name:'Kieron Pollard', team:'MI', role:'AR', credits:9.5, selectionPct:65.2, points:0, avatar:'KP' },
    { id:'m6', name:'Jasprit Bumrah', team:'MI', role:'BWL', credits:10.5, selectionPct:88.9, points:0, avatar:'JB' },
    { id:'m7', name:'Jofra Archer', team:'MI', role:'BWL', credits:9.5, selectionPct:71.8, points:0, avatar:'JA' },
    { id:'m8', name:'MS Dhoni', team:'CSK', role:'WK', credits:10.0, selectionPct:82.1, points:0, avatar:'MSD' },
    { id:'m9', name:'Ruturaj Gaikwad', team:'CSK', role:'BAT', credits:10.0, selectionPct:79.4, points:0, avatar:'RG' },
    { id:'m10', name:'Shivam Dube', team:'CSK', role:'AR', credits:9.0, selectionPct:63.7, points:0, avatar:'SD' },
    { id:'m11', name:'Ravindra Jadeja', team:'CSK', role:'AR', credits:10.0, selectionPct:81.5, points:0, avatar:'RJ' },
    { id:'m12', name:'Deepak Chahar', team:'CSK', role:'BWL', credits:9.0, selectionPct:67.9, points:0, avatar:'DC' },
    { id:'m13', name:'Devon Conway', team:'CSK', role:'BAT', credits:9.5, selectionPct:72.3, points:0, avatar:'DC2' },
    { id:'m14', name:'Moeen Ali', team:'CSK', role:'AR', credits:9.0, selectionPct:61.4, points:0, avatar:'MA' },
    { id:'m15', name:'Tushar Deshpande', team:'CSK', role:'BWL', credits:8.5, selectionPct:54.2, points:0, avatar:'TD' },
    { id:'m16', name:'Tilak Varma', team:'MI', role:'BAT', credits:9.0, selectionPct:66.8, points:0, avatar:'TV' },
  ],
  match_rcb_kkr: [
    { id:'r1', name:'Virat Kohli', team:'RCB', role:'BAT', credits:11.0, selectionPct:93.2, points:0, avatar:'VK' },
    { id:'r2', name:'Faf du Plessis', team:'RCB', role:'BAT', credits:9.5, selectionPct:71.4, points:0, avatar:'FDP' },
    { id:'r3', name:'Glenn Maxwell', team:'RCB', role:'AR', credits:10.5, selectionPct:84.7, points:0, avatar:'GM' },
    { id:'r4', name:'Dinesh Karthik', team:'RCB', role:'WK', credits:9.0, selectionPct:67.3, points:0, avatar:'DK' },
    { id:'r5', name:'Mohammed Siraj', team:'RCB', role:'BWL', credits:9.5, selectionPct:74.8, points:0, avatar:'MoS' },
    { id:'r6', name:'Cameron Green', team:'RCB', role:'AR', credits:9.5, selectionPct:69.1, points:0, avatar:'CG' },
    { id:'r7', name:'Rajat Patidar', team:'RCB', role:'BAT', credits:8.5, selectionPct:55.6, points:0, avatar:'RP' },
    { id:'r8', name:'Shreyas Iyer', team:'KKR', role:'BAT', credits:10.0, selectionPct:79.2, points:0, avatar:'SI' },
    { id:'r9', name:'Andre Russell', team:'KKR', role:'AR', credits:10.5, selectionPct:87.6, points:0, avatar:'AR' },
    { id:'r10', name:'Sunil Narine', team:'KKR', role:'AR', credits:10.0, selectionPct:81.3, points:0, avatar:'SN' },
    { id:'r11', name:'Varun Chakravarthy', team:'KKR', role:'BWL', credits:9.0, selectionPct:68.4, points:0, avatar:'VC' },
    { id:'r12', name:'Rahmanullah Gurbaz', team:'KKR', role:'WK', credits:9.0, selectionPct:64.7, points:0, avatar:'RG2' },
    { id:'r13', name:'Phil Salt', team:'KKR', role:'BAT', credits:9.5, selectionPct:72.9, points:0, avatar:'PS' },
    { id:'r14', name:'Mitchell Starc', team:'KKR', role:'BWL', credits:10.0, selectionPct:76.3, points:0, avatar:'MSt' },
  ]
};

// ═══════════════════════════════════════════
//  AUTH MIDDLEWARE
// ═══════════════════════════════════════════
function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'Login karein pehle.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Session expire ho gaya. Dobara login karein.' });
  }
}

// ═══════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: 'Sab fields bharo.' });

    const db = loadDB();
    if (Object.values(db.users).find(u => u.email === email))
      return res.status(409).json({ success: false, error: 'Email already registered hai.' });

    const id = crypto.randomUUID();
    const hashed = await bcrypt.hash(password, 10);
    db.users[id] = {
      id, name, email, phone: phone || '',
      password: hashed,
      wallet: 500, // Welcome bonus ₹500
      coins: 1000,
      avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      rank: 'Rookie',
      totalMatches: 0, totalWinnings: 0,
      joinedContests: [],
      createdAt: new Date().toISOString()
    };

    // Welcome transaction
    const txId = crypto.randomUUID();
    if (!db.transactions[id]) db.transactions[id] = [];
    db.transactions[id].push({
      id: txId, type: 'credit', amount: 500,
      description: '🎁 Welcome Bonus', date: new Date().toISOString()
    });

    saveDB(db);
    const token = jwt.sign({ id, name, email }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, user: { id, name, email, wallet: 500, coins: 1000, avatar: db.users[id].avatar } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = loadDB();
    const user = Object.values(db.users).find(u => u.email === email);
    if (!user) return res.status(401).json({ success: false, error: 'Email ya password galat hai.' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ success: false, error: 'Email ya password galat hai.' });

    const token = jwt.sign({ id: user.id, name: user.name, email }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, user: { id: user.id, name: user.name, email, wallet: user.wallet, coins: user.coins, avatar: user.avatar } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const db = loadDB();
  const user = db.users[req.user.id];
  if (!user) return res.status(404).json({ success: false, error: 'User nahi mila.' });
  const { password, ...safe } = user;
  res.json({ success: true, user: safe });
});

// ═══════════════════════════════════════════
//  MATCHES ROUTES
// ═══════════════════════════════════════════
app.get('/api/matches', (req, res) => {
  // Try ESPN, fallback to mock
  res.json({ success: true, matches: MOCK_MATCHES });
});

app.get('/api/matches/:matchId', (req, res) => {
  const match = MOCK_MATCHES.find(m => m.id === req.params.matchId);
  if (!match) return res.status(404).json({ success: false, error: 'Match nahi mila.' });
  res.json({ success: true, match });
});

app.get('/api/matches/:matchId/players', (req, res) => {
  const players = PLAYERS_BY_MATCH[req.params.matchId];
  if (!players) return res.status(404).json({ success: false, error: 'Players nahi mile.' });
  res.json({ success: true, players });
});

// ═══════════════════════════════════════════
//  TEAM ROUTES
// ═══════════════════════════════════════════
app.post('/api/teams', authMiddleware, (req, res) => {
  try {
    const { matchId, players, captain, viceCaptain, teamName } = req.body;
    const userId = req.user.id;

    // Validations
    if (!players || players.length !== 11)
      return res.status(400).json({ success: false, error: '11 players chahiye.' });
    if (!captain || !viceCaptain)
      return res.status(400).json({ success: false, error: 'Captain aur Vice Captain choose karo.' });
    if (captain === viceCaptain)
      return res.status(400).json({ success: false, error: 'Captain aur VC alag hone chahiye.' });

    const allPlayers = PLAYERS_BY_MATCH[matchId] || [];
    const selectedPlayers = players.map(pid => allPlayers.find(p => p.id === pid)).filter(Boolean);

    // Credits check
    const totalCredits = selectedPlayers.reduce((s, p) => s + p.credits, 0);
    if (totalCredits > 100) return res.status(400).json({ success: false, error: `Total credits ${totalCredits.toFixed(1)} hain. Max 100 allowed.` });

    // Role validation
    const roles = { WK: 0, BAT: 0, AR: 0, BWL: 0 };
    const teamCount = {};
    selectedPlayers.forEach(p => {
      roles[p.role] = (roles[p.role] || 0) + 1;
      teamCount[p.team] = (teamCount[p.team] || 0) + 1;
    });
    if (roles.WK < 1 || roles.WK > 4) return res.status(400).json({ success: false, error: '1-4 Wicket Keepers chahiye.' });
    if (roles.BAT < 3 || roles.BAT > 6) return res.status(400).json({ success: false, error: '3-6 Batsmen chahiye.' });
    if (roles.AR < 1 || roles.AR > 4) return res.status(400).json({ success: false, error: '1-4 All-Rounders chahiye.' });
    if (roles.BWL < 3 || roles.BWL > 6) return res.status(400).json({ success: false, error: '3-6 Bowlers chahiye.' });
    const teams = Object.values(teamCount);
    if (teams.some(c => c > 10)) return res.status(400).json({ success: false, error: 'Ek team se max 10 players.' });
    if (teams.some(c => c < 1)) return res.status(400).json({ success: false, error: 'Dono teams se players lene zaroori hain.' });

    const db = loadDB();
    const teamId = crypto.randomUUID();
    db.teams[teamId] = {
      id: teamId, userId, matchId,
      teamName: teamName || `Team ${Object.values(db.teams).filter(t => t.userId === userId).length + 1}`,
      players, captain, viceCaptain,
      totalCredits, totalPoints: 0,
      createdAt: new Date().toISOString()
    };
    saveDB(db);
    res.json({ success: true, team: db.teams[teamId], message: 'Team successfully create ho gayi!' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/teams/my', authMiddleware, (req, res) => {
  const db = loadDB();
  const myTeams = Object.values(db.teams).filter(t => t.userId === req.user.id);
  res.json({ success: true, teams: myTeams });
});

app.get('/api/teams/match/:matchId', authMiddleware, (req, res) => {
  const db = loadDB();
  const teams = Object.values(db.teams).filter(t => t.userId === req.user.id && t.matchId === req.params.matchId);
  res.json({ success: true, teams });
});

// ═══════════════════════════════════════════
//  CONTEST ROUTES
// ═══════════════════════════════════════════
app.get('/api/contests/match/:matchId', (req, res) => {
  const db = loadDB();
  const contests = Object.values(db.contests).filter(c => c.matchId === req.params.matchId);
  res.json({ success: true, contests });
});

app.post('/api/contests/:contestId/join', authMiddleware, (req, res) => {
  try {
    const { teamId } = req.body;
    const userId = req.user.id;
    const db = loadDB();

    const contest = db.contests[req.params.contestId];
    if (!contest) return res.status(404).json({ success: false, error: 'Contest nahi mila.' });
    if (contest.filled >= contest.totalSpots) return res.status(400).json({ success: false, error: 'Contest full ho gaya hai.' });

    const user = db.users[userId];
    if (!user) return res.status(404).json({ success: false, error: 'User nahi mila.' });
    if (user.wallet < contest.entryFee) return res.status(400).json({ success: false, error: `Insufficient balance. ₹${contest.entryFee} chahiye.` });

    const team = db.teams[teamId];
    if (!team || team.userId !== userId) return res.status(403).json({ success: false, error: 'Invalid team.' });

    // Already joined check
    const alreadyJoined = contest.participants.find(p => p.userId === userId && p.teamId === teamId);
    if (alreadyJoined) return res.status(400).json({ success: false, error: 'Is team se already join kar chuke ho.' });

    // Deduct entry fee
    user.wallet -= contest.entryFee;
    contest.filled += 1;
    contest.participants.push({
      userId, teamId, userName: user.name, avatar: user.avatar,
      teamName: team.teamName, points: 0, rank: contest.filled,
      joinedAt: new Date().toISOString()
    });

    // Transaction
    if (!db.transactions[userId]) db.transactions[userId] = [];
    db.transactions[userId].push({
      id: crypto.randomUUID(), type: 'debit', amount: contest.entryFee,
      description: `🏆 Contest Join: ${contest.name}`, date: new Date().toISOString()
    });

    user.joinedContests = user.joinedContests || [];
    user.joinedContests.push({ contestId: contest.id, teamId, joinedAt: new Date().toISOString() });

    saveDB(db);
    res.json({ success: true, message: 'Contest join kar liya! Best of luck! 🏏', wallet: user.wallet });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/contests/:contestId/leaderboard', (req, res) => {
  const db = loadDB();
  const contest = db.contests[req.params.contestId];
  if (!contest) return res.status(404).json({ success: false, error: 'Contest nahi mila.' });

  // Generate mock points for demo
  const leaderboard = contest.participants.map((p, i) => ({
    ...p,
    points: Math.floor(Math.random() * 300 + 50),
    rank: i + 1
  })).sort((a, b) => b.points - a.points).map((p, i) => ({ ...p, rank: i + 1 }));

  res.json({ success: true, contest, leaderboard });
});

// ═══════════════════════════════════════════
//  WALLET ROUTES
// ═══════════════════════════════════════════
app.get('/api/wallet', authMiddleware, (req, res) => {
  const db = loadDB();
  const user = db.users[req.user.id];
  const txs = db.transactions[req.user.id] || [];
  res.json({ success: true, wallet: user.wallet, coins: user.coins, transactions: txs.slice(-20).reverse() });
});

app.post('/api/wallet/add', authMiddleware, (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 10) return res.status(400).json({ success: false, error: 'Min ₹10 add kar sakte ho.' });

    const db = loadDB();
    const user = db.users[req.user.id];
    user.wallet += Number(amount);

    if (!db.transactions[req.user.id]) db.transactions[req.user.id] = [];
    db.transactions[req.user.id].push({
      id: crypto.randomUUID(), type: 'credit', amount: Number(amount),
      description: '💳 Wallet Recharge', date: new Date().toISOString()
    });

    saveDB(db);
    res.json({ success: true, wallet: user.wallet, message: `₹${amount} wallet mein add ho gaye!` });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ═══════════════════════════════════════════
//  LEADERBOARD
// ═══════════════════════════════════════════
app.get('/api/leaderboard/global', (req, res) => {
  const db = loadDB();
  const users = Object.values(db.users)
    .map(u => ({ name: u.name, avatar: u.avatar, totalWinnings: u.totalWinnings || 0, rank: u.rank || 'Rookie', totalMatches: u.totalMatches || 0 }))
    .sort((a, b) => b.totalWinnings - a.totalWinnings)
    .slice(0, 50);

  // Add some demo users if empty
  if (users.length === 0) {
    const demoUsers = [
      { name: 'Rahul K', avatar: 'RK', totalWinnings: 85000, rank: 'Legend', totalMatches: 234 },
      { name: 'Priya M', avatar: 'PM', totalWinnings: 62000, rank: 'Expert', totalMatches: 187 },
      { name: 'Amit S', avatar: 'AS', totalWinnings: 45000, rank: 'Pro', totalMatches: 156 },
      { name: 'Sneha R', avatar: 'SR', totalWinnings: 38000, rank: 'Pro', totalMatches: 134 },
      { name: 'Vikram T', avatar: 'VT', totalWinnings: 29000, rank: 'Elite', totalMatches: 98 },
    ];
    return res.json({ success: true, leaderboard: demoUsers });
  }
  res.json({ success: true, leaderboard: users });
});

// ═══════════════════════════════════════════
//  SERVE FRONTEND
// ═══════════════════════════════════════════
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
╔═════════════════════════════════════╗
║   Fantasy11 Server RUNNING ✅       ║
║   http://localhost:${PORT}             ║
╚═════════════════════════════════════╝`);
});
