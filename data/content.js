// ============================================================
// 이 파일 하나만 고치면 홈페이지 내용이 바뀝니다.
// (슬라이드 사진, 참여기관 목록, 연결 주소)
// ============================================================

// 홈페이지 맨 위에 나오는 큰 슬라이드입니다.
// - image: 그림 파일 (public/slides 폴더에 넣고 "/slides/파일명" 형식)
// - title이 비어 있으면("") 글상자를 띄우지 않습니다 (그림 안에 글자가 이미 있을 때)
// - light: true 면 밝은 그림용 (하얀 글상자 + 남색 글씨)
// - textPos: "top" 이면 글상자가 위쪽에 나옵니다
export const slides = [
  {
    image: "/slides/hero-ai-education.png",
    title: "",
    subtitle: "",
    bg: "linear-gradient(135deg, #EAF1FF, #DDE9FF)",
    light: true,
    // 좁은 화면에서 그림이 잘릴 때 아이들·로봇 쪽(오른쪽)이 보이게
    pos: "68% center",
  },
  {
    image: "/slides/slide2-ai-education.svg",
    title: "아이들과 함께하는 AI 교육",
    subtitle: "사람을 이해하는 인공지능, 미래를 준비하는 교육",
    bg: "linear-gradient(135deg, #EAF1FF, #DDE9FF)",
    light: true,
    textPos: "top",
  },
  {
    image: "/slides/slide3-network.svg",
    title: "참여기관을 눌러보세요",
    subtitle: "아래로 내리면 각 기관 홈페이지로 갈 수 있어요",
    bg: "linear-gradient(135deg, #EAF1FF, #DDE9FF)",
    light: true,
    textPos: "top",
  },
];

// 참여기관 목록입니다. 카드를 누르면 url 주소로 이동합니다.
// image 자리에 기관 사진/로고를 넣을 수 있습니다 (public/orgs 폴더).
// 사진이 없으면 emoji(그림문자)와 색 배경으로 나옵니다.
export const organizations = [
  {
    name: "멘토어린이집",
    desc: "수성구 AI선도기관",
    url: "https://mentor-homepage.vercel.app",
    image: null,
    emoji: "🏫",
    color: "linear-gradient(135deg, #6D8DF0, #7C5CF0)",
  },
  {
    name: "참여기관 2",
    desc: "기관 이름과 주소를 알려주시면 채워드려요",
    url: "",
    image: null,
    emoji: "🌱",
    color: "linear-gradient(135deg, #5AA7E8, #5AD1C8)",
  },
  {
    name: "참여기관 3",
    desc: "기관 이름과 주소를 알려주시면 채워드려요",
    url: "",
    image: null,
    emoji: "🎨",
    color: "linear-gradient(135deg, #7FB5FF, #6D8DF0)",
  },
  {
    name: "참여기관 4",
    desc: "기관 이름과 주소를 알려주시면 채워드려요",
    url: "",
    image: null,
    emoji: "🧸",
    color: "linear-gradient(135deg, #8FA8F5, #B9A8FF)",
  },
  {
    name: "참여기관 5",
    desc: "기관 이름과 주소를 알려주시면 채워드려요",
    url: "",
    image: null,
    emoji: "📚",
    color: "linear-gradient(135deg, #48B8A8, #7EDCD6)",
  },
  {
    name: "참여기관 6",
    desc: "기관 이름과 주소를 알려주시면 채워드려요",
    url: "",
    image: null,
    emoji: "🌟",
    color: "linear-gradient(135deg, #7C5CF0, #A78BFA)",
  },
];

// 홈페이지 제목/설명 (검색될 때 보이는 이름)
export const siteInfo = {
  title: "수성구 AI선도기관",
  description: "수성구 AI선도기관 참여기관을 한눈에 보고 방문할 수 있는 홈페이지",
  footer: "대구광역시 수성구 · AI선도기관 네트워크",
};
