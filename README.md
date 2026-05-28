# 풀카운트

KBO 팀을 골라 플레이하는 2D 탑다운 야구 시뮬레이션 게임입니다. Canvas 기반 게임 화면에 계정, 기록 저장, Render 서버 API, WebSocket 실시간 대전 방 기능을 붙였습니다.

## 프로젝트 구조

- `index.html`: 앱 셸, 탭 네비게이션, Canvas
- `style.css`: 게임/계정/온라인 대전 UI 스타일
- `main.js`: 팀/선수 데이터, 야구 로직, Canvas 렌더링, 온라인 대전 상태 동기화
- `auth.js`: 계정 API, 기록 API, 실시간 대전 WebSocket 클라이언트
- `server.mjs`: 정적 파일 서버, 회원가입/로그인/기록 API, WebSocket 방 서버
- `config.js`: 프론트엔드가 호출할 백엔드 주소 설정
- `render.yaml`: Render Blueprint 설정
- `assets/team-logos/`: 팀 로고 이미지 폴더

## 로컬 실행

```bash
npm install
npm run dev
```

기본 주소는 `http://127.0.0.1:5174` 입니다.

`DATABASE_URL`이 없으면 로컬 개발용 메모리 저장소를 사용합니다. 서버를 재시작하면 메모리 계정/기록은 사라집니다.

```powershell
$env:DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DBNAME"
$env:SESSION_SECRET="긴-랜덤-문자열"
npm run dev
```

## 탭 구성

- `게임하기`: 팀 선택, 라인업 선택, 선발 선택, 실제 경기
- `실시간 대전`: 방 만들기, 방 코드 입장, 양쪽 준비, 온라인 PvP 경기 시작
- `기록`: 로그인 계정의 최근 경기 결과
- `설정`: 화면/효과 설정 저장
- `계정`: 회원가입, 로그인, 계정 정보 수정

## 실시간 대전

서버는 `/ws` WebSocket 엔드포인트를 제공합니다.

1. 한 명이 `실시간 대전` 탭에서 팀을 고르고 `방 만들기`를 누릅니다.
2. 생성된 방 코드를 상대에게 알려줍니다.
3. 상대는 같은 탭에서 방 코드를 입력하고 `입장`을 누릅니다.
4. 두 플레이어가 `준비`를 누르면 같은 매치가 시작됩니다.

온라인 대전은 현재 “공격권을 가진 플레이어가 조작하고, 결과 스냅샷을 상대 화면에 동기화”하는 방식입니다. 서버는 `game-event`, `game-input`, `game-state` 릴레이도 지원하므로 이후 투구/스윙 프레임 단위 동기화로 확장할 수 있습니다.

## API

- `POST /api/auth/signup`: 회원가입
- `POST /api/auth/login`: 로그인
- `POST /api/auth/logout`: 로그아웃
- `GET /api/auth/me`: 현재 로그인 계정
- `PATCH /api/account`: 계정 정보 수정
- `POST /api/matches`: 경기 결과 저장
- `GET /api/matches/recent`: 최근 경기 기록
- `GET /api/health`: 서버/DB 상태 확인
- `GET /ws`: 실시간 대전 WebSocket

## Render 배포

Render에서 GitHub 저장소를 연결하고 Blueprint로 `render.yaml`을 사용하면 됩니다.

기존 Render PostgreSQL을 재사용할 때는 새 DB를 만들지 말고, Web Service 환경변수에 기존 DB의 Internal Database URL을 `DATABASE_URL`로 넣으세요. DB URL은 비밀번호가 들어있는 민감 정보라 GitHub에 커밋하면 안 됩니다.

Render Web Service 환경변수:

- `DATABASE_URL`: 기존 Render PostgreSQL Internal Database URL
- `SESSION_SECRET`: 긴 랜덤 문자열
- `NODE_ENV`: `production`
- `CORS_ORIGIN`: Vercel 프론트 주소를 따로 쓸 때만 설정

현재처럼 Render 하나로 접속하면 `config.js`는 아래처럼 비워두면 됩니다.

```js
window.FULLCOUNT_API_BASE = "";
```

Vercel 프론트 + Render 백엔드로 나눌 때만 `config.js`를 Render 주소로 바꿉니다.

```js
window.FULLCOUNT_API_BASE = "https://fullcount-qocr.onrender.com";
```

## 팀 로고 파일명

아래 파일을 `assets/team-logos/`에 넣으면 팀 선택, 스코어보드, 경기장 워터마크에 표시됩니다. 파일이 없어도 기본 배지로 대체됩니다.

- `kia-tigers.png`
- `samsung-lions.png`
- `lg-twins.png`
- `hanwha-eagles.png`
- `doosan-bears.png`
- `lotte-giants.png`
- `kiwoom-heroes.png`
- `kt-wiz.png`
- `ssg-landers.png`
- `nc-dinos.png`

## 다음 확장 포인트

- 플레이마다 서버 권위 판정 방식으로 바꿔 완전한 프레임 단위 PvP 동기화
- 랭킹, 친구 초대, 경기 리플레이
- 계정별 저장 라인업/선발/불펜 프리셋
- 선수 카드, 장비, 시즌 기록 DB
