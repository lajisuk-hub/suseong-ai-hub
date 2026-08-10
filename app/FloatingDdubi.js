"use client";

import { useEffect, useRef } from "react";

// 화면을 자유롭게 돌아다니는 뚜비입니다.
// 벽(화면 가장자리)에 닿으면 방향을 바꾸며 계속 떠다니고,
// 누르면 설정된 수성구 홈페이지가 새 창으로 열립니다.
export default function FloatingDdubi({ url, label }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const size = el.offsetWidth || 88;
    // 시작 위치와 이동 방향(속도)을 조금씩 다르게
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

  const tip = label || "수성구 홈페이지 바로가기";

  return (
    <button
      ref={ref}
      className="ddubi-float"
      onClick={go}
      title={tip}
      aria-label={tip}
    >
      <img src="/ddubi-hi.png" alt="수성구 캐릭터 뚜비" />
      <span className="ddubi-float-tip">{tip}</span>
    </button>
  );
}
