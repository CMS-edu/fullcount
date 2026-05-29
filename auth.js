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
    : "<li><strong>기록 없음</strong><span>로그인 후 경기를 끝내면 서버에 저장돼.</span></li>";
  return `
    <div class="auth-card">
      <p class="eyebrow">RECORDS</p>
      <h2>최근 경기</h2>
      <ol class="match-list">${recent}</ol>
      ${authState.user ? "" : `<p class="auth-message">로그인하면 경기 기록이 저장돼.</p>`}
    </div>`;
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
