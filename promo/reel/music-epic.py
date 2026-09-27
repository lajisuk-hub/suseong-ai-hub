# 저작권 걱정 없는 '웅장한' 배경음악을 numpy로 직접 합성한다.
# (현악 패드 + 낮은 드론 + 팀파니·타이코 북 + 호른 멜로디 + 합창 아~ + 심벌 스웰, 점점 고조되는 영화 예고편 느낌)
# 사용: python music-epic.py [길이초] [출력파일]
import sys, math, wave, numpy as np

SR = 44100
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else 54.0
OUT = sys.argv[2] if len(sys.argv) > 2 else "out/music-epic.wav"
BPM = 72
BEAT = 60 / BPM
BAR = BEAT * 4
rng = np.random.default_rng(11)

def f(m): return 440.0 * 2 ** ((m - 69) / 12)

def env_adsr(n, a, d, s, r, hold=None):
    """초 단위 어택/디케이, 서스테인 레벨, 릴리즈. hold=None이면 끝까지 지속 후 릴리즈"""
    t = np.arange(n) / SR
    total = n / SR
    e = np.ones(n)
    e = np.where(t < a, t / max(a, 1e-4), e)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where(t >= a + d, s, e)
    rel_start = total - r
    e = np.where(t > rel_start, e * np.clip((total - t) / max(r, 1e-4), 0, 1), e)
    return e

def strings(m, dur, level=1.0, attack=0.8):
    """현악 패드: 살짝 어긋난 톱니파 3겹 + 비브라토 + 어두운 음색"""
    n = int(SR * dur); t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.004, 0.0, 0.0045):
        fr = f(m) * (1 + det)
        vib = 1 + 0.004 * np.sin(2 * math.pi * 5.2 * t + rng.uniform(0, 6))
        ph = 2 * math.pi * np.cumsum(fr * vib) / SR
        for k in range(1, 14):
            y += np.sin(ph * k) / (k ** 1.35) * (1 if k * fr < 5000 else 0)
    return y * env_adsr(n, attack, 0.3, 0.85, 0.6) * level / 9

def drone(m, dur, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    y = np.sin(2 * math.pi * f(m) * t) + 0.5 * np.sin(2 * math.pi * f(m) * 2 * t) + 0.18 * np.sin(2 * math.pi * f(m) * 3 * t)
    return y * env_adsr(n, 0.5, 0.2, 0.9, 0.8) * level

def timpani(m, level=1.0, dur=1.4):
    """팀파니: 음정 있는 북 (짧게 내려가는 사인 + 두드리는 소음)"""
    n = int(SR * dur); t = np.arange(n) / SR
    fr = f(m) * (1 + 0.6 * np.exp(-t * 30))
    y = np.sin(2 * math.pi * np.cumsum(fr) / SR) * np.exp(-t * 3.2)
    y += 0.4 * np.sin(2 * math.pi * np.cumsum(fr * 1.5) / SR) * np.exp(-t * 6)
    noise = rng.uniform(-1, 1, n) * np.exp(-t * 60) * 0.5
    return (y + noise) * level

def taiko(level=1.0, dur=1.0):
    """큰 북: 아주 낮은 울림 + 둔탁한 타격"""
    n = int(SR * dur); t = np.arange(n) / SR
    fr = 48 * (1 + 2.5 * np.exp(-t * 25))
    y = np.sin(2 * math.pi * np.cumsum(fr) / SR) * np.exp(-t * 4)
    noise = rng.uniform(-1, 1, n)
    noise = np.convolve(noise, np.ones(24) / 24, mode="same") * np.exp(-t * 40) * 1.2
    return (y + noise) * level

def cymbal_swell(dur, level=1.0):
    """심벌 스웰: 소음이 서서히 커졌다가 마지막에 터지고 사라짐"""
    n = int(SR * dur); t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    noise = noise - np.concatenate([[0], noise[:-1]]) * 0.7  # 고음만
    rise = (t / dur) ** 2.2
    return noise * rise * level

def crash(dur=2.5, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n)
    noise = noise - np.concatenate([[0], noise[:-1]]) * 0.6
    return noise * np.exp(-t * 2.2) * level

def horn(m, dur, level=1.0):
    """호른: 둥근 음색(홀수 배음 조금) + 느린 어택"""
    n = int(SR * dur); t = np.arange(n) / SR
    fr = f(m)
    y = np.sin(2 * math.pi * fr * t) + 0.55 * np.sin(2 * math.pi * fr * 2 * t) + 0.35 * np.sin(2 * math.pi * fr * 3 * t) + 0.15 * np.sin(2 * math.pi * fr * 4 * t)
    return y * env_adsr(n, 0.12, 0.2, 0.8, 0.25) * level / 2

def choir(m, dur, level=1.0):
    """합창 '아~': 모음 공명 흉내(2·3배음 강조) + 여러 사람처럼 어긋난 겹침"""
    n = int(SR * dur); t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.006, -0.002, 0.002, 0.006):
        fr = f(m) * (1 + det)
        vib = 1 + 0.006 * np.sin(2 * math.pi * 4.8 * t + rng.uniform(0, 6))
        ph = 2 * math.pi * np.cumsum(fr * vib) / SR
        y += np.sin(ph) * 0.6 + np.sin(2 * ph) * 0.9 + np.sin(3 * ph) * 0.5 + np.sin(4 * ph) * 0.2
    return y * env_adsr(n, 1.2, 0.3, 0.9, 1.0) * level / 9

def ostinato_note(m, dur, level=1.0):
    n = int(SR * dur); t = np.arange(n) / SR
    fr = f(m)
    y = sum(np.sin(2 * math.pi * fr * k * t) / k for k in range(1, 8))
    return y * np.exp(-t * 9) * np.minimum(1, t / 0.004) * level / 2.6

def place(mix, sig, start, gain=1.0):
    i = int(start * SR); j = min(len(mix), i + len(sig))
    if i < len(mix): mix[i:j] += sig[:j - i] * gain

# ----- 곡 구성 -----
# D단조 영화적 진행: Dm – Bb – F – C (i – VI – III – VII), 마지막은 D장조로 밝게 마무리
PROG = [[50, 53, 57], [46, 50, 53], [41, 45, 48], [48, 52, 55]]
total = int(SR * (DUR + 3))
mix = np.zeros(total)
bars = int(math.ceil(DUR / BAR)) + 1

def section(b):  # 0 도입 / 1 고조 / 2 절정 / 3 마무리
    return min(3, b // 4)

for b in range(bars):
    t0 = b * BAR
    chord = PROG[b % 4]
    root = chord[0]
    sec = section(b)
    last = b >= bars - 2
    if last:
        chord = [50, 54, 57]  # D장조로 밝게
        root = 50
    grow = [0.55, 0.8, 1.0, 0.9][sec]

    # 현악 패드: 낮은 옥타브 + 코드 + 높은 옥타브(고조부터)
    for m in chord:
        place(mix, strings(m, BAR + 0.5, level=0.55 * grow, attack=1.0 if b == 0 else 0.5), t0)
        place(mix, strings(m - 12, BAR + 0.5, level=0.35 * grow, attack=0.9), t0)
        if sec >= 1:
            place(mix, strings(m + 12, BAR + 0.5, level=0.22 * grow, attack=0.6), t0)
    # 드론 베이스
    place(mix, drone(root - 24, BAR + 0.3, level=0.5 * grow), t0)
    if sec >= 2:
        place(mix, drone(root - 12, BAR + 0.3, level=0.2), t0)

    # 팀파니: 1·3박, 고조부터 4박 뒤 16분음 롤로 다음 마디 예고
    tl = [0.5, 0.75, 1.0, 0.85][sec]
    place(mix, timpani(root - 24, level=tl), t0)
    place(mix, timpani(root - 24, level=tl * 0.75), t0 + BEAT * 2)
    if sec >= 1:
        place(mix, timpani(root - 24, level=tl * 0.5), t0 + BEAT * 1.5)
        place(mix, timpani(root - 24, level=tl * 0.5), t0 + BEAT * 3.5)
    if (b % 4 == 3) and sec < 3:
        for k in range(8):
            place(mix, timpani(root - 24, level=0.25 + 0.08 * k, dur=0.5), t0 + BEAT * 3 + k * BEAT / 8)
    # 타이코: 절정에서 1박마다 큰 북
    if sec >= 2 and not last:
        place(mix, taiko(level=0.9), t0)
        place(mix, taiko(level=0.6), t0 + BEAT * 2)
        place(mix, taiko(level=0.45), t0 + BEAT * 3)

    # 심벌: 4마디마다 스웰 → 다음 구간 첫 박에 크래시
    if b % 4 == 3 and not last:
        place(mix, cymbal_swell(BAR, level=0.35), t0)
    if b % 4 == 0 and b > 0:
        place(mix, crash(level=0.4 if sec >= 2 else 0.28), t0)

    # 현악 오스티나토(16분음표): 고조부터, 코드톤 위아래로
    if sec >= 1 and not last:
        pat = [chord[0], chord[2], chord[1], chord[2], chord[0] + 12, chord[2], chord[1], chord[2]] * 2
        for k, m in enumerate(pat):
            place(mix, ostinato_note(m + 12, BEAT / 4 + 0.15, level=(0.16 if k % 4 == 0 else 0.1) * grow), t0 + k * BEAT / 4)

    # 호른 멜로디(2분음표): 고조부터 코드톤 중심으로 오르내림
    if sec >= 1:
        mel = {1: [chord[0] + 12, chord[2] + 12], 2: [chord[2] + 12, chord[0] + 24], 3: [chord[0] + 12, chord[1] + 12]}[sec]
        if last: mel = [62, 62]
        for k, m in enumerate(mel):
            place(mix, horn(m, BEAT * 2 + 0.2, level=[0, 0.28, 0.4, 0.3][sec]), t0 + k * BEAT * 2)

    # 합창: 절정부터
    if sec >= 2:
        for m in chord:
            place(mix, choir(m + 12, BAR + 0.8, level=0.28), t0)
        place(mix, choir(root + 24, BAR + 0.8, level=0.14), t0)

# 마지막 화음 여운: 끝나는 시점에 긴 크래시 + 팀파니 한 방
place(mix, timpani(26, level=0.9, dur=2.5), (bars - 2) * BAR)
place(mix, crash(dur=4, level=0.35), (bars - 2) * BAR)

# 간단한 잔향(콘서트홀 느낌): 짧게 사라지는 소음을 FFT로 합성곱
ir_n = int(SR * 1.8)
ir = rng.uniform(-1, 1, ir_n) * np.exp(-np.arange(ir_n) / SR * 3.2)
ir[0] = 0
ir = ir / np.sqrt(np.sum(ir ** 2)) * 0.35
N = 1 << (len(mix) + ir_n).bit_length()
wet = np.fft.irfft(np.fft.rfft(mix, N) * np.fft.rfft(ir, N), N)[:len(mix)]
mix = mix + wet

# 길이 맞추기, 페이드, 리미터
mix = mix[:int(SR * DUR)]
n = len(mix)
fade_in = np.minimum(1, np.arange(n) / (SR * 2.0))
fade_out = np.minimum(1, (n - np.arange(n)) / (SR * 3.0))
mix *= fade_in * fade_out
mix = mix / (np.max(np.abs(mix)) + 1e-9)
mix = np.tanh(mix * 2.2) * 0.9
mix /= max(1e-9, np.max(np.abs(mix))) / 0.9

with wave.open(OUT, "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    # 좌우를 살짝 다르게(현악은 넓게 들리게) — 오른쪽만 아주 짧게 지연
    right = np.concatenate([np.zeros(int(SR * 0.0007)), mix])[:n]
    st = np.stack([mix, right], axis=1)
    w.writeframes((st * 32767).astype(np.int16).tobytes())
print("saved", OUT, f"{DUR:.1f}s epic")
