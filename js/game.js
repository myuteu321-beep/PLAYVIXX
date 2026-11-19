(() => {
const $ = s => document.querySelector(s);
const LS = "vixxrg:";
const load = (k, d) => { try { const v = localStorage.getItem(LS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem(LS + k, JSON.stringify(v)); } catch (e) {} };
const DIFFS = ["easy", "normal", "hard"];
let mode = "game", recNotes = [];   // game: 기본 채보 / rec: 직접 녹음 / mine: 내가 녹음한 채보로 플레이
const myKey = id => "rec:" + id, mine = id => load(myKey(id), null);
const exportText = (t, name, btn, label) => {   // 클립보드 복사 → 실패하면 전체선택된 텍스트창 + 파일 저장 버튼
  const ok = () => { if (btn) { btn.textContent = "복사됨!"; setTimeout(() => { btn.textContent = label; }, 2000); } };
  const box = () => {
    const w = document.createElement("div");
    w.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);display:flex;flex-direction:column;gap:8px;padding:12px;box-sizing:border-box";
    w.innerHTML = `<div style="color:#fff;font:600 14px sans-serif">전체 선택됨 → 복사하세요 (${t.length.toLocaleString()}자). 안 되면 '파일로 저장'</div><textarea readonly style="flex:1;width:100%;font:12px monospace"></textarea><div style="display:flex;gap:8px"><button class="btn" data-a="dl">파일로 저장</button><button class="btn ghost" data-a="x">닫기</button></div>`;
    const ta = w.querySelector("textarea"); ta.value = t;
    w.onclick = e => { const a = e.target.dataset.a; if (a === "x") w.remove(); if (a === "dl") { const u = URL.createObjectURL(new Blob([t], { type: "application/json" })), l = document.createElement("a"); l.href = u; l.download = name; l.click(); setTimeout(() => URL.revokeObjectURL(u), 3000); } };
    document.body.appendChild(w); ta.focus(); ta.select(); ta.setSelectionRange(0, t.length);
  };
  try { navigator.clipboard.writeText(t).then(ok, box); } catch (e) { box(); }
};
const songs = GROUPS.flatMap(g => g.songs);
const au = $("#au"), cv = $("#cv"), ctx = cv.getContext("2d");
let cur = songs.find(s => s.id === "rockurbody") || songs[0];   // 앱을 켜면 항상 Rock Ur Body 가 선택된 상태로 시작
let diff = load("diff", "normal");
const cfg = Object.assign({ speed: 6, offset: 0 }, load("settings", {}));
const fmt = n => Number(n).toLocaleString();
const durOf = s => ((CHARTS[s.id] || {}).duration) || s.duration || 0;   // 채보가 없는 곡은 songs.js 의 duration
const mmss = ms => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
const best = (id, d) => load(`best:${id}:${d}`, null);
const show = id => document.querySelectorAll(".screen").forEach(e => e.classList.toggle("on", e.id === id));
const cover = s => `<span class="cv"><em>${s.title[0]}</em><img src="${s.cover}" alt="" draggable="false" onerror="this.remove()"></span>`;

/* ---------- 인트로 / 곡 선택 ---------- */
const hx = k => Math.round(Math.max(0, Math.min(1, k)) * 255).toString(16).padStart(2, "0");
let idx = Math.max(0, songs.indexOf(cur)), drag = 0, dragging = false, sx = 0, downEl = null, pvT = 0, lastWheel = 0;
const track = $("#track"), stage = $("#stage");
const on = id => $("#" + id).classList.contains("on");
const step = () => (track.firstElementChild ? track.firstElementChild.offsetWidth : 240) * .7;
const stars = s => { const n = DIFFS.filter(d => best(s.id, d)).length; return "★".repeat(n) + "☆".repeat(3 - n); };
const hex2 = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const mixc = (h, t, k) => { const c = hex2(h), d = hex2(t); return "#" + c.map((v, i) => hx((v + (d[i] - v) * k) / 255)).join(""); };
const tcol = s => s.color || "#a855ff";
function renderTrack() {
  track.innerHTML = songs.map((s, i) => `<div class="card" data-i="${i}" style="--c:${tcol(s)};--crgb:${hex2(tcol(s)).join(",")}"><div class="art">${cover(s)}<i>${stars(s)}</i></div></div>`).join("");
  place();
}
function place() {
  const st = step();
  [...track.children].forEach((c, i) => { const o = i - idx + drag / st, a = Math.abs(o), sg = Math.sign(o) || 1, k = Math.min(a, 1);
    c.style.transform = `translate(-50%,-50%) perspective(900px) translateX(${o * st}px) rotateY(${-sg * k * 34}deg) scale(${Math.max(.5, 1 - a * .17)})`;
    c.style.opacity = Math.max(0, 1 - a * .34); c.style.zIndex = 100 - Math.round(a * 10); c.classList.toggle("on", i === idx); });
}
let bgFlip = 0, lastBg = "";
function theme() {
  const c = tcol(cur), r = document.documentElement.style;
  r.setProperty("--th", c); r.setProperty("--th2", mixc(c, "#ffffff", .45)); r.setProperty("--thd", mixc(c, "#000000", .5)); r.setProperty("--rgb", hex2(c).join(","));
  if (cur.cover !== lastBg) { lastBg = cur.cover; const L = document.querySelectorAll("#selbg .bgl"); bgFlip ^= 1;
    L[bgFlip].style.backgroundImage = `url("${cur.cover}")`; L[bgFlip].classList.add("on"); L[bgFlip ^ 1].classList.remove("on"); }
}
function renderInfo() {
  const ch = CHARTS[cur.id], b = best(cur.id, diff), gp = GROUPS.find(x => x.songs.includes(cur));
  $("#info").innerHTML = `<div class="kick"><span>${gp.name}</span>${durOf(cur) ? `<span>${mmss(durOf(cur))}</span>` : ""}</div><h2 class="ttl">${cur.title}</h2><div class="art2">${cur.artist || ""}</div>${ch ? "" : `<div class="nochart">채보 준비 중 — ● 녹음하기로 채보를 녹음하세요</div>`}
    <div class="best"><div class="gr${b ? "" : " none"}">${b ? b.grade : "–"}</div><div class="bt"><small>BEST SCORE</small><b>${b ? fmt(b.score) : "—"}</b><small>${b ? "MAX COMBO " + b.combo : "NO RECORD"}</small></div></div>`;
  $("#cnt").textContent = String(idx + 1).padStart(2, "0") + " / " + String(songs.length).padStart(2, "0");
  $("#start").disabled = !(ch && ch[diff]); $("#rec").classList.toggle("hot", !ch);
  const m = mine(cur.id), has = !!(m && m.length); $("#mine").disabled = !has; $("#mine").textContent = has ? `▶ 내 채보 (${m.length}개)` : "▶ 내 채보";
}
function renderDiffs() {
  const ch = CHARTS[cur.id]; if (ch && !ch[diff]) diff = "normal";
  $("#diffs").innerHTML = DIFFS.map(d => `<button class="dc ${d} ${d === diff ? "on" : ""}" data-d="${d}" ${ch && ch[d] ? "" : "disabled"}><small>${d.toUpperCase()}</small><b>${ch && ch[d] ? "Lv." + ch[d].level : "-"}</b></button>`).join("");
}
function pick(i) {
  idx = Math.max(0, Math.min(songs.length - 1, i)); const changed = cur !== songs[idx]; cur = songs[idx]; save("song", cur.id);
  theme(); place(); renderInfo(); renderDiffs(); if (changed) schedulePreview();
}
function stopPreview() { clearTimeout(pvT); au.pause(); au.onloadedmetadata = null; }
function schedulePreview() { stopPreview(); pvT = setTimeout(() => {
  if (running || !on("select")) return; const pos = (durOf(cur) / 1000 || 100) * .3;
  au.onerror = null; au.volume = .8; au.onloadedmetadata = () => { au.currentTime = pos; au.play().catch(() => {}); }; au.src = cur.file; au.load(); }, 350); }
function goSelect() { mode = "game"; enterFull(); show("select"); $("#settings").classList.remove("on"); theme(); renderTrack(); renderInfo(); renderDiffs(); schedulePreview(); }
function goIntro() { stopPreview(); show("intro"); }
$("#introT").textContent = "PLAY " + GROUPS[0].name; $("#grp").textContent = GROUPS[0].name;
$("#intro").onclick = goSelect;
$("#close").onclick = goIntro;
$("#prev").onclick = () => pick(idx - 1); $("#next").onclick = () => pick(idx + 1);
$("#diffs").onclick = e => { const b = e.target.closest(".dc"); if (b && !b.disabled) { diff = b.dataset.d; save("diff", diff); renderDiffs(); renderInfo(); } };
$("#start").onclick = () => { mode = "game"; start(); };
$("#rec").onclick = () => { mode = "rec"; start(); };
$("#mine").onclick = () => { mode = "mine"; start(); };
$("#mall").onclick = () => {   // 저장된 내 채보를 전부 한 번에 복사 {"곡id":[[ms,레인(,2,끝ms)],...]}
  const all = {}; songs.forEach(x => { const m = mine(x.id); if (m && m.length) all[x.id] = m; });
  const t = JSON.stringify(all), b = $("#mall");
  if (!Object.keys(all).length) { b.textContent = "채보 없음"; setTimeout(() => { b.textContent = "⧉ 복사"; }, 1500); return; }
  exportText(t, "vixx-charts.json", b, "⧉ 복사"); };
$("#gear").onclick = () => $("#settings").classList.toggle("on");
$("#sp").value = cfg.speed; $("#spo").textContent = cfg.speed; $("#of").value = cfg.offset; $("#ofo").textContent = cfg.offset + "ms";
$("#sp").oninput = e => { cfg.speed = +e.target.value; $("#spo").textContent = cfg.speed; save("settings", cfg); };
$("#of").oninput = e => { cfg.offset = +e.target.value; $("#ofo").textContent = cfg.offset + "ms"; save("settings", cfg); };
stage.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; dragging = true; sx = e.clientX; drag = 0; downEl = e.target.closest(".card"); stage.classList.add("dragging"); });
const endDrag = () => { if (!dragging) return; dragging = false; stage.classList.remove("dragging");
  let t = idx; if (Math.abs(drag) > 8) t = idx - Math.max(-3, Math.min(3, Math.round(drag / (step() * .5)))); else if (downEl) t = +downEl.dataset.i;
  drag = 0; pick(t); place(); };
addEventListener("pointermove", e => { if (dragging) { drag = e.clientX - sx; place(); } });
addEventListener("pointerup", endDrag); addEventListener("pointercancel", endDrag);
stage.addEventListener("wheel", e => { const n = Date.now(); if (n - lastWheel > 220) { lastWheel = n; pick(idx + ((e.deltaY + e.deltaX) > 0 ? 1 : -1)); } }, { passive: true });
addEventListener("resize", () => on("select") && place());

/* ---------- 게임 상태 ---------- */
const J = [["PERFECT", 45, 1, "#ffffff"], ["GREAT", 90, .7, "#ff8cf2"], ["GOOD", 140, .4, "#8fb4ff"]];
const COL = ["#b57bff", "#ff5ce1", "#6fb6ff", "#d58bff"];
const KEYS = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, KeyD: 0, KeyF: 1, KeyJ: 2, KeyK: 3 };
let S = null, running = false, paused = false, raf = 0, bgImg = null;
const LEAD = 3000;   // 준비 시간(ms) — 3, 2, 1 카운트다운 동안 노트가 먼저 내려오고, 끝나면 음원 재생
let leading = false; const lead = { el: 0, last: 0 };
let startedAt = 0, audioOn = false, lastA = -1, lastP = 0;
let lanes, li, total, sum, score, combo, maxCombo, cnt, pressed, rings, jmsg, lastT, W, H, dur;
const ptr = new Map(), flash = [0, 0, 0, 0], vid = $("#bgv");
let act = [], late = [], recHold = [];   // 롱노트: act=누르고 있는 중, late=놓쳤거나 끊긴 것(흐리게 표시), recHold=녹음 중 누르고 있는 키
let parts = [], hasVideo = false, lastSync = 0;   // pointerId -> 마지막 레인 (슬라이드용)

let wake = null;
function enterFull() {
  const el = document.documentElement, installed = matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches;
  if (!installed && !document.fullscreenElement && el.requestFullscreen)
    el.requestFullscreen({ navigationUI: "hide" }).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape")).catch(() => {});
}
const keepAwake = on => { try { if (on) navigator.wakeLock && navigator.wakeLock.request("screen").then(w => { wake = w; }).catch(() => {}); else if (wake) { wake.release(); wake = null; } } catch (e) {} };
function start() {
  enterFull(); keepAwake(true);
  const ch = mode === "rec" ? { notes: [] } : mode === "mine" ? { level: 0, notes: mine(cur.id) || [] } : CHARTS[cur.id][diff];
  S = { song: cur, diff: mode === "rec" ? "REC" : mode === "mine" ? "MY" : diff, chart: ch };
  recNotes = [];
  lanes = [[], [], [], []]; li = [0, 0, 0, 0];
  const all = ch.notes.map(n => ({ t: n[0], l: n[1], link: n[2] === 1, hold: n[2] === 2 && n[3] > n[0], end: n[2] === 2 && n[3] > n[0] ? n[3] : n[0], over: 0, done: 0, hit: 0, prev: null, next: null }));
  all.sort((a, b) => a.t - b.t);
  all.forEach((n, i) => { if (n.link && all[i + 1]) { n.next = all[i + 1]; all[i + 1].prev = n; } else n.link = false; lanes[n.l].push(n); });
  total = all.reduce((a, n) => a + (n.hold ? 2 : 1), 0); sum = score = combo = maxCombo = 0; act = []; late = []; recHold = [];   // 롱노트는 머리+꼬리 2판정
  cnt = { PERFECT: 0, GREAT: 0, GOOD: 0, MISS: 0 };
  pressed = [0, 0, 0, 0]; rings = []; jmsg = null; ptr.clear();
  lastT = all.reduce((a, n) => Math.max(a, n.end), 0); dur = durOf(cur) || 1;
  bgImg = new Image(); bgImg.onerror = () => { bgImg = null; }; bgImg.src = cur.cover;
  stopPreview(); au.volume = 1; parts = []; flash.fill(0);
  hasVideo = false; $("#play").classList.remove("vid"); vid.removeAttribute("src");
  if (cur.video) { vid.onloadeddata = () => { hasVideo = true; $("#play").classList.add("vid"); vid.currentTime = cur.videoOffset || 0; }; vid.onerror = () => { hasVideo = false; $("#play").classList.remove("vid"); }; vid.src = cur.video; vid.load(); }
  au.onerror = () => { if (running) { stop(); alert("음원 파일을 불러오지 못했어요.\n경로를 확인하세요: " + cur.file); show("select"); } };
  show("play"); $("#pause").classList.remove("on"); $("#recsave").style.display = mode === "rec" ? "block" : "none"; resize();
  audioOn = false; lastA = -1; paused = false; running = true; startedAt = performance.now();
  // START 후 3초 카운트다운(준비 시간) → 음원 재생. 미리듣기로 이미 불러온 곡이면 다시 내려받지 않고 미리 준비해 둠
  const url = new URL(cur.file, location.href).href;
  if (au.src !== url || au.error) { au.src = cur.file; au.load(); }
  au.pause(); try { au.currentTime = 0; } catch (e) {}
  leading = true; lead.el = 0; lead.last = performance.now();
  cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
}
function stop() { keepAwake(false); running = false; cancelAnimationFrame(raf); au.pause(); vid.pause(); }

function clock() {
  const p = performance.now();
  if (leading) {   // 준비 시간: 시계가 -3000 → 0 으로 흘러가며 첫 노트들이 미리 내려옴
    lead.el += p - lead.last; lead.last = p;
    if (lead.el < LEAD) return lead.el - LEAD;
    leading = false; startedAt = p; au.play().catch(() => {});
  }
  if (!audioOn) {   // 음원이 실제로 재생되기 시작할 때까지(보통 0.1초 미만) 대기
    if (au.paused || au.readyState < 3 || !(au.currentTime > 0)) return 0;
    audioOn = true; lastA = -1;
    if (hasVideo) { vid.currentTime = cur.videoOffset || 0; vid.play().catch(() => {}); lastSync = performance.now(); } }
  const a = au.currentTime * 1000;
  if (a !== lastA) { lastA = a; lastP = p; }
  return lastA + (p - lastP) - cfg.offset - cur.offset;
}
const travel = () => 2100 - (cfg.speed - 1) * 140;

function judge(n, d) {
  const a = Math.abs(d), j = J.find(x => a <= x[1]); if (!j) return false;
  n.done = 1; n.hit = 1; sum += j[2]; cnt[j[0]]++; combo++; maxCombo = Math.max(maxCombo, combo);
  score = Math.round(1e6 * sum / total);
  jmsg = { txt: j[0], c: j[3], at: performance.now(), late: j[0] !== "PERFECT" ? (d > 0 ? "SLOW" : "FAST") : "" };
  const now = performance.now(), g = G(), px = g.cx + (n.l - 1.5) * g.lw;
  rings.push({ l: n.l, at: now, c: COL[n.l] }); flash[n.l] = now;
  for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * 2.4, v = .15 + Math.random() * .4; parts.push({ x: px, y: g.jy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, at: now, c: i % 3 ? "#5ad7ff" : "#ffffff" }); }
  return true;
}
function head(l) { const q = lanes[l]; while (li[l] < q.length && q[li[l]].done) li[l]++; return q[li[l]]; }
// id: 누르고 있는 입력의 식별자(키 코드 / 포인터 id) — 롱노트를 놓았는지 알기 위해 필요
function press(l, id) {
  if (!running || paused) return;
  if (mode === "rec") { pressed[l] = flash[l] = performance.now(); if (audioOn) { const r = [Math.round(clock()), l]; recNotes.push(r); recHold.push({ id, r }); } return; }
  const n = head(l);
  pressed[l] = performance.now();
  if (!n) return;
  const d = clock() - n.t; if (d < -140) return;
  if (judge(n, d) && n.hold) act.push({ n, id });
}
// 롱노트 꼬리 판정: ok=끝까지(또는 끝나기 130ms 전까지) 눌렀다 / !ok=중간에 놓음
function holdEnd(n, ok) {
  const now = performance.now(); n.over = ok ? 1 : 2;
  if (ok) { sum += 1; cnt.PERFECT++; combo++; maxCombo = Math.max(maxCombo, combo); score = Math.round(1e6 * sum / total);
    jmsg = { txt: "PERFECT", c: "#ffffff", at: now, late: "" }; flash[n.l] = now; rings.push({ l: n.l, at: now, c: COL[n.l] }); }
  else { cnt.MISS++; combo = 0; jmsg = { txt: "BREAK", c: "#7d6a9e", at: now, late: "" }; late.push(n); }
}
function release(id) {
  if (!running) return;
  if (mode === "rec") {   // 녹음: 0.35초 이상 누르고 있었으면 롱노트로 저장
    const k = recHold.findIndex(h => h.id === id); if (k < 0) return;
    const h = recHold.splice(k, 1)[0], e = Math.round(clock()); if (e - h.r[0] >= 350) { h.r[2] = 2; h.r[3] = e; } return; }
  const k = act.findIndex(a => a.id === id); if (k < 0) return;
  const a = act.splice(k, 1)[0]; holdEnd(a.n, clock() >= a.n.end - 130);
}
// 이어진 노트(띠)의 두 번째 이후 노트: 손가락이 그 레인 위에 "있기만 하면" 인정.
//  - 너무 일찍 와도 OK (노트 시간이 될 때까지 손가락이 머물러 있으면 update() 가 처리)
//  - 앞 노트를 놓쳤어도(MISS) 이어서 밀어 오면 이 노트부터는 다시 인정
//  - 일찍 닿은 것은 감점 없이 PERFECT 로, 늦게 닿은 것만 늦은 만큼 판정
function chainHit(l, t) {
  const n = head(l);
  if (!n || n.done || !n.prev || !n.prev.done) return false;
  const d = t - n.t; if (d < -140) return false;
  if (!judge(n, d < 0 ? 0 : d)) return false;
  pressed[l] = performance.now(); return true;
}
function slideInto(l) { return running && !paused && chainHit(l, clock()); }
function update(t) {
  for (let k = act.length - 1; k >= 0; k--) { const n = act[k].n; pressed[n.l] = performance.now(); if (t >= n.end) { act.splice(k, 1); holdEnd(n, true); } }   // 누르고 있는 롱노트
  if (late.length) late = late.filter(n => t < n.end + 250);
  for (const l of ptr.values()) { const n = head(l); if (n && n.prev && t >= n.t - 80) chainHit(l, t); }   // 누른 채 머무는 중
  for (let l = 0; l < 4; l++) { const q = lanes[l];
    while (li[l] < q.length && (q[li[l]].done || t - q[li[l]].t > 140)) {
      if (!q[li[l]].done) { const m = q[li[l]]; m.done = 1; cnt.MISS += m.hold ? 2 : 1; combo = 0; if (m.hold) { m.over = 2; late.push(m); } jmsg = { txt: "MISS", c: "#7d6a9e", at: performance.now(), late: "" }; }
      li[l]++; } }
  if (mode !== "rec" && t > lastT + 1800) finish();
}

/* ---------- 렌더 (원근감 있는 도로) ---------- */
let SAL = 0;
const probe = document.createElement("div"); probe.style.cssText = "position:fixed;visibility:hidden;padding-left:env(safe-area-inset-left)"; document.body.appendChild(probe);
function resize() {
  SAL = parseFloat(getComputedStyle(probe).paddingLeft) || 0;
  const r = devicePixelRatio || 1, b = cv.getBoundingClientRect();
  cv.width = b.width * r; cv.height = b.height * r; ctx.setTransform(r, 0, 0, r, 0, 0); W = b.width; H = b.height;
}
addEventListener("resize", () => running && resize());
const G = () => { const fw = Math.min(W, 760); return { cx: W / 2, hy: H * .13, jy: H * .8, lw: Math.min(fw / 4.4, H * .34) }; };
// 시간 차(dt) → 화면 좌표. q: 0(소실점) ~ 1(판정선)
function proj(g, l, dt, tr) {
  const p = Math.min(1.25, 1 - dt / tr), q = p <= 0 ? 0 : Math.pow(p, 1.7), s = .2 + .8 * q;
  return { x: g.cx + (l - 1.5) * g.lw * s, y: g.hy + (g.jy - g.hy) * q, s, r: g.lw * s * .36 };
}
function orb(x, y, r, c, a) {
  ctx.globalAlpha = a; ctx.shadowColor = c; ctx.shadowBlur = r * .9;
  const gr = ctx.createRadialGradient(x, y - r * .25, r * .1, x, y, r);
  gr.addColorStop(0, "#fff"); gr.addColorStop(.35, c); gr.addColorStop(1, "#3a0d7a");
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = "#ffffffdd"; ctx.lineWidth = Math.max(1, r * .1); ctx.beginPath(); ctx.arc(x, y, r * .98, 0, 7); ctx.stroke(); ctx.globalAlpha = 1;
}
function ribbon(a, b, c) {
  const w1 = a.r * .55, w2 = b.r * .55, g = ctx.createLinearGradient(0, a.y, 0, b.y);
  g.addColorStop(0, c + "cc"); g.addColorStop(1, c + "66");
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a.x - w1, a.y); ctx.lineTo(a.x + w1, a.y); ctx.lineTo(b.x + w2, b.y); ctx.lineTo(b.x - w2, b.y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#ffffff88"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x - w1, a.y); ctx.lineTo(b.x - w2, b.y); ctx.moveTo(a.x + w1, a.y); ctx.lineTo(b.x + w2, b.y); ctx.stroke();
}
// 롱노트 몸통. st: 0=대기, 1=누르는 중(밝게 깜빡), 2=놓침/끊김(흐리게)
function holdBar(a, b, c, st) {
  const w1 = a.r * .78, w2 = b.r * .78, col = st === 2 ? "#6b5a8a" : c, now = performance.now();
  const gr = ctx.createLinearGradient(0, a.y, 0, b.y);
  gr.addColorStop(0, col + (st === 1 ? "ee" : "b0")); gr.addColorStop(1, col + (st === 1 ? "aa" : "55"));
  ctx.save(); if (st === 1) { ctx.shadowColor = c; ctx.shadowBlur = 26; }
  ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(a.x - w1, a.y); ctx.lineTo(a.x + w1, a.y); ctx.lineTo(b.x + w2, b.y); ctx.lineTo(b.x - w2, b.y); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = st === 2 ? "#ffffff33" : "#ffffffcc"; ctx.lineWidth = 2; ctx.beginPath();
  ctx.moveTo(a.x - w1, a.y); ctx.lineTo(b.x - w2, b.y); ctx.moveTo(a.x + w1, a.y); ctx.lineTo(b.x + w2, b.y); ctx.stroke();
  if (st === 1) { ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .3 + .25 * Math.sin(now / 55); ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.moveTo(a.x - w1 * .45, a.y); ctx.lineTo(a.x + w1 * .45, a.y); ctx.lineTo(b.x + w2 * .45, b.y); ctx.lineTo(b.x - w2 * .45, b.y); ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = "source-over"; }
  ctx.globalAlpha = st === 2 ? .4 : .95; ctx.fillStyle = st === 2 ? "#8a78aa" : "#ffffff";   // 꼬리 끝 표시
  ctx.beginPath(); ctx.ellipse(b.x, b.y, w2 * 1.1, Math.max(1.5, w2 * .5), 0, 0, 7); ctx.fill(); ctx.restore();
}
function loop() {
  if (!running) return;
  raf = requestAnimationFrame(loop);
  if (paused) return;
  const t = clock(); update(t); if (!running) return;
  if (hasVideo && audioOn) { const n = performance.now(); if (n - lastSync > 1500) { lastSync = n; const want = au.currentTime + (cur.videoOffset || 0); if (Math.abs(vid.currentTime - want) > .3) vid.currentTime = want; if (vid.paused) vid.play().catch(() => {}); } }
  draw(t);
}
function draw(t) {
  const now = performance.now(), tr = travel(), g = G(), { cx, hy, jy, lw } = g, U = Math.min(W, 520, H * 1.15), L = 16 + SAL;
  ctx.clearRect(0, 0, W, H);
  if (hasVideo) { ctx.fillStyle = "rgba(7,4,15,.68)"; ctx.fillRect(0, 0, W, H); }
  else { ctx.fillStyle = "#07040f"; ctx.fillRect(0, 0, W, H);
    if (bgImg && bgImg.complete && bgImg.naturalWidth) { const k = Math.max(W / bgImg.naturalWidth, H / bgImg.naturalHeight); ctx.globalAlpha = .4; ctx.drawImage(bgImg, (W - bgImg.naturalWidth * k) / 2, (H - bgImg.naturalHeight * k) / 2, bgImg.naturalWidth * k, bgImg.naturalHeight * k); ctx.globalAlpha = 1; } }
  const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, hasVideo ? "#0a051455" : "#0a0514cc"); bg.addColorStop(1, "#3a0d6a88"); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const qb = (H - hy) / (jy - hy), sb = .2 + .8 * qb, sT = .2;       // 화면 맨 아래까지 도로 연장
  const X = (l, s) => cx + (l - 2) * lw * s;
  ctx.save(); ctx.beginPath(); ctx.moveTo(X(0, sT), hy); ctx.lineTo(X(4, sT), hy); ctx.lineTo(X(4, sb), H); ctx.lineTo(X(0, sb), H); ctx.closePath();
  const rg = ctx.createLinearGradient(0, hy, 0, H); rg.addColorStop(0, "#12072400"); rg.addColorStop(1, "#1c0b3acc"); ctx.fillStyle = rg; ctx.fill(); ctx.restore();
  for (let l = 0; l < 4; l++) { const k = Math.max(Math.max(0, 1 - (now - pressed[l]) / 300) * .7, Math.max(0, 1 - (now - flash[l]) / 420));   // 누른 레인의 핑크 빔
    if (k > 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.beginPath(); ctx.moveTo(X(l, sT), hy); ctx.lineTo(X(l + 1, sT), hy); ctx.lineTo(X(l + 1, sb), H); ctx.lineTo(X(l, sb), H); ctx.closePath();
      const bm = ctx.createLinearGradient(0, hy + (jy - hy) * .2, 0, H); bm.addColorStop(0, "#ff2fb800"); bm.addColorStop(.7, "#ff2fb8" + hx(k * .85)); bm.addColorStop(1, "#ffffff" + hx(k * .9)); ctx.fillStyle = bm; ctx.fill(); ctx.restore(); } }
  ctx.shadowColor = "#a855ff"; ctx.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { ctx.strokeStyle = i % 4 ? "#4a2390" : "#d58bff"; ctx.shadowBlur = i % 4 ? 0 : 16; ctx.beginPath(); ctx.moveTo(X(i, sT), hy); ctx.lineTo(X(i, sb), H); ctx.stroke(); }
  ctx.shadowBlur = 0; ctx.strokeStyle = "#ff5ce188"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(0, 1), jy); ctx.lineTo(X(4, 1), jy); ctx.stroke();
  for (let l = 0; l < 4; l++) {                                      // 판정 버튼
    const x = X(l + .5, 1), k = Math.max(0, 1 - (now - pressed[l]) / 160), r = lw * .38;
    ctx.strokeStyle = COL[l]; ctx.lineWidth = 3; ctx.shadowColor = COL[l]; ctx.shadowBlur = 14 + k * 16;
    ctx.fillStyle = COL[l] + Math.round(30 + k * 150).toString(16).padStart(2, "0"); ctx.beginPath(); ctx.arc(x, jy, r, 0, 7); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
  }
  ctx.save(); ctx.beginPath(); ctx.rect(0, hy - 2, W, H); ctx.clip();
  const vis = [];                                                    // 연결 띠 → 노트 순서로 그림
  for (let l = 0; l < 4; l++) { const q = lanes[l]; for (let i = li[l]; i < q.length; i++) { const n = q[i]; if (n.t - t > tr * 1.05) break; vis.push(n); } }
  for (let l = 0; l < 4; l++) { const q = lanes[l]; for (let i = Math.max(0, li[l] - 3); i < li[l]; i++) if (q[i].link && !q[i].next.done) vis.push(q[i]); }
  act.forEach(a => vis.push(a.n)); late.forEach(n => vis.push(n));   // 누르는 중/놓친 롱노트도 그림
  vis.sort((a, b) => b.t - a.t);
  vis.forEach(n => { if (!n.link || n.next.done) return;
    const nx = proj(g, n.next.l + .5 - .5, n.next.t - t, tr), nxp = { ...nx, x: X(n.next.l + .5, nx.s) };
    const a = n.hit ? { x: X(n.l + .5, 1), y: jy, r: lw * .38 * .9, s: 1 } : (() => { const p = proj(g, n.l, n.t - t, tr); return { ...p, x: X(n.l + .5, p.s) }; })();
    ribbon(a, nxp, n.hit ? "#ffd1fb" : COL[n.l]); });
  vis.forEach(n => { if (!n.hold) return;                            // 롱노트 몸통(띠) — 노트 구슬 아래에 깔림
    const st = n.over === 2 || (n.done && !n.hit) ? 2 : n.hit && !n.over ? 1 : 0;
    const hp = st === 1 ? { x: X(n.l + .5, 1), y: jy, r: lw * .38, s: 1 } : (() => { const p = proj(g, n.l, n.t - t, tr); return { ...p, x: X(n.l + .5, p.s) }; })();
    const tq = proj(g, n.l, n.end - t, tr); holdBar(hp, { ...tq, x: X(n.l + .5, tq.s) }, COL[n.l], st); });
  vis.forEach(n => { if (n.done) return; const p = proj(g, n.l, n.t - t, tr), al = Math.min(1, (1 - (n.t - t) / tr) * 3 + .2); orb(X(n.l + .5, p.s), p.y, p.r, COL[n.l], al);
    if (n.hold) { ctx.globalAlpha = al; ctx.strokeStyle = "#5ad7ff"; ctx.lineWidth = Math.max(1.5, p.r * .12); ctx.beginPath(); ctx.arc(X(n.l + .5, p.s), p.y, p.r * 1.22, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; } });
  ctx.restore();
  for (let l = 0; l < 4; l++) {                                     // 버튼 위 빛 폭발
    const k = Math.max(Math.max(0, 1 - (now - pressed[l]) / 220) * .55, Math.max(0, 1 - (now - flash[l]) / 380)); if (k <= 0) continue;
    const R = lw * (.9 + .6 * k); ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(X(l + .5, 1), jy); ctx.scale(1, .5);
    const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, "rgba(255,255,255," + k + ")"); gr.addColorStop(.35, "#5ad7ff" + hx(k * .65)); gr.addColorStop(1, COL[l] + "00");
    ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill(); ctx.restore(); }
  parts = parts.filter(p => now - p.at < 520); ctx.save(); ctx.globalCompositeOperation = "lighter";
  parts.forEach(p => { const a = now - p.at, k = 1 - a / 520; ctx.globalAlpha = k; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x + p.vx * a, p.y + p.vy * a + .0004 * a * a, 2 + 3 * k, 0, 7); ctx.fill(); });
  ctx.restore(); ctx.globalAlpha = 1;
  rings = rings.filter(r => now - r.at < 380);
  rings.forEach(r => { const k = (now - r.at) / 380; ctx.strokeStyle = r.c; ctx.globalAlpha = 1 - k; ctx.lineWidth = 4; ctx.shadowColor = r.c; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(X(r.l + .5, 1), jy, lw * .38 * (1 + k * .7), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; ctx.shadowBlur = 0; });
  // HUD
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#c9b3ff"; ctx.font = "700 13px Sora,sans-serif"; ctx.fillText("SCORE", L, 36);
  ctx.fillStyle = "#fff"; ctx.shadowColor = "#a855ff"; ctx.shadowBlur = 14; ctx.font = "800 32px Sora,sans-serif"; ctx.fillText(fmt(score), L, 68); ctx.shadowBlur = 0;
  ctx.fillStyle = "#2b1650"; ctx.fillRect(L, 78, Math.min(220, W - 90), 6); const pg = ctx.createLinearGradient(L, 0, L + 220, 0); pg.addColorStop(0, "#8b2bff"); pg.addColorStop(1, "#ff5ce1"); ctx.fillStyle = pg; ctx.fillRect(L, 78, Math.min(220, W - 90) * Math.min(1, Math.max(0, t / dur)), 6);
  ctx.fillStyle = "#9a86c4"; ctx.font = '400 12px "Noto Sans KR",sans-serif'; ctx.fillText(`${S.song.title} · ${S.diff.toUpperCase()}`, L, 102);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  if (jmsg) { const k = (now - jmsg.at) / 650; if (k < 1) { ctx.globalAlpha = 1 - k * k; ctx.fillStyle = jmsg.c; ctx.shadowColor = jmsg.c; ctx.shadowBlur = 16;
      ctx.font = `800 ${U / 11 * (1 + (1 - k) * .2)}px Sora,sans-serif`; ctx.fillText(jmsg.txt, cx, H * .38);
      if (combo > 1) { ctx.fillStyle = "#fff"; ctx.font = `800 ${U / 6}px Sora,sans-serif`; ctx.fillText(combo, cx, H * .38 + U / 6); }
      if (jmsg.late) { ctx.font = "700 12px Sora"; ctx.fillStyle = jmsg.c; ctx.fillText(jmsg.late, cx, H * .38 - U / 11); }
      ctx.shadowBlur = 0; ctx.globalAlpha = 1; } }
  if (combo > 1 && (!jmsg || now - jmsg.at >= 650)) { ctx.fillStyle = "#ffffffaa"; ctx.font = `800 ${U / 6}px Sora,sans-serif`; ctx.fillText(combo, cx, H * .42); ctx.font = "700 13px Sora"; ctx.fillStyle = "#d58bff"; ctx.fillText("COMBO", cx, H * .42 + U / 9); }
  if (mode === "rec") { ctx.fillStyle = "#ff5c7a"; ctx.shadowColor = "#ff2f6b"; ctx.shadowBlur = 14; ctx.font = `800 ${U / 13}px Sora`; ctx.fillText(`● REC  ${recNotes.length}`, cx, H * .3); ctx.shadowBlur = 0; }
  if (leading) {   // 준비 시간 카운트다운 3 · 2 · 1
    const rem = LEAD - lead.el, k = Math.max(1, Math.ceil(rem / 1000)), ph = k - rem / 1000;   // ph: 각 숫자가 나온 뒤 0→1
    ctx.save(); ctx.textAlign = "center"; ctx.globalAlpha = Math.max(.15, 1 - ph * .75);
    ctx.fillStyle = "#fff"; ctx.shadowColor = "#a855ff"; ctx.shadowBlur = 24; ctx.font = `800 ${U / 5 * (1.25 - ph * .25)}px Sora,sans-serif`; ctx.fillText(k, cx, H * .47);
    ctx.shadowBlur = 0; ctx.globalAlpha = .85; ctx.fillStyle = "#d58bff"; ctx.font = "700 14px Sora,sans-serif"; ctx.fillText("GET READY", cx, H * .47 + U / 7); ctx.restore();
  }
  if (!leading && !audioOn && now - startedAt > 400) { ctx.fillStyle = "#fff"; ctx.shadowColor = "#a855ff"; ctx.shadowBlur = 20; ctx.font = `800 ${U / 12}px Sora`; ctx.fillText(au.paused ? "TAP TO PLAY" : "LOADING...", cx, H * .45); ctx.shadowBlur = 0; }
}

/* ---------- 입력 ---------- */
const kick = () => { if (running && !paused && !leading && !audioOn && au.paused) au.play().catch(() => {}); };   // 자동재생이 막힌 브라우저용
addEventListener("keydown", e => {
  if (running) { if (e.code in KEYS) { e.preventDefault(); kick(); if (!e.repeat) press(KEYS[e.code], "k" + e.code); } else if (e.code === "Escape") setPause(!paused); return; }
  const k = e.code;
  if (on("intro")) { if (k === "Enter" || k === "Space") { e.preventDefault(); goSelect(); } }
  else if (on("select")) {
    if (k === "ArrowLeft") pick(idx - 1); else if (k === "ArrowRight") pick(idx + 1);
    else if (k === "ArrowUp" || k === "ArrowDown") { const i = DIFFS.indexOf(diff) + (k === "ArrowUp" ? -1 : 1); if (DIFFS[i] && (CHARTS[cur.id] || {})[DIFFS[i]]) { diff = DIFFS[i]; save("diff", diff); renderDiffs(); renderInfo(); } e.preventDefault(); }
    else if (k === "Enter") { mode = "game"; start(); } else if (k === "Escape") goIntro();
  } else if (on("result") && k === "Enter") start();
});
function laneAt(e) {
  const b = cv.getBoundingClientRect(), g = G(), q = Math.min(1.25, Math.max(0, (e.clientY - b.top - g.hy) / (g.jy - g.hy)));
  const s = Math.max(.6, .2 + .8 * q);
  return Math.min(3, Math.max(0, Math.floor((e.clientX - b.left - g.cx) / (g.lw * s) + 2)));
}
cv.addEventListener("pointerdown", e => {
  e.preventDefault(); kick();
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}      // 손가락이 화면 밖/가장자리로 가도 끊기지 않게
  const l = laneAt(e); ptr.set(e.pointerId, l); press(l, e.pointerId);
});
cv.addEventListener("pointermove", e => {                       // 누른 채 옆 레인으로 밀면 이어진 노트 처리
  if (!ptr.has(e.pointerId)) return;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];   // 빠르게 밀 때 건너뛴 중간 터치점도 모두 확인
  for (const ev of (evs.length ? evs : [e])) {
    const from = ptr.get(e.pointerId), l = laneAt(ev); if (l === from) continue;
    const dir = l > from ? 1 : -1;
    for (let k = from + dir; ; k += dir) { slideInto(k); if (k === l) break; }   // 한 번에 여러 칸을 밀어도 사이 레인을 순서대로 통과
    ptr.set(e.pointerId, l);
  }
});
["pointerup", "pointercancel"].forEach(ev => cv.addEventListener(ev, e => { ptr.delete(e.pointerId); release(e.pointerId); }));
addEventListener("keyup", e => { if (running && e.code in KEYS) release("k" + e.code); });
function setPause(p) {
  if (!running || p === paused) return; paused = p; $("#pause").classList.toggle("on", p);
  if (p) { au.pause(); vid.pause(); ptr.clear(); recHold = []; act.splice(0).forEach(a => holdEnd(a.n, false)); }   // 일시정지하면 누르던 롱노트는 끊김
  else { lead.last = performance.now(); if (!leading) au.play().catch(() => {}); lastA = -1; if (hasVideo && audioOn) vid.play().catch(() => {}); }
}
$("#pauseBtn").onclick = () => setPause(true);
$("#resume").onclick = () => setPause(false);
$("#retry1").onclick = () => { stop(); start(); };
$("#quit").onclick = () => { stop(); goSelect(); };
$("#recsave").onclick = () => { paused = false; $("#pause").classList.remove("on"); finish(); };
document.addEventListener("visibilitychange", () => document.hidden && setPause(true));
matchMedia("(orientation: portrait) and (pointer: coarse)").addEventListener("change", e => e.matches && setPause(true));
document.addEventListener("contextmenu", e => e.preventDefault());
au.addEventListener("ended", () => running && finish());

/* ---------- 결과 ---------- */
function finish() {
  if (!running) return; stop();
  if (mode === "rec") return finishRec();
  const pd = mode === "mine" ? "my" : diff;
  const acc = sum / total, g = acc >= .95 ? "S" : acc >= .9 ? "A" : acc >= .8 ? "B" : acc >= .7 ? "C" : "D";
  const prev = best(cur.id, pd), isNew = !prev || score > prev.score;
  if (isNew) save(`best:${cur.id}:${pd}`, { score, grade: g, combo: maxCombo });
  const fc = cnt.MISS === 0 ? (cnt.GOOD + cnt.GREAT === 0 ? "ALL PERFECT" : "FULL COMBO") : "";
  $("#result").innerHTML = `<div class="res"><div class="t">${cur.title} · ${pd.toUpperCase()}</div><div class="g">${g}</div>
    <div class="s">${fmt(score)}</div><div class="nb">${isNew ? "NEW BEST" : fc ? fc : ""}</div>
    <dl><dt>PERFECT</dt><dd>${cnt.PERFECT}</dd><dt>GREAT</dt><dd>${cnt.GREAT}</dd><dt>GOOD</dt><dd>${cnt.GOOD}</dd><dt>MISS</dt><dd>${cnt.MISS}</dd>
    <dt>MAX COMBO</dt><dd>${maxCombo}</dd><dt>정확도</dt><dd>${(acc * 100).toFixed(2)}%</dd><dt>최고 기록</dt><dd>${fmt(Math.max(score, prev ? prev.score : 0))}</dd></dl>
    <button class="btn" id="again">다시 하기</button><button class="btn ghost" id="back">곡 선택</button></div>`;
  $("#again").onclick = start; $("#back").onclick = goSelect;
  show("result");
}

function finishRec() {
  const notes = recNotes.filter(n => n[0] >= 0).sort((a, b) => a[0] - b[0]), ok = notes.length >= 5;
  if (ok) save(myKey(cur.id), notes);
  const m = mine(cur.id), has = !!(m && m.length);
  $("#result").innerHTML = `<div class="res"><div class="t">${cur.title} · REC</div><div class="g">${ok ? "●" : "–"}</div>
    <div class="s">${notes.length}</div><div class="nb">${ok ? "저장 완료" : "노트가 5개 미만이라 저장하지 않았어요"}</div>
    <dl><dt>방금 녹음한 노트</dt><dd>${notes.length}개</dd><dt>저장된 내 채보</dt><dd>${has ? m.length + "개" : "없음"}</dd></dl>
    <button class="btn" id="mplay" ${has ? "" : "disabled"}>내 채보로 플레이</button><button class="btn ghost" id="mcopy" ${has ? "" : "disabled"}>채보 복사 (JSON)</button>
    <button class="btn ghost" id="mre">다시 녹음</button><button class="btn ghost" id="back">곡 선택</button></div>`;
  $("#mplay").onclick = () => { mode = "mine"; start(); };
  $("#mre").onclick = () => { mode = "rec"; start(); };
  $("#back").onclick = goSelect;
  $("#mcopy").onclick = () => {
    exportText(JSON.stringify({ [cur.id]: mine(cur.id) || [] }), cur.id + "-chart.json", $("#mcopy"), "채보 복사 (JSON)"); };
  show("result");
}

goSelect();   // 첫 화면(인트로)을 건너뛰고 곡 선택 화면으로 바로 시작
})();
