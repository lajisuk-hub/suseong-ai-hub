"use client";

import { useEffect, useState, useCallback } from "react";
import { slides, organizations, siteInfo } from "../data/content";

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(
    () => setCurrent((c) => (c + 1) % slides.length),
    []
  );
  const prev = useCallback(
    () => setCurrent((c) => (c - 1 + slides.length) % slides.length),
    []
  );

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(next, 4500);
    return () => clearInterval(timer);
  }, [paused, next]);

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
            {!slide.light && <div className="slide-overlay" />}
            {slide.title && (
              <div className={`slide-text ${slide.light ? "light" : ""}`}>
                <h1>{slide.title}</h1>
                <p>{slide.subtitle}</p>
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
          {organizations.map((org, i) => {
            const inner = (
              <>
                <div
                  className={`card-img ${org.image ? "" : "deco"}`}
                  style={
                    org.image
                      ? { backgroundImage: `url(${org.image})` }
                      : { background: org.color }
                  }
                >
                  {!org.image && <span className="card-emoji">{org.emoji}</span>}
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

      <footer className="footer">
        <img src="/logo-suseong.png" alt="대구광역시 수성구" className="footer-logo" />
        <p>{siteInfo.footer}</p>
      </footer>
    </main>
  );
}
