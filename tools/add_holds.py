#!/usr/bin/env python3
"""charts/<id>.js 의 기존 채보에 "롱노트(길게 누르는 버튼)"를 얹습니다. (numpy/ffmpeg 필요 없음)
사용법:  python3 tools/add_holds.py            (전체)
         python3 tools/add_holds.py spider     (특정 곡만)
         python3 tools/add_holds.py --clear    (롱노트를 모두 일반 노트로 되돌림)
         python3 tools/add_holds.py --keep     (이미 있는 롱노트(직접 녹음한 것)는 그대로 두고 나머지에만 추가)

롱노트 형식: [시작ms, 레인, 2, 끝ms]   (일반 [ms, 레인] / 연결 [ms, 레인, 1] 은 그대로)
기존 노트는 하나도 지우거나 옮기지 않고, "이미 있는 노트 하나"를 길게 누르는 노트로 바꿉니다.

고르는 규칙 (노트 시작 → 다음 노트들 사이의 빈 구간 활용)
  - 연결(띠) 노트나 동시치기 노트는 롱노트로 만들지 않음
  - 같은 레인의 다음 노트 PAD ms 전까지를 최대 길이로 함 (MAXLEN 상한)
  - 누르고 있는 동안 "다른 손가락으로 쳐야 하는" 노트가 MAXINSIDE 개를 넘으면 그 직전에서 끊음
    (동시치기 노트가 나오면 거기서 끊음) → EASY 는 0개(누르는 동안 아무것도 없음), NORMAL 1개, HARD 2개
  - 길이가 MINLEN 이상일 때만 롱노트, 앞 롱노트가 끝나고 SPACING ms 이내에는 다음 롱노트를 만들지 않음
"""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
#          MAXINSIDE, MINLEN, MAXLEN, PAD, SPACING
PARAMS = {"easy": (0, 600, 2400, 260, 1500),
          "normal": (1, 480, 2000, 220, 2200),
          "hard": (2, 520, 1600, 200, 3500)}


def load(p):
    s = p.read_text(encoding="utf-8")
    i = s.index("={") + 1
    return s[:i], json.loads(s[i:s.rindex(";")])


def clear(notes):
    return [[n[0], n[1]] if len(n) > 2 and n[2] == 2 else n for n in notes]


def add_holds(notes, diff, keep=False):
    maxin, minlen, maxlen, pad, spacing = PARAMS[diff]
    notes = sorted(notes if keep else clear(notes), key=lambda n: n[0])
    N = len(notes)
    times = [n[0] for n in notes]
    chord = [(i > 0 and times[i - 1] == times[i]) or (i + 1 < N and times[i + 1] == times[i]) for i in range(N)]
    out, last_end, made = [list(n) for n in notes], -10 ** 9, 0
    for i, n in enumerate(notes):
        t, lane = n[0], n[1]
        if keep and len(n) > 3 and n[2] == 2:            # 직접 녹음한 롱노트는 건드리지 않음
            last_end = max(last_end, n[3]); continue
        if chord[i] or n[2:] == [1] or (i > 0 and notes[i - 1][2:] == [1]):
            continue                                   # 연결 띠의 일부 / 동시치기
        if t < last_end + spacing:
            continue
        same = next((m[0] for m in notes[i + 1:] if m[1] == lane), None)
        end = t + maxlen if same is None else min(t + maxlen, same - pad)
        inside = 0
        for j in range(i + 1, N):                      # 누르는 동안 쳐야 하는 노트 수 제한
            if times[j] >= end + pad:
                break
            if times[j] > t and times[j] - t < 60:     # 거의 같은 시각(동시치기 비슷)은 롱노트 불가
                end = -1
                break
            if chord[j] or notes[j][1] == lane:
                end = min(end, times[j] - pad); break
            inside += 1
            if inside > maxin:
                end = min(end, times[j] - pad); break
        if end - t < minlen:
            continue
        out[i] = [t, lane, 2, int(end)]
        last_end = end
        made += 1
    return out, made


def main():
    args = sys.argv[1:]
    do_clear = "--clear" in args
    keep = "--keep" in args
    only = {a for a in args if not a.startswith("--")}
    for p in sorted((ROOT / "charts").glob("*.js")):
        sid = p.stem
        if only and sid not in only:
            continue
        head, data = load(p)
        row = []
        for d in ("easy", "normal", "hard"):
            if d not in data:
                continue
            if do_clear:
                data[d]["notes"] = clear(data[d]["notes"]); continue
            data[d]["notes"], k = add_holds(data[d]["notes"], d, keep)
            row.append(f"{d}={k}")
        p.write_text(head + json.dumps(data, separators=(",", ":"), ensure_ascii=False) + ";\n", encoding="utf-8")
        print(f"{sid:9}", "롱노트 제거" if do_clear else "  ".join(row))


if __name__ == "__main__":
    main()
