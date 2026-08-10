"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  slides as defaultSlides,
  organizations as defaultOrgs,
  ddubi as defaultDdubi,
  siteInfo,
} from "../data/content";
import { loadContent } from "../lib/supabase";
import FloatingDdubi from "./FloatingDdubi";

// 관리자에서 만든 기관에 사진이 없을 때 쓰는 기본 색/그림문자
const FALLBACK_STYLES = [
  { emoji: "🏫", color: "linear-gradient(135deg, #6D8DF0, #7C5CF0)" },
  { emoji: "🌱", color: "linear-gradient(135deg, #5AA7E8, #5AD1C8)" },
  { emoji: "🎨", color: "linear-gradient(135deg, #7FB5FF, #6D8DF0)" },
  { emoji: "🧸", color: "linear-gradient(135deg, #8FA8F5, #B9A8FF)" },
  { emoji: "📚", color: "linear-gradient(135deg, #48B8A8, #7EDCD6)" },
  { emoji: "🌟", color: "linear-gradient(135deg, #7C5CF0, #A78BFA)" },
];

export default function Home() {
  const [slides, setSlides] = useState(defaultSlides);
  const [orgs, setOrgs] = useState(defaultOrgs);
  const [ddubi, setDdubi] = useState(defaultDdubi);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRefs = useRef({});

  // 관리자 페이지에서 저장한 내용이 있으면 그걸 씁니다
  useEffect(() => {
    loadContent().then(({ content }) => {
      if (content) {
        if (Array.isArray(content.slides) && content.slides.length > 0) {
          setSlides(content.slides);
        }
        if (Array.isArray(content.orgs) && content.orgs.length > 0) {
          setOrgs(content.orgs);
        }
        if (content.ddubi) {
          setDdubi(content.ddubi);
        }
      }
    });
  }, []);

  const count = slides.length;
  const next = useCallback(
    () => setCurrent((c) => (c + 1) % count),
    [count]
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + count) % count),
    [count]
  );

  const activeSlide = slides[current] || {};
  const isVideoSlide = activeSlide.type === "video";

  // 자동 넘김 (영상 슬라이드일 때는 영상이 끝날 때까지 기다림)
  useEffect(() => {
    if (paused || isVideoSlide) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [paused, next, isVideoSlide]);

  // 지금 보이는 영상만 재생하고, 나머지는 멈춤
  useEffect(() => {
    slides.forEach((slide, i) => {
      const v = videoRefs.current[i];
      if (!v) return;
      if (i === current) {
        v.currentTime = 0;
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [current, slides]);

  const scrollToOrgs = () => {
    const el = document.getElementById("orgs");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main>
      {/* ===== 위쪽 로고 띠 ===== */}
      <header className="site-header">
        <img src="/logo-suseong.png" alt="대구광역시 수성구" className="header-logo" />
        <span className="header-title">AI선도기관</span>
      </header>

      {/* ===== 맨 위 큰 슬라이드 ===== */}
      <section
        className="hero"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`slide ${i === current ? "active" : ""} ${
              slide.textPos === "top" ? "pos-top" : ""
            }`}
          >
            {slide.type === "video" ? (
              <>
                <video
                  ref={(el) => (videoRefs.current[i] = el)}
                  className="slide-video"
                  src={slide.video}
                  muted={muted}
                  playsInline
                  preload="auto"
                  onCanPlay={(e) => {
                    if (i === current && e.target.paused) {
                      e.target.play().catch(() => {});
                    }
                  }}
                  onEnded={next}
                  onError={() => {
                    if (i === current) next();
                  }}
                />
                {i === current && (
                  <button
                    className="sound-btn"
                    onClick={() => setMuted((m) => !m)}
                  >
                    {muted ? "🔇 소리 켜기" : "🔊 소리 끄기"}
                  </button>
                )}
              </>
            ) : (
              <div
                className="slide-bg"
                style={
                  slide.image
                    ? {
                        backgroundImage: `url(${slide.image})`,
                        backgroundPosition: slide.pos || "center",
                      }
                    : { background: slide.bg }
                }
              />
            )}
            {!slide.light && slide.type !== "video" && (
              <div className="slide-overlay" />
            )}
            {slide.title && (
              <div className={`slide-text ${slide.light ? "light" : ""}`}>
                <h1>{slide.title}</h1>
                {slide.subtitle && <p>{slide.subtitle}</p>}
              </div>
            )}
          </div>
        ))}

        <button className="arrow left" onClick={prev} aria-label="이전 슬라이드">
          &#10094;
        </button>
        <button className="arrow right" onClick={next} aria-label="다음 슬라이드">
          &#10095;
        </button>

        <div className="dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === current ? "active" : ""}`}
              onClick={() => setCurrent(i)}
              aria-label={`${i + 1}번 슬라이드`}
            />
          ))}
        </div>

        <button className="scroll-hint" onClick={scrollToOrgs}>
          참여기관 보기 <span className="chevron">&#9662;</span>
        </button>
      </section>

      {/* ===== 참여기관 카드 ===== */}
      <section id="orgs" className="orgs">
        <h2>참여기관</h2>
        <p className="orgs-sub">
          기관을 누르면 해당 기관 홈페이지로 이동합니다
        </p>

        <div className="grid">
          {orgs.map((org, i) => {
            const fb = FALLBACK_STYLES[i % FALLBACK_STYLES.length];
            const inner = (
              <>
                <div
                  className={`card-img ${org.image ? "" : "deco"}`}
                  style={
                    org.image
                      ? { backgroundImage: `url(${org.image})` }
                      : { background: org.color || fb.color }
                  }
                >
                  {!org.image && (
                    <span className="card-emoji">{org.emoji || fb.emoji}</span>
                  )}
                </div>
                <div className="card-body">
                  <h3>{org.name}</h3>
                  <p>{org.desc}</p>
                  <span className={`card-link ${org.url ? "" : "pending"}`}>
                    {org.url ? "홈페이지 방문하기 →" : "홈페이지 준비중"}
                  </span>
                </div>
              </>
            );

            return org.url ? (
              <a
                key={i}
                className="card"
                href={org.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            ) : (
              <div key={i} className="card disabled">
                {inner}
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== 인사하는 뚜비 ===== */}
      <img
        src="/ddubi-hi.png"
        alt="수성구 캐릭터 뚜비"
        title="수성구 캐릭터 뚜비"
        className="ddubi"
      />

      <footer className="footer">
        <img src="/logo-suseong.png" alt="대구광역시 수성구" className="footer-logo" />
        <p>{siteInfo.footer}</p>
        <p className="credit">캐릭터 &lsquo;뚜비&rsquo; ⓒ 대구광역시 수성구청</p>
      </footer>

      {/* ===== 자유롭게 돌아다니는 뚜비 (누르면 수성구 홈페이지로) ===== */}
      {ddubi && ddubi.enabled && ddubi.url && (
        <FloatingDdubi url={ddubi.url} label={ddubi.label} />
      )}
    </main>
  );
}
