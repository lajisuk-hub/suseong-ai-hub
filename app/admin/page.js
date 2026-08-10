"use client";

import { useEffect, useState } from "react";
import {
  slides as defaultSlides,
  organizations as defaultOrgs,
  ddubi as defaultDdubi,
} from "../../data/content";
import {
  loadContent,
  saveContent,
  uploadImage,
  uploadVideo,
} from "../../lib/supabase";

const PASSWORD = "1234";

function newOrg() {
  return { name: "", desc: "수성구 AI선도기관", url: "", image: null };
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [orgs, setOrgs] = useState([]);
  const [slides, setSlides] = useState([]);
  const [ddubi, setDdubi] = useState(defaultDdubi);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("hub-admin") === "ok") setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadContent().then(({ content, error }) => {
      if (error) setDbError(true);
      setOrgs(
        content && Array.isArray(content.orgs) && content.orgs.length > 0
          ? content.orgs
          : defaultOrgs.map((o) => ({
              name: o.name,
              desc: o.desc,
              url: o.url,
              image: o.image,
            }))
      );
      setSlides(
        content && Array.isArray(content.slides) && content.slides.length > 0
          ? content.slides
          : defaultSlides
      );
      setDdubi(content && content.ddubi ? content.ddubi : defaultDdubi);
    });
  }, [authed]);

  const login = (e) => {
    e.preventDefault();
    if (pw === PASSWORD) {
      sessionStorage.setItem("hub-admin", "ok");
      setAuthed(true);
    } else {
      setMsg("비밀번호가 맞지 않아요");
    }
  };

  const toast = (t) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 4000);
  };

  // ---------- 공통: 목록 항목 이동/삭제 ----------
  const move = (list, setList, i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const copy = [...list];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setList(copy);
  };
  const remove = (list, setList, i) => {
    if (!confirm("정말 삭제할까요?")) return;
    setList(list.filter((_, k) => k !== i));
  };

  // ---------- 기관 ----------
  const setOrg = (i, field, value) => {
    const copy = [...orgs];
    copy[i] = { ...copy[i], [field]: value };
    setOrgs(copy);
  };

  const pickOrgImage = (i) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      setBusy(true);
      try {
        const url = await uploadImage(file, "orgs");
        setOrg(i, "image", url);
        toast("사진을 올렸어요. 아래 저장 버튼을 꼭 눌러 주세요!");
      } catch (e) {
        setDbError(true);
        toast("사진 올리기 실패: " + (e.message || e));
      }
      setBusy(false);
    };
    input.click();
  };

  // ---------- 슬라이드 ----------
  const setSlide = (i, field, value) => {
    const copy = [...slides];
    copy[i] = { ...copy[i], [field]: value };
    setSlides(copy);
  };

  const addPhotoSlide = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      setBusy(true);
      try {
        const url = await uploadImage(file, "slides");
        setSlides([
          ...slides,
          { type: "image", image: url, title: "", subtitle: "", light: true },
        ]);
        toast("사진 슬라이드를 추가했어요. 저장 버튼을 꼭 눌러 주세요!");
      } catch (e) {
        setDbError(true);
        toast("사진 올리기 실패: " + (e.message || e));
      }
      setBusy(false);
    };
    input.click();
  };

  const addVideoSlide = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      setBusy(true);
      toast("영상을 올리는 중이에요. 조금 기다려 주세요…");
      try {
        const url = await uploadVideo(file);
        setSlides([...slides, { type: "video", video: url }]);
        toast("영상 슬라이드를 추가했어요. 저장 버튼을 꼭 눌러 주세요!");
      } catch (e) {
        setDbError(true);
        toast("영상 올리기 실패: " + (e.message || e));
      }
      setBusy(false);
    };
    input.click();
  };

  // ---------- 저장 ----------
  const save = async () => {
    const emptyName = orgs.find((o) => !o.name.trim());
    if (emptyName && !confirm("이름이 빈 기관이 있어요. 그래도 저장할까요?")) {
      return;
    }
    setBusy(true);
    const error = await saveContent({ orgs, slides, ddubi });
    setBusy(false);
    if (error) {
      setDbError(true);
      toast("저장 실패: " + error.message);
    } else {
      setDbError(false);
      toast("저장 완료! 홈페이지에 바로 반영됐어요 🎉");
    }
  };

  if (!authed) {
    return (
      <main className="admin login-wrap">
        <form className="login-box" onSubmit={login}>
          <h1>관리자 페이지</h1>
          <p>비밀번호를 입력해 주세요</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호"
            autoFocus
          />
          <button type="submit">들어가기</button>
          {msg && <p className="msg">{msg}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="admin">
      <div className="admin-top">
        <h1>🛠️ 관리자 페이지</h1>
        <div className="admin-top-btns">
          <a href="/" className="ghost-btn">홈페이지 보기</a>
          <button className="save-btn" onClick={save} disabled={busy}>
            {busy ? "잠시만요…" : "💾 저장하기"}
          </button>
        </div>
      </div>
      <p className="admin-hint">
        고친 다음에는 꼭 <b>저장하기</b>를 눌러야 홈페이지에 반영돼요.
      </p>

      {dbError && (
        <div className="db-warn">
          ⚠️ 저장소 연결이 아직 안 되어 있어요. Supabase에서 설정 SQL을 한 번
          실행해야 합니다 (방법은 클로드에게 &ldquo;수성구 앱 저장소 설정
          알려줘&rdquo;라고 물어보세요).
        </div>
      )}

      {/* ===== 슬라이드 관리 ===== */}
      <section className="admin-section">
        <h2>1. 슬라이드 (맨 위 큰 화면)</h2>
        <p className="section-hint">
          사진이나 영상을 추가하면 슬라이드에 함께 나와요. 영상 차례가 되면
          자동으로 재생됩니다.
        </p>
        {slides.map((s, i) => (
          <div className="row" key={i}>
            <div className="row-thumb">
              {s.type === "video" ? (
                <video src={s.video} muted preload="metadata" />
              ) : s.image ? (
                <img src={s.image} alt="" />
              ) : (
                <span className="thumb-empty">색 배경</span>
              )}
            </div>
            <div className="row-fields">
              <span className="row-type">
                {s.type === "video" ? "🎬 영상" : "🖼️ 사진/그림"} 슬라이드
              </span>
              {s.type !== "video" && (
                <>
                  <input
                    value={s.title || ""}
                    placeholder="큰 제목 (비우면 글상자 없음)"
                    onChange={(e) => setSlide(i, "title", e.target.value)}
                  />
                  <input
                    value={s.subtitle || ""}
                    placeholder="작은 설명 (선택)"
                    onChange={(e) => setSlide(i, "subtitle", e.target.value)}
                  />
                </>
              )}
            </div>
            <div className="row-btns">
              <button onClick={() => move(slides, setSlides, i, -1)}>▲</button>
              <button onClick={() => move(slides, setSlides, i, 1)}>▼</button>
              <button
                className="del"
                onClick={() => remove(slides, setSlides, i)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        <div className="add-btns">
          <button onClick={addPhotoSlide} disabled={busy}>
            ＋ 사진 슬라이드 추가
          </button>
          <button onClick={addVideoSlide} disabled={busy}>
            ＋ 영상 슬라이드 추가
          </button>
        </div>
      </section>

      {/* ===== 참여기관 관리 ===== */}
      <section className="admin-section">
        <h2>2. 참여기관 (개수 제한 없음)</h2>
        <p className="section-hint">
          기관 이름·소개·홈페이지 주소를 쓰고, 대표 사진도 넣을 수 있어요.
        </p>
        {orgs.map((o, i) => (
          <div className="row" key={i}>
            <div className="row-thumb">
              {o.image ? (
                <img src={o.image} alt="" />
              ) : (
                <span className="thumb-empty">사진 없음</span>
              )}
            </div>
            <div className="row-fields">
              <input
                value={o.name}
                placeholder="기관 이름 (예: 멘토어린이집)"
                onChange={(e) => setOrg(i, "name", e.target.value)}
              />
              <input
                value={o.desc || ""}
                placeholder="한 줄 소개"
                onChange={(e) => setOrg(i, "desc", e.target.value)}
              />
              <input
                value={o.url || ""}
                placeholder="홈페이지 주소 (https://…) — 비우면 '준비중'"
                onChange={(e) => setOrg(i, "url", e.target.value)}
              />
            </div>
            <div className="row-btns">
              <button onClick={() => pickOrgImage(i)} disabled={busy}>
                📷 사진
              </button>
              <button onClick={() => move(orgs, setOrgs, i, -1)}>▲</button>
              <button onClick={() => move(orgs, setOrgs, i, 1)}>▼</button>
              <button className="del" onClick={() => remove(orgs, setOrgs, i)}>
                삭제
              </button>
            </div>
          </div>
        ))}
        <div className="add-btns">
          <button onClick={() => setOrgs([...orgs, newOrg()])}>
            ＋ 기관 추가
          </button>
        </div>
      </section>

      {/* ===== 돌아다니는 뚜비 관리 ===== */}
      <section className="admin-section">
        <h2>3. 돌아다니는 뚜비 🐢</h2>
        <p className="section-hint">
          화면을 자유롭게 떠다니는 뚜비예요. 방문하신 분이 뚜비를 누르면 아래에
          적은 홈페이지가 새 창으로 열립니다.
        </p>
        <div className="ddubi-admin">
          <label className="ddubi-toggle">
            <input
              type="checkbox"
              checked={!!ddubi.enabled}
              onChange={(e) =>
                setDdubi({ ...ddubi, enabled: e.target.checked })
              }
            />
            <span>돌아다니는 뚜비 보이기</span>
          </label>

          <label className="ddubi-field">
            <span>누르면 열릴 주소 (수성구 관련 홈페이지)</span>
            <input
              value={ddubi.url || ""}
              placeholder="https://www.suseong.kr"
              onChange={(e) => setDdubi({ ...ddubi, url: e.target.value })}
            />
          </label>

          <label className="ddubi-field">
            <span>안내 문구 (뚜비에 마우스를 올리면 나와요)</span>
            <input
              value={ddubi.label || ""}
              placeholder="수성구청 홈페이지 바로가기"
              onChange={(e) => setDdubi({ ...ddubi, label: e.target.value })}
            />
          </label>
        </div>
      </section>

      <div className="save-bottom">
        <button className="save-btn big" onClick={save} disabled={busy}>
          {busy ? "잠시만요…" : "💾 저장하기"}
        </button>
      </div>

      {msg && <div className="toast">{msg}</div>}
    </main>
  );
}
