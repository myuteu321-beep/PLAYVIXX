/* 곡 등록 파일 — 곡/그룹을 추가하려면 여기에 항목만 추가하세요.
   title/artist : 곡 선택 카드에 표시되는 곡명, 아티스트
   file   : MP3 경로 (songs/그룹/곡id.mp3)
   cover  : 곡 선택 카드 + 플레이 배경에 쓰이는 사진 (jpg/png/webp) (없으면 기본 표지)
   (선택) video : "videos/그룹/곡id.mp4" 를 적으면 플레이 배경에 영상(소리 없음)이 깔립니다. 없으면 cover 사진이 배경입니다.
   (선택) videoOffset : 영상 싱크 보정(초)
   color  : 곡 테마 컬러(#RRGGBB). 선택 화면 배경·카드 글로우·버튼·결과 화면에 쓰입니다 (없으면 보라색)
   offset : 노트 싱크 보정(ms). 노트가 소리보다 늦게 느껴지면 +, 빠르면 -
   duration : (채보가 아직 없는 곡만) 곡 길이(ms). 진행 바/미리듣기 위치/시간 표시에 쓰입니다. 채보 파일이 있으면 그쪽 값이 우선
   채보   : charts/곡id.js  (곡 id 와 파일명이 같아야 합니다) */
window.GROUPS = [
  { id: "vixx", name: "VIXX", songs: [
    { id: "rockurbody", title: "Rock Ur Body",         artist: "VIXX", file: "songs/vixx/rockurbody.mp3", cover: "covers/vixx/rockurbody.webp", color: "#ff3da8", offset: 0, duration: 222302 },
    { id: "onandon",    title: "다칠 준비가 돼 있어",   artist: "VIXX", file: "songs/vixx/onandon.mp3",    cover: "covers/vixx/onandon.webp",    color: "#8fe36b", offset: 0, duration: 189126 },
    { id: "hyde",       title: "hyde",                 artist: "VIXX", file: "songs/vixx/hyde.mp3",       cover: "covers/vixx/hyde.webp",       color: "#9aa8b8", offset: 0, duration: 195134 },
    { id: "gr8u",       title: "대.다.나.다.너",        artist: "VIXX", file: "songs/vixx/gr8u.mp3",       cover: "covers/vixx/gr8u.webp",       color: "#d4d9e3", offset: 0, duration: 209110 },
    { id: "onlyu",      title: "대답은 너니까",         artist: "VIXX", file: "songs/vixx/onlyu.mp3",      cover: "covers/vixx/onlyu.webp",      color: "#a8c98f", offset: 0, duration: 224705 },
    { id: "voodoo",     title: "저주인형",              artist: "VIXX", file: "songs/vixx/voodoo.mp3",     cover: "covers/vixx/voodoo.webp",     color: "#d9603f", offset: 0, duration: 216241 },
    { id: "eternity", title: "기적", artist: "VIXX", file: "songs/vixx/eternity.mp3", cover: "covers/vixx/eternity.webp", color: "#4f9dff", offset: 0, duration: 183980 },
    { id: "error", title: "Error", artist: "VIXX", file: "songs/vixx/error.mp3", cover: "covers/vixx/error.webp", color: "#aeb8c6", offset: 0, duration: 224888 },
    { id: "lovequation", title: "이별공식", artist: "VIXX", file: "songs/vixx/lovequation.mp3", cover: "covers/vixx/lovequation.webp", color: "#d9a76a", offset: 0, duration: 215066 },
    { id: "chained", title: "사슬", artist: "VIXX", file: "songs/vixx/chained.mp3", cover: "covers/vixx/chained.webp", color: "#d8372f", offset: 0, duration: 194482 },
    { id: "dynamite", title: "다이너마이트", artist: "VIXX", file: "songs/vixx/dynamite.mp3", cover: "covers/vixx/dynamite.webp", color: "#e85aa8", offset: 0, duration: 207856 },
    { id: "fantasy", title: "Fantasy", artist: "VIXX", file: "songs/vixx/fantasy.mp3", cover: "covers/vixx/fantasy.webp", color: "#a58cff", offset: 0, duration: 208666 },
    { id: "thecloser", title: "The Closer", artist: "VIXX", file: "songs/vixx/thecloser.mp3", cover: "covers/vixx/thecloser.webp", color: "#3f8a96", offset: 0, duration: 218410 },
    { id: "milkyway", title: "MILKY WAY", artist: "VIXX", file: "songs/vixx/milkyway.mp3", cover: "covers/vixx/milkyway.webp", color: "#f2c230", offset: 0, duration: 201535 },
    { id: "shangrila", title: "도원경", artist: "VIXX", file: "songs/vixx/shangrila.mp3", cover: "covers/vixx/shangrila.webp", color: "#8b4a7a", offset: 0, duration: 202397 },
    { id: "scentist", title: "향", artist: "VIXX", file: "songs/vixx/scentist.mp3", cover: "covers/vixx/scentist.webp", color: "#c0508f", offset: 0, duration: 192052 },
    { id: "parallel", title: "평행우주", artist: "VIXX", file: "songs/vixx/parallel.mp3", cover: "covers/vixx/parallel.webp", color: "#ff7a45", offset: 0, duration: 213656 },
    { id: "gonnabealright", title: "Gonna Be Alright", artist: "VIXX", file: "songs/vixx/gonnabealright.mp3", cover: "covers/vixx/gonnabealright.webp", color: "#6f6bd8", offset: 0, duration: 179304 },
    { id: "amnesia", title: "Amnesia", artist: "VIXX", file: "songs/vixx/amnesia.mp3", cover: "covers/vixx/amnesia.webp", color: "#9fb3a8", offset: 0, duration: 178129 },
    { id: "alive", title: "Alive", artist: "VIXX", file: "songs/vixx/alive.mp3", cover: "covers/vixx/alive.webp", color: "#8fb8d9", offset: 0, duration: 262844 },
    { id: "dark",     title: "어둠 속을 밝혀줘", artist: "VIXX", file: "songs/vixx/dark.mp3",     cover: "covers/vixx/dark.webp",  color: "#ffbf3f", offset: 0 },
    { id: "painful",  title: "아픈데 좋아",     artist: "VIXX", file: "songs/vixx/painful.mp3",  cover: "covers/vixx/painful.webp",  color: "#ff6ec7", offset: 0 },
    { id: "chemical", title: "Chemical",      artist: "VIXX", file: "songs/vixx/chemical.mp3", cover: "covers/vixx/chemical.webp", color: "#1de2b0", offset: 0 },
    { id: "spider",   title: "Spider",        artist: "VIXX", file: "songs/vixx/spider.mp3",   cover: "covers/vixx/spider.webp",  color: "#ff3b5c", offset: 0 },
    { id: "maze",     title: "MAZE",          artist: "VIXX", file: "songs/vixx/maze.mp3",     cover: "covers/vixx/maze.webp",  color: "#b46bff", offset: 0 },
    { id: "body",     title: "B.O.D.Y",       artist: "VIXX", file: "songs/vixx/body.m4a",     cover: "covers/vixx/body.webp",  color: "#4d8dff", offset: 0 },
    { id: "chaos", title: "Chaos", artist: "VIXX", file: "songs/vixx/chaos.mp3", cover: "covers/vixx/chaos.webp", color: "#b9bcc4", offset: 0, duration: 172878 },
    { id: "dependonme", title: "Depend On Me", artist: "VIXX", file: "songs/vixx/dependonme.mp3", cover: "covers/vixx/dependonme.webp", color: "#e8606a", offset: 0, duration: 207856 },
    { id: "desperate", title: "Desperate", artist: "VIXX", file: "songs/vixx/desperate.mp3", cover: "covers/vixx/desperate.webp", color: "#c9a24a", offset: 0, duration: 209371 },
    { id: "heaven", title: "Heaven", artist: "VIXX", file: "songs/vixx/heaven.mp3", cover: "covers/vixx/heaven.webp", color: "#c4504f", offset: 0, duration: 194900 },
    { id: "sayusayme", title: "Say U Say Me", artist: "VIXX", file: "songs/vixx/sayusayme.mp3", cover: "covers/vixx/sayusayme.webp", color: "#c9b27a", offset: 0, duration: 204199 },
    { id: "secretnight", title: "Secret Night", artist: "VIXX", file: "songs/vixx/secretnight.mp3", cover: "covers/vixx/secretnight.webp", color: "#8f7fb0", offset: 0, duration: 196127 },
    { id: "shadow", title: "Shadow", artist: "VIXX", file: "songs/vixx/shadow.mp3", cover: "covers/vixx/shadow.webp", color: "#9aa8c8", offset: 0, duration: 198296 },
    { id: "timemachine", title: "Time Machine", artist: "VIXX", file: "songs/vixx/timemachine.mp3", cover: "covers/vixx/timemachine.webp", color: "#7fa3d8", offset: 0, duration: 183092 },
    { id: "whatuwaiting", title: "What U Waiting For", artist: "VIXX", file: "songs/vixx/whatuwaiting.mp3", cover: "covers/vixx/whatuwaiting.webp", color: "#c85aa0", offset: 0, duration: 190485 },
    { id: "whattodo", title: "어떡하지", artist: "VIXX", file: "songs/vixx/whattodo.mp3", cover: "covers/vixx/whattodo.webp", color: "#cfcfd6", offset: 0, duration: 188082 },
    { id: "givemesomething", title: "Give me something", artist: "LEO", file: "songs/vixx/givemesomething.m4a", cover: "covers/vixx/givemesomething.webp", color: "#f08a2f", offset: 0, duration: 210906 },
    { id: "afterdark", title: "After Dark", artist: "VIXX", file: "songs/vixx/afterdark.mp3", cover: "covers/vixx/afterdark.webp", color: "#5a7ab0", offset: 0, duration: 187481 },
    { id: "beautifulkiller", title: "Beautiful Killer", artist: "VIXX", file: "songs/vixx/beautifulkiller.mp3", cover: "covers/vixx/beautifulkiller.webp", color: "#d0566e", offset: 0, duration: 198139 },
    { id: "blackout", title: "Black Out", artist: "VIXX", file: "songs/vixx/blackout.mp3", cover: "covers/vixx/blackout.webp", color: "#a06ab0", offset: 0, duration: 189989 },
    { id: "trigger", title: "Trigger", artist: "VIXX", file: "songs/vixx/trigger.mp3", cover: "covers/vixx/trigger.webp", color: "#e0455f", offset: 0, duration: 188813 },
    { id: "goodday", title: "Good Day", artist: "VIXX", file: "songs/vixx/goodday.mp3", cover: "covers/vixx/goodday.webp", color: "#f2b84b", offset: 0, duration: 181238 },
    { id: "escape", title: "Escape", artist: "VIXX", file: "songs/vixx/escape.mp3", cover: "covers/vixx/escape.webp", color: "#5fb3d9", offset: 0, duration: 206655 },
    { id: "circle", title: "Circle", artist: "VIXX", file: "songs/vixx/circle.mp3", cover: "covers/vixx/circle.webp", color: "#9a7be0", offset: 0, duration: 198008 },
    { id: "navyshininggold", title: "Navy & Shining Gold", artist: "VIXX", file: "songs/vixx/navyshininggold.mp3", cover: "covers/vixx/navyshininggold.webp", color: "#d4af37", offset: 0, duration: 188317 },
    { id: "silence", title: "Silence", artist: "VIXX", file: "songs/vixx/silence.mp3", cover: "covers/vixx/silence.webp", color: "#7f8fa8", offset: 0, duration: 222119 },
    { id: "oddsense", title: "Odd Sense", artist: "VIXX", file: "songs/vixx/oddsense.mp3", cover: "covers/vixx/oddsense.webp", color: "#3fc9a5", offset: 0, duration: 211200 },
    { id: "myvalentine", title: "My Valentine", artist: "VIXX", file: "songs/vixx/myvalentine.mp3", cover: "covers/vixx/myvalentine.webp", color: "#ff5a8a", offset: 0, duration: 220891 },
    { id: "savage", title: "SAVAGE", artist: "VIXX", file: "songs/vixx/savage.mp3", cover: "covers/vixx/savage.webp", color: "#c8312f", offset: 0, duration: 171180 },
    { id: "beautifulday", title: "BEAUTIFUL DAY", artist: "HYUK", file: "songs/vixx/beautifulday.m4a", cover: "covers/vixx/beautifulday.webp", color: "#ff9e3d", offset: 0, duration: 212648 },
    { id: "chilling", title: "Chilling", artist: "LEO", file: "songs/vixx/chilling.mp3", cover: "covers/vixx/chilling.webp", color: "#6ab7d8", offset: 0, duration: 177659 },
    { id: "stayforme", title: "Stay For Me (feat.서인국)", artist: "HYUK", file: "songs/vixx/stayforme.mp3", cover: "covers/vixx/stayforme.webp", color: "#f2a0b5", offset: 0, duration: 206629 },
    { id: "chocolatier", title: "Chocolatier", artist: "VIXX LR", file: "songs/vixx/chocolatier.mp3", cover: "covers/vixx/chocolatier.webp", color: "#8a5a3c", offset: 0, duration: 201979 },
    { id: "beautifulnight", title: "아름다운 밤에", artist: "VIXX LR", file: "songs/vixx/beautifulnight.mp3", cover: "covers/vixx/beautifulnight.webp", color: "#5b6fc9", offset: 0, duration: 219298 },
    { id: "romanticism", title: "로맨티시즘", artist: "LEO", file: "songs/vixx/romanticism.mp3", cover: "covers/vixx/romanticism.webp", color: "#4a78b8", offset: 0, duration: 198557 }
  ]}
];
