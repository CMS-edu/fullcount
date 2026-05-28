# 풀카운트

KBO 팀을 선택해 플레이하는 2D 웹 야구 시뮬레이션입니다. 순수 HTML, CSS, JavaScript Canvas만 사용합니다.

## 구성

- `index.html`: 앱 진입점
- `style.css`: 화면 레이아웃과 메뉴 UI
- `main.js`: 선수 데이터, 게임 상태, Canvas 렌더링, 야구 규칙
- `assets/`: 나중에 경기장, 타자, 투수, 공, 효과음 에셋을 넣을 자리
- `assets/team-logos/`: 팀 로고 이미지 폴더
- `vercel.json`: Vercel 정적 배포용 라우팅

## 실행

```bash
npm run dev
```

기본 주소는 `http://127.0.0.1:5174` 입니다. 다른 포트가 필요하면 PowerShell에서 아래처럼 실행할 수 있습니다.

```powershell
$env:PORT="5175"; npm run dev
```

## 현재 구현

- 팀 선택 화면
- 선택 팀 타자 중 9명 타순 선택
- 선택 팀 선발투수 선택
- 선택 팀 공격 타격 모드
- 선택 팀 수비 투구 모드
- 불펜 그룹별 투수 교체
- 팀별 색상/로고 UI
- 볼/스트라이크/아웃/주자/점수/이닝 진행
- 스페이스/마우스 홀드 중 배트 회전, 손을 떼면 복귀
- 투수/타자 능력치와 구종에 따른 구속, 궤적, 판정 변화
- localStorage 최근 경기/최고 득점/라인업/선발 저장

## 팀 로고 파일명

아래 파일을 `assets/team-logos/`에 넣으면 자동으로 표시됩니다. 파일이 없으면 팀 색과 약칭 배지가 대신 나옵니다.
지금 `assets/HT.png`, `assets/SS.png` 같은 기존 로고 파일도 예비 경로로 연결되어 있고, 아래 새 파일명이 있으면 새 파일을 우선 사용합니다.

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

## 배포

GitHub에 올린 뒤 Vercel에서 Import 하면 정적 프론트엔드로 배포할 수 있습니다. Render는 나중에 랭킹, 로그인, 멀티플레이 같은 서버 기능이 생기면 API 서버용으로 붙이는 쪽이 좋습니다.
