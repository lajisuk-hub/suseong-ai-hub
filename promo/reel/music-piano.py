# 저작권 걱정 없는 '세련된 감동 피아노' 배경음악 (영화·다큐 풍: 피아노 아르페지오 + 서정적 멜로디,
# 뒤로 갈수록 현악이 서서히 더해져 뭉클하게 커진다). 멜로디는 새로 지은 것.
# 사용: python music-piano.py [길이초] [출력파일]
import sys, math, wave, numpy as np

SR = 44100
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 54.0
OUT = sys.argv[2] if len(sys.argv) > 2 else "out/music-piano.wav"
BPM = 104
BEAT = 60 / BPM
BAR = BEAT * 4
rng = np.random.default_rng(31)

def f(m): return 440.0 * 2 ** ((m - 69) / 12)

def env_adsr(n, a, d, s, r):
    t = np.arange(n) / SR; total = n / SR
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where(t >= a + d, s, e)
    e = np.where(t > total - r, e * np.clip((total - t) / max(r, 1e-4), 0, 1), e)
    return e

_piano_cache = {}
def piano(m, dur=2.6, level=1.0):
    """피아노: 살짝 어긋난 배음(inharmonicity) + 배음마다 다른 감쇠 + 두 줄 미세 디튠 + 부드러운 타건음"""
    key = (m, round(dur, 2))
    if key in _piano_cache: return _piano_cache[key] * level
    n = int(SR * dur); t = np.arange(n) / SR
    fr = f(m); B = 0.00035
    y = np.zeros(n)
    bright = 1.0 if m < 72 else 0.85
    for k in range(1, 13):
        fk = fr * k * math.sqrt(1 + B * k * k)
        if fk > 9000: break
        amp = (1.0 / k ** 0.95) * bright
        dec = 1.1 + 0.55 * k + fr / 900
        for det in (-0.0012, 0.0012):
            y += amp * np.sin(2 * math.pi * fk * (1 + det) * t) * np.exp(-t * dec)
    # 타건음(아주 짧은 소음)
    y += rng.uniform(-1, 1, n) * np.exp(-t * 400) * 0.25
    y *= np.minimum(1, t / 0.0025)
    y = y / 3.2
    _piano_cache[key] = y
    return y * level

def strings(m, dur, level=1.0, attack=0.8):
    n = int(SR * dur); t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.004, 0.0, 0.0045):
        fr = f(m) * (1 + det)
        vib = 1 + 0.0035 * np.sin(2 * math.pi * 5.0 * t + rng.uniform(0, 6))
        ph = 2 * math.pi * np.cumsum(fr * vib) / SR
        for k in range(1, 12):
            if k * fr > 6000: break
            y += np.sin(ph * k) / (k ** 1.4)
    return y * env_adsr(n, attack, 0.3, 0.85, 0.7) * level / 9

def bass(m, dur, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    y = np.sin(2 * math.pi * f(m) * t) + 0.3 * np.sin(2 * math.pi * f(m) * 2 * t)
    return y * env_adsr(n, 0.04, 0.4, 0.75, 0.5) * level

def pulse(level=1.0, dur=0.35):
    """아주 부드러운 저음 맥박(심장 박동처럼)"""
    n = int(SR * dur); t = np.arange(n) / SR
    fr = 70 * (1 + 1.2 * np.exp(-t * 30))
    return np.sin(2 * math.pi * np.cumsum(fr) / SR) * np.exp(-t * 12) * level

def place(mix, sig, start, gain=1.0):
    i = int(start * SR); j = min(len(mix), i + len(sig))
    if i < len(mix): mix[i:j] += sig[:j - i] * gain

# ----- 곡 구성: C장조, I–V–vi–IV (C G Am F) 8마디 순환 -----
PROG = [[48, 55, 64], [43, 50, 59], [45, 52, 60], [41, 48, 57],   # (근음, 5도, 3도+옥타브) 왼손용
        [48, 55, 64], [43, 50, 59], [45, 52, 60], [41, 48, 57]]
CHORD = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]] * 2  # 현악용 3화음
# 멜로디(새로 지음, 8마디): (미디음, 박)
MELODY = [
    [(76, 2), (79, 1), (81, 1)],
    [(79, 3), (74, 1)],
    [(76, 1), (72, 1), (74, 2)],
    [(69, 2), (72, 2)],
    [(76, 1), (79, 1), (84, 2)],
    [(83, 2), (81, 1), (79, 1)],
    [(81, 1.5), (79, 0.5), (76, 2)],
    [(77, 1), (76, 1), (74, 2)],
]
# 절정에서 멜로디 위에 얹는 현악 대선율(2분음표)
COUNTER = [[79, 81], [79, 74], [76, 74], [72, 76], [79, 84], [83, 79], [81, 76], [77, 79]]

total = int(SR * (DUR + 3))
mix = np.zeros(total)
bars = int(math.ceil(DUR / BAR)) + 1   # 104bpm → 54초 ≈ 23마디

for b in range(bars):
    t0 = b * BAR
    lh = PROG[b % 8]; ch = CHORD[b % 8]
    root = lh[0]
    sec = 0 if b < 8 else (1 if b < 16 else 2)   # 0 피아노만 / 1 현악 더해짐 / 2 절정
    ending = b >= bars - 1
    if ending:
        lh = [48, 55, 64]; ch = [60, 64, 67]; root = 48

    # 왼손 아르페지오(8분음표): 1-5-8-10-8-5-10-8 (뒤로 갈수록 또렷하게)
    if not ending:
        pat = [lh[0], lh[1], lh[0] + 12, lh[2], lh[0] + 12, lh[1], lh[2], lh[0] + 12]
        gain = [0.42, 0.5, 0.58][sec]
        for k, m in enumerate(pat):
            place(mix, piano(m, 2.4), t0 + k * BEAT / 2, gain * (1.0 if k in (0, 4) else 0.72))
        # 절정: 오른손 위쪽 옥타브 반짝임(2·4박 뒤 8분음)
        if sec == 2:
            for k in (3, 7):
                place(mix, piano(lh[2] + 12, 1.8), t0 + k * BEAT / 2, 0.22)
    else:
        for m in (36, 48, 55, 64, 72, 76):
            place(mix, piano(m, 5.0), t0, 0.5)

    # 멜로디: 처음엔 홑음, 뒤로 갈수록 옥타브 겹침
    if b >= 1 and not ending:
        tt = 0.0
        for m, ln in MELODY[(b - 1) % 8] if b >= 1 else []:
            d = ln * BEAT
            place(mix, piano(m, max(2.0, d + 1.2)), t0 + tt, [0.62, 0.7, 0.78][sec])
            if sec >= 1:
                place(mix, piano(m - 12, max(2.0, d + 1.0)), t0 + tt, 0.3)
            if sec == 2:
                place(mix, piano(m + 12, max(1.5, d + 0.8)), t0 + tt, 0.26)
            tt += d

    # 베이스(현악 들어오면서), 맥박
    if sec >= 1 or ending:
        place(mix, bass(root - 12, BAR + 0.2, level=0.28 if sec == 1 else 0.36), t0)
    if sec >= 1 and not ending:
        place(mix, pulse(level=0.5 if sec == 1 else 0.7), t0)
        place(mix, pulse(level=0.3 if sec == 1 else 0.45), t0 + BEAT * 2)

    # 현악: 6마디째부터 아주 작게 스며들고, 절정에서 위 옥타브·대선율 추가
    if b >= 6 or ending:
        lv = 0.12 if b < 8 else (0.3 if sec == 1 else 0.48)
        if ending: lv = 0.45
        for m in ch:
            place(mix, strings(m, BAR + 0.6, level=lv, attack=1.4 if b == 6 else 0.5), t0)
        place(mix, strings(ch[0] - 12, BAR + 0.6, level=lv * 0.7, attack=0.8), t0)
        if sec == 2 and not ending:
            for m in ch:
                place(mix, strings(m + 12, BAR + 0.6, level=0.2, attack=0.5), t0)
            for k, m in enumerate(COUNTER[(b - 1) % 8]):
                place(mix, strings(m + 12, BEAT * 2 + 0.4, level=0.3, attack=0.25), t0 + k * BEAT * 2)

# 잔향(고급스러운 홀, 조금 길게)
ir_n = int(SR * 2.2)
ir = rng.uniform(-1, 1, ir_n) * np.exp(-np.arange(ir_n) / SR * 2.6); ir[0] = 0
ir = ir / np.sqrt(np.sum(ir ** 2)) * 0.32
N = 1 << (len(mix) + ir_n).bit_length()
mix = mix + np.fft.irfft(np.fft.rfft(mix, N) * np.fft.rfft(ir, N), N)[:len(mix)]

mix = mix[:int(SR * DUR)]
n = len(mix)
mix *= np.minimum(1, np.arange(n) / (SR * 0.8)) * np.minimum(1, (n - np.arange(n)) / (SR * 3.5))
mix = mix / (np.max(np.abs(mix)) + 1e-9)
mix = np.tanh(mix * 1.5) * 0.92          # 가벼운 리미터(피아노 타건 살리기)
mix /= max(1e-9, np.max(np.abs(mix))) / 0.9

with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    right = np.concatenate([np.zeros(int(SR * 0.0006)), mix])[:n]
    w.writeframes((np.stack([mix, right], axis=1) * 32767).astype(np.int16).tobytes())
print("saved", OUT, f"{DUR:.1f}s piano")
