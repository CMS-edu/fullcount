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
  strike: { x: 480, y: 512, w: 190, h: 62 },
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

const LINEUP_POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"];
const POSITION_KR = { C: "포수", "1B": "1루수", "2B": "2루수", "3B": "3루수", SS: "유격수", LF: "좌익수", CF: "중견수", RF: "우익수", DH: "지명타자" };

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

const expandedTeamData = {
  삼성: {
    batters: ["김지찬", "이재현", "구자욱", "디아즈", "강민호", "김영웅", "류지혁", "김헌곤", "전병우", "이성규", "김성윤", "이병헌", "김현준", "공민규", "김재상", "안주형"],
    starters: ["원태인", "후라도", "레예스", "백정현", "이승현", "황동재"],
    bullpen: ["김재윤", "임창민", "오승환", "김태훈", "최하늘", "육선엽", "김대우", "이호성"],
  },
  LG: {
    batters: ["홍창기", "박해민", "오스틴", "문보경", "오지환", "박동원", "신민재", "문성주", "김현수", "천성호", "구본혁", "이영빈", "문정빈", "이재원", "김현종", "최승민"],
    starters: ["임찬규", "송승기", "톨허스트", "이정용", "손주영", "김윤식"],
    bullpen: ["김진성", "함덕주", "장현식", "김영우", "우강훈", "박시원", "백승현", "유영찬"],
  },
  한화: {
    batters: ["문현빈", "페라자", "노시환", "채은성", "안치홍", "하주석", "최재훈", "이진영", "황영묵", "김태연", "장진혁", "이도윤", "권광민", "이원석", "유로결"],
    starters: ["류현진", "폰세", "문동주", "와이스", "김기중", "조동욱"],
    bullpen: ["김서현", "주현상", "박상원", "한승혁", "정우주", "권민규", "김종수", "이상규"],
  },
  두산: {
    batters: ["정수빈", "강승호", "양의지", "김재환", "양석환", "허경민", "라모스", "박준영", "조수행", "이유찬", "김대한", "전민재", "홍성호", "김민혁", "박계범"],
    starters: ["곽빈", "최원준", "브랜든", "발라조빅", "최승용", "김동주"],
    bullpen: ["김택연", "홍건희", "최지강", "이영하", "박치국", "이병헌", "김명신", "이교훈"],
  },
  롯데: {
    batters: ["윤동희", "고승민", "빅터 레이예스", "나승엽", "전준우", "손호영", "박승욱", "손성빈", "유강남", "한태양", "전민재", "김세민", "이호준", "장두성", "김동현", "신윤후", "황성빈"],
    starters: ["박세웅", "김진욱", "나균안", "제레미 비슬리", "찰리 반즈", "이승헌"],
    bullpen: ["최준용", "김원중", "정철원", "구승민", "이민석", "박정민", "박준우", "박세진"],
  },
  키움: {
    batters: ["이주형", "송성문", "김건희", "김태진", "고영우", "주성원", "원성준", "김웅빈", "이재상", "김혜성", "임지열", "이용규", "박수종", "변상권"],
    starters: ["하영민", "후라도", "헤이수스", "조영건", "정찬헌", "김윤하"],
    bullpen: ["문성현", "김재웅", "주승우", "김선기", "오석주", "박승주", "양지율", "이명종"],
  },
  KT: {
    batters: ["김민혁", "강백호", "로하스", "문상철", "장성우", "황재균", "배정대", "오윤석", "안현민", "김상수", "권동진", "정준영", "조용호", "오재일"],
    starters: ["고영표", "쿠에바스", "소형준", "벤자민", "엄상백", "원상현"],
    bullpen: ["박영현", "김민수", "손동현", "주권", "우규민", "이상동", "김영현", "박시영"],
  },
  SSG: {
    batters: ["최지훈", "정준재", "박성한", "에레디아", "최정", "한유섬", "김재환", "오태곤", "이지영", "김민식", "안상현", "홍대인", "채현우", "김성현", "김정민"],
    starters: ["최민준", "김건우", "문승원", "타케다 쇼타", "앤서니 베네치아노", "히라모토 긴지로"],
    bullpen: ["조병현", "김민", "이로운", "박시후", "한두솔", "전영준", "최용준", "이건욱"],
  },
  NC: {
    batters: ["박민우", "김주원", "데이비슨", "박건우", "김형준", "최정원", "도태훈", "김한별", "오영수", "신재인", "한석현", "권희동", "이우성", "안중열", "김휘집"],
    starters: ["구창모", "커티스 테일러", "라일리 톰슨", "토다 나츠키", "신영우", "김태경"],
    bullpen: ["천사민", "김영규", "임지민", "김진호", "배재환", "이준혁", "김준원", "손주환"],
  },
};

applyExpandedTeamData(aiTeams);

const defaultLineupNames = ["박찬호", "김선빈", "김도영", "최형우", "나성범", "위즈덤", "이우성", "김태군", "최원준"];

const teamVisuals = {
  "KIA 타이거즈": { shortName: "KIA", color: "#d71920", secondaryColor: "#111111", textColor: "#ffffff", logo: "assets/team-logos/kia-tigers.png", fallbackLogo: "assets/HT.png" },
  삼성: { shortName: "삼성", color: "#1d62ad", secondaryColor: "#ffffff", textColor: "#ffffff", logo: "assets/team-logos/samsung-lions.png", fallbackLogo: "assets/SS.png" },
  LG: { shortName: "LG", color: "#c3042f", secondaryColor: "#111111", textColor: "#ffffff", logo: "assets/team-logos/lg-twins.png", fallbackLogo: "assets/LG.png" },
  한화: { shortName: "한화", color: "#f37321", secondaryColor: "#111111", textColor: "#111111", logo: "assets/team-logos/hanwha-eagles.png", fallbackLogo: "assets/HH.png" },
  두산: { shortName: "두산", color: "#111111", secondaryColor: "#f2f2f2", textColor: "#ffffff", logo: "assets/team-logos/doosan-bears.png", fallbackLogo: "assets/OB.png" },
  롯데: { shortName: "롯데", color: "#002955", secondaryColor: "#d71920", textColor: "#ffffff", logo: "assets/team-logos/lotte-giants.png", fallbackLogo: "assets/LT.png" },
  키움: { shortName: "키움", color: "#862633", secondaryColor: "#b6a269", textColor: "#ffffff", logo: "assets/team-logos/kiwoom-heroes.png", fallbackLogo: "assets/WO.png" },
  KT: { shortName: "KT", color: "#111111", secondaryColor: "#e31837", textColor: "#ffffff", logo: "assets/team-logos/kt-wiz.png", fallbackLogo: "assets/KT.png" },
  SSG: { shortName: "SSG", color: "#cf0a2c", secondaryColor: "#f4c24d", textColor: "#ffffff", logo: "assets/team-logos/ssg-landers.png", fallbackLogo: "assets/SK.png" },
  NC: { shortName: "NC", color: "#1f5aa6", secondaryColor: "#c8aa76", textColor: "#ffffff", logo: "assets/team-logos/nc-dinos.png", fallbackLogo: "assets/NC.png" },
};

const playableTeams = [
  {
    key: "kia",
    ...kiaClub,
    ...teamVisuals["KIA 타이거즈"],
    batters: kiaBatters,
    starters,
    bullpen: Object.values(bullpenGroups).flat(),
    bullpenGroups,
    defaultLineupNames,
  },
  ...aiTeams.map((team) => ({
    key: team.name,
    ...team,
    ...teamVisuals[team.name],
    season: "2026 게임 데이터",
    notes: [`${team.name} 게임용 9인 타순과 투수진`, "첫 화면에서 선택하면 이 팀으로 직접 플레이할 수 있습니다."],
    bullpenGroups: makeOpponentBullpenGroups(team.bullpen),
    defaultLineupNames: team.batters.slice(0, 9).map((b) => b.name),
  })),
];

const game = {
  state: "intro",
  mode: "ai",
  onlineRoomId: "",
  onlineSeat: null,
  onlineSeq: 0,
  onlineAppliedSeq: 0,
  onlineWaiting: false,
  applyingOnlineSnapshot: false,
  playPhase: "대기",
  inning: 1,
  half: "top",
  userScore: 0,
  aiScore: 0,
  outs: 0,
  balls: 0,
  strikes: 0,
  bases: { first: null, second: null, third: null },
  runnerAnimations: [],
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
  throwBall: null,
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
  lineupSlots: {},
  activeLineupSlot: null,
  aiSelectedLineup: null,
  onlinePrep: false,
  selectedPitcher: null,
  selectedPitch: "직구",
  combo: 0,
  userTeam: null,
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
const logoImages = new Map();
let onlineRealtimeUnsubscribe = null;
const myTeamEdit = { activeSlot: null };

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

function getPlayerEligiblePositions(player) {
  const raw = (player.position || "").toUpperCase();
  const parts = raw.split("/").map((s) => s.trim());
  const result = new Set();
  for (const part of parts) {
    if (part === "OF") { result.add("LF"); result.add("CF"); result.add("RF"); }
    else if (part === "IF") { result.add("1B"); result.add("2B"); result.add("3B"); result.add("SS"); }
    else if (part === "UTIL") { LINEUP_POSITIONS.forEach((p) => result.add(p)); }
    else if (LINEUP_POSITIONS.includes(part)) result.add(part);
  }
  if (result.size === 0) result.add("DH");
  return [...result];
}

function autoFillSlots(team) {
  const fillOrder = ["C", "SS", "2B", "3B", "1B", "CF", "LF", "RF", "DH"];
  const slots = {};
  const used = new Set();
  for (const pos of fillOrder) {
    const eligible = team.batters.filter((b) => !used.has(b.name) && getPlayerEligiblePositions(b).includes(pos));
    if (eligible.length > 0) { slots[pos] = eligible[0]; used.add(eligible[0].name); }
  }
  for (const pos of LINEUP_POSITIONS) {
    if (!slots[pos]) {
      const fallback = team.batters.find((b) => !used.has(b.name));
      if (fallback) { slots[pos] = fallback; used.add(fallback.name); }
    }
  }
  return slots;
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
      "게임용 라인업 데이터"
    )
  );
  const startersForTeam = starterNames.map((playerName, i) =>
    pitcher(
      playerName,
      78 + ((name.charCodeAt(0) + i * 7) % 18),
      72 + ((name.charCodeAt(0) + i * 5) % 22),
      70 + ((name.charCodeAt(0) + i * 8) % 24),
      78 + ((name.charCodeAt(0) + i * 6) % 20),
      "선발",
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

function applyExpandedTeamData(teams) {
  const positions = ["CF", "2B", "SS", "1B", "DH", "3B", "C", "LF", "RF", "IF", "OF", "C", "1B/OF", "UTIL", "OF"];
  for (const team of teams) {
    const data = expandedTeamData[team.name];
    if (!data) continue;
    team.batters = data.batters.map((name, index) => {
      const seed = nameSeed(`${team.name}-${name}`);
      const powerBoost = ["구자욱", "디아즈", "노시환", "오스틴", "데이비슨", "강백호", "로하스", "최정", "한유섬", "빅터 레이예스", "양의지", "김재환"].includes(name) ? 10 : 0;
      const speedBoost = ["김지찬", "홍창기", "박해민", "신민재", "문현빈", "정수빈", "조수행", "윤동희", "황성빈", "최지훈", "박민우", "최정원"].includes(name) ? 10 : 0;
      return batter(
        name,
        positions[index % positions.length],
        index % 4 === 0 ? "L" : index % 5 === 0 ? "S" : "R",
        clamp(62 + (seed % 28) + (index < 4 ? 5 : 0), 55, 94),
        clamp(54 + ((seed >> 2) % 32) + powerBoost, 45, 97),
        clamp(50 + ((seed >> 4) % 35) + speedBoost, 38, 96),
        clamp(34 + ((seed >> 6) % 42), 20, 86),
        `${team.name} 현역`,
        "2026 현역 로스터 기반 게임 데이터"
      );
    });
    team.starters = data.starters.map((name, index) => {
      const seed = nameSeed(`${team.name}-SP-${name}`);
      return pitcher(
        name,
        clamp(76 + (seed % 20), 70, 96),
        clamp(70 + ((seed >> 2) % 24), 62, 94),
        clamp(68 + ((seed >> 4) % 26), 60, 96),
        clamp(82 + ((seed >> 6) % 20), 78, 104),
        "선발",
        [
          ["직구", "슬라이더", "체인지업", "커브"],
          ["직구", "투심", "스위퍼", "체인지업"],
          ["직구", "커브", "슬라이더", "투심"],
        ][index % 3],
        index % 3 === 1 ? "L" : "R",
        `${team.name} 선발 로테이션`
      );
    });
    team.bullpen = data.bullpen.map((name, index) => {
      const seed = nameSeed(`${team.name}-RP-${name}`);
      return pitcher(
        name,
        clamp(78 + (seed % 19), 70, 97),
        clamp(66 + ((seed >> 2) % 27), 55, 92),
        clamp(66 + ((seed >> 4) % 28), 55, 94),
        clamp(50 + ((seed >> 6) % 22), 42, 70),
        index === 0 ? "마무리" : index <= 2 ? "필승조" : "불펜",
        [
          ["직구", "슬라이더", "스위퍼"],
          ["직구", "커브", "체인지업"],
          ["직구", "투심", "슬라이더"],
          ["직구", "체인지업", "스위퍼"],
        ][index % 4],
        index % 4 === 2 ? "L" : "R",
        `${team.name} 불펜`
      );
    });
    team.bullpenGroups = makeOpponentBullpenGroups(team.bullpen);
    team.defaultLineupNames = team.batters.slice(0, 9).map((player) => player.name);
  }
}

function makeOpponentBullpenGroups(bullpen) {
  const groups = { 마무리: [], 필승조: [], 추격조: [] };
  bullpen.forEach((pitcherObj, index) => {
    if (pitcherObj.role === "마무리" || index === 0) groups.마무리.push(pitcherObj);
    else if (index <= 2) groups.필승조.push(pitcherObj);
    else groups.추격조.push(pitcherObj);
  });
  return Object.fromEntries(Object.entries(groups).filter(([, pitchers]) => pitchers.length));
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

function preloadTeamLogos() {
  playableTeams.forEach((team) => getTeamLogoRecord(team));
}

function getTeamLogoRecord(team) {
  const sources = getTeamLogoSources(team);
  if (!sources.length || typeof Image === "undefined") return null;
  const cacheKey = sources.join("|");
  if (!logoImages.has(cacheKey)) {
    const record = { img: new Image(), loaded: false, failed: false, sourceIndex: 0, sources };
    record.img.onload = () => {
      record.loaded = true;
    };
    record.img.onerror = () => {
      record.sourceIndex += 1;
      if (record.sourceIndex < record.sources.length) {
        record.img.src = record.sources[record.sourceIndex];
        return;
      }
      record.failed = true;
    };
    record.img.src = sources[0];
    logoImages.set(cacheKey, record);
  }
  return logoImages.get(cacheKey);
}

function getTeamLogoImage(team) {
  const record = getTeamLogoRecord(team);
  return record?.loaded && !record.failed ? record.img : null;
}

function getTeamLogoSources(team) {
  return [team?.logo, team?.fallbackLogo].filter(Boolean);
}

function teamLogoMarkup(team, extraClass = "") {
  const style = `--team-color:${team.color || "#d71920"};--team-secondary:${team.secondaryColor || "#111111"};--team-text:${team.textColor || "#ffffff"}`;
  const fallback = team.fallbackLogo ? `this.onerror=function(){this.style.display='none'};this.src='${team.fallbackLogo}'` : "this.style.display='none'";
  return `
    <span class="team-logo ${extraClass}" style="${style}">
      <span class="team-logo-fallback">${team.shortName || team.name}</span>
      <img src="${team.logo}" alt="${team.name} 로고" loading="lazy" onerror="${fallback}" />
    </span>
  `;
}

function currentUserTeam() {
  if (!game.userTeam) game.userTeam = loadSavedTeam();
  return game.userTeam;
}

function isPvPMode() {
  return game.mode === "localPvp" || game.mode === "onlinePvp";
}

function isOnlinePvp() {
  return game.mode === "onlinePvp";
}

function onlineControlSeat() {
  return game.half === "top" ? 1 : 2;
}

function onlineDefenseSeat() {
  return game.half === "top" ? 2 : 1;
}

function canControlOnlineHalf() {
  return !isOnlinePvp() || !game.onlineSeat || game.onlineSeat === onlineControlSeat();
}

function canUseLocalControls() {
  return !isOnlinePvp() || canControlOnlineHalf();
}

function canPitchOnlineHalf() {
  return isOnlinePvp() && (!game.onlineSeat || game.onlineSeat === onlineDefenseSeat());
}

function controlledPitcher() {
  return isOnlinePvp() ? battingPitcher() : game.currentPitcher;
}

function controlledPitchingTeam() {
  return isOnlinePvp() && game.half === "top" ? game.aiTeam : currentUserTeam();
}

function setControlledPitcher(newPitcher) {
  const cloned = clonePitcher(newPitcher);
  if (isOnlinePvp() && game.half === "top") game.aiPitcher = cloned;
  else game.currentPitcher = cloned;
  game.selectedPitch = cloned.pitches[0];
}

function onlineRoleText() {
  if (!isOnlinePvp()) return "";
  if (canControlOnlineHalf()) return `P${game.onlineSeat || onlineControlSeat()} 공격`;
  if (canPitchOnlineHalf()) return `P${game.onlineSeat || onlineDefenseSeat()} 투구`;
  return "관전";
}

function getOffenseTeam() {
  return game.half === "top" ? currentUserTeam() : game.aiTeam;
}

function getDefenseTeam() {
  return game.half === "top" ? game.aiTeam : currentUserTeam();
}

function battingPitcher() {
  return game.half === "top" ? game.aiPitcher : game.currentPitcher;
}

function getTeamByName(name) {
  return playableTeams.find((team) => team.name === name || team.key === name);
}

function loadSavedTeam() {
  return getTeamByName(localStorage.getItem("fullcount:userTeam")) || getTeamByName("KIA 타이거즈") || playableTeams[0];
}

function selectUserTeam(name) {
  const team = getTeamByName(name);
  if (!team) return;
  game.userTeam = team;
  localStorage.setItem("fullcount:userTeam", team.name);
  game.selectedLineup = loadSavedLineup(team);
  game.selectedPitcher = loadSavedPitcher(team);
  game.currentPitcher = game.selectedPitcher ? clonePitcher(game.selectedPitcher) : null;
  game.selectedPitch = game.currentPitcher?.pitches[0] || "직구";
  setupTeams();
  renderUI(true);
}

function chooseOpponentTeam() {
  const userTeam = currentUserTeam();
  const pool = playableTeams.filter((team) => team.name !== userTeam.name);
  return pool[randomInt(0, pool.length - 1)] || playableTeams[0];
}

function getDefaultLineup(team = currentUserTeam()) {
  const slots = autoFillSlots(team);
  return LINEUP_POSITIONS.map((pos) => slots[pos]).filter(Boolean).slice(0, 9);
}

function lineupStorageKey(team = currentUserTeam()) {
  return `fullcount:lineup:${team.name}`;
}

function pitcherStorageKey(team = currentUserTeam()) {
  return `fullcount:selectedPitcher:${team.name}`;
}

function lineupSlotsStorageKey(team = currentUserTeam()) {
  return `fullcount:lineupSlots:${team.name}`;
}

function loadSavedLineupSlots(team = currentUserTeam()) {
  try {
    const saved = JSON.parse(localStorage.getItem(lineupSlotsStorageKey(team)));
    if (saved && typeof saved === "object") {
      const slots = {};
      for (const pos of LINEUP_POSITIONS) {
        if (saved[pos]) {
          const found = team.batters.find((b) => b.name === saved[pos]);
          if (found) slots[pos] = found;
        }
      }
      const names = Object.values(slots).map((b) => b.name);
      if (new Set(names).size === names.length && names.length === 9) return slots;
    }
  } catch {}
  return autoFillSlots(team);
}

function init() {
  loadRecord();
  preloadTeamLogos();
  setupTeams();
  resetGame(false);
  bindInput();
  const quick = new URLSearchParams(location.search).get("quick");
  if (quick) quickStart(quick);
  renderUI(true);
  requestAnimationFrame(gameLoop);
}

function resetGame(toIntro = true) {
  if (!game.userTeam) game.userTeam = loadSavedTeam();
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
  game.runnerAnimations = [];
  game.battingOrderIndex = 0;
  game.aiBattingOrderIndex = 0;
  game.selectedLineup = loadSavedLineup(game.userTeam);
  game.selectedPitcher = loadSavedPitcher(game.userTeam);
  game.currentPitcher = game.selectedPitcher ? clonePitcher(game.selectedPitcher) : null;
  if (!game.aiTeam || toIntro) setupTeams();
  game.aiPitcher = clonePitcher(selectOpponentStarter());
  game.ball = makeBall();
  game.hitBall = null;
  game.throwBall = null;
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
  if (!game.userTeam) game.userTeam = loadSavedTeam();
  game.aiTeam = chooseOpponentTeam();
  game.aiPitcher = clonePitcher(selectOpponentStarter());
}

function setupLineup() {
  if (!game.userTeam) game.userTeam = loadSavedTeam();
  game.state = "lineupSelect";
  game.lineupSlots = loadSavedLineupSlots(game.userTeam);
  game.activeLineupSlot = LINEUP_POSITIONS.find((p) => !game.lineupSlots[p]) || null;
  game.selectedLineup = LINEUP_POSITIONS.map((p) => game.lineupSlots[p]).filter(Boolean);
  renderUI(true);
}

function prepareOnlineLineup(teamName) {
  const team = getTeamByName(teamName) || currentUserTeam();
  game.userTeam = team;
  localStorage.setItem("fullcount:userTeam", team.name);
  game.onlinePrep = true;
  setupLineup();
}

function selectPitcher(selected) {
  if (!selected) return;
  game.selectedPitcher = clonePitcher(selected);
  game.currentPitcher = clonePitcher(selected);
  localStorage.setItem(pitcherStorageKey(), selected.name);
  if (game.onlinePrep) {
    game.onlinePrep = false;
    game.state = "onlinePrepDone";
    renderUI(true);
    return;
  }
  startGame();
}

function startGame() {
  if (!isPvPMode()) game.mode = "ai";
  game.state = "batting";
  game.playPhase = "투구 대기";
  game.half = "top";
  game.aiSwingPoint = getAIDiffMod().timing;
  game.aiPitcher = game.aiPitcher ? clonePitcher(game.aiPitcher) : clonePitcher(selectOpponentStarter());
  resetCount();
  syncCurrentMatchup();
  prepareBattingPitch();
  renderUI(true);
}

function startOnlinePvp({ roomId = "", seat = null, teamA, teamB, lineupA, pitcherA, lineupB, pitcherB } = {}) {
  const firstTeam = getTeamByName(teamA) || currentUserTeam();
  const secondTeam = getTeamByName(teamB) || chooseOpponentTeam();
  game.mode = "onlinePvp";
  game.onlineRoomId = roomId;
  game.onlineSeat = seat;
  game.onlineSeq = 0;
  game.onlineAppliedSeq = 0;
  game.onlineWaiting = false;
  setupOnlineRealtime();
  game.userTeam = firstTeam;
  game.aiTeam = secondTeam.name === firstTeam.name ? chooseOpponentTeam() : secondTeam;

  // P1 lineup
  if (Array.isArray(lineupA) && lineupA.length === 9) {
    const resolved = lineupA.map((name) => firstTeam.batters.find((b) => b.name === name)).filter(Boolean);
    game.selectedLineup = resolved.length === 9 ? resolved : loadSavedLineup(firstTeam);
  } else {
    game.selectedLineup = loadSavedLineup(firstTeam);
  }

  // P1 pitcher
  const allPitchersA = [...firstTeam.starters, ...Object.values(firstTeam.bullpenGroups || {}).flat()];
  const foundPA = pitcherA ? allPitchersA.find((p) => p.name === pitcherA) : null;
  const startPitcherA = foundPA || loadSavedPitcher(firstTeam) || firstTeam.starters[0];
  game.selectedPitcher = clonePitcher(startPitcherA);
  game.currentPitcher = clonePitcher(startPitcherA);

  // P2 lineup (ai side)
  if (Array.isArray(lineupB) && lineupB.length === 9) {
    const resolved = lineupB.map((name) => game.aiTeam.batters.find((b) => b.name === name)).filter(Boolean);
    game.aiSelectedLineup = resolved.length === 9 ? resolved : null;
  } else {
    game.aiSelectedLineup = null;
  }

  // P2 pitcher (ai side)
  const allPitchersB = [...game.aiTeam.starters, ...Object.values(game.aiTeam.bullpenGroups || {}).flat()];
  const foundPB = pitcherB ? allPitchersB.find((p) => p.name === pitcherB) : null;
  game.aiPitcher = clonePitcher(foundPB || game.aiTeam.starters[0]);

  game.battingOrderIndex = 0;
  game.aiBattingOrderIndex = 0;
  localStorage.setItem("fullcount:userTeam", firstTeam.name);
  startGame();
}

function setupOnlineRealtime() {
  if (onlineRealtimeUnsubscribe) onlineRealtimeUnsubscribe();
  onlineRealtimeUnsubscribe = window.fullcountRealtime?.onGameEvent?.((message) => {
    const event = message.event || message;
    if (event.kind === "snapshot") applyOnlineSnapshot(event.snapshot);
    if (event.kind === "pitch") applyOnlinePitch(event);
  });
}

function broadcastOnlineSnapshot(reason, options = {}) {
  if (!isOnlinePvp() || game.applyingOnlineSnapshot) return;
  if (!options.force && !canControlOnlineHalf()) return;
  window.fullcountRealtime?.sendGameEvent?.({
    kind: "snapshot",
    snapshot: exportOnlineSnapshot(reason),
  });
}

function broadcastOnlinePitch() {
  if (!isOnlinePvp() || !canPitchOnlineHalf() || game.applyingOnlineSnapshot) return;
  window.fullcountRealtime?.sendGameEvent?.({
    kind: "pitch",
    roomId: game.onlineRoomId,
    seq: ++game.onlineSeq,
    inning: game.inning,
    half: game.half,
    userScore: game.userScore,
    aiScore: game.aiScore,
    outs: game.outs,
    balls: game.balls,
    strikes: game.strikes,
    battingOrderIndex: game.battingOrderIndex,
    aiBattingOrderIndex: game.aiBattingOrderIndex,
    bases: {
      first: game.bases.first?.name || null,
      second: game.bases.second?.name || null,
      third: game.bases.third?.name || null,
    },
    currentPitcher: pitcherSnapshot(game.currentPitcher),
    aiPitcher: pitcherSnapshot(game.aiPitcher),
    ball: serializeBallForOnline(game.ball),
  });
}

function exportOnlineSnapshot(reason) {
  return {
    version: 1,
    reason,
    roomId: game.onlineRoomId,
    seq: ++game.onlineSeq,
    state: game.state,
    playPhase: game.playPhase,
    inning: game.inning,
    half: game.half,
    userScore: game.userScore,
    aiScore: game.aiScore,
    outs: game.outs,
    balls: game.balls,
    strikes: game.strikes,
    battingOrderIndex: game.battingOrderIndex,
    aiBattingOrderIndex: game.aiBattingOrderIndex,
    bases: {
      first: game.bases.first?.name || null,
      second: game.bases.second?.name || null,
      third: game.bases.third?.name || null,
    },
    currentPitcher: pitcherSnapshot(game.currentPitcher),
    aiPitcher: pitcherSnapshot(game.aiPitcher),
    aiLineup: game.aiSelectedLineup ? game.aiSelectedLineup.map((b) => b.name) : null,
    resultText: game.resultText,
    resultTimer: game.resultTimer,
  };
}

function serializeBallForOnline(ball) {
  return {
    active: true,
    mode: "batting",
    x: ball.x,
    y: ball.y,
    prevX: ball.prevX,
    prevY: ball.prevY,
    start: ball.start,
    end: ball.end,
    t: 0,
    duration: ball.duration,
    inZone: ball.inZone,
    mistake: ball.mistake,
    decisionMade: false,
    pitchType: ball.pitchType,
    speed: ball.speed,
    movement: ball.movement,
    color: ball.color,
  };
}

function pitcherSnapshot(pitcherObj) {
  if (!pitcherObj) return null;
  return {
    name: pitcherObj.name,
    stamina: pitcherObj.stamina,
    maxStamina: pitcherObj.maxStamina,
  };
}

function applyOnlineSnapshot(snapshot) {
  if (!snapshot || snapshot.version !== 1) return;
  if (snapshot.roomId && game.onlineRoomId && snapshot.roomId !== game.onlineRoomId) return;
  if (snapshot.seq <= game.onlineAppliedSeq) return;
  game.applyingOnlineSnapshot = true;
  game.onlineAppliedSeq = snapshot.seq;
  game.inning = snapshot.inning;
  game.half = snapshot.half;
  game.userScore = snapshot.userScore;
  game.aiScore = snapshot.aiScore;
  game.outs = snapshot.outs;
  game.balls = snapshot.balls;
  game.strikes = snapshot.strikes;
  game.battingOrderIndex = snapshot.battingOrderIndex;
  game.aiBattingOrderIndex = snapshot.aiBattingOrderIndex;
  game.currentPitcher = hydratePitcherSnapshot(snapshot.currentPitcher, currentUserTeam(), game.currentPitcher);
  game.aiPitcher = hydratePitcherSnapshot(snapshot.aiPitcher, game.aiTeam, game.aiPitcher);
  if (Array.isArray(snapshot.aiLineup) && snapshot.aiLineup.length === 9) {
    const resolved = snapshot.aiLineup.map((name) => game.aiTeam.batters.find((b) => b.name === name)).filter(Boolean);
    if (resolved.length === 9) game.aiSelectedLineup = resolved;
  }
  game.bases = {
    first: hydrateRunner(snapshot.bases?.first),
    second: hydrateRunner(snapshot.bases?.second),
    third: hydrateRunner(snapshot.bases?.third),
  };
  syncCurrentMatchup();
  game.hitBall = null;
  game.throwBall = null;
  resetFielderTargets(true);
  resetBatState();

  if (snapshot.state === "gameOver") {
    game.state = "gameOver";
    game.applyingOnlineSnapshot = false;
    renderUI(true);
    return;
  }

  if (snapshot.state === "result" || snapshot.state === "inningChange") {
    game.state = snapshot.state;
    game.playPhase = snapshot.playPhase || "온라인 결과";
    game.resultText = snapshot.resultText || "";
    game.resultTimer = Math.max(0.85, snapshot.resultTimer || 1);
    game.resultDuration = game.resultTimer;
    game.resultNext = () => {
      if (canControlOnlineHalf()) prepareBattingPitch();
      else setOnlineDefenseReady();
    };
  } else if (canControlOnlineHalf()) {
    prepareBattingPitch();
  } else {
    setOnlineDefenseReady();
  }
  game.applyingOnlineSnapshot = false;
  renderUI(true);
}

function applyOnlinePitch(event) {
  if (!isOnlinePvp() || !event?.ball) return;
  if (event.roomId && game.onlineRoomId && event.roomId !== game.onlineRoomId) return;
  if (event.seq <= game.onlineAppliedSeq) return;
  game.applyingOnlineSnapshot = true;
  game.onlineAppliedSeq = event.seq;
  game.inning = event.inning;
  game.half = event.half;
  game.userScore = event.userScore;
  game.aiScore = event.aiScore;
  game.outs = event.outs;
  game.balls = event.balls;
  game.strikes = event.strikes;
  game.battingOrderIndex = event.battingOrderIndex;
  game.aiBattingOrderIndex = event.aiBattingOrderIndex;
  game.currentPitcher = hydratePitcherSnapshot(event.currentPitcher, currentUserTeam(), game.currentPitcher);
  game.aiPitcher = hydratePitcherSnapshot(event.aiPitcher, game.aiTeam, game.aiPitcher);
  game.bases = {
    first: hydrateRunner(event.bases?.first),
    second: hydrateRunner(event.bases?.second),
    third: hydrateRunner(event.bases?.third),
  };
  syncCurrentMatchup();
  game.state = "batting";
  game.onlineWaiting = false;
  game.hitBall = null;
  game.throwBall = null;
  resetFielderTargets(true);
  game.ball = hydrateOnlineBall(event.ball);
  game.pitchType = game.ball.pitchType;
  game.pitchSpeed = game.ball.speed;
  game.pitchMovement = game.ball.movement;
  game.bat.contacted = false;
  game.bat.attempted = false;
  game.bat.held = false;
  game.bat.angle = game.bat.neutral;
  game.bat.spin = 0;
  game.lastContact = null;
  game.buntMode = false;
  game.playPhase = canControlOnlineHalf() ? "온라인 타격" : "상대 타격 관전";
  game.applyingOnlineSnapshot = false;
  renderUI(true);
}

function hydrateOnlineBall(ball) {
  return {
    ...makeBall(),
    ...ball,
    active: true,
    mode: "batting",
    start: { ...ball.start },
    end: { ...ball.end },
    movement: { ...ball.movement },
    t: 0,
    prevX: ball.start?.x ?? FIELD.mound.x,
    prevY: ball.start?.y ?? FIELD.mound.y,
  };
}

function hydratePitcherSnapshot(snapshot, team, fallback) {
  if (!snapshot?.name) return fallback;
  const pool = [...(team?.starters || []), ...(team?.bullpen || []), ...Object.values(team?.bullpenGroups || {}).flat()];
  const source = pool.find((pitcherObj) => pitcherObj.name === snapshot.name) || fallback || snapshot;
  if (!source?.pitches) return fallback || null;
  const hydrated = clonePitcher(source);
  hydrated.stamina = Number.isFinite(snapshot.stamina) ? snapshot.stamina : hydrated.stamina;
  hydrated.maxStamina = Number.isFinite(snapshot.maxStamina) ? snapshot.maxStamina : hydrated.maxStamina;
  return hydrated;
}

function hydrateRunner(name) {
  if (!name) return null;
  const pool = [...(game.selectedLineup || []), ...(currentUserTeam().batters || []), ...(game.aiTeam?.batters || [])];
  const found = pool.find((runner) => runner.name === name);
  return { name, speed: found?.speed || 60 };
}

function resetBatState() {
  game.ball = makeBall();
  game.ball.active = false;
  game.bat.contacted = false;
  game.bat.attempted = false;
  game.bat.held = false;
  game.bat.angle = game.bat.neutral;
  game.bat.spin = 0;
  game.lastContact = null;
  game.buntMode = false;
}

function setOnlineOffenseWaiting() {
  game.state = "batting";
  game.onlineWaiting = true;
  game.hitBall = null;
  game.throwBall = null;
  game.pitchDelay = 999;
  resetFielderTargets(true);
  resetBatState();
  game.playPhase = "상대 투구 대기";
  renderUI(true);
}

function setOnlineDefenseReady() {
  game.state = "pitching";
  game.onlineWaiting = false;
  game.hitBall = null;
  game.throwBall = null;
  resetFielderTargets(true);
  resetBatState();
  const pitcherObj = controlledPitcher();
  game.selectedPitch = pitcherObj?.pitches?.includes(game.selectedPitch) ? game.selectedPitch : pitcherObj?.pitches?.[0] || game.selectedPitch;
  game.playPhase = "구종 선택";
  renderUI(true);
}

function quickStart(mode) {
  const team = currentUserTeam();
  game.selectedLineup = getDefaultLineup(team);
  game.selectedPitcher = clonePitcher(team.starters[0]);
  game.currentPitcher = clonePitcher(team.starters[0]);
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
  updateThrowBall(deltaTime);
  updateFielders(deltaTime);
  updateRunnerAnimations(deltaTime);
}

function updateIntro() {}

function updateBatting(deltaTime) {
  if (isOnlinePvp() && !canControlOnlineHalf()) {
    if (!game.ball.active) {
      game.playPhase = "투구 준비";
      return;
    }
    updateBall(deltaTime);
    if (game.ball.t >= 1) {
      game.ball.active = false;
      game.playPhase = "상대 판정 대기";
    }
    return;
  }
  if (!game.ball.active) {
    if (isOnlinePvp()) {
      game.playPhase = "상대 투구 대기";
      return;
    }
    game.playPhase = "투구 대기";
    game.pitchDelay -= deltaTime;
    if (game.pitchDelay <= 0) startPitch(chooseAIPitch(), "batting");
    return;
  }
  updateBall(deltaTime);
  if (game.ball.active && game.bat.held) game.bat.attempted = true;
  // 번트 모드: 공이 타격 존에 들어오면 자동 컨택
  if (game.ball.active && game.buntMode && !game.bat.contacted && game.ball.t > 0.58) {
    if (getContactReach() > 0.12) {
      game.bat.held = true;
      game.bat.attempted = true;
      game.swingPower = 0;
      if (isSwingInContactWindow()) swingBat();
    }
  }
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
  if (!game.hitBall.fielderSent && game.hitBall.t >= game.hitBall.reactionDelay) {
    game.hitBall.fielderSent = true;
    sendFielderToBall(game.hitBall.end, game.hitBall.result);
  }
  if (game.hitBall.t >= 1 && game.playPhase === "타구 처리") {
    game.playPhase = "판정 대기";
  }
}

function updateThrowBall(deltaTime) {
  if (!game.throwBall) return;
  game.throwBall.timer += deltaTime;
  if (game.throwBall.timer > game.throwBall.delay + game.throwBall.duration + 0.75) {
    game.throwBall = null;
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

function updateRunnerAnimations(deltaTime) {
  for (const runner of game.runnerAnimations) {
    runner.t = Math.min(1, runner.t + deltaTime / runner.duration);
  }
  game.runnerAnimations = game.runnerAnimations.filter((runner) => runner.t < 1);
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
    if (game.half === "top" || isPvPMode()) drawBatting();
    else drawPitching();
    drawResult();
    drawThrowBall(true);
  }
  ctx.restore();
}

function drawMenuBackdrop() {
  const team = currentUserTeam();
  ctx.fillStyle = "#171717";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = team.color || "#d71920";
  ctx.fillRect(0, 0, W, 72);
  ctx.fillStyle = team.secondaryColor || "#111111";
  ctx.fillRect(0, 72, W, 8);
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
  drawTeamLogo(team, 40, 18, 46);
  if (game.aiTeam) drawTeamLogo(game.aiTeam, 874, 18, 46);
}

function drawTeamLogo(team, x, y, size, options = {}) {
  if (!team) return;
  const img = getTeamLogoImage(team);
  ctx.save();
  ctx.globalAlpha = options.alpha ?? 1;
  if (options.shadow !== false) {
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size + 4, size * 0.42, size * 0.12, 0, 0, TWO_PI);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, TWO_PI);
  ctx.clip();
  if (img) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, size, size);
    ctx.drawImage(img, x, y, size, size);
  } else {
    drawTeamBadge(team, x, y, size);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = options.alpha ?? 1;
  ctx.strokeStyle = options.stroke || "#ffffff";
  ctx.lineWidth = Math.max(2, size / 14);
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2 - 1, 0, TWO_PI);
  ctx.stroke();
  ctx.restore();
}

function drawTeamBadge(team, x, y, size) {
  const main = team.color || "#d71920";
  const sub = team.secondaryColor || "#111111";
  ctx.fillStyle = main;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = sub;
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size, y + size);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = team.textColor || "#ffffff";
  ctx.font = `900 ${Math.max(12, Math.floor(size * 0.28))}px Segoe UI`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(team.shortName || team.name, x + size / 2, y + size / 2);
}

function drawTeamWatermark(team, x, y, size) {
  drawTeamLogo(team, x, y, size, { alpha: 0.16, shadow: false, stroke: "rgba(255,255,255,0.75)" });
}

function drawField() {
  // ── 1. STANDS / SKY ─────────────────────────────────────────
  const skyG = ctx.createLinearGradient(0, 0, 0, 100);
  skyG.addColorStop(0, "#060e08");
  skyG.addColorStop(1, "#0c1a0f");
  ctx.fillStyle = skyG;
  ctx.fillRect(0, 0, W, H);

  // ── 2. OUTFIELD GRASS ───────────────────────────────────────
  const ofG = ctx.createLinearGradient(0, 80, 0, H);
  ofG.addColorStop(0, "#1c5230");
  ofG.addColorStop(0.45, "#24673c");
  ofG.addColorStop(1, "#1e5c34");
  ctx.fillStyle = ofG;
  ctx.fillRect(0, 80, W, H - 80);

  // Mowing stripes
  ctx.save();
  for (let x = 0; x < W; x += 60) {
    ctx.fillStyle = (Math.floor(x / 60) % 2 === 0) ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.035)";
    ctx.fillRect(x, 80, 60, H - 80);
  }
  ctx.restore();

  // ── 3. OUTFIELD WALL ────────────────────────────────────────
  ctx.fillStyle = "#0b1a0d";
  ctx.beginPath();
  ctx.moveTo(0, 74); ctx.lineTo(0, 100);
  ctx.quadraticCurveTo(480, 128, 960, 100);
  ctx.lineTo(960, 74); ctx.closePath();
  ctx.fill();
  // Wall padding stripe (bright yellow-green)
  ctx.strokeStyle = "#c8a020";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, 97);
  ctx.quadraticCurveTo(480, 125, 960, 97);
  ctx.stroke();
  // Wall cap
  ctx.strokeStyle = "rgba(80,50,10,0.8)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 102);
  ctx.quadraticCurveTo(480, 130, 960, 102);
  ctx.stroke();

  // ── 4. WARNING TRACK ────────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = "#9a6e36";
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.arc(FIELD.home.x, FIELD.home.y, 400, -2.36, -0.78);
  ctx.stroke();
  ctx.strokeStyle = "rgba(160,115,55,0.45)";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(FIELD.home.x, FIELD.home.y, 387, -2.36, -0.78);
  ctx.stroke();
  ctx.restore();

  // ── 5. TEAM WATERMARKS ──────────────────────────────────────
  drawTeamWatermark(currentUserTeam(), 150, 158, 76);
  if (game.aiTeam) drawTeamWatermark(game.aiTeam, 762, 158, 76);

  // ── 6. INFIELD DIRT ─────────────────────────────────────────
  const dirtG = ctx.createRadialGradient(FIELD.home.x, 360, 0, FIELD.home.x, 310, 245);
  dirtG.addColorStop(0, "#cda060");
  dirtG.addColorStop(0.55, "#b88445");
  dirtG.addColorStop(1, "#9e7038");
  ctx.fillStyle = dirtG;
  ctx.beginPath();
  ctx.moveTo(FIELD.home.x, FIELD.home.y);
  ctx.lineTo(FIELD.first.x, FIELD.first.y);
  ctx.lineTo(FIELD.second.x, FIELD.second.y);
  ctx.lineTo(FIELD.third.x, FIELD.third.y);
  ctx.closePath();
  ctx.fill();

  // ── 7. INFIELD GRASS (inner diamond) ────────────────────────
  const igG = ctx.createRadialGradient(480, 330, 10, 480, 290, 190);
  igG.addColorStop(0, "#2e7242");
  igG.addColorStop(1, "#276038");
  ctx.fillStyle = igG;
  ctx.beginPath();
  ctx.moveTo(FIELD.home.x, FIELD.home.y - 53);
  ctx.lineTo(FIELD.first.x - 54, FIELD.first.y);
  ctx.lineTo(FIELD.second.x, FIELD.second.y + 52);
  ctx.lineTo(FIELD.third.x + 54, FIELD.third.y);
  ctx.closePath();
  ctx.fill();

  // ── 8. PITCHER'S MOUND ──────────────────────────────────────
  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(FIELD.mound.x + 4, FIELD.mound.y + 10, 35, 20, 0, 0, TWO_PI);
  ctx.fill();
  // Body gradient (elevated center)
  const mG = ctx.createRadialGradient(FIELD.mound.x - 5, FIELD.mound.y - 6, 0, FIELD.mound.x, FIELD.mound.y, 33);
  mG.addColorStop(0, "#e0c070");
  mG.addColorStop(0.5, "#c89850");
  mG.addColorStop(1, "#a07038");
  ctx.fillStyle = mG;
  ctx.beginPath();
  ctx.ellipse(FIELD.mound.x, FIELD.mound.y + 4, 33, 24, 0, 0, TWO_PI);
  ctx.fill();
  // Pitching rubber
  ctx.fillStyle = "#eeece4";
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1;
  ctx.fillRect(FIELD.mound.x - 12, FIELD.mound.y - 3, 24, 6);
  ctx.strokeRect(FIELD.mound.x - 12, FIELD.mound.y - 3, 24, 6);

  // ── 9. HOME PLATE CLAY ──────────────────────────────────────
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.ellipse(FIELD.plate.x + 3, FIELD.plate.y + 24, 52, 28, 0, 0, TWO_PI);
  ctx.fill();
  const hpG = ctx.createRadialGradient(FIELD.plate.x - 8, FIELD.plate.y + 8, 0, FIELD.plate.x, FIELD.plate.y + 18, 58);
  hpG.addColorStop(0, "#e0c070");
  hpG.addColorStop(0.6, "#c89850");
  hpG.addColorStop(1, "#9e7038");
  ctx.fillStyle = hpG;
  ctx.beginPath();
  ctx.ellipse(FIELD.plate.x, FIELD.plate.y + 18, 50, 28, 0, 0, TWO_PI);
  ctx.fill();

  // ── 10. BASE PATHS ──────────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = "#b48040";
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(FIELD.home.x + 14, FIELD.home.y - 18);
  ctx.lineTo(FIELD.first.x - 18, FIELD.first.y + 14);
  ctx.moveTo(FIELD.home.x - 14, FIELD.home.y - 18);
  ctx.lineTo(FIELD.third.x + 18, FIELD.third.y + 14);
  ctx.stroke();
  ctx.restore();

  // ── 11. FOUL LINES ──────────────────────────────────────────
  ctx.save();
  ctx.shadowBlur = 4;
  ctx.shadowColor = "rgba(255,255,255,0.5)";
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(FIELD.home.x - 3, FIELD.home.y - 12);
  ctx.lineTo(18, 106);
  ctx.moveTo(FIELD.home.x + 3, FIELD.home.y - 12);
  ctx.lineTo(942, 106);
  ctx.stroke();
  ctx.restore();

  // ── 12. BASELINE CHALK ──────────────────────────────────────
  ctx.save();
  ctx.shadowBlur = 3;
  ctx.shadowColor = "rgba(255,255,255,0.4)";
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(FIELD.home.x, FIELD.home.y);
  ctx.lineTo(FIELD.first.x, FIELD.first.y);
  ctx.lineTo(FIELD.second.x, FIELD.second.y);
  ctx.lineTo(FIELD.third.x, FIELD.third.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // ── 13. BATTER'S BOXES ──────────────────────────────────────
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.38)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 5]);
  ctx.strokeRect(FIELD.plate.x + 8, FIELD.plate.y - 32, 30, 62);
  ctx.strokeRect(FIELD.plate.x - 38, FIELD.plate.y - 32, 30, 62);
  ctx.setLineDash([]);
  ctx.restore();

  // ── BASE SHADOWS ────────────────────────────────────────────
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  for (const pos of [FIELD.first, FIELD.second, FIELD.third]) {
    ctx.beginPath();
    ctx.ellipse(pos.x + 5, pos.y + 5, 11, 7, 0.3, 0, TWO_PI);
    ctx.fill();
  }

  drawBase(FIELD.first, "1B", Boolean(game.bases.first));
  drawBase(FIELD.second, "2B", Boolean(game.bases.second));
  drawBase(FIELD.third, "3B", Boolean(game.bases.third));
  drawRunners();
  drawRunnerAnimations();
  drawDefensePositions();
  drawPlate();
  drawPitcher();
  drawCatcher();
  drawStrikeZoneGuide();
}

function drawScoreboard() {
  const ut = currentUserTeam();
  const op = game.aiTeam;
  ctx.save();

  // ── Background ───────────────────────────────────────────────
  const sbG = ctx.createLinearGradient(0, 0, 0, 76);
  sbG.addColorStop(0, "#060e08");
  sbG.addColorStop(1, "#0b1a0e");
  ctx.fillStyle = sbG;
  ctx.fillRect(0, 0, W, 76);

  // Team color accent strips
  ctx.fillStyle = ut.color || "#d71920";
  ctx.fillRect(0, 0, W / 2, 5);
  ctx.fillStyle = op?.color || "#1c3a58";
  ctx.fillRect(W / 2, 0, W / 2, 5);

  // Bottom separator
  ctx.fillStyle = "#182e1e";
  ctx.fillRect(0, 73, W, 3);

  // Center panel background
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(W / 2 - 92, 5, 184, 67);
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.strokeRect(W / 2 - 92, 5, 184, 67);

  // ── Left: user team ──────────────────────────────────────────
  drawTeamLogo(ut, 8, 10, 50, { shadow: false });

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#f0ece4";
  ctx.font = "900 20px Segoe UI";
  ctx.fillText(ut.shortName || ut.name, 66, 7);
  ctx.fillStyle = "#5a8060";
  ctx.font = "700 11px Segoe UI";
  ctx.fillText(`감독 ${ut.manager || ""}`, 66, 31);

  // User score
  ctx.fillStyle = ut.color || "#d71920";
  ctx.font = "900 34px Segoe UI";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText(String(game.userScore), 226, 42);

  // ── Center ───────────────────────────────────────────────────
  ctx.fillStyle = "#f4c24d";
  ctx.font = "900 11px Segoe UI";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`${game.inning}회  ${game.half === "top" ? "초  ▲" : "말  ▼"}`, W / 2, 10);

  ctx.fillStyle = "#e8ede4";
  ctx.font = "900 28px Segoe UI";
  ctx.textBaseline = "middle";
  ctx.fillText(`${game.userScore} - ${game.aiScore}`, W / 2, 40);

  ctx.fillStyle = "#4a7055";
  ctx.font = "700 10px Segoe UI";
  ctx.textBaseline = "bottom";
  ctx.fillText(game.playPhase, W / 2, 71);

  drawCountDots(W / 2 - 88, 52);
  drawMiniBases(W / 2 + 54, 56);

  // ── Right: opponent ──────────────────────────────────────────
  drawTeamLogo(op, W - 58, 10, 50, { shadow: false });

  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#f0ece4";
  ctx.font = "900 20px Segoe UI";
  ctx.fillText(op?.shortName || "AI", W - 68, 7);
  ctx.fillStyle = "#5a8060";
  ctx.font = "700 11px Segoe UI";
  ctx.fillText(`감독 ${op?.manager || ""}`, W - 68, 31);

  // AI score
  ctx.fillStyle = op?.color || "#1c3a58";
  ctx.font = "900 34px Segoe UI";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(String(game.aiScore), W - 224, 42);

  // Batter / pitcher quick names
  const batter = game.currentBatter?.name || "-";
  const pitName = (game.state === "batting" || isPvPMode() ? battingPitcher() : game.currentPitcher)?.name || "-";
  ctx.fillStyle = "#3a6045";
  ctx.font = "700 10px Segoe UI";
  ctx.textBaseline = "bottom";
  ctx.textAlign = "left";
  ctx.fillText(`타자 ${batter}`, 66, 72);
  ctx.textAlign = "right";
  ctx.fillText(`투수 ${pitName}`, W - 68, 72);

  ctx.restore();
  drawGameHUD();
}

function drawGameHUD() {
  const batter = game.currentBatter;
  const pitcherObj = game.state === "batting" || isPvPMode() ? battingPitcher() : game.currentPitcher;
  const offTeam = getOffenseTeam();
  const defTeam = getDefenseTeam();
  ctx.save();

  // ── HUD background ───────────────────────────────────────────
  const hudG = ctx.createLinearGradient(0, 80, 0, 138);
  hudG.addColorStop(0, "#09140b");
  hudG.addColorStop(1, "#060d08");
  ctx.fillStyle = hudG;
  ctx.fillRect(0, 80, W, 58);

  // Team color left/right accent bar
  ctx.fillStyle = offTeam?.color || "#d71920";
  ctx.fillRect(0, 80, 5, 58);
  ctx.fillStyle = defTeam?.color || "#1c3a58";
  ctx.fillRect(W - 5, 80, 5, 58);

  // Inner panel lines
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(310, 84); ctx.lineTo(310, 134);
  ctx.moveTo(650, 84); ctx.lineTo(650, 134);
  ctx.stroke();

  // Bottom edge
  ctx.fillStyle = "#182e1e";
  ctx.fillRect(0, 137, W, 2);

  ctx.textBaseline = "middle";

  // ── Offense (left) ───────────────────────────────────────────
  ctx.textAlign = "left";
  ctx.fillStyle = offTeam?.color || "#d71920";
  ctx.font = "900 9px Segoe UI";
  ctx.fillText(game.half === "top" ? "▶ 공격" : "▶ 수비", 14, 90);

  drawTeamLogo(offTeam, 46, 88, 28, { shadow: false });

  ctx.fillStyle = "#f0ece4";
  ctx.font = "900 18px Segoe UI";
  ctx.fillText(batter?.name || "-", 84, 100);

  ctx.fillStyle = "#5a8468";
  ctx.font = "700 10px Segoe UI";
  ctx.fillText(`컨 ${batter?.contact || "-"}   파 ${batter?.power || "-"}   주 ${batter?.speed || "-"}`, 84, 122);

  // ── Center: game status ──────────────────────────────────────
  ctx.textAlign = "center";
  if (isOnlinePvp()) {
    ctx.fillStyle = "#f4c24d";
    ctx.font = "900 10px Segoe UI";
    ctx.fillText(onlineRoleText(), W / 2, 89);
  }
  const statusText = game.resultText || game.playPhase;
  const fontSize = statusText.length > 8 ? 16 : 20;
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${fontSize}px Segoe UI`;
  ctx.fillText(statusText, W / 2, isOnlinePvp() ? 113 : 108);

  // Pitch speed (if available)
  if (game.pitchSpeed && game.ball.active) {
    ctx.fillStyle = "#4a9868";
    ctx.font = "700 10px Segoe UI";
    ctx.fillText(`${game.pitchType}  ${game.pitchSpeed}km/h`, W / 2, isOnlinePvp() ? 128 : 125);
  }

  // ── Defense (right) ──────────────────────────────────────────
  ctx.textAlign = "right";
  ctx.fillStyle = defTeam?.color || "#1c3a58";
  ctx.font = "900 9px Segoe UI";
  ctx.fillText("마운드 ◀", W - 14, 90);

  drawTeamLogo(defTeam, W - 74, 88, 28, { shadow: false });

  ctx.fillStyle = "#f0ece4";
  ctx.font = "900 18px Segoe UI";
  ctx.fillText(pitcherObj?.name || "-", W - 84, 100);

  ctx.fillStyle = "#5a8468";
  ctx.font = "700 10px Segoe UI";
  ctx.fillText(`구 ${pitcherObj?.velocity || "-"}   제 ${pitcherObj?.control || "-"}   체 ${Math.round(pitcherObj?.stamina || 0)}`, W - 84, 122);

  ctx.restore();
}

function drawBatting() {
  drawBatter();
  drawBall();
  drawHitBall();
  drawThrowBall();
  if (!game.ball.active && game.state === "batting") {
    drawCenterHint("투수가 준비 중");
  }
}

function drawPitching() {
  drawBatter(true);
  drawBall();
  drawHitBall();
  drawThrowBall();
  if (!game.ball.active && game.state === "pitching") {
    drawCenterHint(`${game.selectedPitch} 선택됨`);
  }
}

function drawBullpen() {}

function drawResult() {
  if (!game.resultText) return;
  ctx.save();
  const isHR = game.resultText.includes("홈런") || game.resultText.includes("만루");
  const isGood = isHR || game.resultText.includes("안타") || game.resultText.includes("출루");
  const boxW = isHR ? 460 : 360;
  const boxH = isHR ? 80 : 62;
  const boxX = W / 2 - boxW / 2;
  const boxY = 158;
  const fade = Math.min(1, game.resultTimer / game.resultDuration);

  ctx.globalAlpha = 0.95 * fade;

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(boxX + 5, boxY + 5, boxW, boxH);

  // Background gradient
  const bg = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
  if (isHR) {
    bg.addColorStop(0, "#b81018");
    bg.addColorStop(1, "#7a0a10");
  } else {
    bg.addColorStop(0, "#0e1e12");
    bg.addColorStop(1, "#060e08");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(boxX, boxY, boxW, boxH);

  // Border
  ctx.strokeStyle = isHR ? "#ffd34d" : (isGood ? "#4aaa70" : "rgba(255,255,255,0.5)");
  ctx.lineWidth = isHR ? 4 : 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  // Top accent line
  ctx.fillStyle = isHR ? "#ffd34d" : (isGood ? "#4aaa70" : "rgba(255,255,255,0.3)");
  ctx.fillRect(boxX, boxY, boxW, 4);

  // Text shadow
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.font = `900 ${isHR ? 52 : 38}px Segoe UI`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(game.resultText, W / 2 + 2, boxY + boxH / 2 + 2);

  // Text
  ctx.fillStyle = isHR ? "#ffd34d" : "#ffffff";
  ctx.fillText(game.resultText, W / 2, boxY + boxH / 2);

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
  const team = isAi ? game.aiTeam : currentUserTeam();
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(isAi ? Math.PI * 1.05 : Math.PI * 0.72);
  ctx.fillStyle = "#f7e8d0";
  ctx.beginPath();
  ctx.arc(0, -14, 6, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = team?.color || (isAi ? "#27405f" : "#d71920");
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
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(p.x - 13, p.y - 7);
  ctx.lineTo(p.x + 13, p.y - 7);
  ctx.lineTo(p.x + 11, p.y + 7);
  ctx.lineTo(p.x, p.y + 16);
  ctx.lineTo(p.x - 11, p.y + 7);
  ctx.closePath();
  ctx.fill();
}

function drawStrikeZoneGuide() {
  const zone = FIELD.strike;
  const L = zone.x - zone.w / 2;
  const T = zone.y - zone.h / 2;
  const W2 = zone.w;
  const H2 = zone.h;
  ctx.save();
  // Outer shadow
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 8;
  ctx.strokeRect(L - 1, T - 1, W2 + 2, H2 + 2);
  // Zone fill (very subtle)
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(L, T, W2, H2);
  // White border
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(L, T, W2, H2);
  // Red corner accents
  const cs = 14;
  ctx.strokeStyle = "#d71920";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "square";
  ctx.beginPath();
  // TL
  ctx.moveTo(L, T + cs); ctx.lineTo(L, T); ctx.lineTo(L + cs, T);
  // TR
  ctx.moveTo(L + W2 - cs, T); ctx.lineTo(L + W2, T); ctx.lineTo(L + W2, T + cs);
  // BL
  ctx.moveTo(L, T + H2 - cs); ctx.lineTo(L, T + H2); ctx.lineTo(L + cs, T + H2);
  // BR
  ctx.moveTo(L + W2 - cs, T + H2); ctx.lineTo(L + W2, T + H2); ctx.lineTo(L + W2, T + H2 - cs);
  ctx.stroke();
  ctx.restore();
}

function drawBase(pos, label, occupied) {
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.rotate(Math.PI / 4);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(-5, -4, 15, 15);
  // body
  const bg = ctx.createLinearGradient(-7, -7, 7, 7);
  if (occupied) {
    bg.addColorStop(0, "#ffe87a");
    bg.addColorStop(1, "#cc9010");
  } else {
    bg.addColorStop(0, "#f6f4ee");
    bg.addColorStop(1, "#cac6bc");
  }
  ctx.fillStyle = bg;
  ctx.fillRect(-7, -7, 14, 14);
  // highlight
  ctx.fillStyle = occupied ? "rgba(255,255,200,0.5)" : "rgba(255,255,255,0.55)";
  ctx.fillRect(-6, -6, 6, 6);
  // border
  ctx.strokeStyle = occupied ? "rgba(180,120,0,0.7)" : "rgba(160,155,145,0.65)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-7, -7, 14, 14);
  ctx.restore();
  ctx.fillStyle = "rgba(8,20,8,0.88)";
  ctx.font = "900 9px Segoe UI";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, pos.x, pos.y + (label === "2B" ? -21 : 22));
}

function drawRunners() {
  const spots = [
    ["first", FIELD.first, 16, -16],
    ["second", FIELD.second, 0, -22],
    ["third", FIELD.third, -16, -16],
  ];
  for (const [base, pos, ox, oy] of spots) {
    const runner = game.bases[base];
    if (!runner) continue;
    if (isRunnerMovingToBase(runner, base)) continue;
    drawRunnerIcon(pos.x + ox, pos.y + oy, runner, false);
  }
}

function isRunnerMovingToBase(runner, base) {
  return game.runnerAnimations.some((animation) => animation.runner === runner && animation.toBase === base);
}

function drawRunnerAnimations() {
  for (const runner of game.runnerAnimations) {
    const p = runnerPathPoint(runner);
    drawRunnerIcon(p.x, p.y, runner.runner, true);
  }
}

function drawRunnerIcon(x, y, runner, moving) {
  ctx.save();
  ctx.translate(x, y);
  const color = game.half === "top" ? currentUserTeam().color || "#d71920" : game.aiTeam.color || "#27405f";
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 11, moving ? 12 : 10, 4, 0, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = "#f3dfbf";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  const stride = moving ? Math.sin(performance.now() / 70) * 4 : 0;
  ctx.beginPath();
  ctx.moveTo(-5, 5);
  ctx.lineTo(-10, 11 + stride);
  ctx.moveTo(5, 5);
  ctx.lineTo(10, 11 - stride);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, moving ? 9 : 8, 0, TWO_PI);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "900 8px Segoe UI";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((runner.name || "R").slice(0, 1), 0, 0);
  ctx.fillStyle = "#f3dfbf";
  ctx.beginPath();
  ctx.arc(0, -12, 5, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function runnerPathPoint(animation) {
  const t = easeInOut(animation.t);
  if (animation.path?.length > 1) {
    const targetDistance = animation.totalDistance * t;
    let walked = 0;
    for (let i = 0; i < animation.path.length - 1; i += 1) {
      const a = animation.path[i];
      const b = animation.path[i + 1];
      const legDistance = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      if (walked + legDistance >= targetDistance || i === animation.path.length - 2) {
        const legT = clamp((targetDistance - walked) / legDistance, 0, 1);
        const legEase = easeInOut(legT);
        return {
          x: a.x + (b.x - a.x) * legEase,
          y: a.y + (b.y - a.y) * legEase - Math.sin(legT * Math.PI) * 8,
        };
      }
      walked += legDistance;
    }
  }
  const x = animation.from.x + (animation.to.x - animation.from.x) * t;
  const y = animation.from.y + (animation.to.y - animation.from.y) * t - Math.sin(t * Math.PI) * 12;
  return { x, y };
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
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
  const userDefense = game.half === "bottom";
  const base = userDefense ? currentUserTeam().color || "#d71920" : game.aiTeam.color || "#27405f";
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

function drawThrowBall(frontLayer = false) {
  const throwBall = game.throwBall;
  if (!throwBall || throwBall.timer < throwBall.delay) return;
  const t = clamp((throwBall.timer - throwBall.delay) / throwBall.duration, 0, 1);
  const arcPoint = (progress) => ({
    x: throwBall.from.x + (throwBall.to.x - throwBall.from.x) * progress,
    y: throwBall.from.y + (throwBall.to.y - throwBall.from.y) * progress - Math.sin(progress * Math.PI) * 36,
  });
  const pos = arcPoint(t);
  ctx.save();

  ctx.globalAlpha = frontLayer ? 0.48 : 0.34;
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = frontLayer ? 13 : 10;
  ctx.beginPath();
  for (let i = 0; i <= 26; i += 1) {
    const point = arcPoint(i / 26);
    if (i === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();

  ctx.globalAlpha = frontLayer ? 0.98 : 0.86;
  ctx.strokeStyle = "#ffd34d";
  ctx.lineWidth = frontLayer ? 7 : 5;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  for (let i = 0; i <= 26; i += 1) {
    const point = arcPoint(i / 26);
    if (i === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  const trailStart = Math.max(0, t - 0.32);
  for (let i = 0; i < 8; i += 1) {
    const progress = trailStart + (t - trailStart) * (i / 7);
    const point = arcPoint(progress);
    ctx.globalAlpha = 0.16 + i * 0.09;
    ctx.fillStyle = i > 5 ? "#ffffff" : "#ffd34d";
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5 + i * 0.45, 0, TWO_PI);
    ctx.fill();
  }

  const pulse = 1 + Math.sin(throwBall.timer * 13) * 0.12;
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "#ff2b2b";
  ctx.lineWidth = frontLayer ? 5 : 4;
  ctx.beginPath();
  ctx.arc(throwBall.to.x, throwBall.to.y, 17 * pulse, 0, TWO_PI);
  ctx.stroke();

  ctx.shadowColor = "#ffd34d";
  ctx.shadowBlur = frontLayer ? 24 : 16;
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, frontLayer ? 11 : 9, 0, TWO_PI);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#d71920";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = "#050505";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(pos.x - 2, pos.y, frontLayer ? 5 : 4, -1.1, 1.1);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(pos.x + 2, pos.y, frontLayer ? 5 : 4, Math.PI - 1.1, Math.PI + 1.1);
  ctx.stroke();

  if (frontLayer) {
    ctx.font = "900 18px Segoe UI";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#050505";
    ctx.fillStyle = "#ffd34d";
    ctx.strokeText("송구!", pos.x, pos.y - 17);
    ctx.fillText("송구!", pos.x, pos.y - 17);
  }
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
  const pitcherObj = game.state === "batting" || isPvPMode() ? battingPitcher() : game.currentPitcher;
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

function startPitch(pitchType, mode, options = {}) {
  if (mode === "batting" && !canUseLocalControls() && !options.onlineDefenseThrow) return;
  if (mode === "batting" && game.half === "top" && game.aiPitcher.stamina <= 0) autoChangeAIPitcher();
  const pitcherObj = mode === "batting" ? battingPitcher() : game.currentPitcher;
  if ((mode === "pitching" || options.onlineDefenseThrow) && pitcherObj.stamina <= 0) {
    game.warning = "투수 체력 0 - 교체 필요";
    showResult("투수 교체 필요!", 0.9, () => {
      game.state = "bullpen";
      renderUI(true);
    });
    return;
  }

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
  const pitchPath = { start: { ...FIELD.mound }, end, movement };
  const inZone = pitchTouchesStrikeLine(pitchPath);
  game.pitchType = pitchType;
  game.pitchSpeed = speed;
  game.pitchMovement = movement;
  game.ball = {
    active: true,
    mode,
    x: FIELD.mound.x,
    y: FIELD.mound.y,
    start: pitchPath.start,
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
  if (options.onlineDefenseThrow) {
    game.state = "batting";
    game.onlineWaiting = false;
    game.playPhase = "상대 타격 관전";
    broadcastOnlinePitch();
    renderUI(true);
  }
}

function swingBat() {
  if (!canUseLocalControls()) return;
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
  const activePitcher = battingPitcher();
  const pitchDifficulty = ball.speed * 0.22 + Math.abs(ball.movement.x) * 0.32 + Math.abs(ball.movement.y) * 0.16 + activePitcher.control * 0.12;
  const contactScore = batter.contact + timingBonus + contactQuality * 24 - pitchDifficulty * 0.36 + randomInt(-10, 14);
  const powerScore = batter.power + game.swingPower * 0.72 + contactQuality * 18 - pitchDifficulty * 0.18 + randomInt(-14, 16);
  game.swingTiming = Math.round(100 - timingDiff);
  game.lastContact = {
    ...(contact || {}),
    quality: contactQuality,
    timingDiff,
    powerScore,
    contactScore,
    batter,
  };
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

  if (contactQuality >= 0.68 && timingDiff < 30 && contactScore > 68) {
    if (sweet && powerScore > 132 && roll < 0.54) return basesLoaded ? "만루홈런" : "홈런";
    if (powerScore > 112 && batter.speed > 72 && roll < 0.12) return "3루타";
    if (powerScore > 96 && roll < 0.34) return "2루타";
    if (hasForceAtSecond && contactScore < 75 && roll < 0.08) return "병살타";
    return roll < 0.78 ? "1루타" : roll < 0.9 ? "플라이아웃" : "땅볼아웃";
  }

  if (contactQuality < 0.18) return "파울";
  if (hasForceAtSecond && jammed && roll < 0.34) return "병살타";
  if (jammed) return roll < 0.54 ? "땅볼아웃" : roll < 0.66 ? "파울" : "1루타";
  if (under) return roll < 0.52 - launchBoost ? "플라이아웃" : roll < 0.6 ? "파울" : "1루타";
  if (hasForceAtSecond && weak && roll < 0.28) return "병살타";
  if (weak) {
    if (roll < 0.34) return "땅볼아웃";
    if (roll < 0.62) return "플라이아웃";
    if (roll < 0.9) return "1루타";
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
  return roll < 0.72 ? "1루타" : roll < 0.82 ? "2루타" : roll < 0.9 ? "파울" : powerScore > 94 ? "플라이아웃" : "땅볼아웃";
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
  const collisionRadius = game.buntMode ? 18 : 23;
  if (projected.distance > collisionRadius) return null;
  const barrel = clamp((projected.along - 0.2) / 0.8, 0, 1);
  return {
    distance: projected.distance,
    along: projected.along,
    quality: clamp(1 - projected.distance / collisionRadius + barrel * 0.16, 0, 1),
    sweetSpot: clamp(1 - Math.abs(projected.along - 0.7) / 0.48, 0, 1),
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
  const rotation = Math.PI * 0.72 + game.bat.angle;
  const start = batLocalToWorld(18, 0, rotation);
  const end = batLocalToWorld(88, 0, rotation);
  return {
    start,
    end,
  };
}

function batLocalToWorld(x, y, rotation) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  return {
    x: FIELD.batter.x + x * cos - y * sin,
    y: FIELD.batter.y + x * sin + y * cos,
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
  const withinLineWidth = point.x >= zone.x - zone.w / 2 - 14 && point.x <= zone.x + zone.w / 2 + 14;
  return withinLineWidth && Math.abs(point.y - zone.y) <= 9;
}

function pitchTouchesStrikeLine(ballLike) {
  const zone = FIELD.strike;
  const left = zone.x - zone.w / 2 - 14;
  const right = zone.x + zone.w / 2 + 14;
  let prev = getPitchPoint(ballLike, 0);
  if (isPointInStrikeZone(prev)) return true;
  for (let i = 1; i <= 32; i += 1) {
    const point = getPitchPoint(ballLike, i / 32);
    if (isPointInStrikeZone(point) || segmentTouchesStrikeLine(prev, point, zone.y, left, right)) return true;
    prev = point;
  }
  return false;
}

function segmentTouchesStrikeLine(a, b, lineY, left, right) {
  const tolerance = 9;
  if (Math.max(a.y, b.y) < lineY - tolerance || Math.min(a.y, b.y) > lineY + tolerance) return false;
  if (Math.abs(b.y - a.y) < 0.001) {
    return Math.abs(a.y - lineY) <= tolerance && Math.max(a.x, b.x) >= left && Math.min(a.x, b.x) <= right;
  }
  const t = clamp((lineY - a.y) / (b.y - a.y), 0, 1);
  const x = a.x + (b.x - a.x) * t;
  return x >= left && x <= right;
}

function resolvePitchingResult(aiSwung) {
  if (!aiSwung) return resolveTakenPitch("pitching");
  game.playPhase = "AI 스윙";
  const ball = game.ball;
  const batter = getAIBatter();
  const timingDiff = Math.abs(ball.t - game.aiSwingPoint) * 100;
  const fatigue = getFatigueLevel(game.currentPitcher);
  const pitchDifficulty = ball.speed * 0.17 + Math.abs(ball.movement.x) * 0.34 + game.currentPitcher.breaking * 0.26 - fatigue * 34;
  const diffMod = getAIDiffMod();
  const contactScore = batter.contact + batter.eye * 0.18 + randomInt(-18, 18) - pitchDifficulty * 0.4 + diffMod.contact;
  const powerScore = batter.power + batter.launch * 0.12 + randomInt(-15, 15) - pitchDifficulty * 0.2 + diffMod.power;
  game.ball.active = false;

  if (timingDiff > 44 || contactScore < 42) {
    addStrike("AI 헛스윙!");
    return;
  }
  if (contactScore < 57 || Math.random() < 0.26) {
    addStrike("파울!", true);
    startHitAnimation("파울", 150, "#f7f7f7");
    return;
  }
  const result = chooseAIBattedBallResult({ batter, contactScore, powerScore, timingDiff, fatigue });
  applyHitResult(result);
}

function chooseAIBattedBallResult({ batter, contactScore, powerScore, timingDiff, fatigue }) {
  const roll = Math.random();
  const forceAtSecond = game.bases.first && game.outs < 2;
  const solidContact = contactScore > 78 && timingDiff < 20;
  const weakContact = contactScore < 66 || timingDiff > 34;

  if (forceAtSecond && weakContact && roll < 0.34) return "병살타";
  if (weakContact) {
    if (roll < 0.42) return "땅볼아웃";
    if (roll < 0.74) return "플라이아웃";
    if (roll < 0.88) return "파울";
    return "1루타";
  }

  if (powerScore > 130 && solidContact && roll < 0.18 + fatigue * 0.08) return "홈런";
  if (powerScore > 112 && solidContact && roll < 0.28) return batter.speed > 78 && roll < 0.08 ? "3루타" : "2루타";
  if (forceAtSecond && contactScore < 74 && roll < 0.18) return "병살타";
  if (roll < 0.34) return "땅볼아웃";
  if (roll < 0.58) return "플라이아웃";
  if (roll < 0.84) return "1루타";
  if (roll < 0.94) return "2루타";
  return powerScore > 118 ? "홈런" : "파울";
}

function resolveTakenPitch(mode) {
  const ball = game.ball;
  game.ball.active = false;
  ball.inZone = pitchTouchesStrikeLine(ball);
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
    const battedBall = startHitAnimation(result, result === "플라이아웃" ? 300 : 150, result === "플라이아웃" ? "#ffffff" : "#e6d0a5");
    if (result === "땅볼아웃") {
      animateRunner(runner, "home", "first");
      queueOutThrow(battedBall, "first", 0.12);
    }
    if (result === "플라이아웃" && game.bases.third && game.outs < 2 && Math.random() < 0.35) {
      const thirdRunner = game.bases.third;
      game.bases.third = null;
      animateRunner(thirdRunner, "third", "home");
      scoreRun(1);
      recordOut(1, "희생플라이!");
      return;
    }
    recordOut(1, `${label}!`);
    return;
  }
  if (result === "병살타") {
    const battedBall = startHitAnimation("병살타", 140, "#e6d0a5");
    if (game.bases.first) animateRunner(game.bases.first, "first", "second");
    animateRunner(runner, "home", "first");
    queueOutThrow(battedBall, "second", 0.08);
    if (game.bases.first) game.bases.first = null;
    recordOut(Math.min(2, 3 - game.outs), "병살타!");
    return;
  }
  const bases = result === "2루타" ? 2 : result === "3루타" ? 3 : result === "홈런" || result === "만루홈런" ? 4 : 1;
  const battedBall = startHitAnimation(result, bases === 4 ? 520 : 190 + bases * 80, bases === 4 ? "#ffd34d" : "#fff");
  const play = advanceRunners(bases, runner, battedBall, result);
  const suffix = play.outs ? ` · ${play.outBaseLabel} 송구 아웃!` : "!";
  finishPlateAppearance(`${label}${suffix}`);
}

function advanceRunners(basesToAdvance, batterRunner, battedBall = game.hitBall, result = "1루타") {
  if (basesToAdvance >= 4) {
    let runs = 1;
    for (const key of ["first", "second", "third"]) {
      if (game.bases[key]) {
        runs += 1;
        animateRunner(game.bases[key], key, "home");
      }
      game.bases[key] = null;
    }
    animateRunner(batterRunner, "home", "home");
    scoreRun(runs);
    return { runs, outs: 0, outBaseLabel: "" };
  }

  const plans = buildRunnerAdvancePlans(basesToAdvance, batterRunner, battedBall, result);
  const outPlan = chooseThrowOutPlan(plans, battedBall, result);
  if (outPlan) {
    outPlan.out = true;
    if (outPlan.throwInfo) {
      game.throwBall = {
        ...outPlan.throwInfo,
        timer: 0,
      };
    }
  }

  const next = { first: null, second: null, third: null };
  let runs = 0;
  let outs = 0;
  for (const plan of plans) {
    animateRunner(plan.runner, plan.fromBase, plan.toBase);
    if (plan.out && game.outs + outs < 3) {
      outs += 1;
      continue;
    }
    if (plan.toNo >= 4) runs += 1;
    else next[plan.toBase] = plan.runner;
  }

  game.bases = next;
  scoreRun(runs);
  if (outs) game.outs = clamp(game.outs + outs, 0, 3);
  return {
    runs,
    outs,
    outBaseLabel: outPlan ? baseDisplayName(outPlan.toBase) : "",
  };
}

function buildRunnerAdvancePlans(basesToAdvance, batterRunner, battedBall, result) {
  const plans = [];
  const existing = [
    { fromBase: "third", fromNo: 3, runner: game.bases.third },
    { fromBase: "second", fromNo: 2, runner: game.bases.second },
    { fromBase: "first", fromNo: 1, runner: game.bases.first },
  ];

  for (const item of existing) {
    if (!item.runner) continue;
    let toNo = item.fromNo + basesToAdvance;
    if (basesToAdvance === 1 && item.fromBase === "second" && shouldTryExtraBase(item.runner, "home", battedBall, result)) toNo = 4;
    if (basesToAdvance === 1 && item.fromBase === "first" && shouldTryExtraBase(item.runner, "third", battedBall, result)) toNo = 3;
    if (basesToAdvance === 2 && item.fromBase === "first" && shouldTryExtraBase(item.runner, "home", battedBall, result)) toNo = 4;
    plans.push(makeRunnerPlan(item.runner, item.fromBase, baseNameFromNumber(toNo), item.fromNo, toNo));
  }

  plans.push(makeRunnerPlan(batterRunner, "home", baseNameFromNumber(basesToAdvance), 0, basesToAdvance, true));
  return plans;
}

function makeRunnerPlan(runner, fromBase, toBase, fromNo, toNo, isBatter = false) {
  return {
    runner,
    fromBase,
    toBase,
    fromNo,
    toNo,
    isBatter,
    runnerTime: runnerTravelTime(runner, fromBase, toBase, isBatter),
    out: false,
  };
}

function shouldTryExtraBase(runner, targetBase, battedBall, result) {
  if (targetBase === "third") {
    const runnerSpeedValue = runner?.speed || 60;
    const targetPoint = battedBall?.end || FIELD.second;
    const isDeepSingle = targetPoint.y < 215 || Math.abs(targetPoint.x - FIELD.plate.x) > 285;
    const isGapSingle = targetPoint.y < 245 && Math.abs(targetPoint.x - FIELD.plate.x) > 205;
    if (!isDeepSingle && !isGapSingle && runnerSpeedValue < 82) return Math.random() < 0.035;
    const extraChance = clamp(
      0.03 + (runnerSpeedValue - 65) / 220 + (isDeepSingle ? 0.14 : 0) + (isGapSingle ? 0.1 : 0),
      0.03,
      0.36
    );
    return Math.random() < extraChance;
  }
  const speed = runner?.speed || 60;
  const target = battedBall?.end || FIELD.second;
  const deepBall = target.y < 235 || Math.abs(target.x - FIELD.plate.x) > 250;
  const cleanGap = result === "2루타" || target.y < 210;
  const chance =
    targetBase === "home"
      ? clamp(0.16 + speed / 260 + (deepBall ? 0.18 : 0) + (cleanGap ? 0.16 : 0), 0.12, 0.82)
      : clamp(0.18 + speed / 300 + (deepBall ? 0.14 : 0), 0.1, 0.7);
  return Math.random() < chance;
}

function chooseThrowOutPlan(plans, battedBall, result) {
  if (!battedBall || result.includes("홈런")) return null;
  const defense = estimateDefenseTiming(battedBall, result);
  const throwCandidates = plans
    .map((plan) => {
      const basePoint = getRunnerBasePoint(plan.toBase);
      const throwDistance = Math.hypot(basePoint.x - defense.fieldPoint.x, basePoint.y - defense.fieldPoint.y);
      const throwSpeed = defense.fielder?.label === "LF" || defense.fielder?.label === "CF" || defense.fielder?.label === "RF" ? 400 : 520;
      const throwDuration = Math.max(0.38, throwDistance / throwSpeed + 0.13 + Math.random() * 0.10);
      const throwArrival = defense.fieldTime + throwDuration;
      const beatBy = plan.runnerTime - throwArrival;
      const value = plan.toBase === "home" ? 4 : plan.toBase === "third" ? 3 : plan.toBase === "second" ? 2 : 1;
      return {
        plan,
        beatBy,
        value,
        throwInfo: {
          from: { ...defense.fieldPoint },
          to: basePoint,
          delay: defense.fieldTime,
          duration: throwDuration,
        },
      };
    })
    .filter(({ plan, beatBy }) => {
      if (plan.isBatter) return false;
      if (plan.toNo >= 4) return beatBy > 0.12;
      if (plan.toNo - plan.fromNo <= (result === "2루타" ? 2 : 1)) return false;
      return beatBy > 0.16;
    })
    .sort((a, b) => b.value - a.value || b.beatBy - a.beatBy);
  if (!throwCandidates[0]) return null;
  throwCandidates[0].plan.throwInfo = throwCandidates[0].throwInfo;
  return throwCandidates[0].plan;
}

function estimateDefenseTiming(battedBall, result) {
  const target = battedBall.end || FIELD.second;
  const candidates =
    target.y < 250 || result === "플라이아웃"
      ? game.fielders.filter((f) => ["LF", "CF", "RF", "SS", "2B"].includes(f.label))
      : game.fielders.filter((f) => ["1B", "2B", "SS", "3B", "p"].includes(f.label));
  const fielder = nearestFielder(candidates, target) || game.fielders[0];
  const fielderDistance = Math.hypot((fielder?.homeX || fielder?.x || FIELD.mound.x) - target.x, (fielder?.homeY || fielder?.y || FIELD.mound.y) - target.y);
  const ballTime = (battedBall.duration || 1) * (target.y < 250 ? 0.96 : 0.76);
  const fielderTime = (battedBall.reactionDelay || 0.1) + fielderDistance / ((fielder?.speed || 170) * 0.72);
  return {
    fielder,
    fieldPoint: target,
    fieldTime: Math.max(ballTime, fielderTime) + 0.28 + Math.random() * 0.18,
  };
}

function queueOutThrow(battedBall, toBase, extraDelay = 0) {
  if (!battedBall) return;
  const defense = estimateDefenseTiming(battedBall, battedBall.result);
  const to = getRunnerBasePoint(toBase);
  const distance = Math.hypot(to.x - defense.fieldPoint.x, to.y - defense.fieldPoint.y);
  game.throwBall = {
    from: { ...defense.fieldPoint },
    to,
    delay: defense.fieldTime + extraDelay,
    duration: Math.max(0.38, distance / 520 + 0.13 + Math.random() * 0.10),
    timer: 0,
  };
}

function runnerTravelTime(runner, fromBase, toBase, isBatter = false) {
  const speed = clamp(runner?.speed || 60, 30, 99);
  const path = buildBasePath(fromBase, toBase);
  const distance = pathDistance(path);
  const runnerSpeed = 108 + speed * 1.15;
  const turns = Math.max(0, path.length - 2);
  return distance / runnerSpeed + turns * 0.18 + (isBatter ? 0.18 : 0.04) + randomInt(-5, 9) / 100;
}

function baseNumber(base) {
  if (base === "first") return 1;
  if (base === "second") return 2;
  if (base === "third") return 3;
  if (base === "home") return 4;
  return 0;
}

function baseNameFromNumber(number) {
  if (number <= 0) return "home";
  if (number === 1) return "first";
  if (number === 2) return "second";
  if (number === 3) return "third";
  return "home";
}

function baseDisplayName(base) {
  if (base === "first") return "1루";
  if (base === "second") return "2루";
  if (base === "third") return "3루";
  return "홈";
}

function walkBatter() {
  const runner = runnerFromCurrentBatter();
  let runs = 0;
  if (game.bases.first && game.bases.second && game.bases.third) {
    runs += 1;
    animateRunner(game.bases.third, "third", "home");
  }
  if (game.bases.first && game.bases.second) {
    animateRunner(game.bases.second, "second", "third");
    game.bases.third = game.bases.second;
  }
  if (game.bases.first) {
    animateRunner(game.bases.first, "first", "second");
    game.bases.second = game.bases.first;
  }
  animateRunner(runner, "home", "first");
  game.bases.first = runner;
  scoreRun(runs);
  finishPlateAppearance(runs ? "밀어내기 볼넷!" : "볼넷!");
}

function recordOut(count, text) {
  game.outs = clamp(game.outs + count, 0, 3);
  resetCount();
  nextBatter();
  showResult(text, resultDurationWithThrow(1.15), () => {
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
  showResult(text, resultDurationWithThrow(text.includes("홈런") ? 1.8 : 1.15), () => {
    if (game.outs >= 3) switchHalfInning();
    else resumeHalf();
  });
}

function resultDurationWithThrow(baseDuration) {
  if (!game.throwBall) return baseDuration;
  return Math.max(baseDuration, game.throwBall.delay + game.throwBall.duration + 0.72);
}

function switchHalfInning(forceBottom = false) {
  resetCount();
  game.outs = 0;
  game.bases = { first: null, second: null, third: null };
  game.runnerAnimations = [];
  game.throwBall = null;
  if (forceBottom || game.half === "top") {
    game.half = "bottom";
    game.state = "inningChange";
    game.playPhase = "공수교대";
    showResult(`${game.inning}회 말`, 1.0, () => {
      if (isPvPMode()) {
        prepareBattingPitch();
      } else {
        game.state = "pitching";
        game.playPhase = "구종 선택";
        game.selectedPitch = game.currentPitcher.pitches[0];
      }
      syncCurrentMatchup();
      renderUI(true);
    });
    broadcastOnlineSnapshot("halfChange", { force: true });
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
    broadcastOnlineSnapshot("halfChange", { force: true });
  }
}

function checkGameEnd() {
  if (game.inning <= 9) return false;
  if (game.userScore === game.aiScore && game.inning <= 10) return false;
  game.state = "gameOver";
  saveRecord();
  broadcastOnlineSnapshot("gameOver");
  renderUI(true);
  return true;
}

function chooseAIPitch() {
  const pitches = game.aiPitcher.pitches;
  return pitches[randomInt(0, pitches.length - 1)];
}

function getDifficulty() {
  try { return JSON.parse(localStorage.getItem("fullcount:settings"))?.difficulty || "normal"; } catch { return "normal"; }
}

function getAIDiffMod() {
  const d = getDifficulty();
  if (d === "easy")   return { swing: -0.18, contact: -24, power: -22, timing: 0.66 };
  if (d === "hard")   return { swing:  0.12, contact:  16, power:  14, timing: 0.84 };
  if (d === "expert") return { swing:  0.22, contact:  28, power:  26, timing: 0.89 };
  return                     { swing:  0,    contact:   0, power:   0, timing: 0.78 };
}

function chooseAISwing() {
  const batter = getAIBatter();
  const zoneBias = game.ball.inZone ? 0.34 : -0.26;
  const countBias = game.strikes >= 2 ? 0.18 : game.balls >= 3 ? -0.08 : 0;
  const fatigue = getFatigueLevel(game.currentPitcher);
  const difficulty = pitchCatalog[game.pitchType].controlDifficulty / 100 + Math.abs(game.pitchMovement.x) / 170 - fatigue * 0.22;
  const mod = getAIDiffMod();
  const chance = clamp(0.27 + batter.contact / 260 + batter.eye / 420 + zoneBias + countBias - difficulty + mod.swing, 0.06, 0.9);
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
  const next = chooseAIBullpenPitcher(true);
  if (!next) return;
  game.aiPitcher = clonePitcher(next);
  game.resultText = `${game.aiTeam.name} 투수 교체`;
}

function maybeAutoChangeAIPitcher() {
  if (!game.aiPitcher || game.half !== "top") return;
  const fatigue = getFatigueLevel(game.aiPitcher);
  const lead = game.aiScore - game.userScore;
  const saveSituation = game.inning >= 9 && lead > 0 && lead <= 3;
  const starterTired = game.aiPitcher.roleType === "starter" && (game.inning >= 7 || fatigue > 0.76);
  const relieverTired = game.aiPitcher.roleType !== "starter" && (fatigue > 0.72 || game.aiPitcher.stamina <= 3);
  const blowupRisk = game.bases.first || game.bases.second || game.bases.third ? fatigue > 0.58 && game.outs < 2 : false;
  if (!saveSituation && !starterTired && !relieverTired && !blowupRisk && game.aiPitcher.stamina > 0) return;
  const next = chooseAIBullpenPitcher(false);
  if (!next || next.name === game.aiPitcher.name) return;
  game.aiPitcher = clonePitcher(next);
  game.resultText = saveSituation ? `${next.name} 마무리 등판` : `${next.name} 불펜 등판`;
}

function chooseAIBullpenPitcher(force = false) {
  const usedName = game.aiPitcher?.name;
  const available = game.aiTeam.bullpen.filter((p) => p.name !== usedName);
  if (!available.length) return game.aiTeam.bullpen[0] || null;
  const lead = game.aiScore - game.userScore;
  const leverage = game.inning >= 8 && Math.abs(lead) <= 3;
  const saveSituation = game.inning >= 9 && lead > 0 && lead <= 3;
  const scoredRecently = game.userScore > game.aiScore;
  const scoredClose = game.inning >= 7 && lead <= 1;
  const sorted = [...available].sort((a, b) => {
    const aCloser = a.role.includes("마무리") ? 18 : 0;
    const bCloser = b.role.includes("마무리") ? 18 : 0;
    const aScore = a.control * 0.34 + a.breaking * 0.26 + a.velocity * 0.2 + a.composure * 0.2 + (saveSituation ? aCloser : 0);
    const bScore = b.control * 0.34 + b.breaking * 0.26 + b.velocity * 0.2 + b.composure * 0.2 + (saveSituation ? bCloser : 0);
    return bScore - aScore;
  });
  if (saveSituation) return sorted.find((p) => p.role.includes("마무리")) || sorted[0];
  if (leverage || scoredClose || force) return sorted[0];
  if (scoredRecently) return sorted[Math.min(sorted.length - 1, 1)] || sorted[0];
  return sorted[randomInt(0, Math.min(sorted.length - 1, 2))];
}

function changePitcher(newPitcher) {
  setControlledPitcher(newPitcher);
  game.warning = "";
  localStorage.setItem("fullcount:selectedPitcher", newPitcher.name);
  showResult(`${newPitcher.name} 등판!`, 1.0, () => {
    if (isOnlinePvp() && canPitchOnlineHalf()) setOnlineDefenseReady();
    else game.state = "pitching";
    renderUI(true);
  });
}

function prepareBattingPitch() {
  if (game.half === "top") maybeAutoChangeAIPitcher();
  if (isOnlinePvp()) {
    if (canControlOnlineHalf()) setOnlineOffenseWaiting();
    else setOnlineDefenseReady();
    return;
  }
  game.state = "batting";
  game.onlineWaiting = false;
  game.playPhase = "투구 대기";
  game.pitchDelay = 0.6 + Math.random() * 0.55;
  game.ball = makeBall();
  game.hitBall = null;
  game.throwBall = null;
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
  if (game.half === "top" || isPvPMode()) prepareBattingPitch();
  else {
    game.state = "pitching";
    game.playPhase = "구종 선택";
    game.ball = makeBall();
    game.hitBall = null;
    game.throwBall = null;
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

function animateRunner(runner, fromBase, toBase) {
  if (!runner) return;
  const path = buildBasePath(fromBase, toBase);
  const from = path[0] || getRunnerBasePoint(fromBase);
  const to = path[path.length - 1] || getRunnerBasePoint(toBase);
  const speed = clamp(runner.speed || 60, 35, 99);
  const dist = pathDistance(path);
  game.runnerAnimations.push({
    runner,
    from,
    to,
    path,
    totalDistance: dist,
    fromBase,
    toBase,
    t: 0,
    duration: clamp(dist / (108 + speed * 1.15), 0.85, 3.2),
  });
}

function buildBasePath(fromBase, toBase) {
  if (fromBase === "home" && toBase === "home") {
    return ["home", "first", "second", "third", "home"].map(getRunnerBasePoint);
  }
  const fromNo = fromBase === "home" ? 0 : baseNumber(fromBase);
  const toNo = toBase === "home" ? 4 : baseNumber(toBase);
  const path = [];
  for (let base = fromNo; base <= toNo; base += 1) {
    path.push(getRunnerBasePoint(baseNameFromNumber(base)));
  }
  if (!path.length) return [getRunnerBasePoint(fromBase), getRunnerBasePoint(toBase)];
  return path;
}

function pathDistance(path) {
  let distance = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    distance += Math.hypot(path[i + 1].x - path[i].x, path[i + 1].y - path[i].y);
  }
  return distance;
}

function getRunnerBasePoint(base) {
  if (base === "first") return { x: FIELD.first.x + 16, y: FIELD.first.y - 16 };
  if (base === "second") return { x: FIELD.second.x, y: FIELD.second.y - 22 };
  if (base === "third") return { x: FIELD.third.x - 16, y: FIELD.third.y - 16 };
  return { x: FIELD.home.x + 4, y: FIELD.home.y - 8 };
}

function startHitAnimation(result, distance, color) {
  game.playPhase = "타구 처리";
  const target = chooseFieldingTarget(result, distance);
  const isHomer = result.includes("홈런");
  const isOutBall = result.includes("아웃") || result === "병살타";
  const isBaseHit = ["1루타", "2루타", "3루타", "번트안타"].includes(result);
  const start = {
    x: FIELD.plate.x + randomInt(-10, 10),
    y: FIELD.plate.y + randomInt(-7, 6),
  };
  const duration = isHomer
    ? 1.12 + Math.random() * 0.68
    : clamp(0.72 + Math.random() * 0.5 + (target.end.y < 230 ? 0.12 : 0), 0.68, 1.34);
  game.impact = {
    timer: isHomer ? 0.45 : 0.28,
    shake: isHomer ? 10 : result === "파울" ? 2 : 5,
    color,
  };
  game.hitBall = {
    t: 0,
    duration,
    start,
    peak: target.peak,
    end: target.end,
    color,
    result,
    reactionDelay: isHomer
      ? 0.2 + Math.random() * 0.18
      : isBaseHit
        ? 0.46 + Math.random() * 0.34
        : isOutBall
          ? 0.1 + Math.random() * 0.18
          : 0.16 + Math.random() * 0.18,
    fielderSent: false,
  };
  return game.hitBall;
}

function chooseFieldingTarget(result, distance) {
  const profile = createBattedBallProfile(result, distance);
  const direction = profile.direction;
  if (result === "파울") {
    const side = Math.random() < 0.5 ? -1 : 1;
    const y = randomInt(150, 460);
    const bounds = fairBoundsAtY(y);
    const x = side < 0 ? bounds.left - randomInt(34, 170) : bounds.right + randomInt(34, 170);
    const end = { x: clamp(x, 18, W - 18), y };
    return {
      end,
      peak: {
        x: (FIELD.plate.x + end.x) / 2 + side * randomInt(24, 90),
        y: randomInt(80, 210),
      },
    };
  }
  if (result === "땅볼아웃" || result === "병살타") {
    const laneRoll = Math.random();
    const lane =
      result === "병살타"
        ? laneRoll < 0.5
          ? FIELD.fielders.SS
          : FIELD.fielders["2B"]
        : direction > 0
          ? laneRoll < 0.6
            ? FIELD.fielders["2B"]
            : FIELD.fielders["1B"]
          : laneRoll < 0.6
            ? FIELD.fielders.SS
            : FIELD.fielders["3B"];
    const end = clampFairPoint({
      x: lane.x + randomInt(-118, 118) + direction * profile.slice,
      y: lane.y + randomInt(-34, 108),
    });
    return {
      end,
      peak: { x: (FIELD.plate.x + end.x) / 2 + profile.slice * 0.18, y: (FIELD.plate.y + end.y) / 2 + randomInt(18, 46) },
    };
  }
  if (result === "플라이아웃") {
    const lane =
      Math.abs(direction) < 0.25
        ? FIELD.fielders.CF
        : direction > 0
          ? Math.random() < 0.72
            ? FIELD.fielders.RF
            : FIELD.fielders.CF
          : Math.random() < 0.72
            ? FIELD.fielders.LF
            : FIELD.fielders.CF;
    const end = clampFairPoint({
      x: lane.x + randomInt(-170, 170) + direction * profile.slice,
      y: lane.y + randomInt(-66, 126),
    });
    return {
      end,
      peak: { x: (FIELD.plate.x + end.x) / 2 + profile.slice * 0.28, y: randomInt(48, 132) },
    };
  }
  return {
    end: result.includes("홈런") ? {
      x: FIELD.plate.x + direction * profile.distance + profile.slice + randomInt(-70, 70),
      y: result.includes("홈런") ? randomInt(-80, 18) : profile.landingY,
    } : clampFairPoint({
      x: FIELD.plate.x + direction * profile.distance + profile.slice + randomInt(-70, 70),
      y: profile.landingY,
    }),
    peak: {
      x: FIELD.plate.x + direction * profile.distance * 0.45 + profile.slice * 0.5,
      y: profile.peakY,
    },
  };
}

function fairBoundsAtY(y) {
  const topY = 118;
  const homeY = FIELD.home.y;
  const progress = clamp((homeY - y) / (homeY - topY), 0, 1);
  return {
    left: FIELD.home.x + (72 - FIELD.home.x) * progress,
    right: FIELD.home.x + (888 - FIELD.home.x) * progress,
  };
}

function clampFairPoint(point) {
  const bounds = fairBoundsAtY(point.y);
  const margin = 18;
  return {
    x: clamp(point.x, bounds.left + margin, bounds.right - margin),
    y: clamp(point.y, 78, FIELD.home.y - 28),
  };
}

function createBattedBallProfile(result, baseDistance) {
  const contact = game.lastContact || {};
  const batter = contact.batter || game.currentBatter || { bats: "R", pull: 0, launch: 60, power: 60 };
  const pullSide = batter.bats === "L" ? -1 : 1;
  const contactAlong = Number.isFinite(contact.along) ? contact.along : 0.62;
  const quality = Number.isFinite(contact.quality) ? contact.quality : 0.55;
  const powerScore = Number.isFinite(contact.powerScore) ? contact.powerScore : batter.power;
  const earlyLate = clamp((0.7 - contactAlong) * 1.45 + batter.pull, -0.85, 0.85);
  const sprayNoise = randomInt(-95, 95) / 100;
  const fieldBias = Math.random() < 0.42 ? (Math.random() < 0.5 ? -1 : 1) * randomInt(18, 70) / 100 : 0;
  const direction = clamp(pullSide * earlyLate + sprayNoise + fieldBias, -1, 1);
  const distanceNoise = randomInt(-155, 175);
  const distance =
    result.includes("홈런")
      ? 430 + quality * 150 + randomInt(-45, 80)
      : baseDistance * (0.72 + quality * 0.46) + powerScore * 1.25 + distanceNoise;
  const launch = clamp((batter.launch - 50) / 80 + quality * 0.65 + randomInt(-18, 18) / 100, 0.08, 1.5);
  const slice = randomInt(-135, 135) + direction * randomInt(-60, 92);
  return {
    direction,
    distance: clamp(distance, 120, result.includes("홈런") ? 660 : 520),
    landingY: clamp(420 - distance * (0.42 + launch * 0.12) + randomInt(-74, 82), 72, 330),
    peakY: clamp(410 - distance * (0.55 + launch * 0.3) + randomInt(-86, 62), -110, 275),
    slice,
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
  const routeJitter = result.includes("아웃") || result === "병살타" ? 10 : 26;
  fielder.targetX = target.x + randomInt(-routeJitter, routeJitter);
  fielder.targetY = target.y + randomInt(-routeJitter, routeJitter);
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
    const pitcherObj = controlledPitcher();
    if (n >= 1 && n <= 6) {
      const p = pitcherObj?.pitches?.[n - 1];
      if (p) game.selectedPitch = p;
    }
    if (e.code === "Space") {
      e.preventDefault();
      if (!game.ball.active) {
        if (isOnlinePvp() && canPitchOnlineHalf()) startPitch(game.selectedPitch, "batting", { onlineDefenseThrow: true });
        else startPitch(game.selectedPitch, "pitching");
      }
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
  if (action === "selectTeam") selectUserTeam(e.target.closest("[data-team]").dataset.team);
  if (action === "start") setupLineup();
  if (action === "selectSlot") {
    const slot = e.target.closest("[data-slot]")?.dataset.slot;
    if (slot && LINEUP_POSITIONS.includes(slot)) {
      game.activeLineupSlot = game.activeLineupSlot === slot ? null : slot;
      renderUI(true);
    }
  }
  if (action === "clearSlot") {
    e.stopPropagation();
    const slot = e.target.closest("[data-slot]")?.dataset.slot;
    if (slot && game.lineupSlots[slot]) {
      delete game.lineupSlots[slot];
      if (!game.activeLineupSlot) game.activeLineupSlot = slot;
      renderUI(true);
    }
  }
  if (action === "defaultLineup") {
    game.lineupSlots = autoFillSlots(currentUserTeam());
    game.activeLineupSlot = null;
    game.selectedLineup = getDefaultLineup();
    renderUI(true);
  }
  if (action === "confirmLineup") {
    const filledCount = LINEUP_POSITIONS.filter((p) => game.lineupSlots[p]).length;
    if (filledCount !== 9) return;
    game.selectedLineup = LINEUP_POSITIONS.map((p) => game.lineupSlots[p]);
    const slotNames = {};
    for (const pos of LINEUP_POSITIONS) slotNames[pos] = game.lineupSlots[pos].name;
    localStorage.setItem(lineupSlotsStorageKey(), JSON.stringify(slotNames));
    localStorage.setItem(lineupStorageKey(), JSON.stringify(game.selectedLineup.map((b) => b.name)));
    game.state = "pitcherSelect";
    renderUI(true);
  }
  if (action === "assignBatter") assignBatterToSlot(e.target.closest("[data-batter]").dataset.batter);
  if (action === "selectPitcher") selectPitcher(currentUserTeam().starters.find((p) => p.name === e.target.closest("[data-pitcher]").dataset.pitcher));
  if (action === "selectBullpen") {
    const name = e.target.closest("[data-bullpen]").dataset.bullpen;
    const team = controlledPitchingTeam();
    const found = Object.values(team.bullpenGroups || {}).flat().find((p) => p.name === name);
    if (!found) return;
    changePitcher(found);
  }
  if (action === "pitch") {
    game.selectedPitch = e.target.closest("[data-pitch]").dataset.pitch;
  }
  if (action === "throw" && game.state === "pitching" && !game.ball.active) {
    if (isOnlinePvp() && canPitchOnlineHalf()) startPitch(game.selectedPitch, "batting", { onlineDefenseThrow: true });
    else startPitch(game.selectedPitch, "pitching");
  }
  if (action === "bullpen") {
    game.state = "bullpen";
    renderUI(true);
  }
  if (action === "backPitching") {
    if (isOnlinePvp() && canPitchOnlineHalf()) setOnlineDefenseReady();
    else game.state = "pitching";
    renderUI(true);
  }
  if (action === "bunt") game.buntMode = true;
  if (action === "steal") trySteal();
  if (action === "restart") {
    resetGame(true);
    setupTeams();
  }
  if (action === "게임시작" || action === "start") {
    game.aiTeam = null;
    resetGame(false);
    if (!game.currentPitcher) game.currentPitcher = clonePitcher(currentUserTeam().starters[0]);
    if (game.selectedLineup.length < 9) game.selectedLineup = getDefaultLineup();
    startGame();
  }
  // ── 내 팀 탭 핸들러 ──────────────────────────────────────────────
  if (action === "mt-selectTeam") {
    const name = e.target.closest("[data-team]")?.dataset.team;
    if (!name) return;
    localStorage.setItem("fullcount:userTeam", name);
    game.userTeam = getTeamByName(name);
    myTeamEdit.activeSlot = null;
    window.fullcountAuth?.refreshMyTeam?.();
  }
  if (action === "mt-selectSlot") {
    const slot = e.target.closest("[data-slot]")?.dataset.slot;
    if (slot && LINEUP_POSITIONS.includes(slot)) {
      myTeamEdit.activeSlot = myTeamEdit.activeSlot === slot ? null : slot;
      window.fullcountAuth?.refreshMyTeam?.();
    }
  }
  if (action === "mt-clearSlot") {
    e.stopPropagation();
    const slot = e.target.closest("[data-slot]")?.dataset.slot;
    if (!slot) return;
    const team = loadSavedTeam();
    const slots = loadSavedLineupSlots(team);
    if (slots[slot]) {
      delete slots[slot];
      localStorage.setItem(lineupSlotsStorageKey(team), JSON.stringify(Object.fromEntries(LINEUP_POSITIONS.filter((p) => slots[p]).map((p) => [p, slots[p].name]))));
      if (!myTeamEdit.activeSlot) myTeamEdit.activeSlot = slot;
      window.fullcountAuth?.refreshMyTeam?.();
    }
  }
  if (action === "mt-assignBatter") {
    const name = e.target.closest("[data-batter]")?.dataset.batter;
    if (!name) return;
    const team = loadSavedTeam();
    const found = team.batters.find((b) => b.name === name);
    if (!found) return;
    const slots = loadSavedLineupSlots(team);
    const existingPos = LINEUP_POSITIONS.find((p) => slots[p]?.name === name);
    if (!myTeamEdit.activeSlot) {
      if (existingPos) { delete slots[existingPos]; myTeamEdit.activeSlot = existingPos; localStorage.setItem(lineupSlotsStorageKey(team), JSON.stringify(Object.fromEntries(LINEUP_POSITIONS.filter((p) => slots[p]).map((p) => [p, slots[p].name])))); }
      window.fullcountAuth?.refreshMyTeam?.();
      return;
    }
    if (existingPos) delete slots[existingPos];
    slots[myTeamEdit.activeSlot] = found;
    localStorage.setItem(lineupSlotsStorageKey(team), JSON.stringify(Object.fromEntries(LINEUP_POSITIONS.filter((p) => slots[p]).map((p) => [p, slots[p].name]))));
    myTeamEdit.activeSlot = LINEUP_POSITIONS.find((p) => !slots[p]) || null;
    window.fullcountAuth?.refreshMyTeam?.();
  }
  if (action === "mt-autoFill") {
    const team = loadSavedTeam();
    const slots = autoFillSlots(team);
    localStorage.setItem(lineupSlotsStorageKey(team), JSON.stringify(Object.fromEntries(LINEUP_POSITIONS.filter((p) => slots[p]).map((p) => [p, slots[p].name]))));
    myTeamEdit.activeSlot = null;
    window.fullcountAuth?.refreshMyTeam?.();
  }
  if (action === "mt-selectPitcher") {
    const pitcherName = e.target.closest("[data-pitcher]")?.dataset.pitcher;
    if (!pitcherName) return;
    const team = loadSavedTeam();
    localStorage.setItem(pitcherStorageKey(team), pitcherName);
    window.fullcountAuth?.refreshMyTeam?.();
  }
  // ─────────────────────────────────────────────────────────────────
  if (action === "goOnlineTab") {
    game.state = "intro";
    window.fullcountAuth?.switchView?.("online");
  }
  if (action === "editLineupOnline") {
    game.onlinePrep = true;
    setupLineup();
  }
  if (action === "changeTeam") {
    game.onlinePrep = false;
    game.state = "intro";
    renderUI(true);
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
  if (!canUseLocalControls()) return;
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
  if (!canUseLocalControls()) return;
  if (game.state !== "batting" || !game.bases.first) return showResult("도루할 1루 주자 없음", 0.8, resumeHalf);
  const runner1 = game.bases.first;
  const runner2 = game.bases.second;

  // 2루·3루 모두 주자 있으면 도루 불가
  if (runner2 && game.bases.third) return showResult("도루 불가 (만루)", 0.8, resumeHalf);

  const success1 = Math.random() < clamp(0.28 + runner1.speed / 145, 0.35, 0.86);

  if (runner2) {
    // 더블 도루: 1루→2루, 2루→3루 동시 시도
    const success2 = Math.random() < clamp(0.22 + runner2.speed / 160, 0.28, 0.78);
    if (success1 && success2) {
      animateRunner(runner2, "second", "third");
      animateRunner(runner1, "first", "second");
      game.bases.third = runner2;
      game.bases.second = runner1;
      game.bases.first = null;
      showResult("더블 도루!", 1.0, resumeHalf);
    } else if (success1) {
      // 2루 주자 아웃, 1루 주자만 진루
      animateRunner(runner2, "second", "third");
      animateRunner(runner1, "first", "second");
      game.bases.second = runner1;
      game.bases.first = null;
      recordOut(1, "더블 도루 — 2루 주자 아웃");
    } else {
      // 1루 주자 아웃
      animateRunner(runner1, "first", "second");
      game.bases.first = null;
      recordOut(1, "도루 실패!");
    }
    return;
  }

  // 일반 도루 (2루 비어있음)
  if (success1) {
    animateRunner(runner1, "first", "second");
    game.bases.second = runner1;
    game.bases.first = null;
    showResult("도루 성공!", 0.9, resumeHalf);
  } else {
    animateRunner(runner1, "first", "second");
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
    userTeam: game.userTeam?.name,
    opponent: game.aiTeam?.name,
    lineup: game.selectedLineup.map((b) => b.name),
    activeSlot: game.activeLineupSlot,
    slotsFilled: LINEUP_POSITIONS.filter((p) => game.lineupSlots[p]).length,
    pitcher: game.currentPitcher?.name,
    pitch: game.selectedPitch,
    paused: game.paused,
    warning: game.warning,
    score: [game.userScore, game.aiScore, game.inning, game.half, game.outs, game.balls, game.strikes],
    online: [game.mode, game.onlineSeat, game.onlineWaiting, game.ball.active, onlineRoleText()],
  });
  if (!force && sig === game.uiSignature) return;
  game.uiSignature = sig;
  uiLayer.innerHTML = renderScreenPanel();
  actionBar.innerHTML = renderActionBar();
}

function renderScreenPanel() {
  if (game.state === "intro") {
    return renderIntro();
  }
  if (game.state === "lineupSelect") return renderLineupSelect();
  if (game.state === "onlinePrepDone") return renderOnlinePrepDone();
  if (game.state === "pitcherSelect") return renderPitcherSelect();
  if (game.state === "bullpen") return renderBullpen();
  if (game.state === "gameOver") {
    return `
      <div class="screen-panel intro-panel">
        <h1>경기 종료</h1>
        <div class="versus-logos">
          ${teamLogoMarkup(currentUserTeam(), "title-logo")}
          <strong>VS</strong>
          ${teamLogoMarkup(game.aiTeam, "title-logo")}
        </div>
        <p>${currentUserTeam().name} ${game.userScore} - ${game.aiScore} ${game.aiTeam.name}</p>
        <p class="muted">최고 득점 ${game.record.bestScore}</p>
        <div class="panel-actions" style="justify-content:center">
          <button class="primary" data-action="restart">다시 시작</button>
        </div>
      </div>
    `;
  }
  return "";
}

function renderMyTeamPanel() {
  const team = loadSavedTeam();
  const slots = loadSavedLineupSlots(team);
  const savedPitcher = loadSavedPitcher(team);
  const activeSlot = myTeamEdit.activeSlot;
  const filledCount = LINEUP_POSITIONS.filter((p) => slots[p]).length;
  const assignedNames = new Set(Object.values(slots).map((b) => b.name));

  const teamGrid = playableTeams.map((t) => {
    const isSel = t.name === team.name;
    return `<button class="player-card team-card${isSel ? " selected" : ""}" data-action="mt-selectTeam" data-team="${t.name}" style="--team-color:${t.color || "#d71920"}">
      <span class="team-stripe"></span>
      <span class="team-card-head">${teamLogoMarkup(t)}<strong>${t.name}</strong></span>
      <span class="muted">${t.manager} 감독</span>
    </button>`;
  }).join("");

  const slotsHtml = LINEUP_POSITIONS.map((pos, i) => {
    const player = slots[pos];
    const isActive = pos === activeSlot;
    return `<div class="slot-row${isActive ? " active" : ""}${player ? " filled" : ""}" data-action="mt-selectSlot" data-slot="${pos}">
      <span class="batting-order">${i + 1}</span>
      <span class="pos-badge">${pos}</span>
      <span class="pos-kr">${POSITION_KR[pos]}</span>
      <span class="slot-player">${player ? player.name : "—"}</span>
      ${player ? `<button class="slot-clear" data-action="mt-clearSlot" data-slot="${pos}">×</button>` : ""}
    </div>`;
  }).join("");

  const poolHint = activeSlot
    ? `<p class="mt-pool-hint"><span class="pos-badge">${activeSlot}</span> ${POSITION_KR[activeSlot]}에 배정할 선수를 선택하세요 · 초록=적합</p>`
    : `<p class="mt-pool-hint">슬롯을 먼저 클릭하면 적합 선수가 강조됩니다</p>`;

  const poolHtml = team.batters.map((b) => {
    const isAssigned = assignedNames.has(b.name);
    const eligible = activeSlot ? getPlayerEligiblePositions(b).includes(activeSlot) : false;
    let cls = "mt-player-row";
    if (isAssigned) cls += " mt-assigned";
    else if (eligible) cls += " mt-eligible";
    else if (activeSlot && !eligible) cls += " mt-ineligible";
    return `<button class="${cls}" data-action="mt-assignBatter" data-batter="${b.name}">
      <span class="mt-player-left">
        <span class="mt-player-name">${b.name}</span>
        <span class="mt-player-info">${b.position} · ${b.bats}타 · ${b.nickname}</span>
      </span>
      <span class="mt-player-stats">
        <span class="mt-stat">컨${b.contact}</span><span class="mt-stat">파${b.power}</span><span class="mt-stat">주${b.speed}</span>
      </span>
    </button>`;
  }).join("");

  const pitcherHtml = team.starters.map((p) => {
    const isSel = savedPitcher?.name === p.name;
    return `<button class="mt-player-row mt-pitcher-row${isSel ? " mt-pitcher-sel" : ""}" data-action="mt-selectPitcher" data-pitcher="${p.name}">
      <span class="mt-player-left">
        <span class="mt-player-name">${p.name}</span>
        <span class="mt-player-info">${p.role} · ${p.hand}HP · ${p.pitches.join(" / ")}</span>
      </span>
      <span class="mt-player-stats">
        <span class="mt-stat">구${p.velocity}</span><span class="mt-stat">제${p.control}</span><span class="mt-stat">변${p.breaking}</span>
      </span>
    </button>`;
  }).join("");

  return `<div class="auth-card my-team-panel">
    <section class="mt-section">
      <p class="eyebrow">내 팀 · 팀 선택</p>
      <div class="grid team-grid" style="margin-top:8px">${teamGrid}</div>
    </section>
    <section class="mt-section">
      <div class="mt-lineup-header">
        <p class="eyebrow">타순 구성</p>
        <span class="mt-count${filledCount === 9 ? " mt-count-done" : ""}">${filledCount}/9</span>
      </div>
      <div class="mt-builder">
        <div class="lineup-slots">${slotsHtml}</div>
        <div class="mt-pool-wrap">
          ${poolHint}
          <div class="mt-pool">${poolHtml}</div>
        </div>
      </div>
      <div style="margin-top:10px"><button data-action="mt-autoFill">자동 채우기</button></div>
    </section>
    <section class="mt-section">
      <p class="eyebrow" style="margin-bottom:8px">선발투수 선택${savedPitcher ? ` · <strong style="color:#f4c24d">${savedPitcher.name}</strong>` : ""}</p>
      <div class="mt-pool">${pitcherHtml}</div>
    </section>
  </div>`;
}

function renderIntro() {
  const team = currentUserTeam();
  const pitcher = game.selectedPitcher || game.currentPitcher;
  const lineupOk = game.selectedLineup.length === 9;
  const pitcherOk = !!pitcher;
  const ready = lineupOk && pitcherOk;
  return `
    <div class="screen-panel intro-panel">
      <h1 style="font-size:clamp(40px,8vw,80px);line-height:0.95;margin:0 0 14px">풀카운트</h1>
      <div class="versus-logos" style="margin-bottom:8px">
        ${teamLogoMarkup(team, "title-logo")}
      </div>
      <p style="font-size:20px;font-weight:900;margin:0 0 4px">${team.name}</p>
      <p class="muted" style="margin:0 0 6px">
        선발: ${pitcher?.name || "—"} &nbsp;·&nbsp; 라인업: ${game.selectedLineup.length}/9명
      </p>
      ${!ready ? `<p style="font-size:13px;font-weight:800;color:var(--kia-red);margin:0 0 10px">「내 팀」 탭에서 라인업과 선발을 설정하세요.</p>` : ""}
      <div class="panel-actions" style="justify-content:center;margin-top:14px">
        <button class="primary" data-action="게임시작" ${ready ? "" : "disabled"}>경기 시작</button>
      </div>
    </div>
  `;
}

function renderLineupSelect() {
  const team = currentUserTeam();
  const slots = game.lineupSlots;
  const activeSlot = game.activeLineupSlot;
  const filledCount = LINEUP_POSITIONS.filter((p) => slots[p]).length;
  const assignedNames = new Set(Object.values(slots).map((b) => b.name));

  const slotsHtml = LINEUP_POSITIONS.map((pos, i) => {
    const player = slots[pos];
    const isActive = pos === activeSlot;
    return `
      <div class="slot-row${isActive ? " active" : ""}${player ? " filled" : ""}" data-action="selectSlot" data-slot="${pos}">
        <span class="batting-order">${i + 1}</span>
        <span class="pos-badge">${pos}</span>
        <span class="pos-kr">${POSITION_KR[pos]}</span>
        <span class="slot-player">${player ? player.name : "—"}</span>
        ${player ? `<button class="slot-clear" data-action="clearSlot" data-slot="${pos}">×</button>` : ""}
      </div>
    `;
  }).join("");

  const poolHtml = team.batters.map((b) => {
    const isAssigned = assignedNames.has(b.name);
    const eligible = activeSlot ? getPlayerEligiblePositions(b).includes(activeSlot) : true;
    return `
      <button class="player-card${isAssigned ? " assigned" : ""}${!eligible && !isAssigned ? " ineligible" : ""}" data-action="assignBatter" data-batter="${b.name}">
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
  }).join("");

  return `
    <div class="screen-panel lineup-builder-panel">
      <div class="screen-title">
        <div>
          <h2><span class="heading-logo">${teamLogoMarkup(team, "tiny-logo")}</span>2026 ${team.name} 타순 구성</h2>
          <p>감독 ${team.manager} · 홈 ${team.stadium} · 포지션 슬롯을 선택한 뒤 선수를 배정하세요.</p>
        </div>
        <strong>${filledCount}/9</strong>
      </div>
      <div class="lineup-builder-grid">
        <div class="lineup-slots">${slotsHtml}</div>
        <div class="grid roster-grid lineup-pool">${poolHtml}</div>
      </div>
      <div class="panel-actions">
        <button data-action="changeTeam">팀 다시 선택</button>
        <button data-action="defaultLineup">자동 채우기</button>
        <button class="primary" data-action="confirmLineup" ${filledCount === 9 ? "" : "disabled"}>라인업 확정</button>
      </div>
    </div>
  `;
}

function renderOnlinePrepDone() {
  const team = currentUserTeam();
  const pitcher = game.selectedPitcher;
  return `
    <div class="screen-panel intro-panel">
      <p class="eyebrow" style="text-align:center">ONLINE PVP</p>
      <h2 style="text-align:center;margin:8px 0 4px">${teamLogoMarkup(team, "inline-logo")} ${team.name}</h2>
      <p style="text-align:center;margin:0 0 10px;font-weight:800">선발: ${pitcher?.name || "-"}</p>
      <div class="selected-lineup" style="justify-content:center">
        ${game.selectedLineup.map((b, i) => `<span class="lineup-chip">${i + 1}. ${b.name}</span>`).join("")}
      </div>
      <p style="text-align:center;margin:14px 0 6px;font-size:22px">✓</p>
      <p style="text-align:center;font-weight:800">라인업 / 선발 설정 완료</p>
      <p class="muted" style="text-align:center;margin-top:4px">실시간 대전 탭에서 방을 만들거나 입장하고 준비를 누르세요.</p>
      <div class="panel-actions" style="justify-content:center;margin-top:16px">
        <button class="primary" data-action="goOnlineTab">실시간 대전 탭으로 →</button>
        <button data-action="editLineupOnline">라인업 다시 편집</button>
      </div>
    </div>
  `;
}

function renderPitcherSelect() {
  const team = currentUserTeam();
  return `
    <div class="screen-panel">
      <div class="screen-title">
        <div>
          <h2><span class="heading-logo">${teamLogoMarkup(team, "tiny-logo")}</span>${team.name} 선발투수 선택</h2>
          <p>상대: ${teamLogoMarkup(game.aiTeam, "inline-logo")} ${game.aiTeam.name} · 감독 ${game.aiTeam.manager} · 선발 ${game.aiPitcher?.name || "-"} 예상</p>
        </div>
      </div>
      <div class="grid pitcher-grid">
        ${team.starters.map((p) => renderPitcherCard(p, "selectPitcher", "pitcher")).join("")}
      </div>
      <section class="bullpen-group">
        <h3>${teamLogoMarkup(game.aiTeam, "inline-logo")} 상대 ${game.aiTeam.name} 정보</h3>
        <div class="selected-lineup">
          ${game.aiTeam.batters.map((b, i) => `<span class="lineup-chip">${i + 1}. ${b.name}</span>`).join("")}
        </div>
        <p class="muted">선발진: ${game.aiTeam.starters.map((p) => p.name).join(", ")} / 불펜: ${game.aiTeam.bullpen.map((p) => p.name).join(", ")}</p>
      </section>
    </div>
  `;
}

function renderBullpen() {
  const team = controlledPitchingTeam();
  const pitcherObj = controlledPitcher();
  const groups = team.bullpenGroups || makeOpponentBullpenGroups(team.bullpen || []);
  return `
    <div class="screen-panel">
      <div class="screen-title">
        <div>
          <h2>투수 교체</h2>
          <p>${teamLogoMarkup(team, "inline-logo")} 현재 투수: ${pitcherObj.name} · 체력 ${Math.round(pitcherObj.stamina)}</p>
        </div>
        <button data-action="backPitching">돌아가기</button>
      </div>
      ${Object.entries(groups)
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
    const onlineStatus = isOnlinePvp() ? `<span class="pill">${onlineRoleText()}</span>` : "";
    const waiting = isOnlinePvp() && (!canControlOnlineHalf() || !game.ball.active);
    return `
      <div class="action-left">
        <span class="status-text">공격 · ${game.currentBatter.name}</span>
        ${onlineStatus}
        <span class="kbd">SPACE</span>
        <span>${waiting ? "상대 투구/판정 대기" : "누르고 있으면 배트 회전"}</span>
      </div>
      <div class="action-right">
        <button class="primary" data-action="holdSwing" ${waiting ? "disabled" : ""}>스윙 홀드</button>
        <button data-action="bunt" class="${game.buntMode ? "selected" : ""}" ${waiting ? "disabled" : ""}>번트</button>
        <button data-action="steal" ${waiting ? "disabled" : ""}>도루</button>
        ${fullscreenButton()}
      </div>
    `;
  }
  if (game.state === "pitching") {
    const pitcherObj = controlledPitcher();
    const onlineStatus = isOnlinePvp() ? `<span class="pill">${onlineRoleText()}</span>` : "";
    return `
      <div class="action-left">
        <span class="status-text">수비 · ${pitcherObj.name} 체력 ${Math.round(pitcherObj.stamina)}</span>
        ${onlineStatus}
        ${game.warning ? `<span class="pill">${game.warning}</span>` : ""}
      </div>
      <div class="pitch-buttons">
        ${pitcherObj.pitches
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

function assignBatterToSlot(name) {
  const found = currentUserTeam().batters.find((b) => b.name === name);
  if (!found) return;
  const existingPos = LINEUP_POSITIONS.find((p) => game.lineupSlots[p]?.name === name);
  if (!game.activeLineupSlot) {
    if (existingPos) {
      game.activeLineupSlot = existingPos;
      delete game.lineupSlots[existingPos];
    }
    renderUI(true);
    return;
  }
  if (existingPos) delete game.lineupSlots[existingPos];
  game.lineupSlots[game.activeLineupSlot] = found;
  const nextEmpty = LINEUP_POSITIONS.find((p) => !game.lineupSlots[p]);
  game.activeLineupSlot = nextEmpty || null;
  renderUI(true);
}

function syncCurrentMatchup() {
  if (game.half === "top") {
    game.currentBatter = game.selectedLineup[game.battingOrderIndex % Math.max(1, game.selectedLineup.length)];
  } else {
    const aiLineup = game.aiSelectedLineup?.length === 9 ? game.aiSelectedLineup : null;
    game.currentBatter = aiLineup ? aiLineup[game.aiBattingOrderIndex % 9] : getAIBatter();
  }
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
  broadcastOnlineSnapshot("result");
  renderUI(true);
}

function saveRecord() {
  game.record.bestScore = Math.max(game.record.bestScore || 0, game.userScore);
  game.record.recent = {
    date: new Date().toISOString(),
    score: `${currentUserTeam().name} ${game.userScore} - ${game.aiScore} ${game.aiTeam.name}`,
    opponent: game.aiTeam.name,
  };
  localStorage.setItem("fullcount:record", JSON.stringify(game.record));
  window.fullcountAuth?.saveMatch?.({
    userTeam: currentUserTeam().name,
    opponentTeam: game.aiTeam.name,
    userScore: game.userScore,
    opponentScore: game.aiScore,
    innings: game.inning,
  });
}

function loadRecord() {
  try {
    game.record = JSON.parse(localStorage.getItem("fullcount:record")) || game.record;
  } catch {
    game.record = { bestScore: 0, recent: null };
  }
}

function loadSavedLineup(team = currentUserTeam()) {
  try {
    const slots = loadSavedLineupSlots(team);
    const lineup = LINEUP_POSITIONS.map((p) => slots[p]).filter(Boolean);
    if (lineup.length === 9) return lineup;
  } catch {}
  return getDefaultLineup(team);
}

function loadSavedPitcher(team = currentUserTeam()) {
  const name = localStorage.getItem(pitcherStorageKey(team));
  const found = team.starters.find((p) => p.name === name);
  return found ? clonePitcher(found) : null;
}

function clonePitcher(p) {
  return { ...p, pitches: [...p.pitches], stamina: p.maxStamina };
}

function selectOpponentStarter() {
  const team = game.aiTeam || playableTeams[1] || playableTeams[0];
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
    mode: game.mode,
    online: isOnlinePvp()
      ? { roomId: game.onlineRoomId, seat: game.onlineSeat, controlSeat: onlineControlSeat(), waiting: game.onlineWaiting }
      : null,
    playPhase: game.playPhase,
    inning: game.inning,
    half: game.half,
    teams: { user: currentUserTeam().name, opponent: game.aiTeam?.name || null },
    score: { user: game.userScore, opponent: game.aiScore },
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

window.fullcountGame = {
  teams: () => playableTeams.map((team) => ({ name: team.name, shortName: team.shortName || team.name })),
  startOnlinePvp,
  startLocalPvp: (teamA, teamB) => startOnlinePvp({ roomId: "LOCAL", seat: 1, teamA, teamB }),
  state: () => JSON.parse(window.render_game_to_text()),
  renderMyTeamPanel,
  prepareOnlineLineup,
  getOnlineReadyData(teamName) {
    const team = getTeamByName(teamName) || currentUserTeam();
    const lineup = loadSavedLineup(team).map((b) => b.name);
    const pitcher = loadSavedPitcher(team)?.name || team.starters[0]?.name || null;
    return { lineup, pitcher };
  },
  onGameViewActivated() {
    const team = loadSavedTeam();
    game.userTeam = team;
    game.selectedLineup = loadSavedLineup(team);
    game.selectedPitcher = loadSavedPitcher(team);
    game.currentPitcher = game.selectedPitcher ? clonePitcher(game.selectedPitcher) : null;
    game.selectedPitch = game.currentPitcher?.pitches[0] || "직구";
    if (!game.aiTeam) setupTeams();
    renderUI(true);
  },
};

init();
