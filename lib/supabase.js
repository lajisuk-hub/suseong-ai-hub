import { createClient } from "@supabase/supabase-js";

// 멘토어린이집 홈페이지와 같은 Supabase 프로젝트를 씁니다.
// (publishable key는 공개용 키라서 코드에 넣어도 됩니다)
const SUPABASE_URL = "https://pgywpdodatjfpivxmymn.supabase.co";
const SUPABASE_KEY = "sb_publishable_FeO3LdfFBB6KEwblcZPa2w_sW9dVuUg";

// 이 앱 전용 테이블/저장 공간 이름
export const TABLE = "suseong_hub_content";
export const BUCKET = "suseong-hub";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 저장된 내용 불러오기 (없으면 null)
export async function loadContent() {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("data")
      .eq("id", "main")
      .maybeSingle();
    if (error) return { content: null, error };
    return { content: data ? data.data : null, error: null };
  } catch (e) {
    return { content: null, error: e };
  }
}

// 내용 저장하기
export async function saveContent(content) {
  const { error } = await supabase.from(TABLE).upsert({
    id: "main",
    data: content,
    updated_at: new Date().toISOString(),
  });
  return error;
}

// 사진을 작게 줄여서 올리기 좋게 만들기
function compressImage(file, maxSize = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("압축 실패"))),
        "image/jpeg",
        0.88
      );
    };
    img.onerror = () => reject(new Error("사진을 읽지 못했어요"));
    img.src = URL.createObjectURL(file);
  });
}

// 사진 업로드 → 공개 주소 반환
export async function uploadImage(file, folder = "img") {
  const blob = await compressImage(file);
  const name = `${folder}/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(name, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}

// 영상 업로드 → 공개 주소 반환 (50MB 제한)
export async function uploadVideo(file) {
  if (file.size > 50 * 1024 * 1024) {
    throw new Error("영상이 50MB보다 커요. 더 짧게 자르거나 화질을 낮춰 주세요.");
  }
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
  const name = `video/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(name, file, { contentType: file.type || "video/mp4" });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
}
