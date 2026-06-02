import type { LocalizedText } from "./types";

export type TopicItem = {
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  tint: string;
};

export type CategoryItem = {
  id: string;
  label: LocalizedText;
  icon: string;
  href: string;
  tint: string;
  premium?: boolean;
};

export type HomeSubItem = TopicItem & {
  id: string;
  href: string;
};

function withRoutes(categoryId: string, items: TopicItem[]): HomeSubItem[] {
  return items.map((item, index) => ({
    ...item,
    id: `${categoryId}-${index}`,
    href: `/c/${categoryId}/${categoryId}-${index}`,
  }));
}

function topicLinks(topics: TopicItem[], categoryId: string): HomeSubItem[] {
  return withRoutes(categoryId, topics);
}

function purchaseLinks(
  categoryId: string,
  items: {
    label: LocalizedText;
    icon: string;
    tint: string;
  }[]
): HomeSubItem[] {
  return items.map((item, index) => ({
    title: item.label,
    description: {
      th: "ดูโพสต์และเขียนในหมวดหมู่นี้",
      ko: "이 카테고리 게시글 보기·작성",
    },
    icon: item.icon,
    tint: item.tint,
    id: `${categoryId}-${index}`,
    href: `/c/${categoryId}/${categoryId}-${index}`,
  }));
}

export const homeCategories: CategoryItem[] = [
  { id: "info", label: { th: "ข้อมูล", ko: "정보" }, icon: "📢", href: "/c/info/info-0", tint: "bg-sky-100" },
  { id: "jobs", label: { th: "หางาน", ko: "구인구직" }, icon: "💼", href: "/c/jobs/jobs-0", tint: "bg-emerald-100" },
  { id: "reviews", label: { th: "รีวิวสถานที่", ko: "장소리뷰" }, icon: "📍", href: "/c/reviews/reviews-0", tint: "bg-rose-100" },
  { id: "purchase", label: { th: "รับหิ้ว", ko: "구매대행" }, icon: "🛍️", href: "/c/purchase/purchase-0", tint: "bg-violet-100" },
  { id: "food", label: { th: "ส่งอาหาร", ko: "음식배달" }, icon: "🍜", href: "/c/food/food-0", tint: "bg-orange-100" },
  { id: "premium", label: { th: "พรีเมียม", ko: "프리미엄" }, icon: "👑", href: "/c/premium/premium-0", tint: "bg-amber-100", premium: true },
  { id: "shopping", label: { th: "ช้อปปิ้ง", ko: "쇼핑" }, icon: "🛒", href: "/c/shopping/shopping-0", tint: "bg-lime-100" },
  { id: "lodging", label: { th: "ที่พัก", ko: "숙박" }, icon: "🛏️", href: "/c/lodging/lodging-0", tint: "bg-indigo-100" },
  { id: "health", label: { th: "สุขภาพ", ko: "건강" }, icon: "🩺", href: "/c/health/health-0", tint: "bg-red-100" },
  { id: "transport", label: { th: "การเดินทาง", ko: "교통" }, icon: "🚕", href: "/c/transport/transport-0", tint: "bg-yellow-100" },
  { id: "education", label: { th: "การศึกษา", ko: "교육" }, icon: "🎓", href: "/c/education/education-0", tint: "bg-purple-100" },
  { id: "service", label: { th: "บริการ", ko: "서비스" }, icon: "🔧", href: "/c/service/service-0", tint: "bg-slate-100" },
];

export const infoTopics: TopicItem[] = [
  {
    title: { th: "วีซ่าและการพำนัก", ko: "비자/체류" },
    description: {
      th: "ข้อมูลประเภทวีซ่า, การต่ออายุ, การเปลี่ยนงาน และเอกสารที่ต้องเตรียมสำหรับการอยู่เกาหลี",
      ko: "비자 종류, 연장, 직장 변경 및 한국 체류에 필요한 서류 정보",
    },
    icon: "🛂",
    tint: "bg-sky-100",
  },
  {
    title: { th: "สิทธิแรงงานและสัญญาจ้าง", ko: "노동권/계약" },
    description: {
      th: "เข้าใจสัญญาจ้าง, ชั่วโมงทำงาน, ค่าแรงขั้นต่ำ, ล่วงเวลา และสิทธิแรงงานที่พนักงานไทยควรรู้",
      ko: "근로계약, 근무시간, 최저임금, 야근 및 태국인 노동자 권리",
    },
    icon: "📄",
    tint: "bg-emerald-100",
  },
  {
    title: { th: "ภาษีและประกันสังคม", ko: "세금/4대보험" },
    description: {
      th: "แนะนำการจ่ายภาษี, ประกันสุขภาพ, ประกันสังคม และวิธีขอคืนภาษีในเกาหลี",
      ko: "세금 납부, 건강보험, 4대보험 및 세금 환급 방법",
    },
    icon: "💳",
    tint: "bg-violet-100",
  },
  {
    title: { th: "บัญชีธนาคารและโอนเงิน", ko: "은행/송금" },
    description: {
      th: "วิธีเปิดบัญชี, บัตรเดบิต, การโอนเงินไปไทย และการใช้งาน mobile banking",
      ko: "계좌 개설, 체크카드, 태국 송금 및 모바일 뱅킹",
    },
    icon: "🏦",
    tint: "bg-amber-100",
  },
  {
    title: { th: "ที่พักและสาธารณูปโภค", ko: "주거/공과금" },
    description: {
      th: "เลือกที่พักปลอดภัย, ค่ามัดจำ, สัญญาเช่า, ค่าน้ำค่าไฟ และวิธีเช็คอินเตอร์เน็ต",
      ko: "안전한 주거, 보증금, 임대계약, 공과금 및 인터넷 설치",
    },
    icon: "🏠",
    tint: "bg-indigo-100",
  },
  {
    title: { th: "โทรศัพท์และการสื่อสาร", ko: "통신" },
    description: {
      th: "ซิมการ์ด, แพ็กเกจอินเทอร์เน็ต, T-money และแอปที่ช่วยให้ชีวิตในเกาหลีง่ายขึ้น",
      ko: "유심, 인터넷 요금제, T-money 및 유용한 앱",
    },
    icon: "📱",
    tint: "bg-rose-100",
  },
  {
    title: { th: "ฉุกเฉินและความปลอดภัย", ko: "긴급/안전" },
    description: {
      th: "เบอร์ฉุกเฉิน, คลินิกภาษาไทย, ศูนย์ช่วยเหลือแรงงานต่างชาติ และคำแนะนำเรื่องความปลอดภัย",
      ko: "긴급전화, 태국어 클리닉, 외국인 근로자 지원센터 및 안전 정보",
    },
    icon: "🚨",
    tint: "bg-red-100",
  },
];

export const infoTips: { th: string[]; ko: string[] } = {
  th: [
    "เตรียมสำเนา passport และบัตร Alien Registration Card (ARC) ไว้เสมอ",
    "ตรวจเช็คสัญญาจ้างเป็นภาษาไทยหรือขอคำแปลหากไม่เข้าใจ",
    "สมัครใช้บริการ translator หรือสายด่วนช่วยเหลือแรงงานต่างชาติ",
    "เก็บสลิปค่าจ้างและใบเสร็จค่าใช้จ่ายเพื่อใช้ยื่นภาษีและเคลมประกัน",
  ],
  ko: [
    "여권 및 외국인등록증(ARC) 사본을 항상 준비하세요",
    "근로계약서를 잘 이해하지 못하면 태국어 번역을 요청하세요",
    "통역 서비스 또는 외국인 근로자 지원 hotline을 활용하세요",
    "급여명세서와 영수증을 세금 및 보험 청구용으로 보관하세요",
  ],
};

export const jobTopics: TopicItem[] = [
  {
    title: { th: "พาร์ทไทม์", ko: "알바" },
    description: {
      th: "งานพาร์ทไทม์ที่ทำได้ง่าย เช่น ร้านอาหาร, คาเฟ่, งานคลังสินค้า และงานบริการ",
      ko: "음식점, 카페, 물류, 서비스 등 알바",
    },
    icon: "🧑‍🍳",
    tint: "bg-orange-100",
  },
  {
    title: { th: "งานประจำ", ko: "정규직" },
    description: {
      th: "ตำแหน่งงานประจำในโรงงาน, บริษัท, โรงแรม และธุรกิจบริการที่รับคนต่างชาติ",
      ko: "공장, 회사, 호텔 등 외국인 채용 정규직",
    },
    icon: "🏢",
    tint: "bg-sky-100",
  },
  {
    title: { th: "เดลิเวอรี", ko: "배달" },
    description: {
      th: "งานส่งอาหาร, สินค้า หรือพัสดุ ที่มีความยืดหยุ่นและชั่วโมงทำงานปรับได้",
      ko: "음식·물품·택배 배달 등 유연한 근무",
    },
    icon: "🛵",
    tint: "bg-lime-100",
  },
  {
    title: { th: "แม่บ้าน", ko: "가사 도우미" },
    description: {
      th: "งานดูแลบ้าน, ทำความสะอาด, เตรียมอาหาร และดูแลเด็ก-ผู้สูงอายุ",
      ko: "청소, 요리, 육아·돌봄 가사 도우미",
    },
    icon: "🧹",
    tint: "bg-violet-100",
  },
  {
    title: { th: "ติวภาษา", ko: "과외" },
    description: {
      th: "สอนภาษาไทย, ภาษาอังกฤษ หรือช่วยงานแปลสำหรับคนไทยในเกาหลี",
      ko: "태국어·영어 과외 및 통역 보조",
    },
    icon: "📚",
    tint: "bg-purple-100",
  },
  {
    title: { th: "หางานไทย-เป็นมิตร", ko: "태국인 환영" },
    description: {
      th: "รวมงานที่นายจ้างไทยหรือเจ้าของร้านเกาหลีที่สื่อสารไทยได้ และเข้าใจวัฒนธรรมไทย",
      ko: "태국어 가능 고용주·태국인 친화 일자리",
    },
    icon: "🤝",
    tint: "bg-emerald-100",
  },
];

export const jobTips: { th: string[]; ko: string[] } = {
  th: [
    "เตรียมเรซูเม่/ใบสมัครเป็นภาษาไทยและภาษาอังกฤษหรือเกาหลีหากทำได้",
    "ตรวจสอบประเภทวีซ่าและเงื่อนไขการทำงานก่อนยื่นสมัคร",
    "คุยเรื่องสภาพการทำงาน ชั่วโมง และค่าจ้างให้ชัดเจนก่อนเริ่มงาน",
    "ขอแนะนำให้มีคนไทยหรือแอดมินในช่องทางสื่อสารช่วยแปลเมื่อติดต่อกับนายจ้าง",
  ],
  ko: [
    "이력서를 태국어·영어 또는 한국어로 준비하세요",
    "지원 전 비자 종류와 근무 조건을 확인하세요",
    "근무 조건, 시간, 임금을 시작 전에 명확히 하세요",
    "고용주 연락 시 태국인·관리자 통역을 활용하세요",
  ],
};

export const boardTopics: TopicItem[] = [
  { title: { th: "กระดานทั่วไป", ko: "자유게시판" }, description: { th: "แชร์เรื่องราวทั่วไปและประสบการณ์ชีวิตในเกาหลีของคนไทย", ko: "한국 생활 경험 및 자유 이야기" }, icon: "💬", tint: "bg-sky-100" },
  { title: { th: "ข้อมูลและ팁", ko: "정보공유" }, description: { th: "แนะนำสำคัญเกี่ยวกับวีซ่า, การต่อใบ, ระบบประกัน, และค่าใช้จ่าย", ko: "비자, 연장, 보험, 생활비 정보" }, icon: "📝", tint: "bg-emerald-100" },
  { title: { th: "สวัสดิการแรงงาน", ko: "노동복지" }, description: { th: "คำแนะนำเรื่องสิทธิแรงงาน, ค่าจ้าง, OT, และการใช้ประกันสังคม", ko: "노동권, 임금, 야근, 4대보험" }, icon: "🛡️", tint: "bg-violet-100" },
  { title: { th: "ที่พักและสัญญาเช่า", ko: "주거정보" }, description: { th: "แชร์หอพัก, เช่าห้อง, ค่าน้ำไฟ, และเคล็ดลับการเซ็นสัญญา", ko: "원룸, 월세, 공과금, 계약 팁" }, icon: "🏠", tint: "bg-indigo-100" },
  { title: { th: "ตลาดมือสอง", ko: "중고장터" }, description: { th: "ซื้อ-ขายของใช้ในครัว, เฟอร์, ของสะสม หรือแลกเปลี่ยนของไทย", ko: "중고 거래 및 태국 물품 교환" }, icon: "📦", tint: "bg-amber-100" },
  { title: { th: "คลินิกและสุขภาพ", ko: "건강/클리닉" }, description: { th: "แนะนำคลินิกภาษาไทย, โรงพยาบาล, และวิธีดูแลสุขภาพในเกาหลี", ko: "태국어 클리닉, 병원, 건강 관리" }, icon: "🩺", tint: "bg-red-100" },
  { title: { th: "เรียนภาษาและสตั๊ดดี้", ko: "어학/스터디" }, description: { th: "รวมกลุ่มเรียนภาษา, คอร์สติว, และแชร์วิธีเตรียมสอบ TOPIK", ko: "어학 스터디, TOPIK 준비" }, icon: "📚", tint: "bg-purple-100" },
  { title: { th: "เที่ยวและร้านอาหาร", ko: "여행/맛집" }, description: { th: "รีวิวร้านอาหารไทย, ร้านเด็ดในโซนคนไทย, และเรื่องเที่ยวสุดคุ้ม", ko: "태국 음식점, 맛집, 여행 정보" }, icon: "🍜", tint: "bg-orange-100" },
  { title: { th: "กิจกรรมชุมชน", ko: "이벤트/모임" }, description: { th: "นัดพบเพื่อนไทย, กิจกรรมวัฒนธรรม, และงานรวมพลคนไทยในเกาหลี", ko: "태국인 모임 및 문화 행사" }, icon: "🎉", tint: "bg-lime-100" },
  { title: { th: "โซนช่วยเหลือด่วน", ko: "긴급지원" }, description: { th: "คำแนะนำเบอร์ฉุกเฉิน, ศูนย์ช่วยเหลือแรงงานต่างชาติ, และการแจ้งปัญหาเร่งด่วน", ko: "긴급전화, 외국인 지원센터" }, icon: "🚨", tint: "bg-rose-100" },
];

export const purchaseItems = [
  { label: { th: "เครื่องสำอาง", ko: "화장품" }, icon: "💄", tint: "bg-rose-100" },
  { label: { th: "Olive Young", ko: "올리브영" }, icon: "🛒", tint: "bg-lime-100" },
  { label: { th: "รองเท้า", ko: "신발" }, icon: "👟", tint: "bg-sky-100" },
  { label: { th: "สินค้าแบรนด์เนม", ko: "명품" }, icon: "💎", tint: "bg-amber-100" },
  { label: { th: "อุปกรณ์อิเล็กทรอนิกส์", ko: "전자제품" }, icon: "📱", tint: "bg-indigo-100" },
  { label: { th: "ขนมและของว่าง", ko: "간식" }, icon: "🍪", tint: "bg-orange-100" },
  { label: { th: "อาหารเสริม", ko: "건강식품" }, icon: "💊", tint: "bg-emerald-100" },
];

const reviewPlaceItems: TopicItem[] = [
  {
    title: { th: "ร้านอาหาร", ko: "음식점" },
    description: { th: "ร้านอาหารไทย เกาหลี และนานาชาติ", ko: "태국·한국·세계 음식점" },
    icon: "🍜",
    tint: "bg-orange-100",
  },
  {
    title: { th: "คาเฟ่", ko: "카페" },
    description: { th: "คาเฟ่และร้านขนม", ko: "카페·디저트" },
    icon: "☕",
    tint: "bg-amber-100",
  },
  {
    title: { th: "ช้อปปิ้ง", ko: "쇼핑" },
    description: { th: "ร้านค้าและห้างสรรพสินค้า", ko: "상점·쇼핑몰" },
    icon: "🛒",
    tint: "bg-lime-100",
  },
  {
    title: { th: "บริการ", ko: "서비스" },
    description: { th: "ร้านบริการและสถานที่ใช้บริการ", ko: "각종 서비스 업체" },
    icon: "🔧",
    tint: "bg-slate-100",
  },
  {
    title: { th: "ร้านคาราโอเกะ", ko: "노래방" },
    description: {
      th: "ร้องเพลง ปาร์ตี้ และสถานที่พักผ่อนช่วงค่ำ",
      ko: "노래방·파티룸·저녁 모임 장소",
    },
    icon: "🎤",
    tint: "bg-purple-100",
  },
  {
    title: { th: "คลับ/บาร์", ko: "클럽" },
    description: {
      th: "คลับ บาร์ และสถานบันเทิงยามค่ำ",
      ko: "클럽·바·나이트라이프",
    },
    icon: "🪩",
    tint: "bg-fuchsia-100",
  },
];

const foodDeliveryItems: TopicItem[] = [
  {
    title: { th: "อาหารไทย", ko: "태국 음식" },
    description: { th: "ร้านอาหารไทยและเดลิเวอรี", ko: "태국 음식점·배달" },
    icon: "🍛",
    tint: "bg-orange-100",
  },
  {
    title: { th: "อาหารเกาหลี", ko: "한식 배달" },
    description: { th: "อาหารเกาหลีสั่งถึงบ้าน", ko: "한식 배달" },
    icon: "🥘",
    tint: "bg-red-100",
  },
  {
    title: { th: "ของว่าง/ดึก", ko: "야식·분식" },
    description: { th: "ของว่างและอาหารดึก", ko: "야식·분식 배달" },
    icon: "🌙",
    tint: "bg-indigo-100",
  },
  {
    title: { th: "แอปสั่งอาหาร", ko: "배달 앱" },
    description: { th: "Baemin, Coupang Eats และอื่นๆ", ko: "배민, 쿠팡이츠 등" },
    icon: "📱",
    tint: "bg-sky-100",
  },
];

const premiumItems: TopicItem[] = [
  {
    title: { th: "แบรนด์เนม", ko: "명품" },
    description: { th: "กระเป๋า เสื้อผ้า และเครื่องประดับ", ko: "명품 가방·의류·주얼리" },
    icon: "💎",
    tint: "bg-amber-100",
  },
  {
    title: { th: "โรงแรมหรู", ko: "럭셔리 호텔" },
    description: { th: "โรงแรมและรีสอร์ทระดับพรีเมียม", ko: "프리미엄 호텔·리조트" },
    icon: "🏨",
    tint: "bg-violet-100",
  },
  {
    title: { th: "สปา/สุขภาพ", ko: "프리미엄 스파" },
    description: { th: "สปาและบริการสุขภาพระดับสูง", ko: "고급 스파·웰니스" },
    icon: "✨",
    tint: "bg-rose-100",
  },
  {
    title: { th: "ร้านพิเศษ", ko: "프리미엄 맛집" },
    description: { th: "ร้านอาหารและสถานที่พิเศษ", ko: "프리미엄 다이닝·장소" },
    icon: "👑",
    tint: "bg-yellow-100",
  },
];

const shoppingItems: TopicItem[] = [
  {
    title: { th: "ห้างสรรพสินค้า", ko: "백화점" },
    description: { th: "Lotte, Shinsegae, Hyundai", ko: "롯데·신세계·현대백화점" },
    icon: "🏬",
    tint: "bg-lime-100",
  },
  {
    title: { th: "เอาท์เล็ต", ko: "아울렛" },
    description: { th: "ช้อปปิ้งราคาดี", ko: "할인 쇼핑" },
    icon: "🏷️",
    tint: "bg-orange-100",
  },
  {
    title: { th: "ตลาด/ร้านค้า", ko: "동네 상가" },
    description: { th: "ตลาดและร้านค้าใกล้บ้าน", ko: "동네 마트·상가" },
    icon: "🏪",
    tint: "bg-emerald-100",
  },
  {
    title: { th: "ช้อปออนไลน์", ko: "온라인 쇼핑" },
    description: { th: "Coupang, Gmarket และอื่นๆ", ko: "쿠팡·G마켓 등" },
    icon: "📦",
    tint: "bg-sky-100",
  },
];

const lodgingItems: TopicItem[] = [
  {
    title: { th: "ห้องเช่า/วัน룸", ko: "원룸·월세" },
    description: { th: "ห้องเช่าและค่าใช้จ่าย", ko: "원룸·월세 정보" },
    icon: "🏠",
    tint: "bg-indigo-100",
  },
  {
    title: { th: "โก시원", ko: "고시원" },
    description: { th: "ที่พักราคาประหยัด", ko: "저렴한 숙소" },
    icon: "🛏️",
    tint: "bg-violet-100",
  },
  {
    title: { th: "โรงแรม", ko: "호텔" },
    description: { th: "โรงแรมและเก스트เฮาส์", ko: "호텔·게하" },
    icon: "🏨",
    tint: "bg-sky-100",
  },
  {
    title: { th: "ที่พักระยะสั้น", ko: "단기 숙박" },
    description: { th: "Airbnb และที่พักชั่วคราว", ko: "에어비앤비·단기임대" },
    icon: "🔑",
    tint: "bg-amber-100",
  },
];

const healthItems: TopicItem[] = [
  {
    title: { th: "โรงพยาบาล", ko: "병원" },
    description: { th: "โรงพยาบาลและคลินิก", ko: "종합병원·클리닉" },
    icon: "🏥",
    tint: "bg-red-100",
  },
  {
    title: { th: "ร้านขายยา", ko: "약국" },
    description: { th: "ยาและของใช้สุขภาพ", ko: "약국·건강용품" },
    icon: "💊",
    tint: "bg-emerald-100",
  },
  {
    title: { th: "ทันตกรรม", ko: "치과" },
    description: { th: "คลินิกทันตกรรม", ko: "치과·스케일링" },
    icon: "🦷",
    tint: "bg-sky-100",
  },
  {
    title: { th: "คลินิกภาษาไทย", ko: "태국어 클리닉" },
    description: { th: "คลินิกที่สื่อสารไทยได้", ko: "태국어 가능 의료" },
    icon: "🩺",
    tint: "bg-rose-100",
  },
];

const transportItems: TopicItem[] = [
  {
    title: { th: "รถไฟใต้ดิน", ko: "지하철" },
    description: { th: "สายรถไฟและสถานี", ko: "지하철 노선·역" },
    icon: "🚇",
    tint: "bg-yellow-100",
  },
  {
    title: { th: "รถเมล์", ko: "버스" },
    description: { th: "เส้นทางและป้ายรถเมล์", ko: "버스 노선·정류장" },
    icon: "🚌",
    tint: "bg-lime-100",
  },
  {
    title: { th: "แท็กซี่", ko: "택시" },
    description: { th: "เรียกแท็กซี่และค่าโดยสาร", ko: "택시·요금" },
    icon: "🚕",
    tint: "bg-amber-100",
  },
  {
    title: { th: "KTX/รถไฟ", ko: "KTX·기차" },
    description: { th: "เดินทางระหว่างเมือง", ko: "KTX·시외 이동" },
    icon: "🚄",
    tint: "bg-indigo-100",
  },
];

const educationItems: TopicItem[] = [
  {
    title: { th: "โรงเรียนสอนภาษา", ko: "어학원" },
    description: { th: "เรียนภาษาเกาหลีและอังกฤษ", ko: "한국어·영어 학원" },
    icon: "📖",
    tint: "bg-purple-100",
  },
  {
    title: { th: "มหาวิทยาลัย", ko: "대학" },
    description: { th: "ข้อมูลมหาวิทยาลัยและคณะ", ko: "대학·학과 정보" },
    icon: "🎓",
    tint: "bg-indigo-100",
  },
  {
    title: { th: "TOPIK", ko: "TOPIK" },
    description: { th: "เตรียมสอบและศูนย์สอบ", ko: "TOPIK 준비·시험장" },
    icon: "📝",
    tint: "bg-sky-100",
  },
  {
    title: { th: "กลุ่มสตั๊ดดี้", ko: "스터디" },
    description: { th: "กลุ่มเรียนและแลกเปลี่ยน", ko: "스터디 모임" },
    icon: "👥",
    tint: "bg-emerald-100",
  },
];

const serviceItems: TopicItem[] = [
  {
    title: { th: "ล่าม/แปล", ko: "통역" },
    description: { th: "บริการแปลและล่าม", ko: "통역·번역 서비스" },
    icon: "🗣️",
    tint: "bg-slate-100",
  },
  {
    title: { th: "ขนย้าย", ko: "이사" },
    description: { th: "บริการขนย้ายและรถขนของ", ko: "이사·용달" },
    icon: "📦",
    tint: "bg-amber-100",
  },
  {
    title: { th: "ซักรีด", ko: "세탁" },
    description: { th: "ร้านซักผ้าและบริการ", ko: "세탁소·클리닝" },
    icon: "👔",
    tint: "bg-sky-100",
  },
  {
    title: { th: "ซ่อม/ช่าง", ko: "수리" },
    description: { th: "ซ่อมโทรศัพท์ รถ และของใช้", ko: "휴대폰·차량·수리" },
    icon: "🔧",
    tint: "bg-orange-100",
  },
];

export const homeCategoryItems: Record<string, HomeSubItem[]> = {
  info: topicLinks(infoTopics, "info"),
  jobs: topicLinks(jobTopics, "jobs"),
  reviews: withRoutes("reviews", reviewPlaceItems),
  purchase: purchaseLinks("purchase", purchaseItems),
  food: withRoutes("food", foodDeliveryItems),
  premium: withRoutes("premium", premiumItems),
  shopping: withRoutes("shopping", shoppingItems),
  lodging: withRoutes("lodging", lodgingItems),
  health: withRoutes("health", healthItems),
  transport: withRoutes("transport", transportItems),
  education: withRoutes("education", educationItems),
  service: withRoutes("service", serviceItems),
};

export function getHomeCategoryById(id: string) {
  return homeCategories.find((category) => category.id === id);
}

export function getCategoryOverviewHref(categoryId: string): string {
  return `/c/${categoryId}`;
}

export const PREMIUM_CATEGORY_ID = "premium";

export function isPremiumCategoryId(categoryId: string): boolean {
  return categoryId === PREMIUM_CATEGORY_ID;
}

export function getSubCategoryItem(categoryId: string, subId: string) {
  return homeCategoryItems[categoryId]?.find((item) => item.id === subId);
}
