// ============================================================
// 이 파일 하나만 고치면 홈페이지 내용이 바뀝니다.
// (슬라이드 사진, 참여기관 목록, 연결 주소)
// ============================================================

// 홈페이지 맨 위에 나오는 큰 슬라이드입니다.
// image 자리에 사진 파일을 넣으면 사진이 나오고,
// 사진이 없으면 예쁜 색 배경으로 나옵니다.
// 사진은 public/slides 폴더에 넣고 "/slides/파일명.jpg" 처럼 씁니다.
export const slides = [
  {
    image: "/slides/slide1-sunrise.svg",
    title: "수성구 AI선도기관",
    subtitle: "함께 성장하는 우리 기관들을 소개합니다",
    bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    image: "/slides/slide2-balloons.svg",
    title: "아이들과 함께하는 AI 교육",
    subtitle: "미래를 준비하는 즐거운 배움",
    bg: "linear-gradient(135deg, #f6ad55 0%, #ed64a6 100%)",
  },
  {
    image: "/slides/slide3-network.svg",
    title: "참여기관을 눌러보세요",
    subtitle: "아래로 내리면 각 기관 홈페이지로 갈 수 있어요",
    bg: "linear-gradient(135deg, #38b2ac 0%, #4299e1 100%)",
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
    color: "linear-gradient(135deg, #667eea, #764ba2)",
  },
  {
    name: "참여기관 2",
    desc: "기관 이름과 주소를 알려주시면 채워드려요",
    url: "",
    image: null,
    emoji: "🌱",
    color: "linear-gradient(135deg, #48bb78, #38b2ac)",
  },
  {
    name: "참여기관 3",
    desc: "기관 이름과 주소를 알려주시면 채워드려요",
    url: "",
    image: null,
    emoji: "🎨",
    color: "linear-gradient(135deg, #ed8936, #f6ad55)",
  },
  {
    name: "참여기관 4",
    desc: "기관 이름과 주소를 알려주시면 채워드려요",
    url: "",
    image: null,
    emoji: "🧸",
    color: "linear-gradient(135deg, #ed64a6, #d53f8c)",
  },
  {
    name: "참여기관 5",
    desc: "기관 이름과 주소를 알려주시면 채워드려요",
    url: "",
    image: null,
    emoji: "📚",
    color: "linear-gradient(135deg, #4299e1, #3182ce)",
  },
  {
    name: "참여기관 6",
    desc: "기관 이름과 주소를 알려주시면 채워드려요",
    url: "",
    image: null,
    emoji: "🌟",
    color: "linear-gradient(135deg, #9f7aea, #805ad5)",
  },
];

// 홈페이지 제목/설명 (검색될 때 보이는 이름)
export const siteInfo = {
  title: "수성구 AI선도기관",
  description: "수성구 AI선도기관 참여기관을 한눈에 보고 방문할 수 있는 홈페이지",
  footer: "수성구 AI선도기관 네트워크",
};
