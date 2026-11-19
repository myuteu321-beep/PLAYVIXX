# VIXX 4K Rhythm

4키 리듬게임 (HTML/CSS/JS, 빌드 도구 없음). PC는 방향키 ← ↓ ↑ → (보조: D F J K), 모바일은 화면 4열 터치.

## 폴더 구조
```
index.html
css/style.css
js/songs.js          ← 곡 등록 (제목, MP3 경로, 앨범 이미지, 싱크 보정)
js/game.js           ← 게임 본체
charts/<곡id>.js     ← 곡별 채보 (EASY/NORMAL/HARD 각각)
songs/vixx/<곡id>.mp3  ← 음원
covers/vixx/<곡id>.webp ← 곡 사진 (곡 선택 카드 + 플레이 배경)
tools/make_charts.py ← MP3 분석으로 채보 자동 생성
```

## 곡 id ↔ 파일명
| 곡 | id | 음원 | 앨범 이미지 | 채보 |
|---|---|---|---|---|
| Spider | spider | songs/vixx/spider.mp3 | covers/vixx/spider.webp | charts/spider.js |
| Chemical | chemical | songs/vixx/chemical.mp3 | covers/vixx/chemical.webp | charts/chemical.js |
| B.O.D.Y | body | songs/vixx/body.m4a | covers/vixx/body.webp | charts/body.js |
| 어둠 속을 밝혀줘 | dark | songs/vixx/dark.mp3 | covers/vixx/dark.webp | charts/dark.js |
| MAZE | maze | songs/vixx/maze.mp3 | covers/vixx/maze.webp | charts/maze.js |
| 아픈데 좋아 | painful | songs/vixx/painful.mp3 | covers/vixx/painful.webp | charts/painful.js |

## 음원 / 이미지 교체
- 같은 파일명으로 덮어쓰면 끝입니다. 음원 길이가 달라졌다면 채보를 다시 만드세요:
  `python3 tools/make_charts.py spider` (필요: ffmpeg, numpy, scipy)
- 음원을 바꿨는데 폰/브라우저에서 옛 곡이 나오면 `sw.js` 맨 위 `VER` 숫자를 올리세요(음원은 기기에 저장되어 있습니다).
- 노트가 소리와 어긋나면: 게임 내 "싱크 보정" 슬라이더 또는 `js/songs.js`의 곡별 `offset`(ms)을 조정하세요.
- 앨범 이미지는 16:9 또는 정사각형 JPG 권장.

## 채보가 맞춰지는 기준
- **MAZE, B.O.D.Y** : 예전 방식(반주 포함 전체 소리의 변화).
- **그 외 모든 곡(Spider, Chemical, 어둠 속을 밝혀줘, 아픈데 좋아)** : 멤버들 **목소리(가사 음절)** 시작점에 맞춤. 가운데 정렬된 소리만 남기고 → 드럼/베이스 제거 → 멜로디(목소리) 음높이를 추적해서, 목소리가 나는 구간에서만 음절 시작·음높이 변화를 노트로 만듭니다. 레인은 목소리 음높이(낮은 음 왼쪽, 높은 음 오른쪽).
- 곡별 기준은 `tools/make_charts.py` 맨 위 `LEGACY = {"maze", "body"}` 로 정합니다. 곡을 여기에 넣으면 예전 방식, 빼면 보컬 방식입니다.
- 게임을 시작하면 카운트다운 없이 **바로 음악이 나옵니다**(곡 선택 화면에서 미리듣기로 불러둔 곡이면 즉시 재생).

## 채보 직접 수정
`charts/<id>.js` 안의 `notes` 는 `[시간ms, 레인]` 또는 `[시간ms, 레인, 1]` 입니다. 레인 0~3 = 왼쪽→오른쪽 버튼(키 ← ↓ ↑ →).
끝에 `1`이 붙으면 "바로 다음 노트와 띠로 연결"됩니다. 첫 노트를 친 뒤 손가락을 떼지 않고 다음 버튼 쪽으로 밀면 되고, 다음 버튼 위에 **미리 가 있어도**(노트 시간까지 머물러 있으면) 인정됩니다. 빠르게 밀어 중간 레인을 건너뛰어도 순서대로 통과 처리하며, 손가락이 화면 가장자리로 나가도 끊기지 않습니다. PC는 각 키를 순서대로 눌러도 됩니다.
**롱노트(길게 누르는 버튼)**: `[시작ms, 레인, 2, 끝ms]`. 시작 구슬을 타이밍에 맞춰 누른 뒤 **끝 시간까지 계속 누르고 있으면** 됩니다(끝나기 130ms 전까지만 눌러도 인정, 끝 시간이 되면 자동 완료). 중간에 놓으면 BREAK(콤보 끊김, 꼬리 판정 MISS). 머리와 꼬리가 각각 1판정(총 2판정)이고, 누르는 동안 다른 손가락으로 다른 레인 노트를 칠 수 있습니다. 일시정지하면 누르던 롱노트는 끊어집니다.
같은 시간에 두 레인을 넣으면 동시치기입니다. `level` 숫자도 자유롭게 바꿔도 됩니다.

## 롱노트 자동 추가 (tools/add_holds.py)
`python3 tools/add_holds.py` 는 기존 채보(`charts/*.js`)에서 노트 사이 빈 구간을 찾아 **기존 노트 하나를 롱노트로 바꿉니다**(노트를 지우거나 옮기지 않음, 재실행해도 같은 결과). 연결(띠)/동시치기 노트는 제외하고, 난이도별로 누르는 동안 쳐야 하는 노트 수(EASY 0 / NORMAL 1 / HARD 2), 최소·최대 길이, 롱노트 사이 간격을 다르게 잡습니다(파일 위쪽 `PARAMS`). `--clear` 로 전부 일반 노트로 되돌릴 수 있습니다. `make_charts.py` 로 채보를 새로 만들었다면 그 뒤에 `add_holds.py` 를 다시 실행하세요.

## 곡/그룹 추가
1. `songs/<그룹>/<id>.mp3` 추가 → `python3 tools/make_charts.py <id>`
2. `js/songs.js` 에 항목 추가, `index.html` 에 `<script src="charts/<id>.js">` 한 줄 추가

## GitHub Pages 배포
저장소 루트에 이 폴더 내용을 올리고 Settings → Pages → Branch: main / (root) 선택.
음원은 `fetch`/`<audio>`로 불러오므로 로컬 테스트는 `python3 -m http.server` 후 http://localhost:8000 으로 여세요.
저작권이 있는 음원을 공개 저장소에 올리면 문제가 될 수 있으니 비공개 저장소/개인 사용을 권장합니다.

## 판정/점수
PERFECT ±45ms(100%) / GREAT ±90ms(70%) / GOOD ±140ms(40%) / MISS. 만점 1,000,000.
등급 S≥95%, A≥90%, B≥80%, C≥70%. 최고 기록은 브라우저 localStorage(`vixxrg:best:<곡>:<난이도>`)에 저장됩니다.

## 모바일 앱처럼 설치하기 (PWA)
1. GitHub Pages 주소(https://아이디.github.io/저장소/)를 **휴대폰 Chrome**으로 엽니다.
2. 메뉴(⋮) → **앱 설치** 또는 **홈 화면에 추가** → 설치.
3. 홈 화면의 "VIXX Rhythm" 아이콘으로 실행하면 상단 시간/배터리 표시줄과 하단 내비게이션 바가 없는 **전체화면 가로 모드**로 열립니다.
- 설치 없이 브라우저에서 열어도 첫 화면을 터치하면 전체화면 + 가로 고정을 시도합니다. (아이폰 Safari는 브라우저 정책상 불가 → 공유 버튼 → "홈 화면에 추가"로 설치하세요. 아이폰은 가로 고정이 안 되므로 직접 돌려야 합니다.)
- 곡 음원은 처음 재생할 때 기기에 저장되어, 이후엔 오프라인에서도 플레이됩니다(전체 약 20MB).
- 파일을 수정해서 다시 올렸는데 안 바뀌면: 앱을 한 번 완전히 종료 후 다시 열거나, `sw.js` 맨 위 `VER` 숫자를 올리세요.
- 아이콘은 `icons/` 폴더(192/512/maskable/apple-touch)를 같은 이름으로 바꾸면 됩니다.


## 직접 녹음하기 (내 채보)
곡 선택 화면의 **● 녹음하기** → 곡이 나오면 박자에 맞춰 버튼(← ↓ ↑ → 또는 D F J K / 화면 터치)을 누르세요. **버튼을 0.35초 이상 누르고 있으면 롱노트로 저장됩니다.** 끝까지 듣거나 일시정지 → "저장하고 끝내기"로 저장됩니다. 저장한 채보는 **▶ 내 채보**로 플레이합니다. 곡마다 따로 저장되고 이 기기(브라우저)에만 남습니다. 결과 화면의 "채보 복사 (JSON)"로 내용을 복사해 `charts/<id>.js` 에 옮길 수 있습니다. 싱크 보정 값은 녹음/플레이에 똑같이 적용됩니다.

## 채보 없는 곡 (녹음 대기)
Rock Ur Body · 다칠 준비가 돼 있어 · hyde · 대.다.나.다.너 · 저주인형 · 대답은 너니까 · 기적 · Error · 이별공식 · 사슬 · 다이너마이트 · Fantasy · MILKY WAY · 향 · Amnesia · Gonna Be Alright · The Closer · 도원경 · 평행우주 는 채보가 아직 없습니다.
곡 선택 화면에서 PLAY 는 잠겨 있고 **● 녹음하기** 로 바로 녹음할 수 있습니다(곡 길이는 `songs.js` 의 `duration`).
녹음 → 일시정지(Esc/II) → "저장하고 끝내기"(노트 5개 이상) → 곡 선택 화면의 **⧉ 복사** 로 모든 곡의 녹음 채보를 한 번에 복사해 보내주세요.
채보를 `charts/곡id.js` 로 넣고 `index.html` 에 `<script src="charts/곡id.js">` 를 추가하면 PLAY 가 열립니다.
