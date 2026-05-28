const authPanel = document.getElementById("authPanel");
const authButtons = document.querySelectorAll("[data-auth-view]");

const authState = {
  user: null,
  matches: [],
  view: "home",
  message: "",
};

window.fullcountAuth = {
  get user() {
    return authState.user;
  },
  async saveMatch(match) {
    if (!authState.user) return;
    try {
      await api("/api/matches", { method: "POST", body: match });
      await loadRecentMatches();
    } catch {
      authState.message = "경기 저장 실패. 로그인 상태를 확인해줘.";
      renderAuth();
    }
  },
};

initAuth();

async function initAuth() {
  authButtons.forEach((button) => {
    button.addEventListener("click", () => {
      authState.view = button.dataset.authView;
      authState.message = "";
      renderAuth();
    });
  });
  try {
    const data = await api("/api/auth/me");
    authState.user = data.user;
    if (authState.user) await loadRecentMatches();
  } catch {
    authState.user = null;
  }
  renderAuth();
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

function renderAuth() {
  updateNav();
  if (!authPanel) return;
  if (authState.view === "login" && !authState.user) {
    authPanel.innerHTML = loginTemplate();
    bindLoginForms();
    return;
  }
  if (authState.view === "account") {
    authPanel.innerHTML = accountTemplate();
    bindAccount();
    return;
  }
  authPanel.innerHTML = homeTemplate();
}

function updateNav() {
  authButtons.forEach((button) => {
    if (button.dataset.authView === "login") {
      button.textContent = authState.user ? "로그아웃" : "로그인";
      button.onclick = authState.user
        ? async () => {
            await api("/api/auth/logout", { method: "POST" });
            authState.user = null;
            authState.matches = [];
            authState.view = "home";
            authState.message = "로그아웃됨.";
            renderAuth();
          }
        : null;
    }
  });
}

function homeTemplate() {
  const userText = authState.user ? `${escapeHtml(authState.user.username)}님 접속 중` : "로그인하면 경기 기록이 서버에 저장됨";
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
    : "<li><strong>최근 경기 없음</strong><span>한 경기 끝내면 여기에 저장돼.</span></li>";
  return `
    <div class="auth-card">
      <div>
        <p class="eyebrow">HOME</p>
        <h2>풀카운트 온라인</h2>
        <p>${userText}</p>
      </div>
      <ol class="match-list">${recent}</ol>
      ${authState.message ? `<p class="auth-message">${escapeHtml(authState.message)}</p>` : ""}
    </div>`;
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
        <h2>회원가입</h2>
        <label>이메일<input name="email" type="email" autocomplete="email" required /></label>
        <label>닉네임<input name="username" autocomplete="username" required /></label>
        <label>비밀번호<input name="password" type="password" autocomplete="new-password" minlength="6" required /></label>
        <label>응원팀<input name="favoriteTeam" value="KIA" /></label>
        <button type="submit">계정 만들기</button>
      </form>
      ${authState.message ? `<p class="auth-message">${escapeHtml(authState.message)}</p>` : ""}
    </div>`;
}

function accountTemplate() {
  if (!authState.user) {
    return `
      <div class="auth-card">
        <p class="eyebrow">ACCOUNT</p>
        <h2>로그인이 필요함</h2>
        <p>계정 정보와 서버 저장 기록은 로그인 후 볼 수 있어.</p>
      </div>`;
  }
  return `
    <div class="auth-card">
      <form id="accountForm" class="auth-form compact">
        <p class="eyebrow">ACCOUNT</p>
        <h2>${escapeHtml(authState.user.username)}</h2>
        <label>닉네임<input name="username" value="${escapeHtml(authState.user.username)}" required /></label>
        <label>응원팀<input name="favoriteTeam" value="${escapeHtml(authState.user.favoriteTeam || "KIA")}" /></label>
        <button class="primary" type="submit">계정 저장</button>
      </form>
      ${authState.message ? `<p class="auth-message">${escapeHtml(authState.message)}</p>` : ""}
    </div>`;
}

function bindLoginForms() {
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
}

function bindAccount() {
  document.getElementById("accountForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const data = await api("/api/account", { method: "PATCH", body });
      authState.user = data.user;
      authState.message = "계정 저장 완료.";
      renderAuth();
    } catch (error) {
      authState.message = error.message;
      renderAuth();
    }
  });
}

async function submitAuth(path, body, message) {
  try {
    const data = await api(path, { method: "POST", body });
    authState.user = data.user;
    authState.view = "home";
    authState.message = message;
    await loadRecentMatches();
    renderAuth();
  } catch (error) {
    authState.message = error.message;
    renderAuth();
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    method: options.method || "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || "요청 실패");
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
