# 풀카운트

KBO 팀을 선택해서 플레이하는 2D 야구 시뮬레이션 웹 게임입니다. Canvas 기반 게임 화면에 계정, 로그인, 서버 저장 기능을 붙였습니다.

## 구성

- `index.html`: 앱 진입점, 홈/계정/로그인 영역, Canvas
- `style.css`: 게임 UI와 계정 UI 스타일
- `main.js`: 게임 데이터, 상태, Canvas 렌더링, 야구 로직
- `auth.js`: 회원가입, 로그인, 계정 수정, 최근 경기 표시
- `server.mjs`: 정적 파일 서버 + 인증/계정/경기 기록 API
- `render.yaml`: 기존 Render PostgreSQL을 연결하는 웹 서비스 Blueprint
- `assets/team-logos/`: 팀 로고 이미지 폴더

## 로컬 실행

```bash
npm install
npm run dev
```

기본 주소는 `http://127.0.0.1:5174`입니다.

DB 없이 실행하면 회원가입/로그인은 메모리 저장소를 사용합니다. 서버를 재시작하면 로컬 메모리 계정은 사라집니다.

PostgreSQL을 로컬이나 Render DB로 붙이고 싶으면 `DATABASE_URL`을 넣으면 됩니다.

```powershell
$env:DATABASE_URL="postgres://USER:PASSWORD@HOST:5432/DBNAME"
$env:SESSION_SECRET="아무거나-긴-랜덤문자"
npm run dev
```

## 현재 API

- `POST /api/auth/signup`: 회원가입
- `POST /api/auth/login`: 로그인
- `POST /api/auth/logout`: 로그아웃
- `GET /api/auth/me`: 현재 로그인 계정
- `PATCH /api/account`: 닉네임/응원팀 수정
- `POST /api/matches`: 경기 결과 저장
- `GET /api/matches/recent`: 최근 경기 기록
- `GET /api/health`: 서버/DB 상태 확인

## Render 배포

Render에서 GitHub 저장소를 연결한 뒤 Blueprint로 `render.yaml`을 사용하면 됩니다. 이 설정은 새 DB를 만들지 않고 `fullcount` 웹 서비스만 만듭니다.

Blueprint 배포 중 `DATABASE_URL` 값을 입력하라고 나오면 기존 Render PostgreSQL의 Internal Database URL을 붙여넣으세요. DB URL은 비밀번호가 들어있는 민감정보라서 GitHub에 커밋하면 안 됩니다.

직접 Web Service로 만들 경우:

- Runtime: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables:
  - `DATABASE_URL`: Render PostgreSQL connection string
  - `SESSION_SECRET`: 긴 랜덤 문자열
  - `NODE_ENV`: `production`

## 앞으로 만들면 좋은 DB 테이블

- `player_cards`: 유저가 수집/육성하는 선수 카드
- `lineups`: 저장된 타순/선발/불펜 프리셋
- `rankings`: 랭킹 캐시
- `friends`: 친구/대전 초대
- `inventory`: 유니폼, 배트, 야구장 스킨 같은 아이템

## 팀 로고 파일명

아래 파일을 `assets/team-logos/`에 넣으면 팀 선택, 스코어보드, 워터마크에 표시됩니다.

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
