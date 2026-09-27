# 저작권 걱정 없는 '밝고 웅장한' 배경음악 (영화 「미션」 풍: 오보에 멜로디가 높이 날고, 현악·하프가 받치다가
# 후반에 합창·호른·팀파니·글로켄이 더해져 커진다). 멜로디는 새로 지은 것.
# 사용: python music-mission.py [길이초] [출력파일]
import sys, math, wave, numpy as np

SR = 44100
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 54.0
OUT = sys.argv[2] if len(sys.argv) > 2 else "out/music-mission.wav"
BPM = 80
BEAT = 60 / BPM
BAR = BEAT * 4
rng = np.random.default_rng(21)

def f(m): return 440.0 * 2 ** ((m - 69) / 12)

def env_adsr(n, a, d, s, r):
    t = np.arange(n) / SR; total = n / SR
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where(t >= a + d, s, e)
    e = np.where(t > total - r, e * np.clip((total - t) / max(r, 1e-4), 0, 1), e)
    return e

def strings(m, dur, level=1.0, attack=0.8, bright=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.004, 0.0, 0.0045):
        fr = f(m) * (1 + det)
        vib = 1 + 0.004 * np.sin(2 * math.pi * 5.0 * t + rng.uniform(0, 6))
        ph = 2 * math.pi * np.cumsum(fr * vib) / SR
        for k in range(1, 16):
            if k * fr > 7000: break
            y += np.sin(ph * k) / (k ** (1.25 / bright))
    return y * env_adsr(n, attack, 0.3, 0.85, 0.6) * level / 9

def oboe(m, dur, level=1.0, slide_from=None):
    """오보에: 2·3·4배음이 강한 콧소리 음색 + 느린 비브라토, 앞 음에서 살짝 이어짐"""
    n = int(SR * dur); t = np.arange(n) / SR
    fr = f(m) * np.ones(n)
    if slide_from is not None:
        fr = f(m) + (f(slide_from) - f(m)) * np.exp(-t * 40)
    vib = 1 + 0.006 * np.sin(2 * math.pi * 5.6 * t) * np.minimum(1, t / 0.35)
    ph = 2 * math.pi * np.cumsum(fr * vib) / SR
    amps = [0.55, 1.0, 0.85, 0.6, 0.35, 0.22, 0.14, 0.08]
    y = sum(a * np.sin(ph * (k + 1)) for k, a in enumerate(amps))
    return y * env_adsr(n, 0.06, 0.15, 0.9, 0.12) * level / 3.8

def horn(m, dur, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    fr = f(m)
    y = np.sin(2 * math.pi * fr * t) + 0.55 * np.sin(2 * math.pi * fr * 2 * t) + 0.35 * np.sin(2 * math.pi * fr * 3 * t) + 0.15 * np.sin(2 * math.pi * fr * 4 * t)
    return y * env_adsr(n, 0.15, 0.2, 0.8, 0.25) * level / 2

def choir(m, dur, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.006, -0.002, 0.002, 0.006):
        fr = f(m) * (1 + det)
        vib = 1 + 0.006 * np.sin(2 * math.pi * 4.8 * t + rng.uniform(0, 6))
        ph = 2 * math.pi * np.cumsum(fr * vib) / SR
        y += np.sin(ph) * 0.6 + np.sin(2 * ph) * 0.9 + np.sin(3 * ph) * 0.5 + np.sin(4 * ph) * 0.2
    return y * env_adsr(n, 1.0, 0.3, 0.9, 0.9) * level / 9

def harp(m, dur=1.6, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    fr = f(m)
    y = sum(np.sin(2 * math.pi * fr * k * t) * np.exp(-t * (2.5 + 1.5 * k)) / k for k in range(1, 6))
    return y * np.minimum(1, t / 0.003) * level / 1.8

def glock(m, dur=1.2, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    fr = f(m)
    y = np.sin(2 * math.pi * fr * t) + 0.35 * np.sin(2 * math.pi * fr * 2.76 * t) * np.exp(-t * 6)
    return y * np.exp(-t * 3.5) * np.minimum(1, t / 0.002) * level

def timpani(m, level=1.0, dur=1.4):
    n = int(SR * dur); t = np.arange(n) / SR
    fr = f(m) * (1 + 0.6 * np.exp(-t * 30))
    y = np.sin(2 * math.pi * np.cumsum(fr) / SR) * np.exp(-t * 3.2)
    y += 0.4 * np.sin(2 * math.pi * np.cumsum(fr * 1.5) / SR) * np.exp(-t * 6)
    noise = rng.uniform(-1, 1, n) * np.exp(-t * 60) * 0.5
    return (y + noise) * level

def cymbal_swell(dur, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n); noise = noise - np.concatenate([[0], noise[:-1]]) * 0.7
    return noise * (t / dur) ** 2.2 * level

def crash(dur=2.5, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n); noise = noise - np.concatenate([[0], noise[:-1]]) * 0.6
    return noise * np.exp(-t * 2.2) * level

def bass(m, dur, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    y = np.sin(2 * math.pi * f(m) * t) + 0.4 * np.sin(2 * math.pi * f(m) * 2 * t)
    return y * env_adsr(n, 0.05, 0.3, 0.8, 0.4) * level

def place(mix, sig, start, gain=1.0):
    i = int(start * SR); j = min(len(mix), i + len(sig))
    if i < len(mix): mix[i:j] += sig[:j - i] * gain

# ----- 곡 구성: D장조 -----
# 코드(마디마다): 도입 2마디 D – G, 이후 멜로디 8마디 D A Bm G / D G A D (두 번 반복)
INTRO = [[62, 66, 69], [55, 59, 62]]
PROG = [[62, 66, 69], [57, 61, 64], [59, 62, 66], [55, 59, 62], [62, 66, 69], [55, 59, 62], [57, 61, 64], [62, 66, 69]]
# 멜로디(새로 지음): (미디음, 박 길이) — 8마디, 올라갔다 내려오는 서정적 선율
MELODY = [
    [(74, 1), (78, 1), (81, 2)],
    [(79, 1.5), (78, 0.5), (76, 2)],
    [(74, 1), (76, 1), (78, 1), (81, 1)],
    [(83, 3), (81, 1)],
    [(86, 2), (85, 1), (83, 1)],
    [(81, 1.5), (79, 0.5), (78, 2)],
    [(76, 1), (78, 1), (79, 1), (81, 1)],
    [(78, 4)],
]

total = int(SR * (DUR + 3))
mix = np.zeros(total)
bars = int(math.ceil(DUR / BAR)) + 1  # 54초 → 18마디 + 1

def chord_at(b):
    if b < 2: return INTRO[b]
    return PROG[(b - 2) % 8]

for b in range(bars):
    t0 = b * BAR
    chord = chord_at(b)
    root = chord[0]
    phase = 0 if b < 2 else (1 if b < 10 else 2)   # 0 도입 / 1 첫 멜로디(조용) / 2 반복(전체 합주)
    ending = b >= 17
    if ending:
        chord = [62, 66, 69]; root = 62
    grow = [0.6, 0.75, 1.0][phase]

    # 현악 패드(밝게 위쪽 옥타브 포함)
    for m in chord:
        place(mix, strings(m, BAR + 0.5, level=0.42 * grow, attack=1.2 if b == 0 else 0.5), t0)
        place(mix, strings(m + 12, BAR + 0.5, level=0.2 * grow, attack=0.6), t0)
    place(mix, strings(root - 12, BAR + 0.5, level=0.3 * grow, attack=0.8), t0)
    # 베이스(가볍게, 1·3박)
    place(mix, bass(root - 24, BEAT * 1.9, level=0.35 * grow), t0)
    place(mix, bass(root - 24, BEAT * 1.9, level=0.28 * grow), t0 + BEAT * 2)

    # 하프 아르페지오(8분음표, 위로 올라가는 반짝임)
    pat = [chord[0], chord[1], chord[2], chord[0] + 12, chord[1] + 12, chord[2] + 12, chord[0] + 24, chord[2] + 12]
    for k, m in enumerate(pat):
        place(mix, harp(m, level=(0.2 if k % 4 == 0 else 0.13) * (0.8 if phase < 2 else 1.0)), t0 + k * BEAT / 2)

    # 팀파니: 조용한 구간은 1박만 살짝, 전체 합주는 1·3박 + 마디 끝 롤
    if phase >= 1:
        place(mix, timpani(root - 24, level=0.35 if phase == 1 else 0.7), t0)
        if phase == 2:
            place(mix, timpani(root - 24, level=0.45), t0 + BEAT * 2)
    if b == 9 or (phase == 2 and (b - 2) % 4 == 3 and not ending):
        for k in range(8):
            place(mix, timpani(root - 24, level=0.2 + 0.07 * k, dur=0.5), t0 + BEAT * 3 + k * BEAT / 8)

    # 심벌: 전체 합주 들어가기 직전 스웰 → 첫 박 크래시
    if b == 9:
        place(mix, cymbal_swell(BAR, level=0.3), t0)
    if b == 10 or b == 14:
        place(mix, crash(level=0.35), t0)

    # 멜로디: 오보에(1차), 2차는 오보에+호른(옥타브 아래)+글로켄(옥타브 위)
    if phase >= 1 and not ending:
        bar_mel = MELODY[(b - 2) % 8]
        tt = 0.0; prev = None
        for m, ln in bar_mel:
            d = ln * BEAT
            place(mix, oboe(m, d + 0.08, level=0.5 if phase == 1 else 0.6, slide_from=prev), t0 + tt)
            if phase == 2:
                place(mix, horn(m - 12, d + 0.1, level=0.3), t0 + tt)
                place(mix, glock(m + 12, level=0.16), t0 + tt)
            prev = m; tt += d

    # 합창: 전체 합주 구간
    if phase == 2:
        for m in chord:
            place(mix, choir(m + 12, BAR + 0.8, level=0.22), t0)
        place(mix, choir(root + 24, BAR + 0.8, level=0.1), t0)

# 마무리: 마지막 마디에 멜로디 으뜸음을 길게 + 크래시
end_t = 17 * BAR
place(mix, oboe(86, 3.5, level=0.55), end_t)
place(mix, horn(74, 3.5, level=0.3), end_t)
place(mix, glock(98, dur=3, level=0.15), end_t)
place(mix, timpani(38, level=0.8, dur=2.5), end_t)
place(mix, crash(dur=4, level=0.3), end_t)

# 잔향(밝은 홀 느낌, 짧게)
ir_n = int(SR * 1.4)
ir = rng.uniform(-1, 1, ir_n) * np.exp(-np.arange(ir_n) / SR * 4.0); ir[0] = 0
ir = ir / np.sqrt(np.sum(ir ** 2)) * 0.3
N = 1 << (len(mix) + ir_n).bit_length()
mix = mix + np.fft.irfft(np.fft.rfft(mix, N) * np.fft.rfft(ir, N), N)[:len(mix)]

mix = mix[:int(SR * DUR)]
n = len(mix)
mix *= np.minimum(1, np.arange(n) / (SR * 1.5)) * np.minimum(1, (n - np.arange(n)) / (SR * 3.0))
mix = mix / (np.max(np.abs(mix)) + 1e-9)
mix = np.tanh(mix * 2.0) * 0.9
mix /= max(1e-9, np.max(np.abs(mix))) / 0.9

with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    right = np.concatenate([np.zeros(int(SR * 0.0007)), mix])[:n]
    w.writeframes((np.stack([mix, right], axis=1) * 32767).astype(np.int16).tobytes())
print("saved", OUT, f"{DUR:.1f}s mission-style")
