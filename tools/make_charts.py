#!/usr/bin/env python3
"""songs/<group>/<id>.mp3(또는 .m4a) 를 분석해 charts/<id>.js (EASY/NORMAL/HARD) 를 만듭니다.
사용법:  python3 tools/make_charts.py            (전체)
         python3 tools/make_charts.py spider     (특정 곡만)

[보컬 모드]  (MAZE, B.O.D.Y 를 뺀 모든 곡)
  노트 위치 = 멤버들 목소리(가사 음절)의 시작점. 반주/드럼 박자가 아닙니다.
  1) 스테레오 가운데(센터)에 정렬된 소리만 남김  → 양옆으로 퍼진 신스/코러스/리버브 제거
  2) 화성/타악 분리(HPSS)로 드럼 제거           → 킥·스네어·하이햇 제거
  3) 280Hz 미만 제거 + 음높이 추적(Viterbi)     → 베이스 제거, 멜로디(보컬) 선만 추적
  4) 목소리가 나는 구간에서만 음절 시작/음높이 변화를 노트로 사용
  레인 = 멜로디 음높이(낮은 음 왼쪽 → 높은 음 오른쪽), 짧은 간격의 연속 음은 "연결 노트"로 이어집니다.
[레거시 모드]  (LEGACY 목록의 곡) 예전 방식(전체 소리의 보컬 대역 변화)
노트 형식: [ms, 레인] / [ms, 레인, 1](=다음 노트와 연결)
필요: ffmpeg, numpy, scipy.  생성 후 charts/<id>.js 를 직접 고쳐도 됩니다.
"""
import bisect, json, random, subprocess, sys
from pathlib import Path
import numpy as np
from scipy.ndimage import gaussian_filter1d, maximum_filter, maximum_filter1d, median_filter, uniform_filter1d

ROOT = Path(__file__).resolve().parent.parent
SR, N, HOP = 22050, 1024, 256
# (초당 노트 수 목표, 노트 최소 간격 ms, 동시치기 비율)
CHAIN = {"easy": (520, 3, .5), "normal": (430, 4, .6), "hard": (360, 5, .7)}  # 최대 간격ms, 최대 길이, 확률
CFG = {"easy": (1.5, 400, 0.0), "normal": (2.6, 230, 0.04), "hard": (4.3, 125, 0.10)}
LEGACY = {"maze", "body", "painful"}          # 이 곡들만 예전(반주 포함 전체 소리) 방식 유지
VN, VHOP = 2048, 256               # 보컬 분석용 FFT 크기 / 간격
VKM = int(6500 / (SR / VN))        # 6.5kHz 까지만 사용
VHZ = np.arange(VKM) * SR / VN
VOICE_MIN_HZ = 280                 # 이보다 낮은 소리(베이스/킥)는 버림
TIME_BIAS_MS = 10.0                # 검출 시점 보정 (합성 보컬 테스트로 측정: 검출이 평균 10ms 빨라서 +10)


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def f0(y, s0):
    seg = y[s0 + 256:s0 + 256 + 2048]
    if len(seg) < 2048:
        return np.nan
    seg = seg * np.hanning(2048)
    ac = np.fft.irfft(np.abs(np.fft.rfft(seg, 4096)) ** 2)[:2048]
    lo, hi = SR // 800, SR // 80
    if ac[0] <= 1e-6:
        return np.nan
    k = lo + int(np.argmax(ac[lo:hi]))
    if ac[k] / ac[0] < 0.25:
        return np.nan
    return 69 + 12 * np.log2(SR / k / 440)


def analyze(y):
    n = 1 + (len(y) - N) // HOP
    idx = np.arange(N)[None, :] + HOP * np.arange(n)[:, None]
    mag = np.abs(np.fft.rfft(y[idx] * np.hanning(N), axis=1))
    lm = np.log1p(mag * 20)
    d = np.maximum(0, np.diff(lm, axis=0, prepend=lm[:1]))
    flux = 0.7 * d[:, 7:170].sum(1) + 0.3 * d.sum(1)   # 보컬 대역 위주
    local = uniform_filter1d(flux, 43)
    strength = flux - local * 1.05
    peak = (flux == maximum_filter1d(flux, 7)) & (strength > 0)
    fr = np.where(peak)[0]
    p = np.array([f0(y, i * HOP) for i in fr])
    med = np.nanmedian(p) if np.isfinite(p).any() else 60.0
    last = med
    for i in range(len(p)):          # 음높이 검출 실패 시 직전 음 유지
        if np.isnan(p[i]):
            p[i] = last
        else:
            last = p[i]
    t_ms = (fr * HOP + N * 0.25) / SR * 1000
    return t_ms, strength[fr], p


# ---------------------------------------------------------------- 보컬 분석 (가사 음에 맞춤)
def decode_stereo(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "2", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)
    return a[:, 0].copy(), a[:, 1].copy()


def vstft(x):
    x = np.pad(x, (VN // 2, VN // 2))
    T = 1 + (len(x) - VN) // VHOP
    w = np.hanning(VN).astype(np.float32)
    out = np.empty((VKM, T), np.complex64)
    for s in range(0, T, 1500):
        e = min(T, s + 1500)
        idx = np.arange(VN)[None, :] + VHOP * np.arange(s, e)[:, None]
        out[:, s:e] = np.fft.rfft(x[idx] * w, axis=1)[:, :VKM].T
    return out


def vocal_spectrum(L, R):
    """센터 정렬 + 화성 성분만 남긴 '보컬 추정' 스펙트럼 (VKM x T)."""
    FL, FR = vstft(L), vstft(R)
    aL, aR = np.abs(FL), np.abs(FR)
    sim = 2 * aL * aR / (aL ** 2 + aR ** 2 + 1e-9)                 # 좌우 크기가 같을수록 1
    ph = np.clip((FL * np.conj(FR)).real / (aL * aR + 1e-9), 0, 1)  # 좌우 위상이 같을수록 1
    M = (np.abs(FL + FR) / 2 * sim * ph).astype(np.float32)
    del FL, FR, aL, aR, sim, ph
    Hm = median_filter(M, size=(1, 15), mode="nearest")             # 시간 방향 중앙값 = 지속음(목소리)
    Pm = median_filter(M, size=(21, 1), mode="nearest")             # 주파수 방향 중앙값 = 타악(드럼)
    H = M * Hm ** 2 / (Hm ** 2 + Pm ** 2 + 1e-12)
    H[VHZ < VOICE_MIN_HZ] = 0
    return H


def melody(H, fmin=140, fmax=700, cents=25, nh=10):
    """배음 합산으로 멜로디(보컬) 음높이 선을 추적. 반환: 후보 f0들, 살리언스, 프레임별 경로."""
    nc = int(np.log2(fmax / fmin) * 1200 / cents)
    f0s = fmin * 2 ** (np.arange(nc) * cents / 1200)
    A = np.zeros((nc, VKM), np.float32)
    for h in range(1, nh + 1):
        pos = f0s * h / (SR / VN)
        i0 = np.floor(pos).astype(int); fr = pos - i0
        ok = np.where(i0 + 1 < VKM)[0]
        A[ok, i0[ok]] += (1 - fr[ok]) / np.sqrt(h)
        A[ok, i0[ok] + 1] += fr[ok] / np.sqrt(h)
    S = A @ H
    Sn = S / (S.max(0, keepdims=True) + 1e-9)
    T, B = S.shape[1], 14
    pen = 0.02 * np.abs(np.arange(-B, B + 1))
    cost = np.zeros(nc); back = np.zeros((T, nc), np.int16)
    for t in range(T):
        pad = np.pad(cost, (B, B), constant_values=-1e9)
        cand = np.stack([pad[B + d:B + d + nc] - pen[d + B] for d in range(-B, B + 1)])
        k = cand.argmax(0); back[t] = k - B
        cost = cand.max(0) + Sn[:, t]
    path = np.empty(T, int); path[-1] = cost.argmax()
    for t in range(T - 1, 0, -1):
        path[t - 1] = np.clip(path[t] + back[t, path[t]], 0, nc - 1)
    return f0s, S, path


def p90(x):
    x = x[x > 0]
    return np.percentile(x, 90) if len(x) else 1.0


def analyze_vocal(path):
    L, R = decode_stereo(path)
    H = vocal_spectrum(L, R); del L, R
    T = H.shape[1]
    f0s, S, mp = melody(H)
    midi = 69 + 12 * np.log2(f0s[mp] / 440)
    band = (VHZ > VOICE_MIN_HZ) & (VHZ < 4500)
    Hb = H[band]
    # 1) 목소리 구간 판정: 한 개의 음높이 배음열로 설명되는 에너지 비율
    ratio = S[mp, np.arange(T)] / (Hb.sum(0) + 1e-9)
    lo, hi = np.percentile(ratio, [20, 60])
    v = np.clip((ratio - lo) / (hi - lo + 1e-9), 0, 1)
    vg = maximum_filter1d(uniform_filter1d(v, 5), 11)               # 앞뒤 ±58ms 안에 목소리가 있으면 통과
    # 2) 음절 시작: 보컬 스펙트럼의 로그 에너지 증가 (SuperFlux: 비브라토 오검출 억제)
    lm = np.log1p(8 * Hb / (np.percentile(Hb[Hb > 0], 95) + 1e-9))
    ref = maximum_filter(lm, size=(3, 1))
    d = np.zeros_like(lm); d[:, 2:] = np.maximum(0, lm[:, 2:] - ref[:, :-2])
    flux = gaussian_filter1d(d.sum(0), 1.0)
    # 3) 음높이가 바뀌는 순간 (같은 모음으로 이어 부르는 "라라라" 같은 부분)
    c = np.concatenate([[0], np.cumsum(midi)])
    idx = np.arange(T)
    a0, a1 = np.clip(idx - 5, 0, T), np.clip(idx, 0, T)
    b0, b1 = np.clip(idx + 1, 0, T), np.clip(idx + 6, 0, T)
    pre = (c[a1] - c[a0]) / np.maximum(1, a1 - a0); post = (c[b1] - c[b0]) / np.maximum(1, b1 - b0)
    vboth = np.minimum(uniform_filter1d(v, 5), np.roll(uniform_filter1d(v, 5), -6))
    jump = np.maximum(0, np.abs(post - pre) - 0.6) * vboth
    comb = (flux / p90(flux) + 0.7 * jump / p90(jump)) * vg
    # 4) 피크 추출 + 구간별 정규화 (조용한 파트에도 노트가 생기도록)
    peak = (comb == maximum_filter1d(comb, 7)) & (comb > 0)
    fr = np.where(peak)[0]
    z = comb / (uniform_filter1d(comb, 258) + 1e-6)
    keep = z[fr] > 1.0
    fr = fr[keep]
    strength = z[fr] * (0.5 + 0.5 * np.minimum(1, comb[fr] / p90(comb[fr])))
    pitch = np.array([np.median(midi[i:i + 9]) for i in fr])
    t_ms = fr * VHOP / SR * 1000 + TIME_BIAS_MS
    return t_ms, strength, pitch


def pick(t, s, dur_ms, dens, gap, tmin=1200):
    order = np.argsort(-s)
    target = int(dens * dur_ms / 1000)
    got = []
    for i in order:
        if len(got) >= target:
            break
        if t[i] < tmin or t[i] > dur_ms - 1500:
            continue
        k = bisect.bisect(got, t[i])
        if (k > 0 and t[i] - got[k - 1] < gap) or (k < len(got) and got[k] - t[i] < gap):
            continue
        got.insert(k, t[i])
    return got


def build(name, t, s, c, dur_ms, diff, rng, tmin=1200):
    dens, gap, chord = CFG[diff]
    times = pick(t, s, dur_ms, dens, gap, tmin)
    pos = {x: i for i, x in enumerate(t)}
    P = np.array([c[pos[x]] for x in times]); S = np.array([s[pos[x]] for x in times])
    qs = np.quantile(P, [.25, .5, .75]) if len(P) else [0, 0, 0]
    sthr = np.quantile(S, 1 - chord) if chord and len(S) else 1e9
    seq, last, run, prev_t = [], -1, 0, -9999
    for x, pv, st in zip(times, P, S):
        lane = int(np.searchsorted(qs, pv))          # 음이 높을수록 오른쪽
        if rng.random() < 0.15:
            lane = min(3, max(0, lane + rng.choice([-1, 1])))
        if lane == last and (x - prev_t < 320 or run >= 2):
            lane = rng.choice([l for l in range(4) if l != last])
        run = run + 1 if lane == last else 0
        seq.append({"t": int(x), "l": lane, "chord": bool(chord and st >= sthr and x - prev_t > 250), "link": 0})
        last, prev_t = lane, x
    cgap, clen, cp = CHAIN[diff]
    i = 0
    while i < len(seq) - 1:
        if rng.random() < cp and not seq[i]["chord"]:
            j = i
            while (j + 1 < len(seq) and j - i + 1 < clen and seq[j + 1]["t"] - seq[j]["t"] <= cgap
                   and not seq[j + 1]["chord"]):
                seq[j]["link"] = 1
                if seq[j + 1]["l"] == seq[j]["l"]:
                    seq[j + 1]["l"] = seq[j]["l"] + (1 if seq[j]["l"] < 3 else -1)
                j += 1
            i = j + 1
        else:
            i += 1
    notes = []
    for e in seq:
        notes.append([e["t"], e["l"], 1] if e["link"] else [e["t"], e["l"]])
        if e["chord"]:
            notes.append([e["t"], rng.choice([l for l in range(4) if l != e["l"]])])
    return notes


def main():
    only = set(sys.argv[1:])
    for mp3 in sorted((p for e in ("mp3", "m4a") for p in (ROOT / "songs").glob("*/*." + e))):
        sid = mp3.stem
        if only and sid not in only:
            continue
        if sid in LEGACY:
            y = decode(mp3)
            dur = len(y) / SR * 1000
            t, s, c = analyze(y); tmin = 1200
        else:
            dur = len(decode(mp3)) / SR * 1000
            t, s, c = analyze_vocal(mp3); tmin = 1800
        out = {"duration": int(dur)}
        for diff in CFG:
            rng = random.Random(f"{sid}-{diff}")
            notes = build(sid, t, s, c, dur, diff, rng, tmin)
            nps = len(notes) / (dur / 1000)
            out[diff] = {"level": max(1, min(15, round(nps * 2.2))), "notes": notes}
            print(f"{sid:9} {diff:6} notes={len(notes):4} chains={sum(1 for n in notes if len(n)>2):3} nps={nps:.2f}")
        body = json.dumps(out, separators=(",", ":"))
        (ROOT / "charts" / f"{sid}.js").write_text(
            f'(window.CHARTS=window.CHARTS||{{}})["{sid}"]={body};\n', encoding="utf-8")


if __name__ == "__main__":
    main()
