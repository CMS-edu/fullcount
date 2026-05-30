const authPanel = document.getElementById("authPanel");
const appButtons = document.querySelectorAll("[data-app-view]");
const gameShell = document.querySelector(".game-shell");
const actionBarElement = document.getElementById("actionBar");
const API_BASE = String(window.FULLCOUNT_API_BASE || "").replace(/\/$/, "");
const WS_BASE = API_BASE
  ? API_BASE.replace(/^http/, "ws")
  : `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;
const initialRoomId = new URLSearchParams(location.search).get("room") || "";

const authState = {
  user: null,
  matches: [],
  view: "game",
  message: "",
  storage: "postgres",
  settings: loadSettings(),
};

const onlineState = {
  socket: null,
  connected: false,
  roomId: initialRoomId.trim().toUpperCase(),
  seat: null,
  status: "disconnected",
  players: [],
  log: [],
};

const realtimeListeners = new Set();

window.fullcountAuth = {
  get user() {
    return authState.user;
  },
  switchView(view) {
    authState.view = view;
    renderApp();
  },
  refreshMyTeam() {
    if (authState.view === "myTeam") renderApp();
  },
  async saveMatch(match) {
    if (!authState.user) return;
    try {
      await api("/api/matches", { method: "POST", body: match });
      await loadRecentMatches();
    } catch (error) {
      authState.message = `경기 저장 실패: ${error.message}`;
      renderApp();
    }
  },
};

window.fullcountRealtime = {
  sendGameEvent(event) {
    if (!onlineState.roomId) return false;
    sendRealtime({ type: "game-event", event });
    return true;
  },
  onGameEvent(listener) {
    realtimeListeners.add(listener);
    return () => realtimeListeners.delete(listener);
  },
  room() {
    return {
      connected: onlineState.connected,
      roomId: onlineState.roomId,
      seat: onlineState.seat,
      players: onlineState.players,
    };
  },
};

initAppShell();

async function initAppShell() {
  appButtons.forEach((button) => {
    button.addEventListener("click", () => {
      authState.view = button.dataset.appView;
      authState.message = "";
      renderApp();
    });
  });
  try {
    const data = await api("/api/auth/me");
    authState.user = data.user;
    authState.storage = data.storage || "postgres";
    if (authState.user) await loadRecentMatches();
  } catch {
    authState.user = null;
  }
  renderApp();
}

function renderApp() {
  appButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.appView === authState.view);
  });
  const showGame = authState.view === "game";
  gameShell.hidden = !showGame;
  actionBarElement.hidden = !showGame;
  authPanel.hidden = showGame;
  if (showGame) {
    authPanel.innerHTML = "";
    window.fullcountGame?.onGameViewActivated?.();
    return;
  }
  if (authState.view === "myTeam") {
    authPanel.innerHTML = window.fullcountGame?.renderMyTeamPanel?.() || "<div class='auth-card'><p>로딩 중...</p></div>";
    return;
  }
  if (authState.view === "online") {
    authPanel.innerHTML = onlineTemplate();
    bindOnline();
    return;
  }
  if (authState.view === "records") {
    authPanel.innerHTML = recordsTemplate();
    bindRecords();
    return;
  }
  if (authState.view === "league") {
    authPanel.innerHTML = leagueTemplate();
    bindLeague();
    return;
  }
  if (authState.view === "settings") {
    authPanel.innerHTML = settingsTemplate();
    bindSettings();
    return;
  }
  authPanel.innerHTML = accountTemplate();
  bindAccount();
}

async function loadRecentMatches() {
  if (!authState.user) {
    authState.matches = [];
    return;
  }
  try {
    const data = await api("/api/matches/recent");
    authState.matches = data.matches || [];
  } catch {
    authState.matches = [];
  }
}

function onlineTemplate() {
  const teams = window.fullcountGame?.teams?.() || [];
  const teamOptions = teams.map((team) => `<option value="${escapeHtml(team.name)}">${escapeHtml(team.name)}</option>`).join("");
  const invite = onlineState.roomId ? `${location.origin}${location.pathname}?room=${encodeURIComponent(onlineState.roomId)}` : "";
  const players = onlineState.players.length
    ? onlineState.players
        .map(
          (player) => `
            <li>
              <strong>P${player.seat} ${escapeHtml(player.username)}</strong>
              <span>${escapeHtml(player.team)} · ${player.ready ? "준비 완료" : "대기 중"}</span>
            </li>`
        )
        .join("")
    : "<li><strong>방 없음</strong><span>방을 만들거나 방 코드로 입장해.</span></li>";
  const log = onlineState.log.slice(-5).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  return `
    <div class="auth-card">
      <div class="screen-title">
        <div>
          <p class="eyebrow">ONLINE PVP</p>
          <h2>실시간 플레이어 대전</h2>
          <p>방 코드로 두 플레이어가 같은 경기방에 접속한다. 공격권을 가진 플레이어가 조작하고 결과는 상대 화면에 동기화된다.</p>
        </div>
        <strong>${onlineState.roomId || "NO ROOM"}</strong>
      </div>
      <form id="onlineForm" class="auth-form compact">
        <label>닉네임<input name="username" value="${escapeHtml(authState.user?.username || "Player")}" /></label>
        <label>팀<select name="team">${teamOptions}</select></label>
        <label>방 코드<input name="roomId" value="${escapeHtml(onlineState.roomId)}" placeholder="입장할 때만 입력" /></label>
        <button class="primary" type="button" data-online-action="create">방 만들기</button>
        <button type="button" data-online-action="join">입장</button>
        <button type="button" data-online-action="ready" ${onlineState.roomId ? "" : "disabled"}>준비</button>
        <button type="button" data-online-action="copy" ${onlineState.roomId ? "" : "disabled"}>초대 링크</button>
      </form>
      ${
        invite
          ? `<div class="invite-box"><strong>초대 링크</strong><span>${escapeHtml(invite)}</span></div>`
          : ""
      }
      <ol class="match-list">${players}</ol>
      ${log ? `<div class="online-log">${log}</div>` : ""}
      ${authState.message ? `<p class="auth-message">${escapeHtml(authState.message)}</p>` : ""}
    </div>`;
}

function bindOnline() {
  const form = document.getElementById("onlineForm");
  if (!form) return;
  form.querySelector("[data-online-action='create']")?.addEventListener("click", () => {
    const data = Object.fromEntries(new FormData(form));
    connectRealtime();
    sendRealtime({ type: "create-room", username: data.username, team: data.team });
  });
  form.querySelector("[data-online-action='join']")?.addEventListener("click", () => {
    const data = Object.fromEntries(new FormData(form));
    connectRealtime();
    sendRealtime({ type: "join-room", roomId: data.roomId, username: data.username, team: data.team });
  });
  form.querySelector("[data-online-action='ready']")?.addEventListener("click", () => {
    const data = Object.fromEntries(new FormData(form));
    const readyData = window.fullcountGame?.getOnlineReadyData?.(data.team) || {};
    sendRealtime({ type: "ready", ready: true, ...readyData });
    addOnlineLog("준비 완료를 보냈어.");
  });
  form.querySelector("[data-online-action='copy']")?.addEventListener("click", async () => {
    if (!onlineState.roomId) return;
    const invite = `${location.origin}${location.pathname}?room=${encodeURIComponent(onlineState.roomId)}`;
    try {
      await navigator.clipboard?.writeText(invite);
      addOnlineLog("초대 링크를 복사했어.");
    } catch {
      addOnlineLog(`초대 링크: ${invite}`);
    }
  });
}

function connectRealtime() {
  if (onlineState.socket && onlineState.socket.readyState <= 1) return;
  const socket = new WebSocket(`${WS_BASE}/ws`);
  onlineState.socket = socket;
  onlineState.status = "connecting";
  socket.addEventListener("open", () => {
    onlineState.connected = true;
    onlineState.status = "connected";
    addOnlineLog("서버에 연결됨.");
  });
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    handleRealtime(data);
  });
  socket.addEventListener("close", () => {
    onlineState.connected = false;
    onlineState.status = "closed";
    addOnlineLog("연결이 끊김.");
    renderApp();
  });
}

function sendRealtime(payload) {
  const send = () => onlineState.socket?.send(JSON.stringify(payload));
  if (!onlineState.socket || onlineState.socket.readyState === WebSocket.CLOSED) connectRealtime();
  if (onlineState.socket?.readyState === WebSocket.OPEN) send();
  else onlineState.socket?.addEventListener("open", send, { once: true });
}

function handleRealtime(data) {
  if (data.type === "game-event" || data.type === "game-input" || data.type === "game-state") {
    realtimeListeners.forEach((listener) => listener(data));
    return;
  }
  if (data.type === "connected") addOnlineLog("소켓 연결 확인.");
  if (data.type === "room-joined") {
    onlineState.roomId = data.roomId;
    onlineState.seat = data.seat;
    onlineState.players = data.players || [];
    updateRoomUrl(data.roomId);
    addOnlineLog(`방 ${data.roomId} 입장 · P${data.seat}`);
  }
  if (data.type === "room-state") {
    onlineState.roomId = data.roomId;
    onlineState.players = data.players || [];
  }
  if (data.type === "start-match") {
    onlineState.players = data.players || onlineState.players;
    addOnlineLog("두 플레이어 준비 완료. 경기를 시작함.");
    const p1 = onlineState.players.find((player) => player.seat === 1);
    const p2 = onlineState.players.find((player) => player.seat === 2);
    window.fullcountGame?.startOnlinePvp?.({
      roomId: data.roomId,
      seat: onlineState.seat,
      teamA: p1?.team,
      teamB: p2?.team,
      lineupA: p1?.lineup,
      pitcherA: p1?.pitcher,
      lineupB: p2?.lineup,
      pitcherB: p2?.pitcher,
    });
    authState.view = "game";
  }
  if (data.type === "error") addOnlineLog(data.message || "서버 오류");
  renderApp();
}

function addOnlineLog(text) {
  onlineState.log.push(`${new Date().toLocaleTimeString("ko-KR")} ${text}`);
  if (onlineState.log.length > 20) onlineState.log.shift();
}

function updateRoomUrl(roomId) {
  if (!roomId) return;
  const url = new URL(location.href);
  url.searchParams.set("room", roomId);
  history.replaceState(null, "", url);
}

function accountTemplate() {
  if (!authState.user) return loginTemplate();
  return `
    <div class="auth-card">
      <form id="accountForm" class="auth-form compact">
        <p class="eyebrow">ACCOUNT</p>
        <h2>${escapeHtml(authState.user.username)}</h2>
        <label>닉네임<input name="username" value="${escapeHtml(authState.user.username)}" required /></label>
        <label>응원팀<input name="favoriteTeam" value="${escapeHtml(authState.user.favoriteTeam || "KIA")}" /></label>
        <button class="primary" type="submit">계정 저장</button>
        <button type="button" id="logoutButton">로그아웃</button>
      </form>
      ${memoryWarningBanner()}
      ${authState.message ? `<p class="auth-message">${escapeHtml(authState.message)}</p>` : ""}
    </div>`;
}

function memoryWarningBanner() {
  if (authState.storage !== "memory") return "";
  return `<p class="auth-message" style="border-left-color:#f4c24d;background:#2a1e00;color:#f4c24d">
    ⚠️ 데이터베이스 미연결 — 계정 정보가 서버 재시작 시 사라집니다. Render 환경변수에 <strong>DATABASE_URL</strong>을 설정하세요.
  </p>`;
}

function loginTemplate() {
  return `
    <div class="auth-card auth-grid">
      <form id="loginForm" class="auth-form">
        <p class="eyebrow">LOGIN</p>
        <h2>로그인</h2>
        <label>이메일 또는 닉네임<input name="login" autocomplete="username" required /></label>
        <label>비밀번호<input name="password" type="password" autocomplete="current-password" required /></label>
        <button class="primary" type="submit">로그인</button>
      </form>
      <form id="signupForm" class="auth-form">
        <p class="eyebrow">SIGN UP</p>
        <h2>계정 만들기</h2>
        <label>이메일<input name="email" type="email" autocomplete="email" required /></label>
        <label>닉네임<input name="username" autocomplete="username" required /></label>
        <label>비밀번호<input name="password" type="password" autocomplete="new-password" minlength="6" required /></label>
        <label>응원팀<input name="favoriteTeam" value="KIA" /></label>
        <button type="submit">회원가입</button>
      </form>
      ${memoryWarningBanner()}
      ${authState.message ? `<p class="auth-message">${escapeHtml(authState.message)}</p>` : ""}
    </div>`;
}

function bindAccount() {
  document.getElementById("loginForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    await submitAuth("/api/auth/login", body, "로그인 완료.");
  });
  document.getElementById("signupForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    await submitAuth("/api/auth/signup", body, "회원가입 완료.");
  });
  document.getElementById("accountForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const data = await api("/api/account", { method: "PATCH", body });
      authState.user = data.user;
      authState.message = "계정 저장 완료.";
      renderApp();
    } catch (error) {
      authState.message = error.message;
      renderApp();
    }
  });
  document.getElementById("logoutButton")?.addEventListener("click", async () => {
    await api("/api/auth/logout", { method: "POST" });
    authState.user = null;
    authState.matches = [];
    authState.message = "로그아웃됨.";
    renderApp();
  });
}

async function submitAuth(path, body, message) {
  try {
    const data = await api(path, { method: "POST", body });
    authState.user = data.user;
    authState.message = message;
    await loadRecentMatches();
    renderApp();
  } catch (error) {
    authState.message = error.message;
    renderApp();
  }
}

function recordsTemplate() {
  const season = (window.fullcountSeason?.load?.() || { batters: {}, pitchers: {}, teams: {}, matches: [] });
  const tab = authState.recordsTab || "standings";
  const tabBtn = (key, label) => `<button class="rec-tab${tab === key ? " active" : ""}" data-rec-tab="${key}">${label}</button>`;
  const recent = authState.matches.length
    ? authState.matches
        .map(
          (match) => `
            <li>
              <strong>${escapeHtml(match.user_team)} ${match.user_score} - ${match.opponent_score} ${escapeHtml(match.opponent_team)}</strong>
              <span>${resultLabel(match.result)} · ${new Date(match.created_at).toLocaleString("ko-KR")}</span>
            </li>`
        )
        .join("")
    : (season.matches.length
        ? season.matches.slice(0, 10).map((m) => `
            <li>
              <strong>${escapeHtml(m.userTeam)} ${m.userScore} - ${m.aiScore} ${escapeHtml(m.aiTeam)}</strong>
              <span>${m.userScore > m.aiScore ? "승" : m.userScore < m.aiScore ? "패" : "무"} · ${new Date(m.date).toLocaleString("ko-KR")}</span>
            </li>`).join("")
        : "<li><strong>기록 없음</strong><span>경기를 끝내면 시즌 기록이 누적됩니다.</span></li>");

  let body = "";
  if (tab === "standings") body = renderStandings(season);
  else if (tab === "batting") body = renderBattingTable(season);
  else if (tab === "hr") body = renderHRTable(season);
  else if (tab === "pitching") body = renderPitchingTable(season);
  else if (tab === "recent") body = `<ol class="match-list">${recent}</ol>`;

  return `
    <div class="auth-card records-card">
      <p class="eyebrow">RECORDS · 시즌 누적</p>
      <h2>기록실</h2>
      <div class="rec-tabs">
        ${tabBtn("standings", "팀 순위")}
        ${tabBtn("batting", "타율 순위")}
        ${tabBtn("hr", "홈런 순위")}
        ${tabBtn("pitching", "투수 기록")}
        ${tabBtn("recent", "최근 경기")}
        <button class="rec-tab rec-reset" data-rec-tab="reset">시즌 리셋</button>
      </div>
      <div class="rec-body">${body}</div>
      ${authState.user ? "" : `<p class="auth-message">로그인하면 경기 기록이 서버에도 저장됩니다.</p>`}
    </div>`;
}

function renderStandings(season) {
  const teams = Object.entries(season.teams || {})
    .map(([name, s]) => {
      const games = (s.W || 0) + (s.L || 0) + (s.T || 0);
      const pct = (s.W || 0) + (s.L || 0) > 0 ? (s.W / ((s.W) + (s.L))) : 0;
      const diff = (s.RS || 0) - (s.RA || 0);
      return { name, games, ...s, pct, diff };
    });
  if (!teams.length) return `<p class="rec-empty">아직 등록된 팀 기록이 없습니다.</p>`;
  const sorted = applySort(teams, "season-standings");
  const lead = applySort(teams, "season-standings")[0] || teams[0];
  const ctx = "season-standings";
  const rows = sorted.map((t, i) => {
    const gap = i === 0 ? "-" : (((lead.W - t.W) + (t.L - lead.L)) / 2).toFixed(1);
    return `<tr>
      <td class="rec-rank">${i + 1}</td>
      <td class="rec-team">${escapeHtml(t.name)}</td>
      <td>${t.games}</td>
      <td>${t.W}</td>
      <td>${t.L}</td>
      <td>${t.T}</td>
      <td>${t.pct.toFixed(3)}</td>
      <td>${gap}</td>
      <td>${t.RS}</td>
      <td>${t.RA}</td>
      <td class="${t.diff > 0 ? "rec-pos" : t.diff < 0 ? "rec-neg" : ""}">${t.diff > 0 ? "+" : ""}${t.diff}</td>
    </tr>`;
  }).join("");
  return `
    <table class="rec-table">
      <thead><tr><th>순위</th><th>팀</th>${sortableTh("경기", "games", ctx)}${sortableTh("승", "W", ctx)}${sortableTh("패", "L", ctx)}${sortableTh("무", "T", ctx)}${sortableTh("승률", "pct", ctx)}<th>게임차</th>${sortableTh("득점", "RS", ctx)}${sortableTh("실점", "RA", ctx, "asc")}${sortableTh("득실", "diff", ctx)}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderBattingTable(season) {
  const list = Object.entries(season.batters || {})
    .map(([name, s]) => {
      const TB = s.TB || ((s.H || 0) + (s["2B"] || 0) + 2 * (s["3B"] || 0) + 3 * (s.HR || 0));
      const SF = s.SF || 0;
      const AVG = s.AB > 0 ? (s.H / s.AB) : 0;
      const OBP = (s.AB + s.BB + SF) > 0 ? ((s.H + s.BB) / (s.AB + s.BB + SF)) : 0;
      const SLG = s.AB > 0 ? (TB / s.AB) : 0;
      const OPS = OBP + SLG;
      const ISO = SLG - AVG;
      return { name, ...s, TB, AVG, OBP, SLG, OPS, ISO };
    })
    .filter((b) => b.AB >= 1);
  if (!list.length) return `<p class="rec-empty">아직 타격 기록이 없습니다. 한 경기를 마치면 표시됩니다.</p>`;
  const ctx = "season-batting";
  const sorted = applySort(list, ctx);
  const rows = sorted.slice(0, 50).map((b, i) => `
    <tr>
      <td class="rec-rank">${i + 1}</td>
      <td class="rec-team">${escapeHtml(b.team || "-")}</td>
      <td class="rec-player">${recPhotoMarkup(b.team, b.name)}<span>${escapeHtml(b.name)}</span></td>
      <td>${b.G}</td>
      <td>${b.AB}</td>
      <td>${b.H}</td>
      <td>${b["2B"]}</td>
      <td>${b["3B"]}</td>
      <td>${b.HR}</td>
      <td>${b.RBI}</td>
      <td>${b.R}</td>
      <td>${b.BB}</td>
      <td>${b.SO}</td>
      <td>${b.TB}</td>
      <td class="rec-pos">${b.AVG.toFixed(3)}</td>
      <td>${b.OBP.toFixed(3)}</td>
      <td>${b.SLG.toFixed(3)}</td>
      <td class="rec-pos">${b.OPS.toFixed(3)}</td>
      <td>${b.ISO.toFixed(3)}</td>
    </tr>`).join("");
  return `
    <table class="rec-table">
      <thead><tr><th>순위</th><th>팀</th><th>선수</th>${sortableTh("G", "G", ctx)}${sortableTh("타수", "AB", ctx)}${sortableTh("안타", "H", ctx)}${sortableTh("2B", "2B", ctx)}${sortableTh("3B", "3B", ctx)}${sortableTh("홈런", "HR", ctx)}${sortableTh("타점", "RBI", ctx)}${sortableTh("득점", "R", ctx)}${sortableTh("볼넷", "BB", ctx)}${sortableTh("삼진", "SO", ctx, "asc")}${sortableTh("루타", "TB", ctx)}${sortableTh("타율", "AVG", ctx)}${sortableTh("출루율", "OBP", ctx)}${sortableTh("장타율", "SLG", ctx)}${sortableTh("OPS", "OPS", ctx)}${sortableTh("ISO", "ISO", ctx)}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function recPhotoMarkup(team, name) {
  const url = window.fullcountSeason?.playerPhoto?.(team, name);
  if (!url) return "";
  return `<img class="rec-photo" src="${escapeHtml(url)}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.style.display='none'" />`;
}

// ── Sortable headers ─────────────────────────────────────────────
function defaultSort(ctx) {
  return {
    "season-batting": { key: "AVG", dir: "desc" },
    "season-hr": { key: "HR", dir: "desc" },
    "season-pitching": { key: "ERA", dir: "asc" },
    "season-standings": { key: "pct", dir: "desc" },
    "league-batting": { key: "OPS", dir: "desc" },
    "league-pitching": { key: "ERA", dir: "asc" },
    "league-standings": { key: "pct", dir: "desc" },
  }[ctx] || { key: "", dir: "desc" };
}

function getSort(ctx) {
  authState.sort = authState.sort || {};
  if (!authState.sort[ctx]) authState.sort[ctx] = defaultSort(ctx);
  return authState.sort[ctx];
}

function sortableTh(label, key, ctx, defaultDir = "desc") {
  const cur = getSort(ctx);
  const isCurrent = cur.key === key;
  const arrow = isCurrent ? (cur.dir === "desc" ? " ▼" : " ▲") : "";
  return `<th class="sort-th${isCurrent ? " sort-active" : ""}" data-sort-key="${key}" data-sort-ctx="${ctx}" data-sort-default="${defaultDir}">${label}${arrow}</th>`;
}

function applySort(arr, ctx) {
  const { key, dir } = getSort(ctx);
  if (!key) return arr;
  const mult = dir === "desc" ? -1 : 1;
  return [...arr].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * mult;
    return ((av || 0) - (bv || 0)) * mult;
  });
}

function renderHRTable(season) {
  const list = Object.entries(season.batters || {})
    .map(([name, s]) => ({ name, ...s, AVG: s.AB > 0 ? s.H / s.AB : 0 }))
    .filter((b) => (b.HR || 0) > 0);
  if (!list.length) return `<p class="rec-empty">아직 홈런이 없습니다.</p>`;
  const ctx = "season-hr";
  const sorted = applySort(list, ctx);
  const rows = sorted.slice(0, 40).map((b, i) => `
    <tr>
      <td class="rec-rank">${i + 1}</td>
      <td class="rec-team">${escapeHtml(b.team || "-")}</td>
      <td class="rec-player">${recPhotoMarkup(b.team, b.name)}<span>${escapeHtml(b.name)}</span></td>
      <td class="rec-pos">${b.HR}</td>
      <td>${b.RBI}</td>
      <td>${b.H}</td>
      <td>${b.AB}</td>
      <td>${b.AB > 0 ? b.AVG.toFixed(3) : "-"}</td>
    </tr>`).join("");
  return `
    <table class="rec-table">
      <thead><tr><th>순위</th><th>팀</th><th>선수</th>${sortableTh("홈런", "HR", ctx)}${sortableTh("타점", "RBI", ctx)}${sortableTh("안타", "H", ctx)}${sortableTh("타수", "AB", ctx)}${sortableTh("타율", "AVG", ctx)}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderPitchingTable(season) {
  const list = Object.entries(season.pitchers || {})
    .map(([name, s]) => {
      const ip = (s.outs || 0) / 3;
      const era = ip > 0 ? ((s.ER || 0) * 9 / ip) : 0;
      const whip = ip > 0 ? ((s.H + s.BB) / ip) : 0;
      const k9 = ip > 0 ? (s.SO * 9 / ip) : 0;
      const bb9 = ip > 0 ? (s.BB * 9 / ip) : 0;
      const hr9 = ip > 0 ? (s.HR * 9 / ip) : 0;
      const kbb = s.BB > 0 ? (s.SO / s.BB) : (s.SO > 0 ? s.SO : 0);
      return { name, ...s, ip, era, whip, k9, bb9, hr9, kbb };
    })
    .filter((p) => p.outs > 0)
    .map((p) => ({ ...p, IP: p.ip, ERA: p.era, WHIP: p.whip, K9: p.k9, BB9: p.bb9, HR9: p.hr9, KBB: p.kbb, W: p.W || 0, L: p.L || 0 }));
  if (!list.length) return `<p class="rec-empty">아직 투수 기록이 없습니다.</p>`;
  const ctx = "season-pitching";
  const sorted = applySort(list, ctx);
  const rows = sorted.slice(0, 50).map((p, i) => `
    <tr>
      <td class="rec-rank">${i + 1}</td>
      <td class="rec-team">${escapeHtml(p.team || "-")}</td>
      <td class="rec-player">${recPhotoMarkup(p.team, p.name)}<span>${escapeHtml(p.name)}</span></td>
      <td>${p.G}</td>
      <td>${p.W}</td>
      <td>${p.L}</td>
      <td>${ipFormat(p.outs)}</td>
      <td>${p.H}</td>
      <td>${p.HR}</td>
      <td>${p.BB}</td>
      <td>${p.SO}</td>
      <td>${p.ER}</td>
      <td>${p.pitches}</td>
      <td class="rec-pos">${p.IP > 0 ? p.ERA.toFixed(2) : "-"}</td>
      <td>${p.IP > 0 ? p.WHIP.toFixed(2) : "-"}</td>
      <td>${p.IP > 0 ? p.K9.toFixed(2) : "-"}</td>
      <td>${p.IP > 0 ? p.BB9.toFixed(2) : "-"}</td>
      <td>${p.IP > 0 ? p.HR9.toFixed(2) : "-"}</td>
      <td>${p.KBB > 0 ? p.KBB.toFixed(2) : "-"}</td>
    </tr>`).join("");
  return `
    <table class="rec-table">
      <thead><tr><th>순위</th><th>팀</th><th>선수</th>${sortableTh("G", "G", ctx)}${sortableTh("승", "W", ctx)}${sortableTh("패", "L", ctx, "asc")}${sortableTh("이닝", "outs", ctx)}${sortableTh("피안타", "H", ctx, "asc")}${sortableTh("피홈런", "HR", ctx, "asc")}${sortableTh("4사구", "BB", ctx, "asc")}${sortableTh("K", "SO", ctx)}${sortableTh("자책", "ER", ctx, "asc")}${sortableTh("투구수", "pitches", ctx)}${sortableTh("ERA", "ERA", ctx, "asc")}${sortableTh("WHIP", "WHIP", ctx, "asc")}${sortableTh("K/9", "K9", ctx)}${sortableTh("BB/9", "BB9", ctx, "asc")}${sortableTh("HR/9", "HR9", ctx, "asc")}${sortableTh("K/BB", "KBB", ctx)}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function ipFormat(outs) {
  const whole = Math.floor(outs / 3);
  const rem = outs % 3;
  return rem === 0 ? `${whole}` : `${whole} ${rem}/3`;
}

// ─── League system ──────────────────────────────────────────────
function loadLeagues() {
  try { return JSON.parse(localStorage.getItem("fullcount:leagues")) || []; }
  catch { return []; }
}

function saveLeagues(leagues) {
  localStorage.setItem("fullcount:leagues", JSON.stringify(leagues));
}

function activeLeagueId() {
  return localStorage.getItem("fullcount:activeLeague") || null;
}

function setActiveLeagueId(id) {
  if (id) localStorage.setItem("fullcount:activeLeague", id);
  else localStorage.removeItem("fullcount:activeLeague");
}

function buildRoundRobinSchedule(teamNames) {
  const teams = [...teamNames];
  if (teams.length < 2) return [];
  const n = teams.length % 2 === 0 ? teams.length : teams.length + 1;
  const slots = [...teams];
  if (slots.length < n) slots.push(null);
  const rounds = [];
  const half = n / 2;
  for (let r = 0; r < n - 1; r++) {
    const round = [];
    for (let i = 0; i < half; i++) {
      const a = slots[i];
      const b = slots[n - 1 - i];
      if (a && b) round.push({ home: a, away: b, result: null });
    }
    rounds.push(round);
    const last = slots.pop();
    slots.splice(1, 0, last);
  }
  return rounds.flat();
}

function createLeague({ name, teams, innings, playerTeams }) {
  const leagues = loadLeagues();
  const id = "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const league = {
    id,
    name: name || `리그 ${leagues.length + 1}`,
    teams,
    playerTeams: Array.isArray(playerTeams) ? playerTeams.filter((t) => teams.includes(t)) : [],
    innings: [1, 3, 5, 7, 9].includes(Number(innings)) ? Number(innings) : 5,
    schedule: buildRoundRobinSchedule(teams),
    createdAt: new Date().toISOString(),
    standings: Object.fromEntries(teams.map((t) => [t, { W: 0, L: 0, T: 0, RS: 0, RA: 0, G: 0 }])),
    batters: {},
    pitchers: {},
  };
  leagues.push(league);
  saveLeagues(leagues);
  setActiveLeagueId(id);
  return league;
}

function getLeague(id) {
  return loadLeagues().find((l) => l.id === id) || null;
}

function updateLeague(id, mutator) {
  const leagues = loadLeagues();
  const idx = leagues.findIndex((l) => l.id === id);
  if (idx < 0) return null;
  mutator(leagues[idx]);
  saveLeagues(leagues);
  return leagues[idx];
}

function leagueTemplate() {
  const leagues = loadLeagues();
  const activeId = activeLeagueId();
  const active = activeId ? leagues.find((l) => l.id === activeId) : null;
  if (active) return renderLeagueDetail(active);
  return renderLeagueList(leagues);
}

function renderLeagueList(leagues) {
  const teams = window.fullcountGame?.teams?.() || [];
  const teamCheckboxes = teams.map((t) => `
    <div class="lg-team-row">
      <label class="lg-team-pick"><input type="checkbox" name="leagueTeams" value="${escapeHtml(t.name)}" data-lg-team-toggle/> ${escapeHtml(t.name)}</label>
      <label class="lg-player-pick"><input type="checkbox" name="leaguePlayerTeams" value="${escapeHtml(t.name)}" data-lg-player-toggle/> 👤 직접 조작</label>
    </div>`).join("");
  const list = leagues.length ? leagues.map((l) => {
    const played = l.schedule.filter((m) => m.result).length;
    const players = (l.playerTeams || []).length;
    return `<li class="lg-list-row">
      <div>
        <strong>${escapeHtml(l.name)}</strong>
        <span class="muted">${l.teams.length}팀 (직접 ${players}) · ${l.innings}이닝 · ${played}/${l.schedule.length}경기 완료</span>
      </div>
      <div class="lg-list-actions">
        <button data-lg-action="open" data-lg-id="${l.id}">열기</button>
        <button class="danger" data-lg-action="delete" data-lg-id="${l.id}">삭제</button>
      </div>
    </li>`;
  }).join("") : `<li class="rec-empty">아직 만든 리그가 없습니다. 아래 양식으로 만들어보세요.</li>`;
  return `
    <div class="auth-card">
      <p class="eyebrow">LEAGUE</p>
      <h2>리그</h2>
      <ol class="lg-list">${list}</ol>
      <form id="leagueCreateForm" class="lg-create">
        <h3>새 리그 만들기</h3>
        <label>리그 이름<input name="leagueName" placeholder="예: 2026 풀카운트 리그" required /></label>
        <label>이닝 수
          <select name="leagueInnings">
            <option value="1">1이닝</option>
            <option value="3" selected>3이닝</option>
            <option value="5">5이닝</option>
            <option value="7">7이닝</option>
            <option value="9">9이닝</option>
          </select>
        </label>
        <fieldset class="lg-team-pickset">
          <legend>참가 팀 + 직접 조작할 팀(👤) 선택 (2팀 이상)</legend>
          ${teamCheckboxes}
        </fieldset>
        <button class="primary" type="submit">리그 생성 + 라운드로빈 스케줄 자동 생성</button>
      </form>
    </div>`;
}

function renderLeagueDetail(league) {
  const tab = authState.leagueTab || "standings";
  const tabBtn = (key, label) => `<button class="rec-tab${tab === key ? " active" : ""}" data-lg-tab="${key}">${label}</button>`;
  let body = "";
  if (tab === "standings") body = renderLeagueStandings(league);
  else if (tab === "schedule") body = renderLeagueSchedule(league);
  else if (tab === "batting") body = renderLeagueBatters(league);
  else if (tab === "pitching") body = renderLeaguePitchers(league);
  else if (tab === "awards") body = renderLeagueAwards(league);
  const playerTeams = (league.playerTeams || []);
  const playerLabel = playerTeams.length ? "직접 조작 팀: " + playerTeams.map(escapeHtml).join(", ") : "직접 조작 팀 없음";
  return `
    <div class="auth-card records-card">
      <div class="lg-header">
        <p class="eyebrow">LEAGUE · ${escapeHtml(league.id)}</p>
        <h2>${escapeHtml(league.name)}</h2>
        <p class="muted">${league.teams.length}팀 · ${league.innings}이닝 · ${playerLabel}</p>
      </div>
      <div class="rec-tabs">
        ${tabBtn("standings", "순위표")}
        ${tabBtn("schedule", "일정·결과")}
        ${tabBtn("batting", "타격")}
        ${tabBtn("pitching", "투수")}
        ${tabBtn("awards", "시상")}
        <button class="rec-tab" data-lg-action="back">← 리그 목록</button>
      </div>
      <div class="rec-body">${body}</div>
    </div>`;
}

function renderLeagueStandings(league) {
  const teams = Object.entries(league.standings)
    .map(([name, s]) => {
      const pct = (s.W + s.L) > 0 ? s.W / (s.W + s.L) : 0;
      const diff = (s.RS || 0) - (s.RA || 0);
      return { name, ...s, pct, diff };
    });
  const ctx = "league-standings";
  const sorted = applySort(teams, ctx);
  const lead = applySort(teams, { key: "pct", dir: "desc" } ? "league-standings" : "league-standings")[0] || teams[0];
  const html = sorted.map((t, i) => {
    const gap = i === 0 ? "-" : (((lead.W - t.W) + (t.L - lead.L)) / 2).toFixed(1);
    return `<tr>
      <td class="rec-rank">${i + 1}</td>
      <td class="rec-team">${escapeHtml(t.name)}</td>
      <td>${t.G}</td>
      <td>${t.W}</td>
      <td>${t.L}</td>
      <td>${t.T}</td>
      <td>${t.pct.toFixed(3)}</td>
      <td>${gap}</td>
      <td>${t.RS}</td>
      <td>${t.RA}</td>
      <td class="${t.diff > 0 ? "rec-pos" : t.diff < 0 ? "rec-neg" : ""}">${t.diff > 0 ? "+" : ""}${t.diff}</td>
    </tr>`;
  }).join("");
  return `
    <table class="rec-table">
      <thead><tr><th>순위</th><th>팀</th>${sortableTh("G", "G", ctx)}${sortableTh("승", "W", ctx)}${sortableTh("패", "L", ctx)}${sortableTh("무", "T", ctx)}${sortableTh("승률", "pct", ctx)}<th>게임차</th>${sortableTh("득점", "RS", ctx)}${sortableTh("실점", "RA", ctx, "asc")}${sortableTh("득실", "diff", ctx)}</tr></thead>
      <tbody>${html}</tbody>
    </table>`;
}

function renderLeagueSchedule(league) {
  const playerTeams = league.playerTeams || [];
  const rows = league.schedule.map((m, i) => {
    const homePlayer = playerTeams.includes(m.home);
    const awayPlayer = playerTeams.includes(m.away);
    const userInvolved = homePlayer || awayPlayer;
    const isPlayed = !!m.result;
    const bothPlayers = homePlayer && awayPlayer;
    let actionBtn;
    if (isPlayed) {
      const r = m.result;
      actionBtn = `<span class="muted">${r.home} ${r.homeScore} - ${r.awayScore} ${r.away}</span>`;
    } else if (userInvolved) {
      const label = bothPlayers ? "P vs P 경기" : "경기 시작";
      actionBtn = `<button class="primary" data-lg-action="play" data-lg-match="${i}">${label}</button>`;
    } else {
      actionBtn = `<button data-lg-action="sim" data-lg-match="${i}">AI 시뮬레이션</button>`;
    }
    const homeBadge = homePlayer ? " 👤" : "";
    const awayBadge = awayPlayer ? " 👤" : "";
    return `<tr>
      <td>${i + 1}</td>
      <td class="rec-team">${escapeHtml(m.home)}${homeBadge}</td>
      <td class="muted">vs</td>
      <td class="rec-team">${escapeHtml(m.away)}${awayBadge}</td>
      <td>${actionBtn}</td>
    </tr>`;
  }).join("");
  return `
    <div class="lg-sched-toolbar">
      <button data-lg-action="simAll">남은 AI 경기 일괄 시뮬</button>
    </div>
    <table class="rec-table">
      <thead><tr><th>#</th><th>홈</th><th></th><th>원정</th><th>결과 / 액션</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderLeagueBatters(league) {
  const list = Object.entries(league.batters)
    .map(([name, s]) => {
      const TB = s.TB || ((s.H || 0) + (s["2B"] || 0) + 2 * (s["3B"] || 0) + 3 * (s.HR || 0));
      const SF = s.SF || 0;
      const AVG = s.AB > 0 ? (s.H / s.AB) : 0;
      const OBP = (s.AB + s.BB + SF) > 0 ? ((s.H + s.BB) / (s.AB + s.BB + SF)) : 0;
      const SLG = s.AB > 0 ? (TB / s.AB) : 0;
      const OPS = OBP + SLG;
      return { name, ...s, TB, AVG, OBP, SLG, OPS };
    })
    .filter((b) => b.AB >= 1);
  if (!list.length) return `<p class="rec-empty">아직 경기 결과가 없습니다.</p>`;
  const ctx = "league-batting";
  const sorted = applySort(list, ctx);
  const rows = sorted.slice(0, 60).map((b, i) => `
    <tr>
      <td class="rec-rank">${i + 1}</td>
      <td class="rec-team">${escapeHtml(b.team || "-")}</td>
      <td class="rec-player">${recPhotoMarkup(b.team, b.name)}<span>${escapeHtml(b.name)}</span></td>
      <td>${b.G || 0}</td>
      <td>${b.AB}</td>
      <td>${b.H}</td>
      <td>${b.HR}</td>
      <td>${b.RBI}</td>
      <td>${b.R}</td>
      <td>${b.BB}</td>
      <td>${b.SO}</td>
      <td class="rec-pos">${b.AVG.toFixed(3)}</td>
      <td>${b.OBP.toFixed(3)}</td>
      <td>${b.SLG.toFixed(3)}</td>
      <td class="rec-pos">${b.OPS.toFixed(3)}</td>
    </tr>`).join("");
  return `
    <table class="rec-table">
      <thead><tr><th>순위</th><th>팀</th><th>선수</th>${sortableTh("G", "G", ctx)}${sortableTh("타수", "AB", ctx)}${sortableTh("안타", "H", ctx)}${sortableTh("홈런", "HR", ctx)}${sortableTh("타점", "RBI", ctx)}${sortableTh("득점", "R", ctx)}${sortableTh("볼넷", "BB", ctx)}${sortableTh("삼진", "SO", ctx, "asc")}${sortableTh("타율", "AVG", ctx)}${sortableTh("출루율", "OBP", ctx)}${sortableTh("장타율", "SLG", ctx)}${sortableTh("OPS", "OPS", ctx)}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderLeaguePitchers(league) {
  const list = Object.entries(league.pitchers)
    .map(([name, s]) => {
      const ip = (s.outs || 0) / 3;
      const era = ip > 0 ? ((s.ER || 0) * 9 / ip) : 0;
      const whip = ip > 0 ? ((s.H + s.BB) / ip) : 0;
      const k9 = ip > 0 ? (s.SO * 9 / ip) : 0;
      return { name, ...s, ip, era, whip, k9 };
    })
    .filter((p) => p.outs > 0)
    .map((p) => ({ ...p, IP: p.ip, ERA: p.era, WHIP: p.whip, K9: p.k9, W: p.W || 0, L: p.L || 0 }));
  if (!list.length) return `<p class="rec-empty">아직 투수 기록이 없습니다.</p>`;
  const ctx = "league-pitching";
  const sorted = applySort(list, ctx);
  const rows = sorted.slice(0, 60).map((p, i) => `
    <tr>
      <td class="rec-rank">${i + 1}</td>
      <td class="rec-team">${escapeHtml(p.team || "-")}</td>
      <td class="rec-player">${recPhotoMarkup(p.team, p.name)}<span>${escapeHtml(p.name)}</span></td>
      <td>${p.G || 0}</td>
      <td>${p.W}</td>
      <td>${p.L}</td>
      <td>${ipFormat(p.outs)}</td>
      <td>${p.H}</td>
      <td>${p.HR}</td>
      <td>${p.BB}</td>
      <td>${p.SO}</td>
      <td>${p.ER}</td>
      <td class="rec-pos">${p.IP > 0 ? p.ERA.toFixed(2) : "-"}</td>
      <td>${p.IP > 0 ? p.WHIP.toFixed(2) : "-"}</td>
      <td>${p.IP > 0 ? p.K9.toFixed(2) : "-"}</td>
    </tr>`).join("");
  return `
    <table class="rec-table">
      <thead><tr><th>순위</th><th>팀</th><th>선수</th>${sortableTh("G", "G", ctx)}${sortableTh("승", "W", ctx)}${sortableTh("패", "L", ctx, "asc")}${sortableTh("이닝", "outs", ctx)}${sortableTh("피안타", "H", ctx, "asc")}${sortableTh("피홈런", "HR", ctx, "asc")}${sortableTh("4사구", "BB", ctx, "asc")}${sortableTh("K", "SO", ctx)}${sortableTh("자책", "ER", ctx, "asc")}${sortableTh("ERA", "ERA", ctx, "asc")}${sortableTh("WHIP", "WHIP", ctx, "asc")}${sortableTh("K/9", "K9", ctx)}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderLeagueAwards(league) {
  const batters = Object.entries(league.batters).map(([name, s]) => {
    const TB = s.TB || ((s.H||0) + (s["2B"]||0) + 2*(s["3B"]||0) + 3*(s.HR||0));
    const SF = s.SF || 0;
    const AVG = s.AB > 0 ? s.H / s.AB : 0;
    const OBP = (s.AB+s.BB+SF) > 0 ? (s.H+s.BB)/(s.AB+s.BB+SF) : 0;
    const SLG = s.AB > 0 ? TB / s.AB : 0;
    return { name, ...s, AVG, OPS: OBP+SLG };
  });
  const pitchers = Object.entries(league.pitchers).map(([name, s]) => {
    const ip = (s.outs||0)/3;
    return { name, ...s, ip, ERA: ip > 0 ? s.ER*9/ip : 999 };
  });
  const batChamp = [...batters].filter(b => b.AB >= 3).sort((a,b) => b.AVG - a.AVG)[0];
  const hrChamp = [...batters].sort((a,b) => b.HR - a.HR)[0];
  const rbiChamp = [...batters].sort((a,b) => b.RBI - a.RBI)[0];
  const eraChamp = [...pitchers].filter(p => p.ip >= 3).sort((a,b) => a.ERA - b.ERA)[0];
  const winChamp = [...pitchers].sort((a,b) => (b.W||0) - (a.W||0))[0];
  const kChamp = [...pitchers].sort((a,b) => b.SO - a.SO)[0];
  // MVP: OPS * G + RBI*0.5 + HR*1
  const mvp = [...batters].sort((a,b) => ((b.OPS||0)*(b.G||1) + (b.RBI||0)*0.5 + (b.HR||0)) - ((a.OPS||0)*(a.G||1) + (a.RBI||0)*0.5 + (a.HR||0)))[0];
  const card = (label, p, value) => p ? `<div class="award-card">
    <p class="eyebrow">${label}</p>
    ${recPhotoMarkup(p.team, p.name) || ""}
    <h3>${escapeHtml(p.name)}</h3>
    <p class="muted">${escapeHtml(p.team || "-")}</p>
    <p class="award-value">${value}</p>
  </div>` : `<div class="award-card"><p class="eyebrow">${label}</p><p class="muted">자격자 없음</p></div>`;
  return `
    <div class="award-grid">
      ${card("MVP", mvp, mvp ? `OPS ${mvp.OPS.toFixed(3)} · ${mvp.HR}홈런 · ${mvp.RBI}타점` : "")}
      ${card("타율왕", batChamp, batChamp ? batChamp.AVG.toFixed(3) : "")}
      ${card("홈런왕", hrChamp, hrChamp ? `${hrChamp.HR}홈런` : "")}
      ${card("타점왕", rbiChamp, rbiChamp ? `${rbiChamp.RBI}타점` : "")}
      ${card("평균자책점왕", eraChamp, eraChamp ? `ERA ${eraChamp.ERA.toFixed(2)}` : "")}
      ${card("다승왕", winChamp, winChamp ? `${winChamp.W||0}승` : "")}
      ${card("탈삼진왕", kChamp, kChamp ? `${kChamp.SO}K` : "")}
    </div>`;
}

function teamStrength(teamName) {
  const roster = window.fullcountGame?.getTeamRoster?.(teamName);
  if (!roster) return { offense: 70, defense: 70 };
  const offense = roster.batters.reduce((s, b) => s + (b.power * 0.55 + b.contact * 0.35 + b.speed * 0.1), 0) / Math.max(1, roster.batters.length);
  const defense = roster.pitchers.reduce((s, p) => s + (p.velocity * 0.4 + p.control * 0.4 + p.breaking * 0.2), 0) / Math.max(1, roster.pitchers.length);
  return { offense, defense };
}

function simulateLeagueMatch(league, home, away) {
  const homeAdv = 0.05;
  const hStr = teamStrength(home);
  const aStr = teamStrength(away);
  // Differential: home offense vs away defense, and vice-versa
  const homeEdge = (hStr.offense - aStr.defense) / 160; // -0.2..0.2 typical
  const awayEdge = (aStr.offense - hStr.defense) / 160;

  // Probability that an inning produces ≥1 run for a given side
  const scoreInningProb = (edge, advantage) => Math.max(0.06, Math.min(0.62, 0.30 + edge * 0.7 + advantage));

  // Given the inning scored, distribution of runs (tone-matched to user games: 1-2 most common)
  const inningRunsIfScored = (edge) => {
    const r = Math.random() - Math.max(0, edge) * 0.35;
    if (r > 0.78) return 4 + (Math.random() < 0.25 ? 1 : 0);
    if (r > 0.60) return 3;
    if (r > 0.34) return 2;
    return 1;
  };

  let homeScore = 0, awayScore = 0;
  for (let i = 0; i < league.innings; i++) {
    if (Math.random() < scoreInningProb(homeEdge, homeAdv)) homeScore += inningRunsIfScored(homeEdge);
    if (Math.random() < scoreInningProb(awayEdge, 0)) awayScore += inningRunsIfScored(awayEdge);
  }
  // Break ties
  let guard = 0;
  while (homeScore === awayScore && guard++ < 6) {
    const flip = Math.random() < 0.5 + homeAdv + homeEdge * 0.4;
    if (flip) homeScore += 1; else awayScore += 1;
  }
  return { homeScore, awayScore };
}

function recordSimulatedMatch(league, matchIdx, sim) {
  const m = league.schedule[matchIdx];
  m.result = { home: m.home, away: m.away, homeScore: sim.homeScore, awayScore: sim.awayScore, date: new Date().toISOString() };
  const homeS = league.standings[m.home];
  const awayS = league.standings[m.away];
  homeS.G += 1; awayS.G += 1;
  homeS.RS += sim.homeScore; homeS.RA += sim.awayScore;
  awayS.RS += sim.awayScore; awayS.RA += sim.homeScore;
  if (sim.homeScore > sim.awayScore) { homeS.W += 1; awayS.L += 1; }
  else if (sim.homeScore < sim.awayScore) { homeS.L += 1; awayS.W += 1; }
  else { homeS.T += 1; awayS.T += 1; }
  simulatePlayerStats(league, m.home, sim.homeScore, sim.awayScore > sim.homeScore);
  simulatePlayerStats(league, m.away, sim.awayScore, sim.homeScore > sim.awayScore);
}

function simulatePlayerStats(league, teamName, runs, lost) {
  const roster = window.fullcountGame?.getTeamRoster?.(teamName);
  if (!roster) return;
  league.batters = league.batters || {};
  league.pitchers = league.pitchers || {};
  const innings = league.innings;
  for (const b of roster.batters) {
    const s = league.batters[b.name] = league.batters[b.name] || { team: teamName, AB:0,H:0,HR:0,RBI:0,R:0,BB:0,SO:0,"2B":0,"3B":0,TB:0,SF:0,G:0 };
    const AB = Math.max(1, Math.round(innings * 0.45 + Math.random() * 1.4));
    const hitProb = clampLeague((b.contact || 70) / 280 + 0.18);
    const hrProb = clampLeague((b.power || 70) / 1100);
    let H = 0, HR = 0, TB = 0, SO = 0, BB = 0, RBI = 0;
    for (let i = 0; i < AB; i++) {
      const r = Math.random();
      if (r < hrProb) { H++; HR++; TB += 4; RBI += 1; }
      else if (r < hitProb) {
        H++;
        const t = Math.random();
        if (t < 0.15) { TB += 2; s["2B"] += 1; }
        else if (t < 0.18) { TB += 3; s["3B"] += 1; }
        else TB += 1;
        if (Math.random() < 0.32) RBI += 1;
      }
      else if (r > 0.88) SO++;
    }
    if (Math.random() < 0.35) BB += 1;
    s.AB += AB; s.H += H; s.HR += HR; s.TB += TB; s.SO += SO; s.BB += BB;
    s.RBI += Math.min(RBI, Math.max(0, runs));
    s.R += Math.round((H + BB) * (runs / Math.max(innings * 3, 6)));
    s.G += 1;
  }
  for (const p of roster.pitchers) {
    const s = league.pitchers[p.name] = league.pitchers[p.name] || { team: teamName, outs:0,H:0,HR:0,BB:0,SO:0,ER:0,pitches:0,G:0,W:0,L:0 };
    const outs = innings * 3;
    const k9 = clampLeague(((p.velocity || 80) - 60) / 12 + Math.random() * 2 + 4, 4, 14);
    const ip = outs / 3;
    const Kavg = Math.round((k9 * ip) / 9);
    const Hsum = Math.max(0, Math.round((9 - (p.control || 80) / 12) + (Math.random() * 4) - 2 + ip * 0.6));
    const ER = Math.max(0, Math.min(runs * 0.85, runs));
    s.outs += outs; s.SO += Kavg; s.H += Hsum;
    s.BB += Math.round(Math.random() * 3);
    s.HR += Math.round(Math.random() * (ip / 4));
    s.ER += Math.round(ER);
    s.pitches += Math.round(outs * 4 + Math.random() * 10);
    s.G += 1;
    if (lost) s.L += 1; else s.W += 1;
  }
}

function clampLeague(v, min = 0.02, max = 0.95) {
  return Math.max(min, Math.min(max, v));
}

function bindLeague() {
  document.getElementById("leagueCreateForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const selectedTeams = data.getAll("leagueTeams");
    const playerTeams = data.getAll("leaguePlayerTeams").filter((p) => selectedTeams.includes(p));
    const teams = [...new Set(selectedTeams)].filter(Boolean);
    if (teams.length < 2) {
      alert("리그에는 최소 2팀이 필요합니다.");
      return;
    }
    if (playerTeams.length === 0) {
      if (!confirm("직접 조작할 팀이 한 팀도 없습니다. 모두 AI로 진행할까요?")) return;
    }
    createLeague({
      name: data.get("leagueName"),
      teams,
      innings: data.get("leagueInnings"),
      playerTeams,
    });
    renderApp();
  });
  // When a 👤 checkbox is checked, auto-check the team checkbox
  document.querySelectorAll("[data-lg-player-toggle]").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) {
        const teamCb = document.querySelector(`[data-lg-team-toggle][value="${cb.value}"]`);
        if (teamCb) teamCb.checked = true;
      }
    });
  });
  document.querySelectorAll("[data-lg-team-toggle]").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (!cb.checked) {
        const playerCb = document.querySelector(`[data-lg-player-toggle][value="${cb.value}"]`);
        if (playerCb) playerCb.checked = false;
      }
    });
  });
  document.querySelectorAll("[data-lg-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => handleLeagueAction(btn, e));
  });
  document.querySelectorAll("[data-lg-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      authState.leagueTab = btn.dataset.lgTab;
      renderApp();
    });
  });
  bindSortHeaders();
}

function handleLeagueAction(btn, e) {
  const action = btn.dataset.lgAction;
  const id = btn.dataset.lgId;
  if (action === "open") {
    setActiveLeagueId(id);
    authState.leagueTab = "standings";
    renderApp();
    return;
  }
  if (action === "delete") {
    if (!confirm("이 리그를 삭제할까요?")) return;
    const leagues = loadLeagues().filter((l) => l.id !== id);
    saveLeagues(leagues);
    if (activeLeagueId() === id) setActiveLeagueId(null);
    renderApp();
    return;
  }
  if (action === "back") {
    setActiveLeagueId(null);
    renderApp();
    return;
  }
  const activeId = activeLeagueId();
  if (!activeId) return;
  if (action === "sim") {
    const matchIdx = Number(btn.dataset.lgMatch);
    updateLeague(activeId, (l) => {
      const sim = simulateLeagueMatch(l, l.schedule[matchIdx].home, l.schedule[matchIdx].away);
      recordSimulatedMatch(l, matchIdx, sim);
    });
    renderApp();
    return;
  }
  if (action === "simAll") {
    updateLeague(activeId, (l) => {
      const playerTeams = l.playerTeams || [];
      l.schedule.forEach((m, i) => {
        if (m.result) return;
        if (playerTeams.includes(m.home) || playerTeams.includes(m.away)) return;
        const sim = simulateLeagueMatch(l, m.home, m.away);
        recordSimulatedMatch(l, i, sim);
      });
    });
    renderApp();
    return;
  }
  if (action === "play") {
    const matchIdx = Number(btn.dataset.lgMatch);
    const league = getLeague(activeId);
    if (!league) return;
    const m = league.schedule[matchIdx];
    const playerTeams = league.playerTeams || [];
    let userSide = null;
    if (playerTeams.includes(m.home) && playerTeams.includes(m.away)) {
      const pick = prompt(`두 팀 모두 직접 조작 팀입니다. 어느 팀을 조작할까요?\n1: ${m.home}\n2: ${m.away}`, "1");
      userSide = pick === "2" ? m.away : m.home;
    } else if (playerTeams.includes(m.home)) {
      userSide = m.home;
    } else if (playerTeams.includes(m.away)) {
      userSide = m.away;
    }
    window.fullcountGame?.startLeagueMatch?.({ leagueId: activeId, matchIdx, home: m.home, away: m.away, innings: league.innings, userTeam: userSide });
    authState.view = "game";
    renderApp();
  }
}

function bindRecords() {
  document.querySelectorAll("[data-rec-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.recTab;
      if (tab === "reset") {
        if (confirm("시즌 누적 기록(타율·홈런·팀 순위·투수)을 모두 지울까요?")) {
          window.fullcountSeason?.reset?.();
          renderApp();
        }
        return;
      }
      authState.recordsTab = tab;
      renderApp();
    });
  });
  bindSortHeaders();
}

function bindSortHeaders() {
  document.querySelectorAll("[data-sort-key]").forEach((th) => {
    th.addEventListener("click", () => {
      const ctx = th.dataset.sortCtx;
      const key = th.dataset.sortKey;
      const def = th.dataset.sortDefault || "desc";
      const cur = getSort(ctx);
      if (cur.key === key) cur.dir = cur.dir === "desc" ? "asc" : "desc";
      else { cur.key = key; cur.dir = def; }
      renderApp();
    });
  });
}

function settingsTemplate() {
  const d = authState.settings.difficulty || "normal";
  return `
    <div class="auth-card">
      <p class="eyebrow">SETTINGS</p>
      <h2>설정</h2>
      <form id="settingsForm" class="settings-grid">
        <label><input type="checkbox" name="showImpact" ${authState.settings.showImpact ? "checked" : ""} /> 임팩트 흔들림</label>
        <label><input type="checkbox" name="autoFullscreenHint" ${authState.settings.autoFullscreenHint ? "checked" : ""} /> 전체화면 안내 유지</label>
        <label><input type="checkbox" name="reducedMotion" ${authState.settings.reducedMotion ? "checked" : ""} /> 연출 줄이기</label>
        <label style="grid-column:1/-1">
          AI 난이도
          <select name="difficulty" style="margin-left:10px;min-height:36px;border:2px solid #050505;background:#fffaf4;font:inherit;font-weight:800;padding:4px 8px">
            <option value="easy"   ${d === "easy"   ? "selected" : ""}>쉬움 — AI가 많이 실수</option>
            <option value="normal" ${d === "normal" ? "selected" : ""}>보통 — 기본값</option>
            <option value="hard"   ${d === "hard"   ? "selected" : ""}>어려움 — AI가 잘 침</option>
            <option value="expert" ${d === "expert" ? "selected" : ""}>극한 — AI가 거의 못 막음</option>
          </select>
        </label>
        <button class="primary" type="submit">저장</button>
      </form>
      ${authState.message ? `<p class="auth-message">${escapeHtml(authState.message)}</p>` : ""}
    </div>`;
}

function bindSettings() {
  document.getElementById("settingsForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    authState.settings = {
      showImpact: data.has("showImpact"),
      autoFullscreenHint: data.has("autoFullscreenHint"),
      reducedMotion: data.has("reducedMotion"),
      difficulty: data.get("difficulty") || "normal",
    };
    localStorage.setItem("fullcount:settings", JSON.stringify(authState.settings));
    authState.message = "설정 저장 완료.";
    renderApp();
  });
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem("fullcount:settings")) || defaultSettings();
  } catch {
    return defaultSettings();
  }
}

function defaultSettings() {
  return { showImpact: true, autoFullscreenHint: true, reducedMotion: false, difficulty: "normal" };
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw };
  }
  if (!response.ok) throw new Error(data.message || data.error || `요청 실패 (${response.status})`);
  return data;
}

function resultLabel(result) {
  if (result === "win") return "승";
  if (result === "loss") return "패";
  return "무";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
