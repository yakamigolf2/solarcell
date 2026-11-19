import { BatteryCharging, Bird, Building2, Cable, Cpu, Factory, Home, HardHat, MapPin, MessageCircle, Monitor, ShieldCheck, Sun, TrendingUp, Wrench, Zap, type LucideIcon } from 'lucide-react';

// Company facts come from the existing quotation template. Projects, testimonials and news below are SAMPLE content —
// replace with real material before launch.
export const COMPANY = {
  brand: 'BGE SolarTech',
  legal: 'บริษัท เบทเทอร์ กรุ๊ป เอ็นจิเนียริ่ง จำกัด',
  legalEn: 'BETTER GROUP ENGINEERING CO., LTD.',
  address: 'เลขที่ 71/2 หมู่ที่ 3 ตำบลลาดหลุมแก้ว อำเภอลาดหลุมแก้ว จังหวัดปทุมธานี 12140',
  phone: '088-693-6699',
  phoneHref: 'tel:0886936699',
  email: 'info.bge.energy@gmail.com',
  taxId: '0105562117061',
};

export const NAV = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/about', label: 'เกี่ยวกับเรา' },
  { href: '/solutions', label: 'สินค้าและบริการ' },
  { href: '/projects', label: 'ผลงาน' },
  { href: '/news', label: 'ข่าวสาร' },
  { href: '/contact', label: 'ติดต่อ' },
];

export const SOLUTIONS: { slug: string; title: string; icon: LucideIcon; text: string; points: string[]; tone: string }[] = [
  { slug: 'home', title: 'โซลาร์รูฟท็อปสำหรับบ้าน', icon: Home, text: 'ลดค่าไฟประจำเดือน ใช้ไฟจากแสงอาทิตย์ในช่วงกลางวัน ออกแบบให้เหมาะกับหลังคาและพฤติกรรมการใช้ไฟของครอบครัว', points: ['สำรวจหน้างานและออกแบบฟรี', 'แผง Tier 1 พร้อม Inverter คุณภาพ', 'ดูแลเรื่องเอกสารการไฟฟ้า'], tone: 'from-sky-100 to-blue-200 text-blue-700' },
  { slug: 'building', title: 'อาคารพาณิชย์และสำนักงาน', icon: Building2, text: 'ระบบขนาดกลางที่ลดต้นทุนพลังงานของธุรกิจ คุ้มค่าในระยะยาว พร้อมระบบติดตามผลการผลิตไฟ', points: ['ออกแบบตามโหลดการใช้ไฟ', 'ติดตามผลผลิตผ่านระบบมอนิเตอร์', 'วางแผนคืนทุนอย่างโปร่งใส'], tone: 'from-emerald-100 to-teal-200 text-emerald-700' },
  { slug: 'factory', title: 'โรงงานและอุตสาหกรรม', icon: Factory, text: 'ระบบขนาดใหญ่บนหลังคาโรงงาน ลดค่าไฟช่วงเวลาทำงาน เพิ่มความสามารถในการแข่งขัน และลดคาร์บอน', points: ['งานโครงสร้างและวิศวกรรมครบวงจร', 'ติดตั้งโดยทีมช่างมีประสบการณ์', 'บริการหลังการขายและบำรุงรักษา'], tone: 'from-violet-100 to-indigo-200 text-indigo-700' },
];

export const SERVICES: { title: string; text: string; icon: LucideIcon }[] = [
  { title: 'ให้คำปรึกษา ตรงไปตรงมา', text: 'ฟังการใช้ไฟและเป้าหมายของคุณ แล้วแนะนำระบบที่เหมาะสม ไม่เกินความจำเป็น', icon: MessageCircle },
  { title: 'สำรวจหน้างาน วิเคราะห์ทิศทางแสง', text: 'ประเมินหลังคา ทิศทาง ร่มเงา และโครงสร้าง เพื่อวางตำแหน่งแผงให้ได้ผลผลิตสูงสุด', icon: MapPin },
  { title: 'ประเมินผลตอบแทน พร้อมแผนการคืนทุน', text: 'คำนวณค่าไฟที่ประหยัดได้และระยะเวลาคืนทุนอย่างโปร่งใส ก่อนตัดสินใจ', icon: TrendingUp },
  { title: 'ออกแบบ และติดตั้งโดยวิศวกร', text: 'ติดตั้งตามมาตรฐานความปลอดภัย พร้อมทดสอบระบบก่อนส่งมอบ และยื่นเอกสารการไฟฟ้าให้', icon: HardHat },
  { title: 'ติดตามระบบ และรายงานผลผลิตไฟฟ้า', text: 'ระบบมอนิเตอร์ช่วยดูปริมาณไฟที่ผลิตได้ และตรวจพบความผิดปกติได้เร็ว', icon: Monitor },
  { title: 'บริการดูแลหลังการขายระยะยาว', text: 'บำรุงรักษา ล้างแผง และแก้ปัญหาหลังการติดตั้ง ตามเงื่อนไขในใบเสนอราคา', icon: Wrench },
];

export const SYSTEMS: { title: string; range: string; text: string; icon: LucideIcon; tone: string }[] = [
  { title: 'ระบบ On-grid', range: 'บ้านและธุรกิจขนาดเล็ก–กลาง', text: 'ลดค่าไฟช่วงกลางวัน เชื่อมต่อกับระบบการไฟฟ้า คุ้มค่าและติดตั้งไว', icon: Sun, tone: 'from-amber-100 to-orange-200 text-orange-600' },
  { title: 'ระบบ Hybrid + แบตเตอรี่', range: 'สำรองไฟสำหรับบ้าน', text: 'เก็บไฟส่วนเกินไว้ใช้ตอนกลางคืนและยามไฟดับ รองรับการเชื่อมต่อเครื่องชาร์จรถไฟฟ้า', icon: BatteryCharging, tone: 'from-emerald-100 to-teal-200 text-emerald-700' },
  { title: 'ระบบสำหรับอาคารพาณิชย์', range: 'สำนักงาน ร้านค้า โกดัง', text: 'ออกแบบตามโหลดไฟฟ้า ลดต้นทุนพลังงานของธุรกิจในช่วงเวลาทำการ', icon: Building2, tone: 'from-sky-100 to-blue-200 text-blue-700' },
  { title: 'ระบบสำหรับโรงงาน', range: 'ขนาดใหญ่บนหลังคาโรงงาน', text: 'งานโครงสร้างและวิศวกรรมครบวงจร ลดค่าไฟและเพิ่มความสามารถในการแข่งขัน', icon: Factory, tone: 'from-violet-100 to-indigo-200 text-indigo-700' },
];

export const PRODUCTS: { slug: string; title: string; icon: LucideIcon; hue: string; points: string[]; note?: string }[] = [
  { slug: 'panel', title: 'แผงโซลาร์เซลล์', icon: Sun, hue: 'from-sky-300 to-blue-600', points: ['แผงมาตรฐาน Tier 1 (เช่น Longi Solar ขนาด 645 วัตต์)', 'รับประกันผลิตภัณฑ์ 15 ปี', 'รับประกันประสิทธิภาพการผลิตไฟ (Efficiency output) 30 ปี'], note: 'ตามที่ระบุในใบเสนอราคา อาจต่างกันตามรุ่นที่เลือก' },
  { slug: 'inverter', title: 'อินเวอร์เตอร์', icon: Cpu, hue: 'from-emerald-300 to-teal-600', points: ['Hybrid inverter (เช่น Sigenergy ขนาด 10 kW)', 'รับประกัน 10 ปี', 'รองรับระบบ 3 เฟส และการเชื่อมต่อเครื่องชาร์จรถไฟฟ้า'] },
  { slug: 'battery', title: 'แบตเตอรี่ลิเธียม', icon: BatteryCharging, hue: 'from-amber-300 to-orange-500', points: ['เก็บไฟส่วนเกินไว้ใช้ตอนกลางคืน (เช่น ขนาด 9.04 kWh)', 'ชุดควบคุมการสำรองไฟฟ้าภายในบ้าน (Gateway)', 'ขยายระบบได้ตามความต้องการ'] },
  { slug: 'protection', title: 'อุปกรณ์ป้องกันและตู้ควบคุม', icon: ShieldCheck, hue: 'from-indigo-300 to-violet-600', points: ['อุปกรณ์ป้องกันไฟฟ้าย้อนกลับ (Zero export)', 'ตู้ควบคุม AC/DC Combiner', 'ระบบกราวด์ และอุปกรณ์ป้องกันไฟกระโชก (Surge protection)'] },
  { slug: 'cable', title: 'โครงสร้างและสายไฟ', icon: Cable, hue: 'from-cyan-300 to-sky-600', points: ['อุปกรณ์จับยึดแผง (Mounting) ตามโครงสร้างหลังคา', 'สายไฟกระแสตรง (DC) และกระแสสลับ (AC)', 'อุปกรณ์ร้อยสายสำหรับเดินภายนอก'] },
  { slug: 'extras', title: 'อุปกรณ์เสริมและบริการหลังติดตั้ง', icon: Bird, hue: 'from-fuchsia-300 to-purple-600', points: ['ตะแกรงกันนกใต้แผง (ตามเงื่อนไขของบริษัท)', 'งานบำรุงรักษาและล้างแผงปีละครั้ง', 'รับประกันงานติดตั้ง 2 ปี'] },
];

export const DESIGN_PRINCIPLES = [
  { title: 'ออกแบบให้ดูแลรักษาง่าย', text: 'เว้นทางเดินและจุดเข้าถึงแผง ทำให้ล้างและตรวจเช็กระบบได้สะดวกในระยะยาว', icon: HardHat },
  { title: 'จัดวางแผงให้ได้แสงมากที่สุด', text: 'เลือกทิศทางและองศาที่เหมาะกับหลังคาและร่มเงาในพื้นที่จริง', icon: Sun },
  { title: 'เลือกอุปกรณ์ที่เชื่อถือได้', text: 'ใช้อุปกรณ์มาตรฐาน มีการรับประกัน และเหมาะกับสภาพการใช้งานของคุณ', icon: Zap },
];

export const WHY = [
  { title: 'ออกแบบเฉพาะหน้างาน', text: 'ไม่ใช่แพ็กเกจสำเร็จรูป เราสำรวจแล้วคำนวณให้ตรงกับการใช้ไฟจริง' },
  { title: 'ราคาโปร่งใส', text: 'ใบเสนอราคาแจกแจงรายการอุปกรณ์ ค่าแรง และงวดชำระชัดเจน' },
  { title: 'ครบวงจรในที่เดียว', text: 'ตั้งแต่ออกแบบ ติดตั้ง ไปจนถึงเอกสารการไฟฟ้าและการดูแลระบบ' },
  { title: 'ติดตามงานได้ทุกขั้นตอน', text: 'ทีมงานอัปเดตสถานะและภาพหน้างานก่อนและหลังการติดตั้ง' },
];

export const PROJECTS = [
  { id: 'p1', title: 'ติดตั้ง Solar บ้านพักอาศัย 5.8 kWp', place: 'ปทุมธานี', type: 'บ้านพักอาศัย', kw: 5.8, text: 'ระบบ On-grid สำหรับบ้านสองชั้น ลดค่าไฟช่วงกลางวันที่ใช้เครื่องปรับอากาศ', hue: 'from-sky-300 to-blue-500' },
  { id: 'p2', title: 'โซลาร์รูฟท็อปอาคารสำนักงาน 30 kWp', place: 'นนทบุรี', type: 'อาคารพาณิชย์', kw: 30, text: 'ติดตั้งบนดาดฟ้าอาคาร พร้อมระบบมอนิเตอร์ผลผลิตแบบเรียลไทม์', hue: 'from-emerald-300 to-teal-500' },
  { id: 'p3', title: 'ระบบโซลาร์โรงงานพลาสติก 99 kWp', place: 'สมุทรปราการ', type: 'โรงงาน', kw: 99, text: 'ลดต้นทุนพลังงานในช่วงเวลาผลิต ออกแบบโครงสร้างรองรับหลังคาเมทัลชีท', hue: 'from-indigo-300 to-violet-500' },
  { id: 'p4', title: 'Solar บ้านในหมู่บ้านจัดสรร 4.4 kWp', place: 'กรุงเทพฯ', type: 'บ้านพักอาศัย', kw: 4.4, text: 'จัดวางแผงให้กลมกลืนกับหลังคา คำนึงถึงทิศและร่มเงา', hue: 'from-cyan-300 to-sky-500' },
  { id: 'p5', title: 'โซลาร์ร้านค้าและโกดัง 15 kWp', place: 'ปทุมธานี', type: 'อาคารพาณิชย์', kw: 15, text: 'ระบบขนาดกลางสำหรับธุรกิจที่เปิดทำการช่วงกลางวัน', hue: 'from-amber-300 to-orange-500' },
  { id: 'p6', title: 'ระบบโซลาร์โรงงานอะไหล่ 60 kWp', place: 'ปทุมธานี', type: 'โรงงาน', kw: 60, text: 'วิศวกรออกแบบตามโหลดไฟฟ้าและพื้นที่หลังคาจริง', hue: 'from-fuchsia-300 to-purple-500' },
];

export const TESTIMONIALS = [
  { name: 'คุณสมชาย', role: 'เจ้าของบ้าน ลาดพร้าว', text: 'ทีมงานอธิบายตัวเลขชัดเจน ไม่ขายเกินจริง ติดตั้งเรียบร้อย ค่าไฟลดลงเห็นผลตั้งแต่เดือนแรก' },
  { name: 'คุณนภา', role: 'เจ้าของกิจการ นนทบุรี', text: 'ชอบที่ได้รับอัปเดตสถานะงานและรูปหน้างานตลอด ทำให้มั่นใจว่างานเป็นไปตามแผน' },
  { name: 'คุณวิชัย', role: 'ผู้จัดการโรงงาน สมุทรปราการ', text: 'ช่วยดูแลทั้งงานโครงสร้างและเอกสารการไฟฟ้า ลดภาระของฝ่ายวิศวกรรมเราได้มาก' },
];

export const NEWS = [
  { id: 'n1', date: '12 พ.ย. 2569', tag: 'ความรู้', title: 'ติดตั้งโซลาร์รูฟท็อปต้องเตรียมอะไรบ้าง', text: 'เช็กลิสต์ก่อนติดตั้ง ตั้งแต่โครงสร้างหลังคา ทิศทาง ไปจนถึงมิเตอร์และเอกสาร' },
  { id: 'n2', date: '3 พ.ย. 2569', tag: 'คู่มือ', title: 'ขนาดระบบแค่ไหนจึงเหมาะกับค่าไฟของคุณ', text: 'วิธีประเมินขนาดระบบคร่าว ๆ จากบิลค่าไฟรายเดือน และสิ่งที่ควรถามผู้ติดตั้ง' },
  { id: 'n3', date: '21 ต.ค. 2569', tag: 'บำรุงรักษา', title: 'ดูแลแผงโซลาร์ให้ผลิตไฟได้เต็มประสิทธิภาพ', text: 'การล้างแผง ตรวจสายไฟ และสัญญาณเตือนที่ควรให้ช่างมาตรวจสอบ' },
];

export const PROJECT_TYPES = ['บ้านพักอาศัย', 'อาคารพาณิชย์', 'โรงงาน', 'อื่น ๆ'];
export const BUILDINGS = ['บ้านพักอาศัย', 'อาคารพาณิชย์ / สำนักงาน', 'โรงงาน / อุตสาหกรรม', 'อื่น ๆ'];

// Customer logos shown on the home page. Drop new files in public/clients and add a row here.
export const CLIENTS = [
  { name: 'MG', src: '/clients/mg.png', w: 107, h: 102 },
  { name: '7-Eleven', src: '/clients/7-eleven.png', w: 93, h: 124 },
  { name: 'Cafe Amazon', src: '/clients/cafe-amazon.png', w: 164, h: 124 },
  { name: 'เทศบาล', src: '/clients/seal.png', w: 123, h: 123 },
];
