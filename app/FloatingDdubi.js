"use client";

import { useEffect, useRef, useState } from "react";

// 수성구 공식 뚜비 그림을 프레임(여러 장)으로 나눠 빠르게 바꿔가며
// 마치 영상처럼 콩콩 뛰는 모습으로 보여줍니다.
// (수성구청 뚜비 페이지 https://www.suseong.kr/ddubi/index.do 의 공식 캐릭터)
const FRAMES = [
  "/ddubi/hop1.png",
  "/ddubi/hop2.png",
  "/ddubi/hop3.png",
  "/ddubi/hop4.png",
  "/ddubi/hop5.png",
  "/ddubi/hop6.png",
  "/ddubi/hop7.png",
  "/ddubi/hop8.png",
];

// 화면을 자유롭게 돌아다니는 뚜비입니다.
// 벽(화면 가장자리)에 닿으면 방향을 바꾸며 계속 떠다니고,
// 누르면 설정된 수성구 홈페이지가 새 창으로 열립니다.
export default function FloatingDdubi({ url, label }) {
  const ref = useRef(null);
  const [frame, setFrame] = useState(0);

  // 그림을 미리 받아두어 바뀔 때 깜빡이지 않게 합니다
  useEffect(() => {
    FRAMES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // 1초에 여러 번(약 100ms마다) 그림을 바꿔 영상처럼 움직이게 합니다
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 100);
    return () => clearInterval(t);
  }, []);

  // 화면을 떠다니는 움직임 (벽에 튕김)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const size = el.offsetWidth || 130;
    let x = Math.random() * Math.max(0, window.innerWidth - size);
    let y = Math.random() * Math.max(0, window.innerHeight - size);
    let vx = (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.6);
    let vy = (Math.random() < 0.5 ? -1 : 1) * (0.7 + Math.random() * 0.6);
    let raf;
    let paused = false;

    const step = () => {
      if (!paused) {
        const maxX = Math.max(0, window.innerWidth - size);
        const maxY = Math.max(0, window.innerHeight - size);
        x += vx;
        y += vy;
        if (x <= 0) { x = 0; vx = Math.abs(vx); }
        if (x >= maxX) { x = maxX; vx = -Math.abs(vx); }
        if (y <= 0) { y = 0; vy = Math.abs(vy); }
        if (y >= maxY) { y = maxY; vy = -Math.abs(vy); }
        el.style.transform = `translate(${x}px, ${y}px)`;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    // 마우스를 올리면 잠시 멈춰서 누르기 쉽게
    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const go = () => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const tip = label || "수성구 캐릭터 뚜비 만나러 가기";

  return (
    <button
      ref={ref}
      className="ddubi-float"
      onClick={go}
      title={tip}
      aria-label={tip}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FRAMES[frame]} alt="수성구 캐릭터 뚜비" />
      <span className="ddubi-float-tip">{tip}</span>
    </button>
  );
}
