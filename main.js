const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const uiLayer = document.querySelector("#uiLayer");
const actionBar = document.querySelector("#actionBar");

const W = canvas.width;
const H = canvas.height;
const TWO_PI = Math.PI * 2;

const FIELD = {
  home: { x: 480, y: 500 },
  first: { x: 694, y: 336 },
  second: { x: 480, y: 172 },
  third: { x: 266, y: 336 },
  mound: { x: 480, y: 326 },
  plate: { x: 480, y: 492 },
  catcher: { x: 480, y: 522 },
  batter: { x: 535, y: 478 },
  strike: { x: 480, y: 474, w: 126, h: 62 },
  fielders: {
    p: { x: 480, y: 326 },
    c: { x: 480, y: 522 },
    "1B": { x: 704, y: 326 },
    "2B": { x: 564, y: 250 },
    "SS": { x: 396, y: 250 },
    "3B": { x: 256, y: 326 },
    LF: { x: 188, y: 170 },
    CF: { x: 480, y: 128 },
    RF: { x: 772, y: 170 },
  },
};

const pitchCatalog = {
  "직구": { speedModifier: 16, movement: { x: 4, y: -2 }, controlDifficulty: 8, color: "#f4f7ff" },
  "커브": { speedModifier: -24, movement: { x: -18, y: 42 }, controlDifficulty: 18, color: "#ffd36b" },
  "체인지업": { speedModifier: -22, movement: { x: 10, y: 18 }, controlDifficulty: 12, color: "#65d68a" },
  "슬라이더": { speedModifier: -6, movement: { x: -34, y: 8 }, controlDifficulty: 16, color: "#79a8ff" },
  "투심": { speedModifier: 10, movement: { x: 18, y: 18 }, controlDifficulty: 13, color: "#ff9b70" },
  "스위퍼": { speedModifier: -10, movement: { x: -50, y: 5 }, controlDifficulty: 21, color: "#c79bff" },
};

const kiaClub = {
  name: "KIA 타이거즈",
  manager: "이범호",
  stadium: "광주-KIA 챔피언스 필드",
  season: "2026 게임 데이터",
  colors: { main: "#d71920", dark: "#111111", light: "#ffffff" },
  notes: [
    "2026 시즌 공개 엔트리와 보도된 라인업을 참고한 게임용 선수단",
    "김도영/나성범/최형우/위즈덤은 장타, 박찬호/김선빈은 컨택, 박찬호/최원준/김호령은 주루에 강점",
  ],
};

const kiaBatters = [
  batter("박찬호", "SS/2B", "R", 84, 55, 88, 82, "리드오프", "컨택과 작전, 도루 시동"),
  batter("김선빈", "2B/DH", "R", 91, 52, 66, 76, "교타자", "끈질긴 승부와 높은 컨택"),
  batter("김도영", "3B", "R", 86, 94, 93, 60, "슈퍼스타", "장타, 주루, 클러치 모두 상급"),
  batter("최형우", "DH/LF", "L", 83, 91, 38, 34, "해결사", "득점권과 장타 보정"),
  batter("나성범", "RF/DH", "L", 77, 94, 58, 35, "거포", "직구 공략 장타 보정"),
  batter("위즈덤", "1B/3B", "R", 67, 97, 47, 24, "장타 머신", "완벽 타이밍 홈런 보정"),
  batter("이우성", "1B/RF", "R", 73, 76, 60, 48, "찬스", "중거리 타구 안정"),
  batter("김태군", "C", "R", 69, 63, 42, 72, "안방", "번트와 작전 수행"),
  batter("최원준", "CF/RF", "L", 76, 58, 87, 78, "스피드", "1루타 때 추가 진루 확률 증가"),
  batter("윤도현", "2B/3B", "R", 71, 73, 72, 54, "영건", "성장형 밸런스"),
  batter("오선우", "1B/OF", "L", 61, 85, 44, 28, "한 방", "대타 장타형"),
  batter("고종욱", "OF/DH", "L", 79, 55, 77, 66, "대타", "좌투 상대 컨택 안정"),
  batter("한준수", "C", "L", 65, 75, 44, 44, "포수", "포수 장타 옵션"),
  batter("김호령", "CF", "R", 65, 54, 92, 76, "대주자", "도루/수비형"),
  batter("김석환", "1B/OF", "L", 58, 87, 46, 30, "거포 유망주", "뜬공도 장타 확률"),
  batter("황대인", "1B", "R", 64, 83, 38, 22, "파워", "낮은 컨택 높은 장타"),
  batter("홍종표", "IF", "L", 68, 48, 81, 80, "작전", "번트 성공 보정"),
  batter("김규성", "IF", "L", 67, 52, 75, 72, "유틸", "멀티 포지션"),
  batter("변우혁", "1B/3B", "R", 61, 86, 43, 24, "장타", "실투 장타 보정"),
  batter("서건창", "IF/DH", "L", 78, 50, 70, 76, "베테랑", "볼넷 확률 보정"),
  batter("박재현", "OF", "R", 63, 50, 84, 70, "백업", "대주자/대수비"),
  batter("박정우", "OF", "L", 60, 47, 87, 68, "스피드", "도루 후보"),
  batter("이창진", "OF", "R", 73, 62, 70, 60, "출루", "중하위 연결"),
  batter("박민", "SS", "R", 66, 50, 73, 72, "수비형", "하위 타순 안정"),
  batter("데일", "SS/2B", "S", 80, 64, 79, 64, "외국인 테이블세터", "출루와 선구 보정"),
  batter("카스트로", "LF/IF", "L", 75, 78, 63, 40, "외국인 타자", "좌중간 장타"),
  batter("이호연", "1B/IF", "L", 72, 65, 61, 56, "전천후", "컨택형 1루 옵션"),
  batter("주효상", "C", "L", 61, 58, 40, 58, "포수 뎁스", "수비형 포수"),
  batter("한승연", "OF", "R", 62, 60, 74, 62, "외야 뎁스", "백업 외야"),
  batter("박상준", "1B", "R", 60, 72, 42, 28, "우타 1루", "플래툰 파워"),
];

const starters = [
  pitcher("네일", 88, 86, 88, 92, "선발 에이스", ["투심", "스위퍼", "체인지업", "커브"], "R", "무브먼트와 땅볼 유도"),
  pitcher("올러", 91, 76, 74, 88, "외국인 선발", ["직구", "슬라이더", "체인지업", "커브"], "R", "구위형 선발"),
  pitcher("양현종", 78, 90, 82, 94, "베테랑 선발", ["직구", "슬라이더", "체인지업", "커브"], "L", "제구와 완급 조절"),
  pitcher("김도현", 86, 72, 70, 82, "파워 선발", ["직구", "슬라이더", "투심", "커브"], "R", "빠른 공 중심"),
  pitcher("윤영철", 74, 86, 78, 84, "좌완 선발", ["직구", "체인지업", "슬라이더", "커브"], "L", "체인지업 타이밍 빼앗기"),
  pitcher("김건국", 76, 78, 66, 78, "대체 선발", ["직구", "커브", "체인지업", "투심"], "R", "긴 이닝 백업"),
  pitcher("선동열", 96, 94, 96, 99, "레전드", ["직구", "슬라이더", "스위퍼", "커브"], "R", "게임용 레전드 카드"),
  pitcher("이의리", 90, 68, 86, 80, "복귀 좌완", ["직구", "슬라이더", "체인지업", "커브"], "L", "높은 구위, 흔들리는 제구"),
  pitcher("황동하", 82, 76, 70, 78, "젊은 선발", ["직구", "슬라이더", "투심", "체인지업"], "R", "성장형 로테이션"),
  pitcher("김시훈", 84, 75, 76, 76, "스윙맨", ["직구", "슬라이더", "체인지업", "커브"], "R", "선발/불펜 겸업"),
];

const bullpenGroups = {
  "필승조": [
    pitcher("조상우", 94, 78, 84, 70, "필승조", ["직구", "슬라이더", "커브"], "R", "강한 직구"),
    pitcher("전상현", 88, 82, 80, 68, "필승조", ["직구", "슬라이더", "체인지업"], "R", "위기 관리"),
  ],
  "승리조": [
    pitcher("최지민", 86, 77, 86, 64, "승리조", ["직구", "슬라이더", "커브"], "L", "좌완 변화구"),
    pitcher("이준영", 80, 84, 78, 62, "승리조", ["직구", "슬라이더", "체인지업"], "L", "좌타 상대"),
    pitcher("성영탁", 84, 76, 75, 62, "승리조", ["직구", "투심", "슬라이더"], "R", "중간 계투"),
  ],
  "추격조": [
    pitcher("김대유", 78, 80, 72, 60, "추격조", ["직구", "슬라이더", "체인지업"], "L", "좌완 추격"),
    pitcher("임기영", 77, 84, 80, 66, "추격조", ["직구", "체인지업", "커브"], "R", "롱릴리프"),
    pitcher("홍원빈", 85, 70, 68, 58, "추격조", ["직구", "슬라이더", "투심"], "R", "구위형"),
    pitcher("김현수", 81, 76, 74, 58, "추격조", ["직구", "커브", "체인지업"], "L", "좌완 뎁스"),
    pitcher("김범수", 87, 70, 82, 56, "추격조", ["직구", "슬라이더", "커브"], "L", "게임용 좌완 파워"),
    pitcher("홍민규", 83, 72, 70, 54, "추격조", ["직구", "슬라이더", "체인지업"], "R", "추격 불펜"),
  ],
  "패전조": [
    pitcher("윤중현", 76, 78, 68, 56, "패전조", ["직구", "슬라이더", "커브"], "R", "이닝 소화"),
    pitcher("김민주", 82, 68, 72, 55, "패전조", ["직구", "투심", "슬라이더"], "R", "젊은 불펜"),
  ],
  "원포인트": [pitcher("이호민", 78, 82, 76, 48, "원포인트", ["직구", "슬라이더", "체인지업"], "L", "좌타 원포인트")],
  "마무리": [pitcher("정해영", 91, 82, 88, 64, "마무리", ["직구", "슬라이더", "스위퍼"], "R", "9회 마무리")],
};

const aiTeams = [
  opponentTeam("삼성", "박진만", "대구", ["김지찬", "이재현", "구자욱", "디아즈", "강민호", "김영웅", "류지혁", "김헌곤", "전병우"], ["원태인", "후라도", "레예스"], ["김재윤", "임창민", "이승현", "오승환"], "#1d62ad"),
  opponentTeam("LG", "염경엽", "잠실", ["홍창기", "문성주", "김현수", "오스틴", "문보경", "오지환", "박동원", "신민재", "박해민"], ["임찬규", "손주영", "치리노스"], ["유영찬", "김진성", "함덕주", "정우영"], "#c3042f"),
  opponentTeam("한화", "김경문", "대전", ["문현빈", "페라자", "노시환", "채은성", "안치홍", "하주석", "최재훈", "이진영", "황영묵"], ["류현진", "폰세", "문동주"], ["주현상", "김서현", "한승혁", "박상원"], "#f37321"),
  opponentTeam("두산", "조성환", "잠실", ["정수빈", "허경민", "양의지", "김재환", "양석환", "강승호", "라모스", "박준영", "조수행"], ["곽빈", "최원준", "브랜든"], ["홍건희", "김택연", "이영하", "최지강"], "#111111"),
  opponentTeam("롯데", "김태형", "사직", ["윤동희", "고승민", "전준우", "레이예스", "나승엽", "손호영", "박승욱", "유강남", "황성빈"], ["박세웅", "반즈", "나균안"], ["김원중", "구승민", "최준용", "진해수"], "#002955"),
  opponentTeam("키움", "설종진", "고척", ["이주형", "송성문", "도슨", "김혜성", "최주환", "김웅빈", "김건희", "김태진", "이용규"], ["후라도", "헤이수스", "조영건"], ["문성현", "김재웅", "하영민", "주승우"], "#862633"),
  opponentTeam("KT", "이강철", "수원", ["김민혁", "강백호", "로하스", "문상철", "장성우", "황재균", "배정대", "오윤석", "심우준"], ["고영표", "쿠에바스", "엄상백"], ["박영현", "김민수", "손동현", "우규민"], "#111111"),
  opponentTeam("SSG", "이숭용", "인천", ["최지훈", "추신수", "최정", "에레디아", "한유섬", "박성한", "고명준", "이지영", "김성현"], ["김광현", "앤더슨", "오원석"], ["문승원", "노경은", "조병현", "서진용"], "#cf0a2c"),
  opponentTeam("NC", "이호준", "창원", ["박민우", "손아섭", "박건우", "데이비슨", "권희동", "김휘집", "서호철", "김형준", "김주원"], ["하트", "신민혁", "이재학"], ["이용찬", "류진욱", "임정호", "김시훈"], "#1f5aa6"),
];

const defaultLineupNames = ["박찬호", "김선빈", "김도영", "최형우", "나성범", "위즈덤", "이우성", "김태군", "최원준"];

const game = {
  state: "intro",
  playPhase: "대기",
  inning: 1,
  half: "top",
  userScore: 0,
  aiScore: 0,
  outs: 0,
  balls: 0,
  strikes: 0,
  bases: { first: null, second: null, third: null },
  battingOrderIndex: 0,
  aiBattingOrderIndex: 0,
  currentBatter: null,
  currentPitcher: null,
  aiPitcher: null,
  pitchType: "직구",
  pitchSpeed: 0,
  pitchMovement: { x: 0, y: 0 },
  ball: makeBall(),
  hitBall: null,
  fielders: [],
  bat: { angle: -0.6, neutral: -0.6, held: false, contacted: false, attempted: false, spin: 0 },
  aiBat: { neutral: -0.78, angle: -0.78, timer: 0, duration: 0.34 },
  lastContact: null,
  swingPower: 0,
  swingTiming: 0,
  resultText: "",
  resultTimer: 0,
  resultDuration: 1.2,
  resultNext: null,
  isPitching: false,
  isSwinging: false,
  isBallInPlay: false,
  stamina: 100,
  selectedLineup: [],
  selectedPitcher: null,
  selectedPitch: "직구",
  combo: 0,
  aiTeam: null,
  buntMode: false,
  paused: false,
  record: { bestScore: 0, recent: null },
  uiSignature: "",
  pitchDelay: 0.75,
  aiSwingPoint: 0.78,
  warning: "",
  impact: { timer: 0, shake: 0, color: "#ffffff" },
};

let lastTime = 0;

function batter(name, position, bats, contact, power, speed, bunt, nickname, note) {
  const seed = nameSeed(name);
  return {
    name,
    position,
    bats,
    contact,
    power,
    speed,
    bunt,
    nickname,
    note,
    eye: clamp(Math.round(contact * 0.58 + bunt * 0.22 + (seed % 18)), 35, 96),
    launch: clamp(Math.round(power * 0.55 + speed * 0.12 + ((seed >> 2) % 24)), 32, 98),
    pull: ((seed % 21) - 10) / 100,
  };
}

function pitcher(name, velocity, control, breaking, stamina, role, pitches, hand = "R", note = "") {
  const seed = nameSeed(name);
  const roleType = stamina >= 74 ? "starter" : "bullpen";
  const maxStamina =
    roleType === "starter"
      ? clamp(Math.round(92 + (stamina - 84) * 0.85 + (seed % 9)), 82, 112)
      : clamp(Math.round(28 + (stamina - 55) * 0.45 + (seed % 7)), 20, 42);
  return {
    name,
    velocity,
    control,
    breaking,
    stamina: maxStamina,
    maxStamina,
    role,
    roleType,
    pitches: [...new Set(pitches)],
    hand,
    note,
    stuff: clamp(Math.round((velocity + breaking) / 2 + ((seed % 13) - 6)), 45, 99),
    composure: clamp(Math.round(control * 0.75 + stamina * 0.18 + (seed % 10)), 45, 98),
    fatigueRate: roleType === "starter" ? 0.86 + (seed % 7) / 20 : 1.02 + (seed % 7) / 14,
    speedVariance: 5 + (seed % 7),
  };
}

function opponentTeam(name, manager, stadium, batterNames, starterNames, bullpenNames, color) {
  const batters = batterNames.map((playerName, i) =>
    batter(
      playerName,
      ["CF", "2B", "3B", "1B", "DH", "SS", "C", "LF", "RF"][i],
      i % 3 === 0 ? "L" : "R",
      64 + ((name.charCodeAt(0) + i * 6) % 24),
      56 + ((name.charCodeAt(0) + i * 9) % 36),
      52 + ((name.charCodeAt(0) + i * 5) % 35),
      38 + ((name.charCodeAt(0) + i * 7) % 34),
      `${name} ${i + 1}번`,
      "상대 라인업 데이터"
    )
  );
  const startersForTeam = starterNames.map((playerName, i) =>
    pitcher(
      playerName,
      78 + ((name.charCodeAt(0) + i * 7) % 18),
      72 + ((name.charCodeAt(0) + i * 5) % 22),
      70 + ((name.charCodeAt(0) + i * 8) % 24),
      78 + ((name.charCodeAt(0) + i * 6) % 20),
      "상대 선발",
      [
        ["직구", "슬라이더", "체인지업", "커브"],
        ["직구", "투심", "스위퍼", "체인지업"],
        ["직구", "커브", "슬라이더", "투심"],
      ][i % 3],
      i % 2 ? "L" : "R",
      `${name} 선발진`
    )
  );
  const bullpen = bullpenNames.map((playerName, i) =>
    pitcher(
      playerName,
      80 + ((name.charCodeAt(0) + i * 6) % 16),
      68 + ((name.charCodeAt(0) + i * 4) % 24),
      70 + ((name.charCodeAt(0) + i * 7) % 22),
      48 + ((name.charCodeAt(0) + i * 5) % 18),
      i === 0 ? "마무리" : "불펜",
      [
        ["직구", "슬라이더", "스위퍼"],
        ["직구", "커브", "체인지업"],
        ["직구", "투심", "슬라이더"],
        ["직구", "체인지업", "스위퍼"],
      ][i % 4],
      i % 2 ? "L" : "R",
      `${name} 불펜`
    )
  );
  return { name, manager, stadium, color, batters, starters: startersForTeam, bullpen };
}

function nameSeed(name) {
  return [...String(name)].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 0);
}

function makeBall() {
  return {
    active: false,
    mode: "batting",
    x: FIELD.mound.x,
    y: FIELD.mound.y,
    start: { ...FIELD.mound },
    end: { ...FIELD.plate },
    t: 0,
    duration: 0.9,
    inZone: true,
    decisionMade: false,
    pitchType: "직구",
    speed: 140,
    movement: { x: 0, y: 0 },
  };
}

function createFielders() {
  return Object.entries(FIELD.fielders).map(([label, pos]) => ({
    label,
    x: pos.x,
    y: pos.y,
    homeX: pos.x,
    homeY: pos.y,
    targetX: pos.x,
    targetY: pos.y,
    speed: label === "CF" || label === "LF" || label === "RF" ? 150 : 190,
    active: false,
    hasBall: false,
  }));
}

function init() {
  loadRecord();
  setupTeams();
  resetGame(false);
  bindInput();
  const quick = new URLSearchParams(location.search).get("quick");
  if (quick) quickStart(quick);
  renderUI(true);
  requestAnimationFrame(gameLoop);
}

function resetGame(toIntro = true) {
  game.state = toIntro ? "intro" : game.state;
  game.playPhase = "대기";
  game.inning = 1;
  game.half = "top";
  game.userScore = 0;
  game.aiScore = 0;
  game.outs = 0;
  game.balls = 0;
  game.strikes = 0;
  game.bases = { first: null, second: null, third: null };
  game.battingOrderIndex = 0;
  game.aiBattingOrderIndex = 0;
  game.selectedLineup = loadSavedLineup();
  game.selectedPitcher = loadSavedPitcher();
  game.currentPitcher = game.selectedPitcher ? clonePitcher(game.selectedPitcher) : null;
  game.aiPitcher = clonePitcher(selectOpponentStarter());
  game.ball = makeBall();
  game.hitBall = null;
  game.fielders = createFielders();
  game.bat = { angle: -0.6, neutral: -0.6, held: false, contacted: false, attempted: false, spin: 0 };
  game.aiBat = { neutral: -0.78, angle: -0.78, timer: 0, duration: 0.34 };
  game.lastContact = null;
  game.swingPower = 0;
  game.resultText = "";
  game.resultTimer = 0;
  game.pitchDelay = 0.75;
  game.buntMode = false;
  game.paused = false;
  syncCurrentMatchup();
  renderUI(true);
}

function setupTeams() {
  game.aiTeam = aiTeams[randomInt(0, aiTeams.length - 1)];
  game.aiPitcher = clonePitcher(selectOpponentStarter());
}

function setupLineup() {
  game.state = "lineupSelect";
  if (!game.selectedLineup.length) {
    game.selectedLineup = defaultLineupNames.map((name) => kiaBatters.find((b) => b.name === name));
  }
  renderUI(true);
}

function selectPitcher(selected) {
  game.selectedPitcher = clonePitcher(selected);
  game.currentPitcher = clonePitcher(selected);
  localStorage.setItem("fullcount:selectedPitcher", selected.name);
  startGame();
}

function startGame() {
  game.state = "batting";
  game.playPhase = "투구 대기";
  game.half = "top";
  game.aiPitcher = clonePitcher(selectOpponentStarter());
  resetCount();
  syncCurrentMatchup();
  prepareBattingPitch();
  renderUI(true);
}

function quickStart(mode) {
  game.selectedLineup = defaultLineupNames.map((name) => kiaBatters.find((b) => b.name === name));
  game.selectedPitcher = clonePitcher(starters[0]);
  game.currentPitcher = clonePitcher(starters[0]);
  game.aiPitcher = clonePitcher(selectOpponentStarter());
  startGame();
  if (mode === "pitching") {
    switchHalfInning(true);
    game.state = "pitching";
    game.selectedPitch = game.currentPitcher.pitches[0];
  }
}

function gameLoop(timestamp) {
  const deltaTime = Math.min(0.05, (timestamp - lastTime || 16) / 1000);
  lastTime = timestamp;
  update(deltaTime);
  draw();
  renderUI();
  requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
  if (game.paused) return;
  if (game.impact.timer > 0) game.impact.timer = Math.max(0, game.impact.timer - deltaTime);
  if (game.state === "intro") updateIntro(deltaTime);
  if (game.state === "batting") updateBatting(deltaTime);
  if (game.state === "pitching") updatePitching(deltaTime);
  if (game.state === "result") updateResult(deltaTime);
  if (game.state === "inningChange") updateInningChange(deltaTime);
  updateBat(deltaTime);
  updateAIBat(deltaTime);
  updateHitBall(deltaTime);
  updateFielders(deltaTime);
}

function updateIntro() {}

function updateBatting(deltaTime) {
  if (!game.ball.active) {
    game.playPhase = "투구 대기";
    game.pitchDelay -= deltaTime;
    if (game.pitchDelay <= 0) startPitch(chooseAIPitch(), "batting");
    return;
  }
  updateBall(deltaTime);
  if (game.ball.active && game.bat.held) game.bat.attempted = true;
  if (game.ball.active && game.bat.held && !game.bat.contacted && isSwingInContactWindow()) {
    swingBat();
  }
  if (game.ball.active && game.ball.t >= 1) resolveTakenPitch("batting");
}

function updatePitching(deltaTime) {
  if (!game.ball.active) {
    game.playPhase = "구종 선택";
    return;
  }
  updateBall(deltaTime);
  if (!game.ball.decisionMade && game.ball.t >= game.aiSwingPoint) {
    game.ball.decisionMade = true;
    const aiSwung = chooseAISwing();
    if (aiSwung) triggerAIBatSwing();
    if (aiSwung) resolvePitchingResult(true);
  }
  if (game.ball.active && game.ball.t >= 1) resolveTakenPitch("pitching");
}

function updateResult(deltaTime) {
  game.resultTimer -= deltaTime;
  if (game.resultTimer <= 0) {
    const next = game.resultNext;
    game.resultNext = null;
    if (typeof next === "function") next();
  }
}

function updateInningChange(deltaTime) {
  updateResult(deltaTime);
}

function updateBat(deltaTime) {
  if (game.bat.held) {
    game.bat.spin += deltaTime * 11.2;
    game.bat.angle = game.bat.neutral + game.bat.spin;
    game.swingPower = clamp(game.swingPower + deltaTime * 58, 15, 100);
    return;
  }
  game.swingPower = Math.max(0, game.swingPower - deltaTime * 90);
  const diff = normalizeAngle(game.bat.neutral - game.bat.angle);
  game.bat.angle += diff * clamp(deltaTime * 16, 0, 1);
  if (Math.abs(diff) < 0.02) {
    game.bat.angle = game.bat.neutral;
    game.bat.spin = 0;
  }
}

function updateAIBat(deltaTime) {
  if (!game.aiBat) return;
  if (game.aiBat.timer > 0) {
    game.aiBat.timer = Math.max(0, game.aiBat.timer - deltaTime);
    const progress = 1 - game.aiBat.timer / game.aiBat.duration;
    const swing = Math.sin(progress * Math.PI);
    game.aiBat.angle = game.aiBat.neutral - swing * 1.25;
    return;
  }
  game.aiBat.angle += (game.aiBat.neutral - game.aiBat.angle) * clamp(deltaTime * 12, 0, 1);
}

function triggerAIBatSwing() {
  game.aiBat.timer = game.aiBat.duration;
  game.aiBat.angle = game.aiBat.neutral;
}

function updateBall(deltaTime) {
  const ball = game.ball;
  ball.prevX = ball.x;
  ball.prevY = ball.y;
  ball.t = clamp(ball.t + deltaTime / ball.duration, 0, 1);
  const p = getPitchPoint(ball, ball.t);
  ball.x = p.x;
  ball.y = p.y;
}

function updateHitBall(deltaTime) {
  if (!game.hitBall) return;
  game.hitBall.t = clamp(game.hitBall.t + deltaTime / game.hitBall.duration, 0, 1);
  if (game.hitBall.t >= 1 && game.playPhase === "타구 처리") {
    game.playPhase = "판정 대기";
  }
}

function updateFielders(deltaTime) {
  for (const fielder of game.fielders) {
    const dx = fielder.targetX - fielder.x;
    const dy = fielder.targetY - fielder.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) {
      fielder.x = fielder.targetX;
      fielder.y = fielder.targetY;
      continue;
    }
    const step = Math.min(dist, fielder.speed * deltaTime);
    fielder.x += (dx / dist) * step;
    fielder.y += (dy / dist) * step;
  }
}

function draw() {
  const shake = game.impact.timer > 0 ? game.impact.shake * (game.impact.timer / 0.45) : 0;
  ctx.save();
  if (shake > 0) ctx.translate(randomInt(-shake, shake), randomInt(-shake, shake));
  if (["intro", "lineupSelect", "pitcherSelect", "bullpen", "gameOver"].includes(game.state)) {
    drawMenuBackdrop();
    if (game.state === "gameOver") drawGameOver();
    ctx.restore();
    return;
  }
  drawField();
  drawScoreboard();
  if (game.state === "batting") drawBatting();
  if (game.state === "pitching") drawPitching();
  if (game.state === "result" || game.state === "inningChange") {
    if (game.half === "top") drawBatting();
    else drawPitching();
    drawResult();
  }
  ctx.restore();
}

function drawMenuBackdrop() {
  ctx.fillStyle = "#171717";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#d71920";
  ctx.fillRect(0, 0, W, 72);
  ctx.fillStyle = "#2f7d49";
  ctx.fillRect(0, 360, W, 180);
  ctx.fillStyle = "#c98242";
  ctx.beginPath();
  ctx.moveTo(480, 438);
  ctx.lineTo(650, 330);
  ctx.lineTo(480, 224);
  ctx.lineTo(310, 330);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = "#fff4df";
  ctx.font = "900 82px Segoe UI";
  ctx.textAlign = "center";
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = 8;
  ctx.strokeText("FULL COUNT", W / 2, 190);
  ctx.fillText("FULL COUNT", W / 2, 190);
  ctx.fillStyle = "#d71920";
  ctx.fillRect(300, 218, 360, 14);
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = 4;
  ctx.strokeRect(300, 218, 360, 14);
}

function drawField() {
  ctx.fillStyle = "#275a35";
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let x = -100; x < W + 140; x += 86) {
    ctx.fillStyle = x % 172 === 0 ? "#3b8a50" : "#22623a";
    ctx.fillRect(x, 76, 50, H);
  }
  ctx.restore();

  ctx.fillStyle = "#347f49";
  ctx.beginPath();
  ctx.moveTo(32, 76);
  ctx.lineTo(928, 76);
  ctx.lineTo(862, 230);
  ctx.quadraticCurveTo(480, 124, 98, 230);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(168,92,42,0.76)";
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(FIELD.home.x, FIELD.home.y, 430, -2.36, -0.78);
  ctx.stroke();

  ctx.fillStyle = "#b77438";
  ctx.beginPath();
  ctx.moveTo(FIELD.home.x, FIELD.home.y);
  ctx.lineTo(FIELD.first.x, FIELD.first.y);
  ctx.lineTo(FIELD.second.x, FIELD.second.y);
  ctx.lineTo(FIELD.third.x, FIELD.third.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#2f7d49";
  ctx.beginPath();
  ctx.moveTo(FIELD.home.x, FIELD.home.y - 55);
  ctx.lineTo(FIELD.first.x - 58, FIELD.first.y);
  ctx.lineTo(FIELD.second.x, FIELD.second.y + 54);
  ctx.lineTo(FIELD.third.x + 58, FIELD.third.y);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#c98744";
  ctx.beginPath();
  ctx.arc(FIELD.home.x, FIELD.home.y, 44, 0, TWO_PI);
  ctx.fill();

  ctx.fillStyle = "#d29352";
  ctx.beginPath();
  ctx.arc(FIELD.mound.x, FIELD.mound.y, 30, 0, TWO_PI);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(FIELD.home.x, FIELD.home.y);
  ctx.lineTo(72, 118);
  ctx.moveTo(FIELD.home.x, FIELD.home.y);
  ctx.lineTo(888, 118);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.88)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(FIELD.home.x, FIELD.home.y);
  ctx.lineTo(FIELD.first.x, FIELD.first.y);
  ctx.lineTo(FIELD.second.x, FIELD.second.y);
  ctx.lineTo(FIELD.third.x, FIELD.third.y);
  ctx.closePath();
  ctx.stroke();

  drawBase(FIELD.first, "1B", Boolean(game.bases.first));
  drawBase(FIELD.second, "2B", Boolean(game.bases.second));
  drawBase(FIELD.third, "3B", Boolean(game.bases.third));
  drawDefensePositions();
  drawPlate();
  drawPitcher();
  drawCatcher();
}

function drawScoreboard() {
  ctx.save();
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, 76);
  ctx.fillStyle = "#d71920";
  ctx.fillRect(0, 0, W, 10);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 74, W, 3);

  ctx.fillStyle = "#fff";
  ctx.font = "900 29px Segoe UI";
  ctx.textAlign = "left";
  ctx.fillText(`KIA ${game.userScore} - ${game.aiScore} ${game.aiTeam.name}`, 22, 38);
  ctx.fillStyle = "#f4c24d";
  ctx.font = "900 16px Segoe UI";
  ctx.fillText(`${game.inning}회 ${game.half === "top" ? "초" : "말"} · ${game.playPhase}`, 24, 64);

  const batter = game.currentBatter?.name || "-";
  const pitcherName = (game.half === "top" ? game.aiPitcher : game.currentPitcher)?.name || "-";
  ctx.textAlign = "right";
  ctx.fillStyle = "#fff";
  ctx.font = "900 16px Segoe UI";
  ctx.fillText(`타자 ${batter}`, 936, 30);
  ctx.fillText(`투수 ${pitcherName} · ${game.pitchType} ${game.pitchSpeed || "-"}km/h`, 936, 56);
  drawMiniBases(680, 33);
  drawCountDots(300, 32);
  ctx.restore();
  drawGameHUD();
}

function drawGameHUD() {
  const batter = game.currentBatter;
  const pitcherObj = game.half === "top" ? game.aiPitcher : game.currentPitcher;
  ctx.save();
  ctx.fillStyle = "#050505";
  ctx.fillRect(16, 84, 928, 50);
  ctx.fillStyle = "#d71920";
  ctx.fillRect(16, 84, 928, 5);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 84, 928, 50);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(330, 88);
  ctx.lineTo(330, 131);
  ctx.moveTo(630, 88);
  ctx.lineTo(630, 131);
  ctx.stroke();

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillStyle = "#f4c24d";
  ctx.font = "900 12px Segoe UI";
  ctx.fillText(game.half === "top" ? "공격" : "수비", 34, 100);
  ctx.fillStyle = "#fff";
  ctx.font = "900 20px Segoe UI";
  ctx.fillText(batter?.name || "-", 34, 120);
  ctx.font = "800 12px Segoe UI";
  ctx.fillStyle = "#d7d7d7";
  ctx.fillText(`컨택 ${batter?.contact || "-"}  파워 ${batter?.power || "-"}  주력 ${batter?.speed || "-"}`, 158, 120);

  ctx.textAlign = "center";
  ctx.fillStyle = "#d71920";
  ctx.font = "900 13px Segoe UI";
  ctx.fillText("PLAY", 480, 100);
  ctx.fillStyle = "#fff";
  ctx.font = "900 22px Segoe UI";
  ctx.fillText(game.resultText || game.playPhase, 480, 120);

  ctx.textAlign = "right";
  ctx.fillStyle = "#f4c24d";
  ctx.font = "900 12px Segoe UI";
  ctx.fillText("마운드", 926, 100);
  ctx.fillStyle = "#fff";
  ctx.font = "900 20px Segoe UI";
  ctx.fillText(pitcherObj?.name || "-", 926, 120);
  ctx.font = "800 12px Segoe UI";
  ctx.fillStyle = "#d7d7d7";
  ctx.fillText(`체력 ${Math.round(pitcherObj?.stamina || 0)}  제구 ${pitcherObj?.control || "-"}  변화 ${pitcherObj?.breaking || "-"}`, 795, 120);
  ctx.restore();
}

function drawBatting() {
  drawBatter();
  drawBall();
  drawHitBall();
  if (!game.ball.active && game.state === "batting") {
    drawCenterHint("투수가 준비 중");
  }
}

function drawPitching() {
  drawBatter(true);
  drawBall();
  drawHitBall();
  if (!game.ball.active && game.state === "pitching") {
    drawCenterHint(`${game.selectedPitch} 선택됨`);
  }
}

function drawBullpen() {}

function drawResult() {
  if (!game.resultText) return;
  ctx.save();
  const isBig = game.resultText.includes("홈런") || game.resultText.includes("만루");
  const boxW = isBig ? 430 : 340;
  const boxH = isBig ? 74 : 58;
  const boxX = W / 2 - boxW / 2;
  const boxY = 154;
  ctx.fillStyle = isBig ? "#d71920" : "#050505";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = isBig ? "#ffd34d" : "#ffffff";
  ctx.lineWidth = isBig ? 6 : 4;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = isBig ? "#ffd34d" : "#fff";
  ctx.strokeStyle = "#141414";
  ctx.lineWidth = 4;
  ctx.font = `900 ${isBig ? 54 : 40}px Segoe UI`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeText(game.resultText, W / 2, boxY + boxH / 2 + 1);
  ctx.fillText(game.resultText, W / 2, boxY + boxH / 2 + 1);
  ctx.restore();
}

function drawGameOver() {
  drawMenuBackdrop();
  ctx.fillStyle = "#fff";
  ctx.font = "900 42px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(`나 ${game.userScore} - ${game.aiScore} AI`, W / 2, 278);
}

function drawPitcher() {
  const p = FIELD.mound;
  const throwProgress = game.ball.active ? Math.min(1, game.ball.t * 2.2) : 0;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-Math.PI / 2 + throwProgress * 0.9);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-13, 2);
  ctx.lineTo(-22, 12);
  ctx.moveTo(13, 2);
  ctx.lineTo(22, 12);
  ctx.stroke();
  ctx.strokeStyle = "#f8f0df";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-12, -4);
  ctx.lineTo(-20 + throwProgress * 28, -17 - throwProgress * 12);
  ctx.moveTo(12, -4);
  ctx.lineTo(20, 8);
  ctx.stroke();
  ctx.fillStyle = game.half === "bottom" ? "#d71920" : game.aiTeam.color || "#1c355e";
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 9px Segoe UI";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("P", 0, 0);
  ctx.fillStyle = "#f8f0df";
  ctx.beginPath();
  ctx.arc(0, -20, 7, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawCatcher() {
  const c = FIELD.catcher;
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.fillStyle = "#202020";
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = "#d71920";
  ctx.beginPath();
  ctx.arc(0, -11, 6, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawBatter(isAi = false) {
  const b = FIELD.batter;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(isAi ? Math.PI * 1.05 : Math.PI * 0.72);
  ctx.fillStyle = "#f7e8d0";
  ctx.beginPath();
  ctx.arc(0, -14, 6, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = isAi ? "#27405f" : "#d71920";
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = "#f7e8d0";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.lineTo(-18, -8);
  ctx.moveTo(10, -4);
  ctx.lineTo(17, -8);
  ctx.stroke();
  ctx.strokeStyle = "#202020";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-7, 15);
  ctx.lineTo(-13, 21);
  ctx.moveTo(7, 15);
  ctx.lineTo(13, 21);
  ctx.stroke();

  const angle = isAi ? game.aiBat.angle : game.bat.angle;
  ctx.rotate(angle);
  ctx.lineCap = "butt";
  ctx.fillStyle = "#3b210f";
  ctx.fillRect(2, -3, 16, 6);
  ctx.fillStyle = "#f4f4f4";
  ctx.fillRect(6, -4, 3, 8);
  ctx.fillRect(12, -4, 3, 8);
  ctx.fillStyle = "#b66b2c";
  ctx.strokeStyle = "#1c1008";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(18, -4);
  ctx.lineTo(62, -6);
  ctx.lineTo(84, -8);
  ctx.lineTo(88, 0);
  ctx.lineTo(84, 8);
  ctx.lineTo(62, 6);
  ctx.lineTo(18, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e1a254";
  ctx.fillRect(62, -5, 18, 10);
  ctx.strokeStyle = "#1c1008";
  ctx.lineWidth = 2;
  ctx.strokeRect(62, -5, 18, 10);
  ctx.fillStyle = "#1c1008";
  ctx.fillRect(0, -5, 5, 10);
  ctx.restore();
}

function drawPlate() {
  const p = FIELD.plate;
  const zone = FIELD.strike;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(p.x - 13, p.y - 7);
  ctx.lineTo(p.x + 13, p.y - 7);
  ctx.lineTo(p.x + 11, p.y + 7);
  ctx.lineTo(p.x, p.y + 16);
  ctx.lineTo(p.x - 11, p.y + 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(20,20,20,0.45)";
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(zone.x - zone.w / 2, zone.y);
  ctx.lineTo(zone.x + zone.w / 2, zone.y);
  ctx.stroke();
  ctx.strokeStyle = "#d71920";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(zone.x - zone.w / 2, zone.y);
  ctx.lineTo(zone.x + zone.w / 2, zone.y);
  ctx.stroke();
  ctx.lineCap = "butt";
}

function drawBase(pos, label, occupied) {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = occupied ? "#f4c24d" : "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.fillRect(-7, -7, 14, 14);
  ctx.strokeRect(-7, -7, 14, 14);
  ctx.restore();
  ctx.fillStyle = "#102016";
  ctx.font = "900 10px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(label, pos.x, pos.y + (label === "2B" ? -17 : 21));
}

function drawDefensePositions() {
  game.fielders.forEach((fielder) => {
    if (fielder.label === "p" || fielder.label === "c") return;
    const color = getFielderColor(fielder);
    ctx.save();
    ctx.translate(fielder.x, fielder.y);

    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(0, 11, 14, 5, 0, 0, TWO_PI);
    ctx.fill();

    ctx.strokeStyle = "#f3dfbf";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(-13, 7);
    ctx.moveTo(7, 0);
    ctx.lineTo(14, 5);
    ctx.moveTo(-4, 10);
    ctx.lineTo(-8, 15);
    ctx.moveTo(4, 10);
    ctx.lineTo(8, 15);
    ctx.stroke();

    ctx.fillStyle = color.body;
    ctx.beginPath();
    ctx.roundRect?.(-10, -8, 20, 22, 6);
    if (!ctx.roundRect) roundRect(-10, -8, 20, 22, 6);
    ctx.fill();

    ctx.fillStyle = color.cap;
    ctx.beginPath();
    ctx.arc(0, -14, 7, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = "#f3dfbf";
    ctx.beginPath();
    ctx.arc(0, -12, 4, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = fielder.hasBall ? "#ffffff" : color.glove;
    ctx.beginPath();
    ctx.arc(14, 4, fielder.hasBall ? 5 : 4, 0, TWO_PI);
    ctx.fill();

    if (fielder.active) {
      ctx.strokeStyle = "#ffd34d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, TWO_PI);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(0,0,0,0.72)";
    roundRect(-17, 17, 34, 14, 4);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 8px Segoe UI";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(fielder.label, 0, 24);
    ctx.restore();
  });
}

function getFielderColor(fielder) {
  const kiaDefense = game.half === "bottom";
  const base = kiaDefense ? "#d71920" : game.aiTeam.color || "#27405f";
  if (["1B", "3B"].includes(fielder.label)) return { body: base, cap: "#111111", glove: "#b77233" };
  if (["2B", "SS"].includes(fielder.label)) return { body: "#f7f7f7", cap: base, glove: "#b77233" };
  return { body: base, cap: "#f7f7f7", glove: "#b77233" };
}

function drawBall() {
  if (!game.ball.active) return;
  const ball = game.ball;
  ctx.save();
  ctx.strokeStyle = ball.color || pitchCatalog[ball.pitchType].color;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.65;
  ctx.beginPath();
  for (let i = 0; i <= 16; i += 1) {
    const t = Math.min(ball.t, (ball.t * i) / 16);
    const p = getPitchPoint(ball, t);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, 8, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = "#d71920";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawHitBall() {
  if (!game.hitBall) return;
  const h = game.hitBall;
  const p = quadraticPoint(h.start, h.peak, h.end, h.t);
  ctx.save();
  ctx.strokeStyle = h.color;
  ctx.lineWidth = 5;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  for (let i = 0; i <= 22; i += 1) {
    const t = Math.min(h.t, (h.t * i) / 22);
    const point = quadraticPoint(h.start, h.peak, h.end, t);
    if (i === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 7, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawMiniBases(x, y) {
  const spots = [
    { key: "second", x, y: y - 16 },
    { key: "third", x: x - 20, y: y + 6 },
    { key: "first", x: x + 20, y: y + 6 },
  ];
  for (const spot of spots) {
    ctx.save();
    ctx.translate(spot.x, spot.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = game.bases[spot.key] ? "#f4c24d" : "#fff";
    ctx.fillRect(-7, -7, 14, 14);
    ctx.restore();
  }
}

function drawCountDots(x, y) {
  const rows = [
    ["B", game.balls, 3, "#60d394"],
    ["S", game.strikes, 2, "#f4c24d"],
    ["O", game.outs, 2, "#d71920"],
  ];
  ctx.save();
  ctx.font = "900 12px Segoe UI";
  ctx.textAlign = "left";
  rows.forEach((row, rowIndex) => {
    const [label, count, max, color] = row;
    const yy = y + rowIndex * 15;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, x, yy + 4);
    for (let i = 0; i < max; i += 1) {
      ctx.fillStyle = i < count ? color : "rgba(255,255,255,0.24)";
      ctx.beginPath();
      ctx.arc(x + 24 + i * 14, yy, 5, 0, TWO_PI);
      ctx.fill();
    }
  });
  ctx.restore();
}

function drawPlayerInfoPanels() {
  const batter = game.currentBatter;
  const pitcherObj = game.half === "top" ? game.aiPitcher : game.currentPitcher;
  drawInfoCard(22, 102, "타자", batter, [
    `포지션 ${batter?.position || "-"}`,
    `컨택 ${batter?.contact || "-"} · 파워 ${batter?.power || "-"}`,
    `주루 ${batter?.speed || "-"} · 번트 ${batter?.bunt || "-"}`,
  ]);
  drawInfoCard(700, 102, "투수", pitcherObj, [
    `${pitcherObj?.role || "-"} · ${pitcherObj?.hand || "R"}HP`,
    `구속 ${pitcherObj?.velocity || "-"} · 제구 ${pitcherObj?.control || "-"}`,
    `변화 ${pitcherObj?.breaking || "-"} · 체력 ${Math.round(pitcherObj?.stamina || 0)}`,
  ]);
}

function drawInfoCard(x, y, title, person, lines) {
  ctx.save();
  ctx.fillStyle = "rgba(255,250,244,0.9)";
  roundRect(x, y, 238, 106, 8);
  ctx.fill();
  ctx.fillStyle = "#d71920";
  ctx.font = "900 13px Segoe UI";
  ctx.textAlign = "left";
  ctx.fillText(title, x + 14, y + 24);
  ctx.fillStyle = "#141414";
  ctx.font = "900 20px Segoe UI";
  ctx.fillText(person?.name || "-", x + 14, y + 49);
  ctx.font = "800 12px Segoe UI";
  lines.forEach((line, index) => ctx.fillText(line, x + 14, y + 70 + index * 16));
  ctx.restore();
}

function drawCenterHint(text) {
  ctx.save();
  ctx.fillStyle = "#fff4df";
  ctx.fillRect(W / 2 - 150, 146, 300, 44);
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = 4;
  ctx.strokeRect(W / 2 - 150, 146, 300, 44);
  ctx.fillStyle = "#141414";
  ctx.font = "900 22px Segoe UI";
  ctx.textAlign = "center";
  ctx.fillText(text, W / 2, 175);
  ctx.restore();
}

function startPitch(pitchType, mode) {
  if (mode === "batting" && game.aiPitcher.stamina <= 0) autoChangeAIPitcher();
  if (mode === "pitching" && game.currentPitcher.stamina <= 0) {
    game.warning = "투수 체력 0 - 교체 필요";
    showResult("투수 교체 필요!", 0.9, () => {
      game.state = "bullpen";
      renderUI(true);
    });
    return;
  }

  const pitcherObj = mode === "batting" ? game.aiPitcher : game.currentPitcher;
  const batterObj = mode === "batting" ? game.currentBatter : getAIBatter();
  pitchType = chooseFatiguedPitch(pitcherObj, pitchType);
  const fatigue = getFatigueLevel(pitcherObj);
  const speed = calculatePitchSpeed(pitcherObj, pitchType);
  const movement = calculatePitchMovement(pitcherObj, pitchType, batterObj);
  const controlChance = clamp(
    (pitcherObj.control + getStaminaPercent(pitcherObj) * 24 - pitchCatalog[pitchType].controlDifficulty - fatigue * 48) / 100,
    0.06,
    0.9
  );
  const mistakeChance = clamp((fatigue - 0.58) * 1.18, 0, 0.52);
  const plannedStrike = Math.random() < controlChance;
  const mistake = Math.random() < mistakeChance;
  const zone = FIELD.strike;
  let end;
  if (mistake) {
    end = {
      x: zone.x + randomInt(-15, 15),
      y: zone.y + randomInt(-10, 10),
    };
    movement.x *= 0.35;
    movement.y *= 0.35;
  } else if (plannedStrike) {
    end = {
      x: clamp(zone.x + movement.x * 0.18 + randomInt(-24, 24), zone.x - zone.w / 2 + 10, zone.x + zone.w / 2 - 10),
      y: clamp(zone.y + movement.y * 0.12 + randomInt(-18, 18), zone.y - zone.h / 2 + 8, zone.y + zone.h / 2 - 8),
    };
  } else {
    const missSide = randomInt(0, 3);
    const missX = randomInt(28, 96 + Math.round(fatigue * 46));
    const missY = randomInt(22, 72 + Math.round(fatigue * 32));
    end = {
      x:
        missSide === 0
          ? zone.x - zone.w / 2 - missX
          : missSide === 1
            ? zone.x + zone.w / 2 + missX
            : zone.x + randomInt(-Math.floor(zone.w / 2), Math.floor(zone.w / 2)),
      y:
        missSide === 2
          ? zone.y - zone.h / 2 - missY
          : missSide === 3
            ? zone.y + zone.h / 2 + missY
            : zone.y + randomInt(-Math.floor(zone.h / 2), Math.floor(zone.h / 2)),
    };
  }
  const inZone = isPointInStrikeZone(end);
  game.pitchType = pitchType;
  game.pitchSpeed = speed;
  game.pitchMovement = movement;
  game.ball = {
    active: true,
    mode,
    x: FIELD.mound.x,
    y: FIELD.mound.y,
    start: { ...FIELD.mound },
    end,
    t: 0,
    duration: clamp(0.68 - (speed - 122) / 185 + randomInt(-6, 6) / 100, 0.22, 0.58),
    inZone,
    mistake,
    decisionMade: false,
    pitchType,
    speed,
    movement,
    color: pitchCatalog[pitchType].color,
  };
  game.bat.contacted = false;
  game.isPitching = true;
  game.playPhase = mode === "batting" ? "공 날아옴" : "투구 중";
  decreasePitcherStamina(pitcherObj);
}

function swingBat() {
  if (game.state !== "batting" || !game.ball.active || game.bat.contacted) return;
  game.bat.contacted = true;
  game.isSwinging = true;
  game.playPhase = "스윙 판정";
  resolveBattingResult();
}

function resolveBattingResult() {
  const ball = game.ball;
  const batter = game.currentBatter;
  const contact = game.lastContact || getBatBallContact();
  const contactQuality = contact ? (contact.quality * 0.65 + contact.sweetSpot * 0.35) : 0;
  const timingDiff = Math.abs(ball.t - 0.84) * 82 + (1 - contactQuality) * 26;
  const timingBonus = clamp(70 - timingDiff * 1.35, -30, 70);
  const pitchDifficulty = ball.speed * 0.22 + Math.abs(ball.movement.x) * 0.32 + Math.abs(ball.movement.y) * 0.16 + game.aiPitcher.control * 0.12;
  const contactScore = batter.contact + timingBonus + contactQuality * 24 - pitchDifficulty * 0.36 + randomInt(-10, 14);
  const powerScore = batter.power + game.swingPower * 0.72 + contactQuality * 18 - pitchDifficulty * 0.18 + randomInt(-14, 16);
  game.swingTiming = Math.round(100 - timingDiff);
  game.ball.active = false;

  if (timingDiff > 58 || contactScore < 38) {
    if (Math.random() < 0.68) {
      addStrike("파울!", true);
      startHitAnimation("파울", 145, "#f7f7f7");
      return;
    }
    applyHitResult("땅볼아웃");
    return;
  }
  if (timingDiff > 38 || contactScore < 55) {
    if (Math.random() < 0.42) {
      addStrike("파울!", true);
      startHitAnimation("파울", 180, "#f7f7f7");
      return;
    }
    applyHitResult(powerScore > 88 || Math.random() < 0.42 ? "플라이아웃" : "땅볼아웃");
    return;
  }

  const result = chooseBattedBallResult({
    batter,
    contact,
    contactQuality,
    contactScore,
    powerScore,
    timingDiff,
  });
  applyHitResult(result);
}

function chooseBattedBallResult({ batter, contact, contactQuality, contactScore, powerScore, timingDiff }) {
  const basesLoaded = game.bases.first && game.bases.second && game.bases.third;
  const hasForceAtSecond = game.bases.first && game.outs < 2;
  const roll = Math.random();
  const sweet = contactQuality > 0.74 && timingDiff < 16 && contactScore > 82;
  const weak = contactQuality < 0.4 || contactScore < 62 || timingDiff > 38;
  const jammed = contact?.along < 0.38 || contactQuality < 0.36;
  const under = contact?.along > 0.88 || (powerScore > 96 && contactQuality < 0.58);
  const launchBoost = (batter.launch - 60) / 120;

  if (game.buntMode) {
    if (batter.bunt + randomInt(-20, 25) > 70) return "번트안타";
    return hasForceAtSecond && roll < 0.28 ? "병살타" : "땅볼아웃";
  }

  if (contactQuality < 0.22) return "파울";
  if (hasForceAtSecond && jammed && roll < 0.34) return "병살타";
  if (jammed) return roll < 0.5 ? "땅볼아웃" : roll < 0.78 ? "파울" : "1루타";
  if (under) return roll < 0.5 - launchBoost ? "플라이아웃" : roll < 0.72 ? "파울" : "1루타";
  if (hasForceAtSecond && weak && roll < 0.28) return "병살타";
  if (weak) {
    if (roll < 0.34) return "땅볼아웃";
    if (roll < 0.62) return "플라이아웃";
    if (roll < 0.84) return "1루타";
    return "파울";
  }

  if (sweet && powerScore > 134 && roll < 0.62) return basesLoaded ? "만루홈런" : "홈런";
  if (sweet && powerScore > 116 && batter.speed > 72 && roll < 0.18) return "3루타";
  if (sweet && powerScore > 102 && roll < 0.5) return "2루타";

  if (hasForceAtSecond && contactScore < 76 && roll < 0.18) return "병살타";
  if (contactQuality < 0.58 && roll < 0.28) return powerScore > 98 ? "플라이아웃" : "땅볼아웃";
  if (powerScore > 126 && contactScore > 82 && roll < 0.18) return "홈런";
  if (powerScore > 104 && contactScore > 76 && roll < 0.3) return "2루타";
  if (powerScore > 108 && batter.speed > 78 && roll < 0.10) return "3루타";
  return roll < 0.66 ? "1루타" : roll < 0.84 ? "파울" : powerScore > 94 ? "플라이아웃" : "땅볼아웃";
}

function isSwingInContactWindow() {
  if (!game.ball.active) return false;
  const contact = getBatBallContact();
  game.lastContact = contact;
  return Boolean(contact);
}

function getBatImpactDiff() {
  const phase = ((game.bat.spin % TWO_PI) + TWO_PI) % TWO_PI;
  const impactPhase = 0.78;
  return Math.abs(normalizeAngle(phase - impactPhase));
}

function getContactReach() {
  if (!game.ball.active) return 0;
  const dx = Math.abs(game.ball.x - FIELD.strike.x);
  const dy = Math.abs(game.ball.y - FIELD.strike.y);
  const reachX = game.buntMode ? 82 : 88;
  const reachY = game.buntMode ? 64 : 62;
  const xScore = 1 - dx / reachX;
  const yScore = 1 - dy / reachY;
  return clamp(Math.min(xScore, yScore), 0, 1);
}

function getBatBallContact() {
  if (!game.ball.active || !game.bat.held) return null;
  const segment = getBatWorldSegment();
  const projected = getSweptBallBatContact(segment);
  const collisionRadius = game.buntMode ? 18 : 15;
  if (projected.distance > collisionRadius) return null;
  return {
    distance: projected.distance,
    along: projected.along,
    quality: clamp(1 - projected.distance / collisionRadius, 0, 1),
    sweetSpot: clamp(1 - Math.abs(projected.along - 0.72) / 0.5, 0, 1),
  };
}

function getSweptBallBatContact(segment) {
  const start = {
    x: Number.isFinite(game.ball.prevX) ? game.ball.prevX : game.ball.x,
    y: Number.isFinite(game.ball.prevY) ? game.ball.prevY : game.ball.y,
  };
  const end = { x: game.ball.x, y: game.ball.y };
  let best = projectPointToSegment(end, segment.start, segment.end);
  const steps = 5;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const point = {
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
    };
    const projected = projectPointToSegment(point, segment.start, segment.end);
    if (projected.distance < best.distance) best = projected;
  }
  return best;
}

function getBatWorldSegment() {
  const origin = FIELD.batter;
  const rotation = Math.PI * 0.72 + game.bat.angle;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    start: {
      x: origin.x + cos * 8,
      y: origin.y + sin * 8,
    },
    end: {
      x: origin.x + cos * 84,
      y: origin.y + sin * 84,
    },
  };
}

function projectPointToSegment(point, start, end) {
  const vx = end.x - start.x;
  const vy = end.y - start.y;
  const wx = point.x - start.x;
  const wy = point.y - start.y;
  const lengthSq = vx * vx + vy * vy || 1;
  const along = clamp((wx * vx + wy * vy) / lengthSq, 0, 1);
  const px = start.x + vx * along;
  const py = start.y + vy * along;
  return {
    along,
    distance: Math.hypot(point.x - px, point.y - py),
  };
}

function isPointInStrikeZone(point) {
  const zone = FIELD.strike;
  return (
    point.x >= zone.x - zone.w / 2 &&
    point.x <= zone.x + zone.w / 2 &&
    point.y >= zone.y - zone.h / 2 &&
    point.y <= zone.y + zone.h / 2
  );
}

function resolvePitchingResult(aiSwung) {
  if (!aiSwung) return resolveTakenPitch("pitching");
  game.playPhase = "AI 스윙";
  const ball = game.ball;
  const batter = getAIBatter();
  const timingDiff = Math.abs(ball.t - game.aiSwingPoint) * 100;
  const fatigue = getFatigueLevel(game.currentPitcher);
  const pitchDifficulty = ball.speed * 0.17 + Math.abs(ball.movement.x) * 0.34 + game.currentPitcher.breaking * 0.26 - fatigue * 34;
  const contactScore = batter.contact + batter.eye * 0.18 + randomInt(-18, 18) - pitchDifficulty * 0.4;
  const powerScore = batter.power + batter.launch * 0.12 + randomInt(-15, 15) - pitchDifficulty * 0.2;
  game.ball.active = false;

  if (timingDiff > 44 || contactScore < 42) {
    addStrike("AI 헛스윙!");
    return;
  }
  if (contactScore < 57 || Math.random() < 0.22) {
    addStrike("파울!", true);
    startHitAnimation("파울", 150, "#f7f7f7");
    return;
  }
  let result = "1루타";
  if (powerScore > 126 && Math.random() < 0.25 + fatigue * 0.14) result = "홈런";
  else if (powerScore > 106 && Math.random() < 0.34) result = "2루타";
  else if (game.bases.first && game.outs < 2 && contactScore < 72 && Math.random() < 0.24) result = "병살타";
  else if (contactScore < 64 || Math.random() < 0.14) result = powerScore > 92 || Math.random() < 0.45 ? "플라이아웃" : "땅볼아웃";
  applyHitResult(result);
}

function resolveTakenPitch(mode) {
  const ball = game.ball;
  game.ball.active = false;
  game.playPhase = mode === "batting" ? "지켜봄 판정" : "AI 지켜봄";
  if (mode === "batting" && game.bat.attempted) {
    addStrike("헛스윙!");
    return;
  }
  if (ball.inZone) addStrike(mode === "batting" ? "스트라이크!" : "루킹 스트라이크!");
  else addBall("볼!");
}

function applyHitResult(result) {
  game.buntMode = false;
  const runner = runnerFromCurrentBatter();
  const isOffense = game.half === "top";
  const label = isOffense ? result : result.includes("아웃") || result === "병살타" ? result : `${result} 허용`;

  if (result === "파울") {
    addStrike("파울!", true);
    startHitAnimation("파울", 160, "#f7f7f7");
    return;
  }
  if (result === "땅볼아웃" || result === "플라이아웃") {
    startHitAnimation(result, result === "플라이아웃" ? 300 : 150, result === "플라이아웃" ? "#ffffff" : "#e6d0a5");
    if (result === "플라이아웃" && game.bases.third && game.outs < 2 && Math.random() < 0.35) {
      game.bases.third = null;
      scoreRun(1);
      recordOut(1, "희생플라이!");
      return;
    }
    recordOut(1, `${label}!`);
    return;
  }
  if (result === "병살타") {
    startHitAnimation("병살타", 140, "#e6d0a5");
    if (game.bases.first) game.bases.first = null;
    recordOut(Math.min(2, 3 - game.outs), "병살타!");
    return;
  }
  const bases = result === "2루타" ? 2 : result === "3루타" ? 3 : result === "홈런" || result === "만루홈런" ? 4 : 1;
  startHitAnimation(result, bases === 4 ? 520 : 190 + bases * 80, bases === 4 ? "#ffd34d" : "#fff");
  advanceRunners(bases, runner);
  finishPlateAppearance(`${label}!`);
}

function advanceRunners(basesToAdvance, batterRunner) {
  if (basesToAdvance >= 4) {
    let runs = 1;
    for (const key of ["first", "second", "third"]) {
      if (game.bases[key]) runs += 1;
      game.bases[key] = null;
    }
    scoreRun(runs);
    return;
  }
  const order = [
    ["third", 3],
    ["second", 2],
    ["first", 1],
  ];
  const next = { first: null, second: null, third: null };
  let runs = 0;
  for (const [key, baseNo] of order) {
    const runner = game.bases[key];
    if (!runner) continue;
    const target = baseNo + basesToAdvance;
    if (target >= 4) runs += 1;
    else if (target === 3) next.third = runner;
    else if (target === 2) next.second = runner;
    else next.first = runner;
  }
  if (basesToAdvance === 3) next.third = batterRunner;
  if (basesToAdvance === 2) next.second = batterRunner;
  if (basesToAdvance === 1) next.first = batterRunner;
  game.bases = next;
  scoreRun(runs);
}

function walkBatter() {
  const runner = runnerFromCurrentBatter();
  let runs = 0;
  if (game.bases.first && game.bases.second && game.bases.third) runs += 1;
  if (game.bases.first && game.bases.second) game.bases.third = game.bases.second;
  if (game.bases.first) game.bases.second = game.bases.first;
  game.bases.first = runner;
  scoreRun(runs);
  finishPlateAppearance(runs ? "밀어내기 볼넷!" : "볼넷!");
}

function recordOut(count, text) {
  game.outs = clamp(game.outs + count, 0, 3);
  resetCount();
  nextBatter();
  showResult(text, 1.15, () => {
    if (game.outs >= 3) switchHalfInning();
    else resumeHalf();
  });
}

function nextBatter() {
  if (game.half === "top") game.battingOrderIndex = (game.battingOrderIndex + 1) % game.selectedLineup.length;
  else game.aiBattingOrderIndex = (game.aiBattingOrderIndex + 1) % game.aiTeam.batters.length;
  syncCurrentMatchup();
}

function finishPlateAppearance(text) {
  resetCount();
  nextBatter();
  showResult(text, text.includes("홈런") ? 1.8 : 1.15, () => {
    if (game.outs >= 3) switchHalfInning();
    else resumeHalf();
  });
}

function switchHalfInning(forceBottom = false) {
  resetCount();
  game.outs = 0;
  game.bases = { first: null, second: null, third: null };
  if (forceBottom || game.half === "top") {
    game.half = "bottom";
    game.state = "inningChange";
    game.playPhase = "공수교대";
    showResult(`${game.inning}회 말`, 1.0, () => {
      game.state = "pitching";
      game.playPhase = "구종 선택";
      game.selectedPitch = game.currentPitcher.pitches[0];
      syncCurrentMatchup();
      renderUI(true);
    });
  } else {
    game.inning += 1;
    if (checkGameEnd()) return;
    game.half = "top";
    game.state = "inningChange";
    game.playPhase = "공수교대";
    showResult(`${game.inning}회 초`, 1.0, () => {
      game.state = "batting";
      prepareBattingPitch();
      syncCurrentMatchup();
      renderUI(true);
    });
  }
}

function checkGameEnd() {
  if (game.inning <= 9) return false;
  if (game.userScore === game.aiScore && game.inning <= 10) return false;
  game.state = "gameOver";
  saveRecord();
  renderUI(true);
  return true;
}

function chooseAIPitch() {
  const pitches = game.aiPitcher.pitches;
  return pitches[randomInt(0, pitches.length - 1)];
}

function chooseAISwing() {
  const batter = getAIBatter();
  const zoneBias = game.ball.inZone ? 0.34 : -0.26;
  const countBias = game.strikes >= 2 ? 0.18 : game.balls >= 3 ? -0.08 : 0;
  const fatigue = getFatigueLevel(game.currentPitcher);
  const difficulty = pitchCatalog[game.pitchType].controlDifficulty / 100 + Math.abs(game.pitchMovement.x) / 170 - fatigue * 0.22;
  const chance = clamp(0.27 + batter.contact / 260 + batter.eye / 420 + zoneBias + countBias - difficulty, 0.06, 0.9);
  return Math.random() < chance;
}

function calculatePitchSpeed(pitcherObj, pitchType) {
  const fatigue = getFatigueLevel(pitcherObj);
  const staminaPenalty = fatigue * fatigue * 18;
  const raw = 132 + pitcherObj.velocity * 0.45 + pitchCatalog[pitchType].speedModifier + pitcherObj.stuff * 0.08 - staminaPenalty + randomInt(-pitcherObj.speedVariance, pitcherObj.speedVariance);
  return Math.round(clamp(raw, 108, 174));
}

function calculatePitchMovement(pitcherObj, pitchType, batterObj) {
  const base = pitchCatalog[pitchType].movement;
  const fatigue = getFatigueLevel(pitcherObj);
  const pitcherBoost = pitcherObj.breaking / 100 - fatigue * 0.28;
  const batterRead = batterObj.contact / 280 + batterObj.eye / 520;
  return {
    x: base.x * (0.78 + pitcherBoost) - batterRead * 7 + randomInt(-6, 6),
    y: base.y * (0.74 + pitcherBoost) + randomInt(-5, 5),
  };
}

function decreasePitcherStamina(pitcherObj = game.currentPitcher) {
  if (!pitcherObj) return;
  const cost = (Math.random() < 0.18 ? 2 : 1) * pitcherObj.fatigueRate;
  pitcherObj.stamina = clamp(pitcherObj.stamina - cost, 0, pitcherObj.maxStamina);
  if (pitcherObj === game.currentPitcher) {
    game.stamina = pitcherObj.stamina;
    if (getStaminaPercent(pitcherObj) <= 0.18) game.warning = "투수 교체 필요!";
  }
}

function getStaminaPercent(pitcherObj) {
  if (!pitcherObj?.maxStamina) return 0;
  return clamp(pitcherObj.stamina / pitcherObj.maxStamina, 0, 1);
}

function getFatigueLevel(pitcherObj) {
  return 1 - getStaminaPercent(pitcherObj);
}

function chooseFatiguedPitch(pitcherObj, pitchType) {
  if (!pitcherObj.pitches.includes(pitchType)) pitchType = pitcherObj.pitches[0];
  const fatigue = getFatigueLevel(pitcherObj);
  const hasFastball = pitcherObj.pitches.includes("직구");
  if (pitcherObj.stamina <= 0 && hasFastball) return "직구";
  if (fatigue > 0.86 && hasFastball && Math.random() < 0.62) return "직구";
  if (fatigue > 0.72 && pitchCatalog[pitchType].controlDifficulty > 17 && hasFastball && Math.random() < 0.35) return "직구";
  return pitchType;
}

function autoChangeAIPitcher() {
  const next = game.aiTeam.bullpen.find((p) => p.stamina > 0 && p.name !== game.aiPitcher?.name) || game.aiTeam.bullpen[0];
  if (!next) return;
  game.aiPitcher = clonePitcher(next);
  game.resultText = `${game.aiTeam.name} 투수 교체`;
}

function changePitcher(newPitcher) {
  game.currentPitcher = clonePitcher(newPitcher);
  game.selectedPitch = game.currentPitcher.pitches[0];
  game.warning = "";
  localStorage.setItem("fullcount:selectedPitcher", newPitcher.name);
  showResult(`${newPitcher.name} 등판!`, 1.0, () => {
    game.state = "pitching";
    renderUI(true);
  });
}

function prepareBattingPitch() {
  game.state = "batting";
  game.playPhase = "투구 대기";
  game.pitchDelay = 0.6 + Math.random() * 0.55;
  game.ball = makeBall();
  game.hitBall = null;
  resetFielderTargets(true);
  game.bat.contacted = false;
  game.bat.attempted = false;
  game.bat.held = false;
  game.bat.angle = game.bat.neutral;
  game.bat.spin = 0;
  game.lastContact = null;
  game.buntMode = false;
}

function resumeHalf() {
  if (game.half === "top") prepareBattingPitch();
  else {
    game.state = "pitching";
    game.playPhase = "구종 선택";
    game.ball = makeBall();
    game.hitBall = null;
    resetFielderTargets(true);
  }
  syncCurrentMatchup();
  renderUI(true);
}

function addStrike(text, foul = false) {
  if (!foul || game.strikes < 2) game.strikes += 1;
  const isThird = game.strikes >= 3;
  if (isThird) {
    game.strikes = 0;
    recordOut(1, "삼진!");
    return;
  }
  showResult(text, 0.85, resumeHalf);
}

function addBall(text) {
  game.balls += 1;
  if (game.balls >= 4) {
    walkBatter();
    return;
  }
  showResult(text, 0.85, resumeHalf);
}

function scoreRun(count) {
  if (game.half === "top") game.userScore += count;
  else game.aiScore += count;
}

function startHitAnimation(result, distance, color) {
  game.playPhase = "타구 처리";
  const pull = game.currentBatter?.bats === "L" ? -1 : 1;
  const right = Math.random() < 0.55 ? pull : -pull;
  const target = chooseFieldingTarget(result, distance, right);
  game.impact = {
    timer: result.includes("홈런") ? 0.45 : 0.28,
    shake: result.includes("홈런") ? 10 : result === "파울" ? 2 : 5,
    color,
  };
  game.hitBall = {
    t: 0,
    duration: result.includes("홈런") ? 1.5 : 1.0,
    start: { ...FIELD.plate },
    peak: target.peak,
    end: target.end,
    color,
    result,
  };
  sendFielderToBall(target.end, result);
}

function chooseFieldingTarget(result, distance, direction) {
  if (result === "땅볼아웃" || result === "병살타") {
    const lane = result === "병살타" ? FIELD.fielders.SS : direction > 0 ? FIELD.fielders["2B"] : FIELD.fielders.SS;
    const end = {
      x: lane.x + randomInt(-22, 22),
      y: lane.y + randomInt(14, 42),
    };
    return {
      end,
      peak: { x: (FIELD.plate.x + end.x) / 2, y: (FIELD.plate.y + end.y) / 2 + 24 },
    };
  }
  if (result === "플라이아웃") {
    const lane = direction > 0 ? FIELD.fielders.RF : FIELD.fielders.LF;
    const end = {
      x: lane.x + randomInt(-34, 34),
      y: lane.y + randomInt(-18, 28),
    };
    return {
      end,
      peak: { x: (FIELD.plate.x + end.x) / 2, y: 72 },
    };
  }
  return {
    end: {
      x: FIELD.plate.x + direction * distance * 0.62,
      y: result.includes("홈런") ? -36 : 160 + Math.random() * 120,
    },
    peak: { x: FIELD.plate.x + direction * distance * 0.28, y: 260 - distance * 0.36 },
  };
}

function sendFielderToBall(target, result) {
  resetFielderTargets(false);
  const candidates =
    result === "플라이아웃" || result.includes("홈런")
      ? game.fielders.filter((f) => ["LF", "CF", "RF"].includes(f.label))
      : game.fielders.filter((f) => ["1B", "2B", "SS", "3B", "p"].includes(f.label));
  const fielder = nearestFielder(candidates, target);
  if (!fielder) return;
  fielder.targetX = target.x;
  fielder.targetY = target.y;
  fielder.active = true;
  fielder.hasBall = result.includes("아웃") || result === "병살타";
}

function nearestFielder(fielders, target) {
  return fielders.reduce((best, fielder) => {
    const dist = Math.hypot(fielder.x - target.x, fielder.y - target.y);
    if (!best || dist < best.dist) return { fielder, dist };
    return best;
  }, null)?.fielder;
}

function resetFielderTargets(moveHome = true) {
  for (const fielder of game.fielders) {
    fielder.active = false;
    fielder.hasBall = false;
    if (moveHome) {
      fielder.targetX = fielder.homeX;
      fielder.targetY = fielder.homeY;
    }
  }
}

function getPitchPoint(ball, t) {
  const mid = {
    x: (ball.start.x + ball.end.x) / 2 + ball.movement.x,
    y: (ball.start.y + ball.end.y) / 2 + ball.movement.y - 18,
  };
  return quadraticPoint(ball.start, mid, ball.end, t);
}

function quadraticPoint(a, b, c, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * b.x + t * t * c.x,
    y: mt * mt * a.y + 2 * mt * t * b.y + t * t * c.y,
  };
}

function handleKeyDown(e) {
  if (e.repeat && e.code === "Space") return;
  if (e.key.toLowerCase() === "r") {
    resetGame(true);
    return;
  }
  if (e.key.toLowerCase() === "f") {
    toggleFullscreen();
    return;
  }
  if (e.key === "Escape") {
    if (document.fullscreenElement) document.exitFullscreen();
    else game.paused = !game.paused;
    renderUI(true);
    return;
  }
  if (game.state === "batting") {
    if (e.code === "Space") {
      e.preventDefault();
      setSwingHeld(true);
    }
    if (e.key.toLowerCase() === "b") game.buntMode = true;
    if (e.key.toLowerCase() === "d") trySteal();
  }
  if (game.state === "pitching") {
    const n = Number(e.key);
    if (n >= 1 && n <= 6) {
      const p = game.currentPitcher.pitches[n - 1];
      if (p) game.selectedPitch = p;
    }
    if (e.code === "Space") {
      e.preventDefault();
      if (!game.ball.active) startPitch(game.selectedPitch, "pitching");
    }
    if (e.key.toLowerCase() === "p") {
      game.state = "bullpen";
      renderUI(true);
    }
  }
}

function handleKeyUp(e) {
  if (e.code === "Space") setSwingHeld(false);
}

function handleMouseClick(e) {
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "start") setupLineup();
  if (action === "defaultLineup") {
    game.selectedLineup = defaultLineupNames.map((name) => kiaBatters.find((b) => b.name === name));
    renderUI(true);
  }
  if (action === "confirmLineup" && game.selectedLineup.length === 9) {
    localStorage.setItem("fullcount:lineup", JSON.stringify(game.selectedLineup.map((b) => b.name)));
    game.state = "pitcherSelect";
    renderUI(true);
  }
  if (action === "toggleBatter") toggleBatter(e.target.closest("[data-batter]").dataset.batter);
  if (action === "selectPitcher") selectPitcher(starters.find((p) => p.name === e.target.closest("[data-pitcher]").dataset.pitcher));
  if (action === "selectBullpen") {
    const name = e.target.closest("[data-bullpen]").dataset.bullpen;
    const found = Object.values(bullpenGroups).flat().find((p) => p.name === name);
    changePitcher(found);
  }
  if (action === "pitch") {
    game.selectedPitch = e.target.closest("[data-pitch]").dataset.pitch;
  }
  if (action === "throw" && game.state === "pitching" && !game.ball.active) startPitch(game.selectedPitch, "pitching");
  if (action === "bullpen") {
    game.state = "bullpen";
    renderUI(true);
  }
  if (action === "backPitching") {
    game.state = "pitching";
    renderUI(true);
  }
  if (action === "bunt") game.buntMode = true;
  if (action === "steal") trySteal();
  if (action === "restart") {
    resetGame(true);
    setupTeams();
  }
  if (action === "fullscreen") toggleFullscreen();
}

function handleMouseDown(e) {
  if (game.state !== "batting") return;
  if (e.target.closest("button") && e.target.closest("[data-action]")?.dataset.action !== "holdSwing") return;
  setSwingHeld(true);
}

function handleMouseUp() {
  setSwingHeld(false);
}

function setSwingHeld(held) {
  if (game.state !== "batting") return;
  if (held && !game.bat.held) {
    game.bat.spin = 0;
    game.bat.angle = game.bat.neutral;
  }
  if (held && game.ball.active) game.bat.attempted = true;
  game.bat.held = held;
  game.isSwinging = held;
}

function toggleFullscreen() {
  const app = document.querySelector(".app");
  if (!document.fullscreenElement) app.requestFullscreen?.();
  else document.exitFullscreen?.();
  setTimeout(() => renderUI(true), 80);
}

function trySteal() {
  if (game.state !== "batting" || !game.bases.first) return showResult("도루할 1루 주자 없음", 0.8, resumeHalf);
  const runner = game.bases.first;
  const success = Math.random() < clamp(0.28 + runner.speed / 145, 0.35, 0.86);
  if (success) {
    game.bases.second = runner;
    game.bases.first = null;
    showResult("도루 성공!", 0.9, resumeHalf);
  } else {
    game.bases.first = null;
    recordOut(1, "도루 실패!");
  }
}

function bindInput() {
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  document.addEventListener("click", handleMouseClick);
  canvas.addEventListener("pointerdown", handleMouseDown);
  window.addEventListener("pointerup", handleMouseUp);
  actionBar.addEventListener("pointerdown", (e) => {
    if (e.target.closest("[data-action='holdSwing']")) setSwingHeld(true);
  });
  actionBar.addEventListener("pointerup", handleMouseUp);
}

function renderUI(force = false) {
  const sig = JSON.stringify({
    state: game.state,
    phase: game.playPhase,
    lineup: game.selectedLineup.map((b) => b.name),
    pitcher: game.currentPitcher?.name,
    pitch: game.selectedPitch,
    paused: game.paused,
    warning: game.warning,
    score: [game.userScore, game.aiScore, game.inning, game.half, game.outs, game.balls, game.strikes],
  });
  if (!force && sig === game.uiSignature) return;
  game.uiSignature = sig;
  uiLayer.innerHTML = renderScreenPanel();
  actionBar.innerHTML = renderActionBar();
}

function renderScreenPanel() {
  if (game.state === "intro") {
    return `
      <div class="screen-panel intro-panel">
        <h1>풀카운트</h1>
        <p>KIA 타이거즈 2D 야구 시뮬레이션</p>
        <div class="panel-actions" style="justify-content:center">
          <button class="primary" data-action="start">START</button>
        </div>
      </div>
    `;
  }
  if (game.state === "lineupSelect") return renderLineupSelect();
  if (game.state === "pitcherSelect") return renderPitcherSelect();
  if (game.state === "bullpen") return renderBullpen();
  if (game.state === "gameOver") {
    return `
      <div class="screen-panel intro-panel">
        <h1>경기 종료</h1>
        <p>나 ${game.userScore} - ${game.aiScore} AI</p>
        <p class="muted">최고 득점 ${game.record.bestScore}</p>
        <div class="panel-actions" style="justify-content:center">
          <button class="primary" data-action="restart">다시 시작</button>
        </div>
      </div>
    `;
  }
  return "";
}

function renderLineupSelect() {
  return `
    <div class="screen-panel">
      <div class="screen-title">
        <div>
          <h2>2026 ${kiaClub.name} 타순 선택</h2>
          <p>감독 ${kiaClub.manager} · 홈 ${kiaClub.stadium} · 9명을 순서대로 선택하세요.</p>
        </div>
        <strong>${game.selectedLineup.length}/9</strong>
      </div>
      <p class="muted">${kiaClub.notes.join(" / ")}</p>
      <div class="selected-lineup">
        ${game.selectedLineup.map((b, i) => `<span class="lineup-chip">${i + 1}. ${b.name}</span>`).join("")}
      </div>
      <div class="grid roster-grid">
        ${kiaBatters
          .map((b) => {
            const selected = game.selectedLineup.some((p) => p.name === b.name);
            return `
              <button class="player-card ${selected ? "selected" : ""}" data-action="toggleBatter" data-batter="${b.name}">
                <strong>${b.name}</strong>
                <span class="muted">${b.position} · ${b.bats}타 · ${b.nickname}</span>
                <span class="stats">
                  <span class="pill">컨 ${b.contact}</span>
                  <span class="pill">파 ${b.power}</span>
                  <span class="pill">주 ${b.speed}</span>
                  <span class="pill">번 ${b.bunt}</span>
                </span>
                <small class="muted">${b.note}</small>
              </button>
            `;
          })
          .join("")}
      </div>
      <div class="panel-actions">
        <button data-action="defaultLineup">기본 타순</button>
        <button class="primary" data-action="confirmLineup" ${game.selectedLineup.length === 9 ? "" : "disabled"}>라인업 확정</button>
      </div>
    </div>
  `;
}

function renderPitcherSelect() {
  return `
    <div class="screen-panel">
      <div class="screen-title">
        <div>
          <h2>선발투수 선택</h2>
          <p>상대: ${game.aiTeam.name} · 감독 ${game.aiTeam.manager} · 선발 ${game.aiPitcher?.name || "-"} 예상</p>
        </div>
      </div>
      <div class="grid pitcher-grid">
        ${starters.map((p) => renderPitcherCard(p, "selectPitcher", "pitcher")).join("")}
      </div>
      <section class="bullpen-group">
        <h3>상대 ${game.aiTeam.name} 정보</h3>
        <div class="selected-lineup">
          ${game.aiTeam.batters.map((b, i) => `<span class="lineup-chip">${i + 1}. ${b.name}</span>`).join("")}
        </div>
        <p class="muted">선발진: ${game.aiTeam.starters.map((p) => p.name).join(", ")} / 불펜: ${game.aiTeam.bullpen.map((p) => p.name).join(", ")}</p>
      </section>
    </div>
  `;
}

function renderBullpen() {
  return `
    <div class="screen-panel">
      <div class="screen-title">
        <div>
          <h2>투수 교체</h2>
          <p>현재 투수: ${game.currentPitcher.name} · 체력 ${Math.round(game.currentPitcher.stamina)}</p>
        </div>
        <button data-action="backPitching">돌아가기</button>
      </div>
      ${Object.entries(bullpenGroups)
        .map(
          ([group, pitchers]) => `
          <section class="bullpen-group">
            <h3>${group}</h3>
            <div class="grid pitcher-grid">
              ${pitchers.map((p) => renderPitcherCard(p, "selectBullpen", "bullpen")).join("")}
            </div>
          </section>
        `
        )
        .join("")}
    </div>
  `;
}

function renderPitcherCard(p, action, dataName) {
  return `
    <button class="player-card" data-action="${action}" data-${dataName}="${p.name}">
      <strong>${p.name}</strong>
      <span class="muted">${p.role} · ${p.hand}HP · ${p.pitches.join(", ")}</span>
      <span class="stats">
        <span class="pill">구속 ${p.velocity}</span>
        <span class="pill">제구 ${p.control}</span>
        <span class="pill">변화 ${p.breaking}</span>
        <span class="pill">체력 ${Math.round(p.stamina)}</span>
      </span>
      <small class="muted">${p.note || ""}</small>
    </button>
  `;
}

function renderActionBar() {
  if (game.state === "batting") {
    return `
      <div class="action-left">
        <span class="status-text">공격 · ${game.currentBatter.name}</span>
        <span class="kbd">SPACE</span>
        <span>누르고 있으면 배트 회전</span>
      </div>
      <div class="action-right">
        <button class="primary" data-action="holdSwing">스윙 홀드</button>
        <button data-action="bunt" class="${game.buntMode ? "selected" : ""}">번트</button>
        <button data-action="steal">도루</button>
        ${fullscreenButton()}
      </div>
    `;
  }
  if (game.state === "pitching") {
    return `
      <div class="action-left">
        <span class="status-text">수비 · ${game.currentPitcher.name} 체력 ${Math.round(game.currentPitcher.stamina)}</span>
        ${game.warning ? `<span class="pill">${game.warning}</span>` : ""}
      </div>
      <div class="pitch-buttons">
        ${game.currentPitcher.pitches
          .map((p, i) => `<button data-action="pitch" data-pitch="${p}" class="${game.selectedPitch === p ? "selected" : ""}"><span class="kbd">${i + 1}</span> ${p}</button>`)
          .join("")}
        <button class="primary" data-action="throw">투구</button>
        <button class="dark" data-action="bullpen">불펜</button>
        ${fullscreenButton()}
      </div>
    `;
  }
  if (game.state === "result" || game.state === "inningChange") {
    return `<span class="status-text">${game.resultText}</span><div class="action-right">${fullscreenButton()}</div>`;
  }
  return `<span class="status-text">R 재시작 · ESC 일시정지 · F 전체화면</span><div class="action-right">${fullscreenButton()}</div>`;
}

function fullscreenButton() {
  return `<button data-action="fullscreen">${document.fullscreenElement ? "전체화면 해제" : "전체화면"}</button>`;
}

function toggleBatter(name) {
  const found = kiaBatters.find((b) => b.name === name);
  const index = game.selectedLineup.findIndex((b) => b.name === name);
  if (index >= 0) game.selectedLineup.splice(index, 1);
  else if (game.selectedLineup.length < 9) game.selectedLineup.push(found);
  renderUI(true);
}

function syncCurrentMatchup() {
  game.currentBatter = game.half === "top" ? game.selectedLineup[game.battingOrderIndex] : getAIBatter();
}

function getAIBatter() {
  return game.aiTeam.batters[game.aiBattingOrderIndex % game.aiTeam.batters.length];
}

function runnerFromCurrentBatter() {
  return { name: game.currentBatter.name, speed: game.currentBatter.speed || 60 };
}

function resetCount() {
  game.balls = 0;
  game.strikes = 0;
}

function showResult(text, duration = 1.1, next = resumeHalf) {
  game.state = game.state === "inningChange" ? "inningChange" : "result";
  game.playPhase = "판정";
  game.resultText = text;
  game.resultTimer = duration;
  game.resultDuration = duration;
  game.resultNext = next;
  renderUI(true);
}

function saveRecord() {
  game.record.bestScore = Math.max(game.record.bestScore || 0, game.userScore);
  game.record.recent = {
    date: new Date().toISOString(),
    score: `나 ${game.userScore} - ${game.aiScore} AI`,
    opponent: game.aiTeam.name,
  };
  localStorage.setItem("fullcount:record", JSON.stringify(game.record));
}

function loadRecord() {
  try {
    game.record = JSON.parse(localStorage.getItem("fullcount:record")) || game.record;
  } catch {
    game.record = { bestScore: 0, recent: null };
  }
}

function loadSavedLineup() {
  try {
    const names = JSON.parse(localStorage.getItem("fullcount:lineup"));
    if (Array.isArray(names) && names.length === 9) return names.map((name) => kiaBatters.find((b) => b.name === name)).filter(Boolean);
  } catch {}
  return defaultLineupNames.map((name) => kiaBatters.find((b) => b.name === name));
}

function loadSavedPitcher() {
  const name = localStorage.getItem("fullcount:selectedPitcher");
  const found = starters.find((p) => p.name === name);
  return found ? clonePitcher(found) : null;
}

function clonePitcher(p) {
  return { ...p, pitches: [...p.pitches], stamina: p.maxStamina };
}

function selectOpponentStarter() {
  const team = game.aiTeam || aiTeams[0];
  const index = Math.min(team.starters.length - 1, Math.floor(Math.random() * team.starters.length));
  return team.starters[index];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) update(1 / 60);
  draw();
};

window.render_game_to_text = () =>
  JSON.stringify({
    note: "Canvas origin top-left, x right, y down.",
    state: game.state,
    playPhase: game.playPhase,
    inning: game.inning,
    half: game.half,
    score: { kia: game.userScore, ai: game.aiScore },
    count: { balls: game.balls, strikes: game.strikes, outs: game.outs },
    bases: {
      first: game.bases.first?.name || null,
      second: game.bases.second?.name || null,
      third: game.bases.third?.name || null,
    },
    batter: game.currentBatter?.name || null,
    pitcher: (game.half === "top" ? game.aiPitcher : game.currentPitcher)?.name || null,
    pitch: game.ball.active
      ? { type: game.pitchType, speed: game.pitchSpeed, t: Number(game.ball.t.toFixed(2)), inZone: game.ball.inZone }
      : null,
    result: game.resultText,
  });

init();
