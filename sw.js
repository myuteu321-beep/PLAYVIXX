/* 오프라인/앱 설치용 서비스워커.
   - 화면/코드/채보/사진: 캐시를 먼저 보여주고 뒤에서 최신으로 갱신(stale-while-revalidate)
   - 음원(mp3/m4a): 처음 한 번 받아 저장 → 이후 오프라인 재생 (Range 요청 직접 처리)
   배포 후 파일 구조를 크게 바꿨다면 아래 VER 숫자를 올리세요. */
const VER = "vixx-v21";   // v21: 첫 화면 개편   // v6: 롱노트 추가 → 옛 캐시 버림
//   // v3: 곡 선택 화면 UI 개편(카드형·테마 컬러) / v2: Chemical 음원 교체 + 채보/게임 코드 변경 → 숫자를 올려 옛 캐시(옛 Chemical 포함)를 버림
const SHELL = ["./", "index.html", "css/style.css", "css/intro.css", "js/songs.js", "js/game.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  ...["spider", "chemical", "body", "dark", "maze", "painful"].flatMap(i => ["charts/" + i + ".js", "covers/vixx/" + i + ".webp"]),
  ...["eternity", "error", "lovequation", "chained", "dynamite", "fantasy", "thecloser", "milkyway", "shangrila", "scentist", "parallel", "gonnabealright", "amnesia", "alive"].flatMap(i => ["charts/" + i + ".js", "covers/vixx/" + i + ".webp"]),
  ...["chaos", "dependonme", "desperate", "heaven", "sayusayme", "secretnight", "shadow", "timemachine", "whatuwaiting", "whattodo", "givemesomething", "afterdark", "beautifulkiller", "blackout"].map(i => "charts/" + i + ".js"),
  ...["rockurbody", "onandon", "hyde", "gr8u", "voodoo", "onlyu", "chaos", "dependonme", "desperate", "heaven", "sayusayme", "secretnight", "shadow", "timemachine", "whatuwaiting", "whattodo", "givemesomething", "afterdark", "beautifulkiller", "blackout", "trigger", "goodday", "escape", "circle", "navyshininggold", "silence", "oddsense", "myvalentine", "savage", "beautifulday", "chilling", "stayforme", "chocolatier", "beautifulnight", "romanticism"].map(i => "covers/vixx/" + i + ".webp")];   // 채보 없는 곡은 표지만 미리 저장

self.addEventListener("install", e => { e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !k.startsWith(VER)).map(k => caches.delete(k)))).then(() => self.clients.claim())); });

async function audio(e, req) {
  const cache = await caches.open(VER + "-audio");
  let res = await cache.match(req.url);
  if (!res) {   // 처음 듣는 곡: 전체를 다 받을 때까지 기다리지 않고 바로 네트워크로 흘려보내 즉시 재생, 저장은 뒤에서
    e.waitUntil(cache.add(req.url).catch(() => {}));
    try { return await fetch(req); } catch (err) { return new Response("", { status: 504 }); }
  }
  const range = req.headers.get("range"); if (!range) return res;
  const buf = await res.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(range);
  const s = +m[1] || 0, en = Math.min(m[2] ? +m[2] : buf.byteLength - 1, buf.byteLength - 1);
  return new Response(buf.slice(s, en + 1), { status: 206, headers: {
    "Content-Type": res.headers.get("Content-Type") || "audio/mpeg", "Content-Range": `bytes ${s}-${en}/${buf.byteLength}`,
    "Content-Length": String(en - s + 1), "Accept-Ranges": "bytes" } });
}

self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === location.origin && /\.(mp3|m4a)$/i.test(u.pathname)) { e.respondWith(audio(e, r)); return; }
  if (u.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(u.host)) return;
  e.respondWith(caches.open(VER).then(async c => {
    const hit = await c.match(r);
    const net = fetch(r).then(res => { if (res.ok || res.type === "opaque") c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
