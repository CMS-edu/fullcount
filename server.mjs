import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const port = Number(process.env.PORT || 5174);
const host = process.env.HOST || (process.env.RENDER ? "0.0.0.0" : "127.0.0.1");
const scrypt = promisify(scryptCallback);
const sessionSecret = process.env.SESSION_SECRET || "dev-fullcount-secret-change-on-render";
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};

const memory = {
  users: new Map(),
  sessions: new Map(),
  matches: [],
};

let pool = null;
let dbReady = false;

async function bootDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set. Auth API will use in-memory dev storage.");
    return;
  }
  try {
    const { Pool } = await import("pg");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    });
    await pool.query(`
      create table if not exists users (
        id bigserial primary key,
        email text unique not null,
        username text unique not null,
        password_hash text not null,
        favorite_team text default 'KIA',
        created_at timestamptz not null default now()
      );
      create table if not exists sessions (
        token_hash text primary key,
        user_id bigint not null references users(id) on delete cascade,
        expires_at timestamptz not null,
        created_at timestamptz not null default now()
      );
      create table if not exists match_records (
        id bigserial primary key,
        user_id bigint references users(id) on delete cascade,
        user_team text not null,
        opponent_team text not null,
        user_score integer not null,
        opponent_score integer not null,
        innings integer not null,
        result text not null,
        created_at timestamptz not null default now()
      );
      create index if not exists match_records_user_created_idx on match_records(user_id, created_at desc);
      create index if not exists sessions_expires_idx on sessions(expires_at);
    `);
    dbReady = true;
    console.log("PostgreSQL connected.");
  } catch (error) {
    console.error("PostgreSQL failed. Falling back to in-memory dev storage.", error);
    pool = null;
  }
}

await bootDatabase();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(url, res);
  } catch (error) {
    console.error(error);
    if (error?.code === "23505" || error?.message === "duplicate_user") {
      sendJson(res, 409, { error: "duplicate_user", message: "이미 사용 중인 이메일 또는 닉네임입니다." });
      return;
    }
    if (error instanceof SyntaxError) {
      sendJson(res, 400, { error: "bad_json", message: "요청 형식이 올바르지 않습니다." });
      return;
    }
    sendJson(res, 500, { error: "server_error" });
  }
}).listen(port, host, () => {
  console.log(`Fullcount server running at http://${host}:${port}`);
});

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, db: dbReady ? "postgres" : "memory" });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/auth/signup") {
    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    const username = normalizeUsername(body.username);
    const password = String(body.password || "");
    const favoriteTeam = String(body.favoriteTeam || "KIA").slice(0, 40);
    if (!email || !username || password.length < 6) {
      sendJson(res, 400, { error: "invalid_signup", message: "이메일, 닉네임, 6자 이상 비밀번호가 필요합니다." });
      return;
    }
    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, username, passwordHash, favoriteTeam });
    const token = await createSession(user.id);
    setSessionCookie(res, token);
    sendJson(res, 201, { user: publicUser(user) });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    const body = await readJson(req);
    const login = String(body.login || body.email || "").trim();
    const password = String(body.password || "");
    const user = await findUserByLogin(login);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      sendJson(res, 401, { error: "bad_login", message: "로그인 정보가 맞지 않습니다." });
      return;
    }
    const token = await createSession(user.id);
    setSessionCookie(res, token);
    sendJson(res, 200, { user: publicUser(user) });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/auth/logout") {
    const token = getCookie(req, "fc_session");
    if (token) await deleteSession(token);
    clearSessionCookie(res);
    sendJson(res, 200, { ok: true });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/auth/me") {
    const user = await requireUser(req);
    sendJson(res, 200, { user: user ? publicUser(user) : null });
    return;
  }
  if (req.method === "PATCH" && url.pathname === "/api/account") {
    const user = await requireUser(req);
    if (!user) return sendJson(res, 401, { error: "unauthorized" });
    const body = await readJson(req);
    const username = normalizeUsername(body.username || user.username);
    const favoriteTeam = String(body.favoriteTeam || user.favorite_team || "KIA").slice(0, 40);
    const updated = await updateUser(user.id, { username, favoriteTeam });
    sendJson(res, 200, { user: publicUser(updated) });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/matches") {
    const user = await requireUser(req);
    if (!user) return sendJson(res, 401, { error: "unauthorized" });
    const body = await readJson(req);
    const match = await saveMatch(user.id, {
      userTeam: String(body.userTeam || "KIA").slice(0, 40),
      opponentTeam: String(body.opponentTeam || "AI").slice(0, 40),
      userScore: clampInt(body.userScore, 0, 99),
      opponentScore: clampInt(body.opponentScore, 0, 99),
      innings: clampInt(body.innings, 1, 30),
      result: String(body.result || "unknown").slice(0, 20),
    });
    sendJson(res, 201, { match });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/matches/recent") {
    const user = await requireUser(req);
    if (!user) return sendJson(res, 401, { error: "unauthorized" });
    sendJson(res, 200, { matches: await recentMatches(user.id) });
    return;
  }
  sendJson(res, 404, { error: "not_found" });
}

function serveStatic(url, res) {
  if (url.pathname === "/favicon.ico") {
    res.writeHead(204);
    res.end();
    return;
  }
  const requested = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath);
  try {
    const stat = statSync(filePath);
    if (!stat.isFile()) throw new Error("not file");
    res.writeHead(200, {
      "Content-Type": types[extname(filePath)] || "application/octet-stream",
      "Cache-Control": isProduction ? "public, max-age=300" : "no-store",
    });
    createReadStream(filePath).pipe(res);
  } catch {
    const fallback = join(root, "index.html");
    if (existsSync(fallback)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      createReadStream(fallback).pipe(res);
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

async function createUser({ email, username, passwordHash, favoriteTeam }) {
  if (pool) {
    const { rows } = await pool.query(
      `insert into users (email, username, password_hash, favorite_team)
       values ($1, $2, $3, $4)
       returning id, email, username, password_hash, favorite_team, created_at`,
      [email, username, passwordHash, favoriteTeam]
    );
    return rows[0];
  }
  if ([...memory.users.values()].some((u) => u.email === email || u.username === username)) {
    const error = new Error("duplicate_user");
    error.code = "23505";
    throw error;
  }
  const user = {
    id: memory.users.size + 1,
    email,
    username,
    password_hash: passwordHash,
    favorite_team: favoriteTeam,
    created_at: new Date().toISOString(),
  };
  memory.users.set(user.id, user);
  return user;
}

async function findUserByLogin(login) {
  const email = normalizeEmail(login);
  const username = normalizeUsername(login);
  if (pool) {
    const { rows } = await pool.query(
      `select id, email, username, password_hash, favorite_team, created_at
       from users where email = $1 or username = $2 limit 1`,
      [email, username]
    );
    return rows[0] || null;
  }
  return [...memory.users.values()].find((u) => u.email === email || u.username === username) || null;
}

async function findUserById(userId) {
  if (pool) {
    const { rows } = await pool.query(
      `select id, email, username, password_hash, favorite_team, created_at from users where id = $1`,
      [userId]
    );
    return rows[0] || null;
  }
  return memory.users.get(Number(userId)) || null;
}

async function updateUser(userId, { username, favoriteTeam }) {
  if (pool) {
    const { rows } = await pool.query(
      `update users set username = $2, favorite_team = $3
       where id = $1
       returning id, email, username, password_hash, favorite_team, created_at`,
      [userId, username, favoriteTeam]
    );
    return rows[0];
  }
  const user = memory.users.get(Number(userId));
  user.username = username;
  user.favorite_team = favoriteTeam;
  return user;
}

async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  if (pool) {
    await pool.query(`insert into sessions (token_hash, user_id, expires_at) values ($1, $2, $3)`, [tokenHash, userId, expiresAt]);
  } else {
    memory.sessions.set(tokenHash, { user_id: userId, expires_at: expiresAt });
  }
  return token;
}

async function deleteSession(token) {
  const tokenHash = hashToken(token);
  if (pool) await pool.query(`delete from sessions where token_hash = $1`, [tokenHash]);
  else memory.sessions.delete(tokenHash);
}

async function requireUser(req) {
  const token = getCookie(req, "fc_session");
  if (!token) return null;
  const tokenHash = hashToken(token);
  if (pool) {
    const { rows } = await pool.query(`select user_id from sessions where token_hash = $1 and expires_at > now()`, [tokenHash]);
    return rows[0] ? findUserById(rows[0].user_id) : null;
  }
  const session = memory.sessions.get(tokenHash);
  if (!session || new Date(session.expires_at).getTime() < Date.now()) return null;
  return findUserById(session.user_id);
}

async function saveMatch(userId, match) {
  const result = match.userScore > match.opponentScore ? "win" : match.userScore < match.opponentScore ? "loss" : "draw";
  if (pool) {
    const { rows } = await pool.query(
      `insert into match_records (user_id, user_team, opponent_team, user_score, opponent_score, innings, result)
       values ($1, $2, $3, $4, $5, $6, $7)
       returning id, user_team, opponent_team, user_score, opponent_score, innings, result, created_at`,
      [userId, match.userTeam, match.opponentTeam, match.userScore, match.opponentScore, match.innings, result]
    );
    return rows[0];
  }
  const saved = { id: memory.matches.length + 1, user_id: userId, ...match, result, created_at: new Date().toISOString() };
  memory.matches.unshift(saved);
  return saved;
}

async function recentMatches(userId) {
  if (pool) {
    const { rows } = await pool.query(
      `select id, user_team, opponent_team, user_score, opponent_score, innings, result, created_at
       from match_records where user_id = $1 order by created_at desc limit 10`,
      [userId]
    );
    return rows;
  }
  return memory.matches.filter((match) => match.user_id === userId).slice(0, 10);
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("base64url");
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString("base64url")}`;
}

async function verifyPassword(password, stored) {
  const [, salt, encoded] = String(stored || "").split(":");
  if (!salt || !encoded) return false;
  const key = await scrypt(password, salt, 64);
  const saved = Buffer.from(encoded, "base64url");
  return saved.length === key.length && timingSafeEqual(saved, key);
}

function hashToken(token) {
  return createHmac("sha256", sessionSecret).update(token).digest("base64url");
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    favoriteTeam: user.favorite_team,
    createdAt: user.created_at,
  };
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("request_too_large");
  }
  return body ? JSON.parse(body) : {};
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function setSessionCookie(res, token) {
  const secure = isProduction ? "; Secure" : "";
  res.setHeader("Set-Cookie", `fc_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${secure}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `fc_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
}

function getCookie(req, name) {
  const header = req.headers.cookie || "";
  return header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .replace(/[^\w가-힣.-]/g, "")
    .slice(0, 20);
}

function clampInt(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return min;
  return Math.max(min, Math.min(max, number));
}
