import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/* ============================================================
   تبدیل تاریخ شمسی <-> میلادی (الگوریتم استاندارد jalaali)
   ============================================================ */
const div = (a, b) => ~~(a / b);
const mod = (a, b) => a - ~~(a / b) * b;
const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

function jalCal(jy) {
  const bl = breaks.length;
  let gy = jy + 621, leapJ = -14, jp = breaks[0], jm, jump, n, i, leap;
  for (i = 1; i < bl; i += 1) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}
function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}
function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}
function j2d(jy, jm, jd) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}
function d2j(jdn) {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f, jm, jd;
  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}
function jalaliToGregorian(jy, jm, jd) {
  const jdn = j2d(jy, jm, jd);
  const { gy, gm, gd } = d2g(jdn);
  return new Date(gy, gm - 1, gd);
}
function gregorianToJalali(date) {
  const jdn = g2d(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return d2j(jdn);
}
const toFa = (num) => String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const JALALI_MONTHS = ['', 'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/* ============================================================
   ثابت‌ها
   ============================================================ */
const EXAM_DATE = jalaliToGregorian(1406, 4, 14);
const YEAR_START = jalaliToGregorian(1406, 1, 1);

const PROVINCES = ['آذربایجان شرقی', 'آذربایجان غربی', 'اردبیل', 'اصفهان', 'البرز', 'ایلام', 'بوشهر', 'تهران', 'چهارمحال و بختیاری', 'خراسان جنوبی', 'خراسان رضوی', 'خراسان شمالی', 'خوزستان', 'زنجان', 'سمنان', 'سیستان و بلوچستان', 'فارس', 'قزوین', 'قم', 'کردستان', 'کرمان', 'کرمانشاه', 'کهگیلویه و بویراحمد', 'گلستان', 'گیلان', 'لرستان', 'مازندران', 'مرکزی', 'هرمزگان', 'همدان', 'یزد'];
const FIELDS = ['تجربی', 'ریاضی', 'انسانی', 'هنر', 'زبان'];
const QUOTAS = ['منطقه ۱', 'منطقه ۲', 'منطقه ۳', 'ایثارگران', 'سایر سهمیه‌ها'];
const INSTITUTES = ['ماز', 'قلم‌چی', 'گزینه دو', 'خیلی سبز', 'گاج', 'سنجش', 'سایر'];
const TEST_BOOKS = ['IQ', 'موج آزمون', 'خیلی سبز', 'مهروماه', 'فاگو', 'گاج', 'میکرو گاج', 'سایر'];
const GRADES = ['دهم', 'یازدهم', 'دوازدهم'];

const SUBJECTS_BY_FIELD = {
  'تجربی': ['زیست', 'شیمی', 'فیزیک', 'ریاضی'],
  'ریاضی': ['ریاضی', 'فیزیک', 'شیمی', 'هندسه'],
  'انسانی': ['ادبیات تخصصی', 'عربی', 'دین و زندگی', 'تاریخ و جغرافیا'],
  'هنر': ['درک عمومی هنر', 'خلاقیت تصویری', 'خواص مواد'],
  'زبان': ['زبان تخصصی', 'گرامر', 'واژگان'],
};
const HIGH_COMPETITION = ['پزشکی', 'دندانپزشکی', 'داروسازی'];
const MED_COMPETITION = ['مهندسی کامپیوتر', 'حقوق', 'روانشناسی', 'دامپزشکی', 'مهندسی برق'];
function targetTierFor(targetFieldText) {
  const t = (targetFieldText || '').trim();
  if (HIGH_COMPETITION.some((k) => t.includes(k))) return [78, 70, 58, 52];
  if (MED_COMPETITION.some((k) => t.includes(k))) return [65, 58, 48, 42];
  return [52, 46, 38, 34];
}
const LEVEL_START = { 'مبتدی': 25, 'متوسط': 40, 'پیشرفته': 55 };

const FINAL_SUBJECTS = {
  'یازدهم': ['دینی', 'زیست', 'شیمی', 'زبان', 'فارسی', 'عربی'],
  'دوازدهم': ['دینی', 'فارسی', 'ریاضی', 'زیست', 'عربی', 'زبان', 'فیزیک', 'هویت اجتماعی', 'شیمی', 'سلامت و بهداشت'],
};

function buildMonthlyPlan(field, targetFieldText, level) {
  const subjects = SUBJECTS_BY_FIELD[field] || SUBJECTS_BY_FIELD['تجربی'];
  const targets = targetTierFor(targetFieldText);
  const startPct = LEVEL_START[level] ?? 35;

  const today = gregorianToJalali(new Date());
  const months = [];
  let jy = today.jy, jm = today.jm;
  let guard = 0;
  while (!(jy === 1406 && jm === 4) && guard < 24) {
    months.push({ jy, jm });
    jm += 1;
    if (jm > 12) { jm = 1; jy += 1; }
    guard += 1;
  }
  months.push({ jy: 1406, jm: 4 });

  const n = months.length;
  return months.map((m, idx) => {
    const ratio = n === 1 ? 1 : idx / (n - 1);
    const values = subjects.map((subj, si) => {
      const target = targets[si] ?? targets[targets.length - 1];
      const pct = Math.round(startPct + (target - startPct) * ratio);
      return { subj, pct };
    });
    return { jy: m.jy, jm: m.jm, label: `${JALALI_MONTHS[m.jm]} ${toFa(m.jy)}`, values, isExam: m.jy === 1406 && m.jm === 4 };
  });
}

/* ============================================================
   المان امضادار: نوار طلوع
   ============================================================ */
function SunArc({ progress, size = 'lg' }) {
  const p = Math.max(0, Math.min(100, progress));
  const big = size === 'lg';
  return (
    <div className={`relative w-full ${big ? 'h-36' : 'h-16'}`}>
      <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="skyline" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5C6AAA" />
            <stop offset="55%" stopColor="#9B8BD4" />
            <stop offset="100%" stopColor="#F5A623" />
          </linearGradient>
        </defs>
        <path d="M0,52 L20,44 L38,50 L55,36 L72,48 L90,32 L110,46 L128,38 L148,50 L165,40 L182,48 L200,42 L200,60 L0,60 Z" fill="#2E3768" opacity="0.85" />
        <line x1="0" y1="46" x2="200" y2="46" stroke="url(#skyline)" strokeWidth="2" strokeLinecap="round" strokeDasharray="1 4" opacity="0.75" />
      </svg>
      <div className="absolute transition-all duration-700 ease-out" style={{ right: `${p}%`, top: big ? '18%' : '10%', transform: 'translate(50%, -50%)' }}>
        <div className={`${big ? 'w-14 h-14' : 'w-6 h-6'} rounded-full`} style={{ background: 'radial-gradient(circle at 35% 30%, #FFE7A8, #F5A623 55%, #E08A1E 100%)', boxShadow: '0 0 30px 6px rgba(245,166,35,0.55)' }} />
      </div>
    </div>
  );
}

/* ============================================================
   صفحه خوش‌آمدگویی
   ============================================================ */
function Welcome({ onStart }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 700);
    return () => clearTimeout(t1);
  }, []);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 100%, #4A3F94 0%, #2E3768 55%, #262F5E 100%)' }}>
      <div className="absolute inset-x-0 bottom-0 h-40 opacity-70" style={{ background: 'linear-gradient(to top, rgba(245,166,35,0.24), transparent)' }} />
      <div className={`transition-all duration-1000 ${phase ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
        <div className="w-24 h-24 mx-auto mb-8 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, #FFE7A8, #F5A623 55%, #E08A1E 100%)', boxShadow: '0 0 60px 14px rgba(245,166,35,0.45)' }} />
        <p style={{ fontFamily: "'Noto Naskh Arabic', serif" }} className="text-2xl md:text-3xl text-[#F7F4EE] leading-relaxed mb-3">
          سلام... به کنکوریار خوش اومدی 🌱
        </p>
        <p className="text-[#CDD3F0] text-base md:text-lg mb-12">از امروز تا روز قبولی کنارت هستیم.</p>
        <button onClick={onStart} className="px-8 py-3 rounded-full font-bold text-[#262F5E] bg-[#F5A623] hover:bg-[#FFC15E] transition-colors shadow-lg">
          بریم شروع کنیم
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   فرم ساخت پروفایل
   ============================================================ */
function ProfileForm({ initial, onSave }) {
  const [data, setData] = useState(initial || {
    name: '', field: FIELDS[0], year: '۱۴۰۶', province: PROVINCES[7], city: '',
    quota: QUOTAS[0], gpa: '', targetUniversity: '', targetCity: '', targetField: '', institute: INSTITUTES[0],
  });
  const [error, setError] = useState('');
  const set = (k) => (e) => setData((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!data.name.trim()) { setError('لطفاً نامت رو وارد کن.'); return; }
    setError('');
    onSave(data);
  };

  const inputCls = "w-full rounded-xl px-4 py-3 bg-[#333D74] text-[#F7F4EE] placeholder-[#9AA3CC] border border-[#4A5890] focus:border-[#F5A623] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 transition";
  const labelCls = "block text-sm text-[#CDD3F0] mb-1.5";

  return (
    <div className="min-h-screen px-5 py-10" style={{ background: '#262F5E' }}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-extrabold text-[#F7F4EE] mb-1">بریم پروفایلت رو بسازیم</h1>
        <p className="text-[#CDD3F0] mb-8 text-sm">این اطلاعات کمک می‌کنه برنامه‌ات دقیق‌تر و شخصی‌تر بشه.</p>

        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className={labelCls}>نام</label>
            <input className={inputCls} value={data.name} onChange={set('name')} placeholder="مثلاً سارا" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>رشته</label>
              <select className={inputCls} value={data.field} onChange={set('field')}>
                {FIELDS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>سال کنکور</label>
              <div className={`${inputCls} flex items-center justify-between cursor-not-allowed opacity-80`}>
                <span>۱۴۰۶</span>
              </div>
              <p className="text-[11px] text-[#9AA3CC] mt-1">فعلاً فقط کنکور ۱۴۰۶ پشتیبانی میشه — سال‌های بعد به‌زودی اضافه میشن.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>استان</label>
              <select className={inputCls} value={data.province} onChange={set('province')}>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>شهر محل زندگی</label>
              <input className={inputCls} value={data.city} onChange={set('city')} placeholder="مثلاً کرج" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>سهمیه</label>
              <select className={inputCls} value={data.quota} onChange={set('quota')}>
                {QUOTAS.map((q) => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>معدل</label>
              <input type="number" step="0.01" min="0" max="20" className={inputCls} value={data.gpa} onChange={set('gpa')} placeholder="مثلاً ۱۸.۵۰" />
            </div>
          </div>

          <div className="pt-2 border-t border-[#4A5890]" />

          <div>
            <label className={labelCls}>دانشگاه هدف</label>
            <input className={inputCls} value={data.targetUniversity} onChange={set('targetUniversity')} placeholder="مثلاً دانشگاه علوم پزشکی تبریز" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>شهر دانشگاه</label>
              <input className={inputCls} value={data.targetCity} onChange={set('targetCity')} placeholder="مثلاً تبریز" />
            </div>
            <div>
              <label className={labelCls}>رشته هدف</label>
              <input className={inputCls} value={data.targetField} onChange={set('targetField')} placeholder="مثلاً پزشکی" />
            </div>
          </div>

          <div>
            <label className={labelCls}>مؤسسه آزمون</label>
            <select className={inputCls} value={data.institute} onChange={set('institute')}>
              {INSTITUTES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-[#FF9478] text-sm mt-4">{error}</p>}

        <button onClick={submit} className="w-full mt-8 py-3.5 rounded-xl font-bold text-[#262F5E] bg-[#F5A623] hover:bg-[#FFC15E] transition-colors shadow-lg">
          ثبت پروفایل و ورود به داشبورد
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   کارت‌های داشبورد
   ============================================================ */
function ComingSoonCard({ title, hint }) {
  return (
    <div className="rounded-2xl p-5 bg-[#2E3768] border border-[#4A5890] border-dashed">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-[#F7F4EE]">{title}</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4A5890] text-[#CDD3F0]">به‌زودی</span>
      </div>
      <p className="text-sm text-[#9AA3CC]">{hint}</p>
    </div>
  );
}
function MiniStatCard({ title, value, hint }) {
  return (
    <div className="rounded-2xl p-5 bg-[#2E3768] border border-[#4A5890]">
      <p className="text-sm text-[#CDD3F0] mb-1">{title}</p>
      <p className="text-2xl font-extrabold text-[#F5A623] mb-1">{value}</p>
      <p className="text-xs text-[#9AA3CC]">{hint}</p>
    </div>
  );
}

function ActiveCard({ title, hint, onClick, wide }) {
  return (
    <button onClick={onClick} className={`text-right rounded-2xl p-5 bg-[#333D74] border border-[#F5A623]/40 hover:border-[#F5A623] transition-colors ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-[#F7F4EE]">{title}</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5A623] text-[#262F5E] font-bold">فعال</span>
      </div>
      <p className="text-sm text-[#CDD3F0]">{hint}</p>
    </button>
  );
}

/* ============================================================
   داشبورد
   ============================================================ */
function Dashboard({ profile, exams, sheets, tasksByDate, onEdit, onOpenGoals, onOpenExams, onOpenSimulator, onOpenTestSheet, onOpenBudget, onOpenResources, onOpenTasks, onOpenMood, onOpenCharts, onOpenMotivation }) {
  const msPerDay = 86400000;
  const examMidnight = new Date(EXAM_DATE); examMidnight.setHours(0, 0, 0, 0);
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.round((examMidnight - todayMidnight) / msPerDay));
  const totalSpan = EXAM_DATE - YEAR_START;
  const elapsed = new Date() - YEAR_START;
  const progress = Math.max(0, Math.min(100, (elapsed / totalSpan) * 100));
  const lastExam = exams && exams.length ? exams[0] : null;

  const todayTestsCount = (sheets || []).filter((s) => s.dateLabel === todayJalaliLabel()).length;
  const todayTasks = (tasksByDate || {})[todayJalaliKey()] || [];
  const todayTaskPct = todayTasks.length ? Math.round((todayTasks.filter((t) => t.done).length / todayTasks.length) * 100) : null;

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#F7F4EE] text-lg">سلام {profile.name || 'همراه عزیز'} 👋</p>
            <button onClick={onEdit} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] underline underline-offset-2">ویرایش پروفایل</button>
          </div>
          <p className="text-[#CDD3F0] text-sm mb-4">
            هدف: {profile.targetField || 'رشته هدف'} {profile.targetUniversity ? `— ${profile.targetUniversity}` : ''}
          </p>

          <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[#CDD3F0] text-sm">تا کنکور {profile.year || '۱۴۰۶'}</span>
              <span className="text-[#F5A623] font-extrabold text-2xl">{toFa(daysLeft)} <span className="text-sm font-normal text-[#CDD3F0]">روز</span></span>
            </div>
            <SunArc progress={progress} size="sm" />
            <div className="flex justify-between text-[10px] text-[#9AA3CC] mt-1">
              <span>ابتدای سال ۱۴۰۶</span>
              <span>۱۴ تیر ۱۴۰۶</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-6 grid grid-cols-2 gap-3 grid-flow-row-dense">
        <ActiveCard wide title="سیستم هدف‌گذاری هوشمند" hint="درصدهای هدف هر درس + برنامه ماهانه تا روز کنکور" onClick={onOpenGoals} />

        <button onClick={onOpenExams} className="col-span-2 text-right rounded-2xl p-5 bg-[#333D74] border border-[#F5A623]/40 hover:border-[#F5A623] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-[#F7F4EE]">تحلیل آزمون‌های آزمایشی</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5A623] text-[#262F5E] font-bold">فعال</span>
          </div>
          {lastExam ? (
            <p className="text-sm text-[#CDD3F0]">
              آخرین آزمون: {lastExam.institute} — میانگین <b className="text-[#F5A623]">{toFa(lastExam.avg)}٪</b>
            </p>
          ) : (
            <p className="text-sm text-[#CDD3F0]">هنوز آزمونی ثبت نکردی — همینجا شروع کن.</p>
          )}
        </button>

        <ActiveCard wide title="شبیه‌ساز رتبه" hint="با تغییر درصدها، تراز و وضعیت قبولی رو لحظه‌ای ببین" onClick={onOpenSimulator} />

        <ActiveCard wide title="تست‌برگ" hint="کتاب تست رو انتخاب کن، تعداد صحیح و غلط رو ثبت کن، درصد خودکار حساب میشه" onClick={onOpenTestSheet} />

        <ActiveCard wide title="بودجه‌بندی آزمون‌ها" hint="فصل‌های هر آزمون رو به تفکیک مؤسسه، درس و پایه ثبت کن" onClick={onOpenBudget} />

        <ActiveCard wide title="مدیریت منابع" hint="کتاب‌هات رو ثبت کن: درصد پیشرفت، صفحات و جلسات باقی‌مانده" onClick={onOpenResources} />

        <MiniStatCard title="تعداد تست امروز" value={toFa(todayTestsCount)} hint={todayTestsCount > 0 ? 'از تست‌برگ‌های امروز' : 'هنوز امروز تست‌برگی ثبت نکردی'} />
        <MiniStatCard title="درصد انجام برنامه" value={todayTaskPct === null ? '—' : `${toFa(todayTaskPct)}٪`} hint={todayTaskPct === null ? 'هنوز کاری برای امروز اضافه نکردی' : 'از کارهای روزانه‌ی امروز'} />
        <ComingSoonCard title="ساعت مطالعه امروز" hint="ثبت و رصد ساعت مطالعه روزانه" />
        <ActiveCard wide title="نمودارهای کلی" hint="روند درصد آزمون‌ها، پیشرفت هر درس، رتبه، تست‌برگ‌ها و کارهای روزانه" onClick={onOpenCharts} />
        <ActiveCard wide title="سیستم انگیزشی" hint="استریک، سطح و XP، مأموریت روزانه/هفتگی و دستاوردها" onClick={onOpenMotivation} />
        <ComingSoonCard title="مرورهای امروز" hint="لیست مباحثی که باید مرور شوند" />
        <ActiveCard title="کارهای روزانه" hint="حداکثر ۱۰ کار برای امروز" onClick={onOpenTasks} />
        <ActiveCard title="وضعیت روحیه" hint="ثبت شبانه‌ی رضایت، تمرکز و استرس" onClick={onOpenMood} />
      </div>

      <p className="text-center text-[#9AA3CC] text-xs mt-8">
        همه‌ی مراحل اصلی ساخته شدن 🌱 قدم بعدی هرچی خودت بخوای.
      </p>
    </div>
  );
}

/* ============================================================
   سیستم هدف‌گذاری هوشمند
   ============================================================ */
function GoalPlanner({ profile, level, onChangeLevel, onBack }) {
  const plan = buildMonthlyPlan(profile.field, profile.targetField, level);
  const finalTargets = plan[plan.length - 1].values;
  const startPct = LEVEL_START[level] ?? 35;

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] mb-3">← بازگشت به داشبورد</button>
          <h1 className="text-xl font-extrabold text-[#F7F4EE] mb-1">هدف‌گذاری هوشمند</h1>
          <p className="text-[#CDD3F0] text-sm">
            هدف تو: <span className="text-[#F5A623] font-bold">{profile.targetField || 'رشته هدف'}</span>
            {profile.targetUniversity ? <> — {profile.targetUniversity}</> : null}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5">
        <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-2">
          <p className="text-sm text-[#CDD3F0] mb-3">سطح فعلی‌ت رو انتخاب کن تا برنامه‌ی ماهانه دقیق‌تر بشه:</p>
          <div className="flex gap-2">
            {['مبتدی', 'متوسط', 'پیشرفته'].map((lv) => (
              <button key={lv} onClick={() => onChangeLevel(lv)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${level === lv ? 'bg-[#F5A623] text-[#262F5E]' : 'bg-[#333D74] text-[#CDD3F0] border border-[#4A5890]'}`}>
                {lv}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[#333D74] border border-[#F5A623]/40 p-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-[#CDD3F0] mb-1">نقطه‌ی شروع بر اساس سطح «{level}»</p>
            <p className="text-xs text-[#9AA3CC]">همه‌ی درس‌ها از این درصد شروع می‌شن و طی برنامه‌ی ماهانه به هدف نهایی می‌رسن.</p>
          </div>
          <p className="text-3xl font-extrabold text-[#F5A623] shrink-0 mr-3">{toFa(startPct)}٪</p>
        </div>

        <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-5">
          <p className="text-xs text-[#9AA3CC] leading-relaxed">
            ⚠️ این اعداد یک برآورد اولیه‌ست، نه داده‌ی واقعی کارنامه‌های سال‌های قبل. وقتی داده‌ی واقعی قبولی‌ها در دسترس باشه، همین موتور رو بهش وصل می‌کنیم تا دقیق‌تر بشه.
          </p>
        </div>

        <h2 className="text-[#F7F4EE] font-bold mb-1">درصد هدف نهایی (تا ۱۴ تیر ۱۴۰۶)</h2>
        <p className="text-xs text-[#9AA3CC] mb-3">این عدد‌ها بر اساس رقابت رشته‌ی هدفت ثابته — با تغییر سطح فعلی عوض نمی‌شه، فقط سرعت رسیدنت بهش (توی برنامه‌ی ماهانه پایین) تغییر می‌کنه.</p>
        <div className="grid grid-cols-2 gap-3 mb-8">
          {finalTargets.map((v) => (
            <div key={v.subj} className="rounded-xl bg-[#2E3768] border border-[#4A5890] p-4">
              <p className="text-sm text-[#CDD3F0] mb-1">{v.subj}</p>
              <p className="text-2xl font-extrabold text-[#F5A623]">{toFa(v.pct)}٪</p>
            </div>
          ))}
        </div>

        <h2 className="text-[#F7F4EE] font-bold mb-3">برنامه ماهانه</h2>
        <div className="space-y-2">
          {plan.map((m, idx) => (
            <div key={idx} className={`rounded-xl p-3.5 border ${m.isExam ? 'bg-[#F5A623]/10 border-[#F5A623]' : 'bg-[#2E3768] border-[#4A5890]'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${m.isExam ? 'text-[#F5A623]' : 'text-[#F7F4EE]'}`}>{m.label}{m.isExam ? ' 🎯 روز کنکور' : ''}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {m.values.map((v) => (
                  <span key={v.subj} className="text-xs px-2.5 py-1 rounded-full bg-[#333D74] text-[#CDD3F0]">
                    {v.subj}: <b className="text-[#F7F4EE]">{toFa(v.pct)}٪</b>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   تحلیل آزمون‌های آزمایشی
   ============================================================ */
function analyzeExam(exam, entry, profile) {
  const targetAvg = Math.round(entry.values.reduce((s, v) => s + v.pct, 0) / entry.values.length);
  const actualAvg = exam.avg;
  const diff = actualAvg - targetAvg;
  let weakest = null;
  entry.values.forEach((tv) => {
    const actual = exam.percentages[tv.subj] ?? 0;
    const d = actual - tv.pct;
    if (!weakest || d < weakest.d) weakest = { subj: tv.subj, d };
  });
  return { targetAvg, actualAvg, diff, weakest };
}

function ExamForm({ profile, onCancel, onSave }) {
  const subjects = SUBJECTS_BY_FIELD[profile.field] || SUBJECTS_BY_FIELD['تجربی'];
  const today = gregorianToJalali(new Date());
  const [institute, setInstitute] = useState(profile.institute || INSTITUTES[0]);
  const [jy, setJy] = useState(today.jy);
  const [jm, setJm] = useState(today.jm);
  const [scope, setScope] = useState('');
  const [percentages, setPercentages] = useState(Object.fromEntries(subjects.map((s) => [s, ''])));
  const [rank, setRank] = useState('');
  const [error, setError] = useState('');

  const inputCls = "w-full rounded-xl px-4 py-3 bg-[#333D74] text-[#F7F4EE] placeholder-[#9AA3CC] border border-[#4A5890] focus:border-[#F5A623] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 transition";
  const labelCls = "block text-sm text-[#CDD3F0] mb-1.5";

  const submit = () => {
    const vals = subjects.map((s) => Number(percentages[s]));
    if (subjects.some((s) => percentages[s] === '' || Number.isNaN(Number(percentages[s])))) {
      setError('درصد همه‌ی درس‌ها رو وارد کن.');
      return;
    }
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    onSave({
      id: Date.now(),
      institute, jy, jm, scope,
      percentages: Object.fromEntries(subjects.map((s) => [s, Number(percentages[s])])),
      avg,
      rank: rank ? Number(rank) : null,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-5">
      <h3 className="font-bold text-[#F7F4EE] mb-3">ثبت آزمون جدید</h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>مؤسسه</label>
          <select className={inputCls} value={institute} onChange={(e) => setInstitute(e.target.value)}>
            {INSTITUTES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>ماه آزمون</label>
          <select className={inputCls} value={`${jy}-${jm}`} onChange={(e) => { const [y, m] = e.target.value.split('-').map(Number); setJy(y); setJm(m); }}>
            {[jy - 1, jy].flatMap((y) => JALALI_MONTHS.slice(1).map((_, i) => ({ y, m: i + 1 })))
              .filter((o) => jalaliToGregorian(o.y, o.m, 1) <= new Date() && jalaliToGregorian(o.y, o.m, 1) >= jalaliToGregorian(1404, 7, 1))
              .map((o) => (
                <option key={`${o.y}-${o.m}`} value={`${o.y}-${o.m}`}>{JALALI_MONTHS[o.m]} {toFa(o.y)}</option>
              ))}
          </select>
        </div>
      </div>
      <div className="mb-3">
        <label className={labelCls}>بودجه‌بندی (اختیاری)</label>
        <input className={inputCls} value={scope} onChange={(e) => setScope(e.target.value)} placeholder="مثلاً فصل ۱ تا ۴ زیست" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {subjects.map((s) => (
          <div key={s}>
            <label className={labelCls}>{s} ٪</label>
            <input type="number" min="0" max="100" className={inputCls} value={percentages[s]} onChange={(e) => setPercentages((p) => ({ ...p, [s]: e.target.value }))} placeholder="۰-۱۰۰" />
          </div>
        ))}
      </div>
      <div className="mb-3">
        <label className={labelCls}>رتبه (اختیاری)</label>
        <input type="number" className={inputCls} value={rank} onChange={(e) => setRank(e.target.value)} placeholder="مثلاً ۴۵۰۰" />
      </div>
      {error && <p className="text-[#FF9478] text-sm mb-3">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} className="flex-1 py-3 rounded-xl font-bold text-[#262F5E] bg-[#F5A623] hover:bg-[#FFC15E] transition-colors">ثبت و تحلیل</button>
        <button onClick={onCancel} className="px-5 py-3 rounded-xl font-bold text-[#CDD3F0] bg-[#333D74] border border-[#4A5890]">انصراف</button>
      </div>
    </div>
  );
}

function ExamAnalyzer({ profile, level, exams, onAdd, onBack }) {
  const [showForm, setShowForm] = useState(exams.length === 0);
  const plan = buildMonthlyPlan(profile.field, profile.targetField, level);

  const findEntry = (jy, jm) => plan.find((p) => p.jy === jy && p.jm === jm) || plan[0];

  const chartData = [...exams].slice().reverse().map((e, i) => ({ name: `آزمون ${toFa(i + 1)}`, avg: e.avg }));

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] mb-3">← بازگشت به داشبورد</button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-[#F7F4EE]">تحلیل آزمون‌های آزمایشی</h1>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="text-xs px-3 py-1.5 rounded-full bg-[#F5A623] text-[#262F5E] font-bold">+ آزمون جدید</button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5">
        {showForm && (
          <ExamForm profile={profile} onCancel={() => setShowForm(false)}
            onSave={(exam) => { onAdd(exam); setShowForm(false); }} />
        )}

        {exams.length > 1 && (
          <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-5">
            <h3 className="font-bold text-[#F7F4EE] mb-3 text-sm">روند میانگین درصد</h3>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5890" />
                  <XAxis dataKey="name" tick={{ fill: '#9AA3CC', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#9AA3CC', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#333D74', border: '1px solid #4A5890', borderRadius: 8, color: '#F7F4EE' }} />
                  <Line type="monotone" dataKey="avg" stroke="#F5A623" strokeWidth={2.5} dot={{ fill: '#F5A623', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <h2 className="text-[#F7F4EE] font-bold mb-3">سوابق آزمون</h2>
        {exams.length === 0 && !showForm && (
          <p className="text-sm text-[#9AA3CC]">هنوز آزمونی ثبت نشده.</p>
        )}
        <div className="space-y-3">
          {exams.map((exam) => {
            const entry = findEntry(exam.jy, exam.jm);
            const a = analyzeExam(exam, entry, profile);
            const good = a.diff >= 0;
            return (
              <div key={exam.id} className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-[#F7F4EE]">{exam.institute} — {JALALI_MONTHS[exam.jm]} {toFa(exam.jy)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${good ? 'bg-[#5FA777] text-[#0E1530]' : 'bg-[#E4634E] text-white'}`}>
                    {good ? '✅ عالی' : '❌ زیر برنامه'}
                  </span>
                </div>
                {exam.scope && <p className="text-xs text-[#9AA3CC] mb-2">بودجه‌بندی: {exam.scope}</p>}
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(exam.percentages).map(([subj, pct]) => (
                    <span key={subj} className="text-xs px-2.5 py-1 rounded-full bg-[#333D74] text-[#CDD3F0]">{subj}: <b className="text-[#F7F4EE]">{toFa(pct)}٪</b></span>
                  ))}
                </div>
                <p className="text-xs text-[#CDD3F0] mb-1">میانگین: <b className="text-[#F5A623]">{toFa(a.actualAvg)}٪</b> (هدف این ماه: {toFa(a.targetAvg)}٪){exam.rank ? <> — رتبه: {toFa(exam.rank)}</> : null}</p>
                <p className="text-xs text-[#9AA3CC] leading-relaxed mt-2">
                  {good
                    ? `عالی بود. اگر این روند رو حفظ کنی، احتمال قبولی ${profile.targetField || 'هدف‌ت'}${profile.targetUniversity ? ' در ' + profile.targetUniversity : ''} بیشتر می‌شه.`
                    : `این آزمون پایین‌تر از برنامه بود. پیشنهاد می‌شه روی «${a.weakest.subj}» بیشتر کار کنی — روزی چند تست بیشتر و مرور فصل‌های ضعیف.`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   شبیه‌ساز رتبه
   ============================================================ */
function RankSimulator({ profile, level, onBack }) {
  const plan = buildMonthlyPlan(profile.field, profile.targetField, level);
  const finalTargets = plan[plan.length - 1].values;
  const subjects = SUBJECTS_BY_FIELD[profile.field] || SUBJECTS_BY_FIELD['تجربی'];
  const [values, setValues] = useState(Object.fromEntries(finalTargets.map((v) => [v.subj, v.pct])));
  const [activeGrade, setActiveGrade] = useState('دوازدهم');
  const [finalGrades, setFinalGrades] = useState(() => {
    const init = {};
    Object.entries(FINAL_SUBJECTS).forEach(([grade, subs]) => {
      subs.forEach((s) => { init[`${grade}__${s}`] = 17; });
    });
    return init;
  });

  const avg = Math.round(subjects.reduce((s, subj) => s + (Number(values[subj]) || 0), 0) / subjects.length);

  const allGradeKeys = Object.keys(finalGrades);
  const schoolAvg20 = allGradeKeys.length
    ? allGradeKeys.reduce((s, k) => s + (Number(finalGrades[k]) || 0), 0) / allGradeKeys.length
    : 0;
  const schoolPercent = Math.round((schoolAvg20 / 20) * 100);

  const composite = Math.round(avg * 0.7 + schoolPercent * 0.3);

  const tier = targetTierFor(profile.targetField);
  const tierAvg = Math.round(tier.reduce((a, b) => a + b, 0) / tier.length);
  const diff = composite - tierAvg;
  const tarazEstimate = Math.round(3000 + (composite / 100) * 6500);

  let probLabel = 'متوسط', probColor = '#F5A623';
  if (diff >= 10) { probLabel = 'بسیار خوب'; probColor = '#5FA777'; }
  else if (diff >= 0) { probLabel = 'خوب'; probColor = '#F5A623'; }
  else if (diff >= -12) { probLabel = 'در مرز'; probColor = '#F5A623'; }
  else { probLabel = 'نیازمند تلاش بیشتر'; probColor = '#E4634E'; }

  const reset = () => setValues(Object.fromEntries(finalTargets.map((v) => [v.subj, v.pct])));

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] mb-3">← بازگشت به داشبورد</button>
          <h1 className="text-xl font-extrabold text-[#F7F4EE] mb-1">شبیه‌ساز رتبه</h1>
          <p className="text-[#CDD3F0] text-sm">درصدها و نمرات نهایی رو جابه‌جا کن و ببین وضعیتت نسبت به هدفت چطور تغییر می‌کنه.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5">
        <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-5">
          <p className="text-xs text-[#9AA3CC] leading-relaxed">
            ⚠️ این عدد‌ها یک شبیه‌سازی نسبی‌ان برای اینکه حس کنی هر درس (و سوابق تحصیلی) چقدر روی نتیجه اثر داره — نه رتبه یا تراز واقعی سازمان سنجش، چون به داده‌ی واقعی کارنامه‌ها دسترسی ندارم. وزن ترکیب (٪۷۰ کنکور / ٪۳۰ سوابق تحصیلی) هم فقط یک فرض ساده‌ست.
          </p>
        </div>

        <h2 className="text-[#F7F4EE] font-bold mb-3">درصد دروس کنکور</h2>
        <div className="space-y-5 mb-6">
          {subjects.map((subj) => (
            <div key={subj}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-[#F7F4EE] font-bold">{subj}</span>
                <span className="text-sm text-[#F5A623] font-bold">{toFa(values[subj] ?? 0)}٪</span>
              </div>
              <input
                type="range" min="0" max="100" value={values[subj] ?? 0}
                onChange={(e) => setValues((v) => ({ ...v, [subj]: Number(e.target.value) }))}
                className="w-full accent-[#F5A623]"
                style={{ accentColor: '#F5A623' }}
              />
            </div>
          ))}
        </div>

        <button onClick={reset} className="text-xs text-[#9AA3CC] hover:text-[#F5A623] mb-6 underline underline-offset-2">
          بازگشت به درصدهای هدف
        </button>

        <h2 className="text-[#F7F4EE] font-bold mb-1">نمرات نهایی (سوابق تحصیلی)</h2>
        <p className="text-xs text-[#9AA3CC] mb-3">سوابق تحصیلی هم مستقیم روی نتیجه‌ی کنکور اثر داره — نمره‌ی هر درس رو از ۲۰ وارد کن.</p>

        <div className="flex gap-2 mb-4">
          {Object.keys(FINAL_SUBJECTS).map((g) => (
            <button key={g} onClick={() => setActiveGrade(g)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${activeGrade === g ? 'bg-[#F5A623] text-[#262F5E]' : 'bg-[#333D74] text-[#CDD3F0] border border-[#4A5890]'}`}>
              پایه {g}
            </button>
          ))}
        </div>

        <div className="space-y-4 mb-6">
          {FINAL_SUBJECTS[activeGrade].map((subj) => {
            const key = `${activeGrade}__${subj}`;
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#F7F4EE] font-bold">{subj}</span>
                  <span className="text-sm text-[#F5A623] font-bold">{toFa(finalGrades[key] ?? 0)} از ۲۰</span>
                </div>
                <input
                  type="range" min="0" max="20" step="0.25" value={finalGrades[key] ?? 0}
                  onChange={(e) => setFinalGrades((f) => ({ ...f, [key]: Number(e.target.value) }))}
                  className="w-full accent-[#F5A623]"
                  style={{ accentColor: '#F5A623' }}
                />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl bg-[#2E3768] border border-[#4A5890] p-3">
            <p className="text-xs text-[#CDD3F0] mb-1">میانگین کنکور</p>
            <p className="text-xl font-extrabold text-[#F7F4EE]">{toFa(avg)}٪</p>
          </div>
          <div className="rounded-xl bg-[#2E3768] border border-[#4A5890] p-3">
            <p className="text-xs text-[#CDD3F0] mb-1">سوابق تحصیلی</p>
            <p className="text-xl font-extrabold text-[#F7F4EE]">{toFa(schoolPercent)}٪</p>
          </div>
          <div className="rounded-xl bg-[#333D74] border border-[#F5A623]/40 p-3">
            <p className="text-xs text-[#CDD3F0] mb-1">نمره ترکیبی</p>
            <p className="text-xl font-extrabold text-[#F5A623]">{toFa(composite)}٪</p>
          </div>
        </div>

        <div className="rounded-xl bg-[#2E3768] border border-[#4A5890] p-4 mb-4">
          <p className="text-sm text-[#CDD3F0] mb-1">تراز تخمینی</p>
          <p className="text-2xl font-extrabold text-[#F7F4EE]">{toFa(tarazEstimate)}</p>
        </div>

        <div className="rounded-2xl p-4 border" style={{ background: `${probColor}22`, borderColor: probColor }}>
          <p className="text-sm text-[#CDD3F0] mb-1">وضعیت نسبت به هدف «{profile.targetField || 'رشته هدف'}»</p>
          <p className="text-lg font-extrabold" style={{ color: probColor }}>{probLabel}</p>
          <p className="text-xs text-[#CDD3F0] mt-2">
            {diff >= 0
              ? `${toFa(Math.abs(diff))} درصد بالاتر از میانگین هدف‌گذاری‌شده‌ای.`
              : `${toFa(Math.abs(diff))} درصد پایین‌تر از میانگین هدف‌گذاری‌شده‌ای.`}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   صفحه تست‌برگ
   ============================================================ */
function computePercent(total, correct, wrong) {
  const t = Number(total), c = Number(correct), w = Number(wrong);
  if (!t || t <= 0) return null;
  return Math.round(((c - w / 3) / t) * 100);
}

function TestSheetForm({ profile, onCancel, onSave }) {
  const subjects = SUBJECTS_BY_FIELD[profile.field] || SUBJECTS_BY_FIELD['تجربی'];
  const [book, setBook] = useState(TEST_BOOKS[0]);
  const [customBook, setCustomBook] = useState('');
  const [subject, setSubject] = useState(subjects[0]);
  const [chapter, setChapter] = useState('');
  const [total, setTotal] = useState('');
  const [correct, setCorrect] = useState('');
  const [wrong, setWrong] = useState('');
  const [error, setError] = useState('');

  const inputCls = "w-full rounded-xl px-4 py-3 bg-[#333D74] text-[#F7F4EE] placeholder-[#9AA3CC] border border-[#4A5890] focus:border-[#F5A623] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 transition";
  const labelCls = "block text-sm text-[#CDD3F0] mb-1.5";

  const percent = computePercent(total, correct || 0, wrong || 0);
  const unanswered = total !== '' ? Math.max(0, Number(total) - Number(correct || 0) - Number(wrong || 0)) : null;

  const submit = () => {
    const t = Number(total), c = Number(correct || 0), w = Number(wrong || 0);
    if (!t || t <= 0) { setError('تعداد کل تست رو وارد کن.'); return; }
    if (c + w > t) { setError('مجموع صحیح و غلط نمی‌تونه از کل تست بیشتر باشه.'); return; }
    setError('');
    const today = gregorianToJalali(new Date());
    onSave({
      id: Date.now(),
      book: book === 'سایر' ? (customBook.trim() || 'سایر') : book,
      subject, chapter,
      total: t, correct: c, wrong: w,
      percent: computePercent(t, c, w),
      dateLabel: `${JALALI_MONTHS[today.jm]} ${toFa(today.jd)}`,
    });
  };

  return (
    <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-5">
      <h3 className="font-bold text-[#F7F4EE] mb-3">ثبت تست‌برگ جدید</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>کتاب تست</label>
          <select className={inputCls} value={book} onChange={(e) => setBook(e.target.value)}>
            {TEST_BOOKS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>درس</label>
          <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {book === 'سایر' && (
        <div className="mb-3">
          <label className={labelCls}>نام کتاب</label>
          <input className={inputCls} value={customBook} onChange={(e) => setCustomBook(e.target.value)} placeholder="مثلاً نشر الگو" />
        </div>
      )}

      <div className="mb-3">
        <label className={labelCls}>فصل / مبحث (اختیاری)</label>
        <input className={inputCls} value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="مثلاً فصل ۳ - ژنتیک" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-2">
        <div>
          <label className={labelCls}>کل تست</label>
          <input type="number" min="1" className={inputCls} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="۲۰" />
        </div>
        <div>
          <label className={labelCls}>صحیح</label>
          <input type="number" min="0" className={inputCls} value={correct} onChange={(e) => setCorrect(e.target.value)} placeholder="۱۴" />
        </div>
        <div>
          <label className={labelCls}>غلط</label>
          <input type="number" min="0" className={inputCls} value={wrong} onChange={(e) => setWrong(e.target.value)} placeholder="۳" />
        </div>
      </div>

      <p className="text-xs text-[#9AA3CC] mb-3">
        {unanswered !== null ? `پاسخ‌نزده: ${toFa(unanswered)}` : ''}
        {percent !== null ? ` — درصد: ` : ''}
        {percent !== null && <b className="text-[#F5A623]">{toFa(percent)}٪</b>}
      </p>

      {error && <p className="text-[#FF9478] text-sm mb-3">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submit} className="flex-1 py-3 rounded-xl font-bold text-[#262F5E] bg-[#F5A623] hover:bg-[#FFC15E] transition-colors">ثبت</button>
        <button onClick={onCancel} className="px-5 py-3 rounded-xl font-bold text-[#CDD3F0] bg-[#333D74] border border-[#4A5890]">انصراف</button>
      </div>
    </div>
  );
}

function TestSheetPage({ profile, sheets, onAdd, onDelete, onBack }) {
  const [showForm, setShowForm] = useState(sheets.length === 0);
  const avg = sheets.length ? Math.round(sheets.reduce((s, x) => s + x.percent, 0) / sheets.length) : null;

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] mb-3">← بازگشت به داشبورد</button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-[#F7F4EE]">تست‌برگ</h1>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="text-xs px-3 py-1.5 rounded-full bg-[#F5A623] text-[#262F5E] font-bold">+ تست‌برگ جدید</button>
            )}
          </div>
          {avg !== null && <p className="text-[#CDD3F0] text-sm mt-1">میانگین کل: <b className="text-[#F5A623]">{toFa(avg)}٪</b> از {toFa(sheets.length)} تست‌برگ</p>}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5">
        {showForm && (
          <TestSheetForm profile={profile} onCancel={() => setShowForm(false)} onSave={(s) => { onAdd(s); setShowForm(false); }} />
        )}

        <h2 className="text-[#F7F4EE] font-bold mb-3">سوابق تست‌برگ</h2>
        {sheets.length === 0 && !showForm && <p className="text-sm text-[#9AA3CC]">هنوز تست‌برگی ثبت نشده.</p>}

        <div className="space-y-2">
          {sheets.map((s) => (
            <div key={s.id} className="rounded-xl bg-[#2E3768] border border-[#4A5890] p-3.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-[#F7F4EE]">{s.book} — {s.subject}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-extrabold ${s.percent >= 50 ? 'text-[#5FA777]' : s.percent >= 0 ? 'text-[#F5A623]' : 'text-[#E4634E]'}`}>{toFa(s.percent)}٪</span>
                  <button onClick={() => onDelete(s.id)} className="text-[#9AA3CC] hover:text-[#E4634E] text-xs">✕</button>
                </div>
              </div>
              {s.chapter && <p className="text-xs text-[#9AA3CC] mb-1">{s.chapter}</p>}
              <p className="text-xs text-[#CDD3F0]">
                کل {toFa(s.total)} — صحیح {toFa(s.correct)} — غلط {toFa(s.wrong)} · {s.dateLabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   بودجه‌بندی آزمون‌ها (ورود دستی توسط کاربر)
   ============================================================ */
function BudgetForm({ profile, onCancel, onSave }) {
  const subjects = [...(SUBJECTS_BY_FIELD[profile.field] || SUBJECTS_BY_FIELD['تجربی']), 'سایر'];
  const [institute, setInstitute] = useState(INSTITUTES[0]);
  const [examLabel, setExamLabel] = useState('');
  const [grade, setGrade] = useState(GRADES[2]);
  const [subject, setSubject] = useState(subjects[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [chapterInput, setChapterInput] = useState('');
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState('');

  const inputCls = "w-full rounded-xl px-4 py-3 bg-[#333D74] text-[#F7F4EE] placeholder-[#9AA3CC] border border-[#4A5890] focus:border-[#F5A623] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 transition";
  const labelCls = "block text-sm text-[#CDD3F0] mb-1.5";

  const addChapter = () => {
    const v = chapterInput.trim();
    if (!v) return;
    setChapters((c) => [...c, v]);
    setChapterInput('');
  };
  const removeChapter = (idx) => setChapters((c) => c.filter((_, i) => i !== idx));

  const submit = () => {
    if (!examLabel.trim()) { setError('یک نام برای آزمون بذار (مثلاً «آزمون ۵ - آبان»).'); return; }
    if (chapters.length === 0) { setError('حداقل یک فصل یا مبحث اضافه کن.'); return; }
    setError('');
    const today = gregorianToJalali(new Date());
    onSave({
      id: Date.now(),
      institute, examLabel: examLabel.trim(), grade,
      subject: subject === 'سایر' ? (customSubject.trim() || 'سایر') : subject,
      chapters,
      dateLabel: `${JALALI_MONTHS[today.jm]} ${toFa(today.jd)}`,
    });
  };

  return (
    <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-5">
      <h3 className="font-bold text-[#F7F4EE] mb-3">ثبت بودجه‌بندی جدید</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>مؤسسه</label>
          <select className={inputCls} value={institute} onChange={(e) => setInstitute(e.target.value)}>
            {INSTITUTES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>پایه</label>
          <select className={inputCls} value={grade} onChange={(e) => setGrade(e.target.value)}>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-3">
        <label className={labelCls}>نام آزمون</label>
        <input className={inputCls} value={examLabel} onChange={(e) => setExamLabel(e.target.value)} placeholder="مثلاً آزمون ۵ - آبان" />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>درس</label>
          <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {subject === 'سایر' && (
          <div>
            <label className={labelCls}>نام درس</label>
            <input className={inputCls} value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} placeholder="مثلاً زمین‌شناسی" />
          </div>
        )}
      </div>

      <div className="mb-2">
        <label className={labelCls}>فصل‌ها / مباحث</label>
        <div className="flex gap-2">
          <input className={inputCls} value={chapterInput} onChange={(e) => setChapterInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChapter(); } }}
            placeholder="مثلاً فصل ۳ - ژنتیک" />
          <button onClick={addChapter} className="px-4 rounded-xl font-bold text-[#262F5E] bg-[#F5A623] hover:bg-[#FFC15E] whitespace-nowrap">افزودن</button>
        </div>
      </div>

      {chapters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {chapters.map((c, idx) => (
            <span key={idx} className="text-xs pl-1 pr-2.5 py-1 rounded-full bg-[#333D74] text-[#CDD3F0] flex items-center gap-1.5">
              {c}
              <button onClick={() => removeChapter(idx)} className="text-[#9AA3CC] hover:text-[#E4634E]">✕</button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="text-[#FF9478] text-sm mb-3">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submit} className="flex-1 py-3 rounded-xl font-bold text-[#262F5E] bg-[#F5A623] hover:bg-[#FFC15E] transition-colors">ثبت بودجه‌بندی</button>
        <button onClick={onCancel} className="px-5 py-3 rounded-xl font-bold text-[#CDD3F0] bg-[#333D74] border border-[#4A5890]">انصراف</button>
      </div>
    </div>
  );
}

function BudgetPage({ profile, budgets, onAdd, onDelete, onBack }) {
  const [showForm, setShowForm] = useState(budgets.length === 0);
  const [activeInstitute, setActiveInstitute] = useState('همه');

  const usedInstitutes = Array.from(new Set(budgets.map((b) => b.institute)));
  const filtered = activeInstitute === 'همه' ? budgets : budgets.filter((b) => b.institute === activeInstitute);

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] mb-3">← بازگشت به داشبورد</button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-[#F7F4EE]">بودجه‌بندی آزمون‌ها</h1>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="text-xs px-3 py-1.5 rounded-full bg-[#F5A623] text-[#262F5E] font-bold">+ بودجه‌بندی جدید</button>
            )}
          </div>
          <p className="text-[#CDD3F0] text-sm mt-1">هر چی خودت یا مؤسسه‌ت اعلام می‌کنه رو اینجا ثبت کن تا همیشه در دسترس باشه.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5">
        {showForm && (
          <BudgetForm profile={profile} onCancel={() => setShowForm(false)} onSave={(b) => { onAdd(b); setShowForm(false); }} />
        )}

        {usedInstitutes.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {['همه', ...usedInstitutes].map((i) => (
              <button key={i} onClick={() => setActiveInstitute(i)}
                className={`text-xs px-3 py-1.5 rounded-full font-bold transition-colors ${activeInstitute === i ? 'bg-[#F5A623] text-[#262F5E]' : 'bg-[#333D74] text-[#CDD3F0] border border-[#4A5890]'}`}>
                {i}
              </button>
            ))}
          </div>
        )}

        <h2 className="text-[#F7F4EE] font-bold mb-3">لیست بودجه‌بندی‌ها</h2>
        {filtered.length === 0 && !showForm && <p className="text-sm text-[#9AA3CC]">هنوز بودجه‌بندی‌ای ثبت نشده.</p>}

        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-[#F7F4EE]">{b.institute} — {b.examLabel}</span>
                <button onClick={() => onDelete(b.id)} className="text-[#9AA3CC] hover:text-[#E4634E] text-xs">✕</button>
              </div>
              <p className="text-xs text-[#9AA3CC] mb-2">پایه‌ی {b.grade} · {b.subject} · {b.dateLabel}</p>
              <div className="flex flex-wrap gap-2">
                {b.chapters.map((c, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-[#333D74] text-[#CDD3F0]">{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   مدیریت منابع (کتاب‌ها)
   ============================================================ */
const RESOURCE_STATUSES = ['شروع نشده', 'در حال مطالعه', 'تمام شده', 'متوقف شده'];

function resourceProgress(r) {
  if (r.totalPages > 0) return Math.round((Math.min(r.pagesRead, r.totalPages) / r.totalPages) * 100);
  if (r.totalSessions > 0) return Math.round((Math.min(r.sessionsDone, r.totalSessions) / r.totalSessions) * 100);
  return 0;
}

function ResourceForm({ profile, initial, onCancel, onSave }) {
  const subjects = [...(SUBJECTS_BY_FIELD[profile.field] || SUBJECTS_BY_FIELD['تجربی']), 'سایر'];
  const [name, setName] = useState(initial?.name || '');
  const [subject, setSubject] = useState(initial?.subject || subjects[0]);
  const [totalPages, setTotalPages] = useState(initial?.totalPages ?? '');
  const [pagesRead, setPagesRead] = useState(initial?.pagesRead ?? '');
  const [totalSessions, setTotalSessions] = useState(initial?.totalSessions ?? '');
  const [sessionsDone, setSessionsDone] = useState(initial?.sessionsDone ?? '');
  const [testsDone, setTestsDone] = useState(initial?.testsDone ?? '');
  const [status, setStatus] = useState(initial?.status || RESOURCE_STATUSES[0]);
  const [error, setError] = useState('');

  const inputCls = "w-full rounded-xl px-4 py-3 bg-[#333D74] text-[#F7F4EE] placeholder-[#9AA3CC] border border-[#4A5890] focus:border-[#F5A623] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 transition";
  const labelCls = "block text-sm text-[#CDD3F0] mb-1.5";

  const submit = () => {
    if (!name.trim()) { setError('اسم کتاب رو وارد کن.'); return; }
    setError('');
    onSave({
      id: initial?.id || Date.now(),
      name: name.trim(), subject, status,
      totalPages: Number(totalPages) || 0,
      pagesRead: Number(pagesRead) || 0,
      totalSessions: Number(totalSessions) || 0,
      sessionsDone: Number(sessionsDone) || 0,
      testsDone: Number(testsDone) || 0,
    });
  };

  return (
    <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-5">
      <h3 className="font-bold text-[#F7F4EE] mb-3">{initial ? 'ویرایش کتاب' : 'افزودن کتاب جدید'}</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>نام کتاب</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً زیست خیلی سبز" />
        </div>
        <div>
          <label className={labelCls}>درس</label>
          <select className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)}>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>کل صفحات</label>
          <input type="number" min="0" className={inputCls} value={totalPages} onChange={(e) => setTotalPages(e.target.value)} placeholder="مثلاً ۳۲۰" />
        </div>
        <div>
          <label className={labelCls}>صفحات خونده‌شده</label>
          <input type="number" min="0" className={inputCls} value={pagesRead} onChange={(e) => setPagesRead(e.target.value)} placeholder="مثلاً ۱۲۰" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>کل جلسات</label>
          <input type="number" min="0" className={inputCls} value={totalSessions} onChange={(e) => setTotalSessions(e.target.value)} placeholder="مثلاً ۲۰" />
        </div>
        <div>
          <label className={labelCls}>جلسات انجام‌شده</label>
          <input type="number" min="0" className={inputCls} value={sessionsDone} onChange={(e) => setSessionsDone(e.target.value)} placeholder="مثلاً ۸" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className={labelCls}>تعداد تست زده‌شده</label>
          <input type="number" min="0" className={inputCls} value={testsDone} onChange={(e) => setTestsDone(e.target.value)} placeholder="مثلاً ۱۵۰" />
        </div>
        <div>
          <label className={labelCls}>وضعیت مطالعه</label>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            {RESOURCE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-[#FF9478] text-sm mb-3">{error}</p>}

      <div className="flex gap-2">
        <button onClick={submit} className="flex-1 py-3 rounded-xl font-bold text-[#262F5E] bg-[#F5A623] hover:bg-[#FFC15E] transition-colors">{initial ? 'ذخیره تغییرات' : 'افزودن کتاب'}</button>
        <button onClick={onCancel} className="px-5 py-3 rounded-xl font-bold text-[#CDD3F0] bg-[#333D74] border border-[#4A5890]">انصراف</button>
      </div>
    </div>
  );
}

function ResourcesPage({ profile, resources, onAdd, onUpdate, onDelete, onBack }) {
  const [showForm, setShowForm] = useState(resources.length === 0);
  const [editing, setEditing] = useState(null);

  const openEdit = (r) => { setEditing(r); setShowForm(true); };
  const closeForm = () => { setEditing(null); setShowForm(false); };
  const save = (r) => {
    if (editing) onUpdate(r); else onAdd(r);
    closeForm();
  };

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] mb-3">← بازگشت به داشبورد</button>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-[#F7F4EE]">مدیریت منابع</h1>
            {!showForm && (
              <button onClick={() => { setEditing(null); setShowForm(true); }} className="text-xs px-3 py-1.5 rounded-full bg-[#F5A623] text-[#262F5E] font-bold">+ کتاب جدید</button>
            )}
          </div>
          <p className="text-[#CDD3F0] text-sm mt-1">کتاب‌هات رو ثبت کن و پیشرفتشون رو دنبال کن.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5">
        {showForm && (
          <ResourceForm profile={profile} initial={editing} onCancel={closeForm} onSave={save} />
        )}

        {resources.length === 0 && !showForm && <p className="text-sm text-[#9AA3CC]">هنوز کتابی ثبت نکردی.</p>}

        <div className="space-y-3">
          {resources.map((r) => {
            const pct = resourceProgress(r);
            const remainingPages = Math.max(0, r.totalPages - r.pagesRead);
            const remainingSessions = Math.max(0, r.totalSessions - r.sessionsDone);
            return (
              <div key={r.id} className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-[#F7F4EE]">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(r)} className="text-[#9AA3CC] hover:text-[#F5A623] text-xs">ویرایش</button>
                    <button onClick={() => onDelete(r.id)} className="text-[#9AA3CC] hover:text-[#E4634E] text-xs">✕</button>
                  </div>
                </div>
                <p className="text-xs text-[#9AA3CC] mb-2">{r.subject} · {r.status}</p>

                <div className="w-full h-2 rounded-full bg-[#333D74] overflow-hidden mb-1.5">
                  <div className="h-full rounded-full bg-[#F5A623] transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
                <p className="text-xs text-[#CDD3F0] mb-2">{toFa(pct)}٪ پیشرفت</p>

                <div className="flex flex-wrap gap-1.5">
                  {r.totalPages > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#333D74] text-[#CDD3F0]">{toFa(remainingPages)} صفحه مونده</span>}
                  {r.totalSessions > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#333D74] text-[#CDD3F0]">{toFa(remainingSessions)} جلسه مونده</span>}
                  {r.testsDone > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#333D74] text-[#CDD3F0]">{toFa(r.testsDone)} تست زده</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   کارهای روزانه + ثبت حال روحی
   ============================================================ */
function todayJalaliKey() {
  const t = gregorianToJalali(new Date());
  return `${t.jy}-${t.jm}-${t.jd}`;
}
function todayJalaliLabel() {
  const t = gregorianToJalali(new Date());
  return `${toFa(t.jd)} ${JALALI_MONTHS[t.jm]} ${toFa(t.jy)}`;
}

function DailyTasksPage({ tasksByDate, onUpdateDay, onBack }) {
  const key = todayJalaliKey();
  const tasks = tasksByDate[key] || [];
  const [text, setText] = useState('');

  const inputCls = "flex-1 rounded-xl px-4 py-3 bg-[#333D74] text-[#F7F4EE] placeholder-[#9AA3CC] border border-[#4A5890] focus:border-[#F5A623] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/30 transition";

  const addTask = () => {
    const v = text.trim();
    if (!v || tasks.length >= 10) return;
    onUpdateDay(key, [...tasks, { id: Date.now(), text: v, done: false }]);
    setText('');
  };
  const toggleTask = (id) => onUpdateDay(key, tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const deleteTask = (id) => onUpdateDay(key, tasks.filter((t) => t.id !== id));

  const doneCount = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] mb-3">← بازگشت به داشبورد</button>
          <h1 className="text-xl font-extrabold text-[#F7F4EE] mb-1">کارهای روزانه</h1>
          <p className="text-[#CDD3F0] text-sm">{todayJalaliLabel()} · حداکثر ۱۰ کار</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5">
        <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-[#CDD3F0]">امروز</span>
            <span className="text-2xl font-extrabold text-[#F5A623]">{toFa(pct)}٪</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#333D74] overflow-hidden">
            <div className="h-full rounded-full bg-[#F5A623] transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-[#9AA3CC] mt-2">{toFa(doneCount)} از {toFa(tasks.length)} کار انجام شده</p>
        </div>

        {tasks.length < 10 && (
          <div className="flex gap-2 mb-4">
            <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTask(); }}
              placeholder="مثلاً زیست فصل ۳" />
            <button onClick={addTask} className="px-5 py-3 rounded-xl font-bold text-[#262F5E] bg-[#F5A623] hover:bg-[#FFC15E] transition-colors whitespace-nowrap">افزودن</button>
          </div>
        )}
        {tasks.length >= 10 && (
          <p className="text-xs text-[#9AA3CC] mb-4">به سقف ۱۰ کار رسیدی — یکی رو حذف کن تا کار جدید اضافه کنی.</p>
        )}

        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-xl bg-[#2E3768] border border-[#4A5890] px-3.5 py-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="w-4 h-4 accent-[#F5A623]" />
                <span className={`text-sm ${t.done ? 'text-[#9AA3CC] line-through' : 'text-[#F7F4EE]'}`}>{t.text}</span>
              </label>
              <button onClick={() => deleteTask(t.id)} className="text-[#9AA3CC] hover:text-[#E4634E] text-xs px-2">✕</button>
            </div>
          ))}
        </div>

        {tasks.length > 0 && (
          <p className="text-center text-sm text-[#CDD3F0] mt-6">
            {pct === 100 ? '🎉 امروز: ۱۰۰٪ برنامه انجام شد. آفرین!' : `امروز: ${toFa(pct)}٪ برنامه انجام شد.`}
          </p>
        )}
      </div>
    </div>
  );
}

function StarRating({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm text-[#F7F4EE] font-bold">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)} className="text-2xl leading-none" style={{ color: n <= value ? '#F5A623' : '#4A5890' }}>
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

function MoodPage({ moodByDate, onSave, onBack }) {
  const key = todayJalaliKey();
  const existing = moodByDate[key];
  const [satisfaction, setSatisfaction] = useState(existing?.satisfaction || 0);
  const [focus, setFocus] = useState(existing?.focus || 0);
  const [motivation, setMotivation] = useState(existing?.motivation || 0);
  const [sleep, setSleep] = useState(existing?.sleep || 0);
  const [stress, setStress] = useState(existing?.stress || 0);
  const [saved, setSaved] = useState(false);

  const submit = () => {
    onSave(key, { satisfaction, focus, motivation, sleep, stress, dateLabel: todayJalaliLabel() });
    setSaved(true);
  };

  const history = Object.entries(moodByDate).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
  const chartData = [...history].reverse().map(([k, v], i) => ({ name: `${toFa(i + 1)}`, رضایت: v.satisfaction, استرس: v.stress }));

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] mb-3">← بازگشت به داشبورد</button>
          <h1 className="text-xl font-extrabold text-[#F7F4EE] mb-1">حال روحی امشب</h1>
          <p className="text-[#CDD3F0] text-sm">{todayJalaliLabel()}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5">
        <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-5">
          <p className="text-sm text-[#CDD3F0] mb-4">امروز چقدر از خودت راضی بودی؟</p>
          <StarRating label="رضایت کلی" value={satisfaction} onChange={setSatisfaction} />
          <StarRating label="تمرکز" value={focus} onChange={setFocus} />
          <StarRating label="انگیزه" value={motivation} onChange={setMotivation} />
          <StarRating label="خواب" value={sleep} onChange={setSleep} />
          <StarRating label="استرس" value={stress} onChange={setStress} />

          <button onClick={submit} className="w-full mt-2 py-3 rounded-xl font-bold text-[#262F5E] bg-[#F5A623] hover:bg-[#FFC15E] transition-colors">
            {existing ? 'به‌روزرسانی امشب' : 'ثبت امشب'}
          </button>
          {saved && <p className="text-xs text-[#5FA777] text-center mt-2">ثبت شد 🌙</p>}
        </div>

        {history.length > 1 && (
          <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4">
            <h3 className="font-bold text-[#F7F4EE] mb-3 text-sm">روند رضایت و استرس</h3>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#4A5890" />
                  <XAxis dataKey="name" tick={{ fill: '#9AA3CC', fontSize: 11 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: '#9AA3CC', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#333D74', border: '1px solid #4A5890', borderRadius: 8, color: '#F7F4EE' }} />
                  <Line type="monotone" dataKey="رضایت" stroke="#5FA777" strokeWidth={2.5} dot={{ fill: '#5FA777', r: 3 }} />
                  <Line type="monotone" dataKey="استرس" stroke="#E4634E" strokeWidth={2.5} dot={{ fill: '#E4634E', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   نمودارهای کلی
   ============================================================ */
function ChartsPage({ profile, exams, sheets, tasksByDate, onBack }) {
  const subjects = SUBJECTS_BY_FIELD[profile.field] || SUBJECTS_BY_FIELD['تجربی'];

  const examChartData = [...exams].reverse().map((e) => ({ name: `${JALALI_MONTHS[e.jm]} ${toFa(e.jy)}`, 'درصد': e.avg }));
  const rankExams = [...exams].filter((e) => e.rank).reverse();
  const rankChartData = rankExams.map((e) => ({ name: `${JALALI_MONTHS[e.jm]} ${toFa(e.jy)}`, 'رتبه': e.rank }));

  const subjectAvg = subjects.map((s) => {
    const vals = exams.map((e) => e.percentages?.[s]).filter((v) => typeof v === 'number');
    const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    return { name: s, 'درصد': avg };
  });

  const sheetsByDate = {};
  sheets.forEach((s) => { sheetsByDate[s.dateLabel] = (sheetsByDate[s.dateLabel] || 0) + 1; });
  const sheetsChartData = Object.entries(sheetsByDate).map(([name, count]) => ({ name, 'تعداد': count }));

  const taskDays = Object.entries(tasksByDate)
    .map(([key, tasks]) => {
      const [jy, jm, jd] = key.split('-').map(Number);
      const done = tasks.filter((t) => t.done).length;
      const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
      return { key, jy, jm, jd, pct, name: `${toFa(jd)} ${JALALI_MONTHS[jm]}` };
    })
    .sort((a, b) => (a.key > b.key ? 1 : -1))
    .slice(-14);

  const axisStyle = { fill: '#9AA3CC', fontSize: 10 };
  const gridColor = '#4A5890';
  const tooltipStyle = { background: '#333D74', border: '1px solid #4A5890', borderRadius: 8, color: '#F7F4EE' };

  const ChartCard = ({ title, empty, children }) => (
    <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-4">
      <h3 className="font-bold text-[#F7F4EE] mb-3 text-sm">{title}</h3>
      {empty ? <p className="text-xs text-[#9AA3CC]">{empty}</p> : children}
    </div>
  );

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] mb-3">← بازگشت به داشبورد</button>
          <h1 className="text-xl font-extrabold text-[#F7F4EE] mb-1">نمودارهای کلی</h1>
          <p className="text-[#CDD3F0] text-sm">روند پیشرفتت رو از دل داده‌هایی که ثبت کردی می‌بینی.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5">
        <ChartCard title="روند درصد آزمون‌های آزمایشی" empty={exams.length < 2 ? 'حداقل دو آزمون ثبت کن تا روندش رو ببینی.' : null}>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={examChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={axisStyle} />
                <YAxis domain={[0, 100]} tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="درصد" stroke="#F5A623" strokeWidth={2.5} dot={{ fill: '#F5A623', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="پیشرفت هر درس (میانگین آزمون‌ها)" empty={exams.length === 0 ? 'هنوز آزمونی ثبت نکردی.' : null}>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <BarChart data={subjectAvg} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={axisStyle} />
                <YAxis domain={[0, 100]} tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="درصد" fill="#F5A623" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="رشد رتبه" empty={rankExams.length < 2 ? 'حداقل دو آزمون با رتبه‌ی ثبت‌شده لازمه.' : null}>
          <p className="text-xs text-[#9AA3CC] mb-2">رتبه‌ی پایین‌تر یعنی وضعیت بهتر — محور برعکسه.</p>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={rankChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={axisStyle} />
                <YAxis reversed tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="رتبه" stroke="#5FA777" strokeWidth={2.5} dot={{ fill: '#5FA777', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="تعداد تست‌برگ در هر روز" empty={sheets.length === 0 ? 'هنوز تست‌برگی ثبت نکردی.' : null}>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <BarChart data={sheetsChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={axisStyle} />
                <YAxis allowDecimals={false} tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="تعداد" fill="#5FA777" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="درصد انجام کارهای روزانه (۱۴ روز اخیر)" empty={taskDays.length < 2 ? 'حداقل دو روز کارهای روزانه ثبت کن.' : null}>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={taskDays} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={axisStyle} />
                <YAxis domain={[0, 100]} tick={axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="pct" name="درصد" stroke="#9B8BD4" strokeWidth={2.5} dot={{ fill: '#9B8BD4', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <p className="text-xs text-[#9AA3CC] leading-relaxed">
          نکته: نمودار «ساعت مطالعه» و «کیفیت مطالعه» هنوز اضافه نشدن، چون فیچر ثبت ساعت مطالعه هنوز ساخته نشده — وقتی اون رو ساختیم، این نمودارها هم کامل می‌شن. نمودار رضایت و استرس رو هم می‌تونی توی صفحه‌ی «ثبت حال روحی» ببینی.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   سیستم انگیزشی
   ============================================================ */
function jalaliKeyToDate(key) {
  const [jy, jm, jd] = key.split('-').map(Number);
  return jalaliToGregorian(jy, jm, jd);
}

function computeStreak(tasksByDate) {
  const activeDays = new Set(
    Object.entries(tasksByDate)
      .filter(([, tasks]) => tasks.some((t) => t.done))
      .map(([key]) => key)
  );
  if (activeDays.size === 0) return 0;

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  const cursorKey = () => {
    const t = gregorianToJalali(cursor);
    return `${t.jy}-${t.jm}-${t.jd}`;
  };

  if (!activeDays.has(cursorKey())) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDays.has(cursorKey())) return 0;
  }
  while (activeDays.has(cursorKey())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function computeXP({ exams, sheets, resources, budgets, tasksByDate, moodByDate }) {
  const doneTasksTotal = Object.values(tasksByDate).reduce((sum, tasks) => sum + tasks.filter((t) => t.done).length, 0);
  return exams.length * 20 + sheets.length * 15 + resources.length * 10 + budgets.length * 10
    + doneTasksTotal * 5 + Object.keys(moodByDate).length * 10;
}

function MotivationPage({ profile, exams, sheets, resources, budgets, tasksByDate, moodByDate, onBack }) {
  const streak = computeStreak(tasksByDate);

  const activeDaysLast7 = (() => {
    const cutoff = new Date(); cutoff.setHours(0, 0, 0, 0); cutoff.setDate(cutoff.getDate() - 6);
    let count = 0;
    Object.entries(tasksByDate).forEach(([key, tasks]) => {
      if (!tasks.some((t) => t.done)) return;
      const d = jalaliKeyToDate(key);
      if (d >= cutoff) count += 1;
    });
    return count;
  })();

  const xp = computeXP({ exams, sheets, resources, budgets, tasksByDate, moodByDate });
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;

  const todayKey = todayJalaliKey();
  const todayTasks = tasksByDate[todayKey] || [];
  const todayDoneCount = todayTasks.filter((t) => t.done).length;
  const todayHasMood = !!moodByDate[todayKey];
  const todaySheetCount = sheets.filter((s) => s.dateLabel === todayJalaliLabel()).length;

  const dailyMissions = [
    { label: 'حداقل یک کار امروز رو تیک بزن', done: todayDoneCount >= 1 },
    { label: 'حال روحیت رو امروز ثبت کن', done: todayHasMood },
    { label: 'یک تست‌برگ امروز ثبت کن', done: todaySheetCount >= 1 },
  ];
  const weeklyMissions = [
    { label: 'حداقل ۳ روز از هفته کارهاتو انجام بده', done: activeDaysLast7 >= 3, progress: `${toFa(activeDaysLast7)} از ۷` },
    { label: 'حداقل ۵ روز از هفته کارهاتو انجام بده', done: activeDaysLast7 >= 5, progress: `${toFa(activeDaysLast7)} از ۷` },
  ];

  const achievements = [
    { label: 'اولین قدم', hint: 'ساخت پروفایل', unlocked: true },
    { label: 'اولین تست‌برگ', hint: 'حداقل ۱ تست‌برگ', unlocked: sheets.length >= 1 },
    { label: 'اهل تمرین', hint: 'حداقل ۱۰ تست‌برگ', unlocked: sheets.length >= 10 },
    { label: 'اولین آزمون', hint: 'حداقل ۱ آزمون آزمایشی', unlocked: exams.length >= 1 },
    { label: 'آزمون‌گیر حرفه‌ای', hint: 'حداقل ۵ آزمون آزمایشی', unlocked: exams.length >= 5 },
    { label: 'کتابدار', hint: 'حداقل ۱ کتاب ثبت‌شده', unlocked: resources.length >= 1 },
    { label: 'برنامه‌ریز', hint: 'حداقل ۱ بودجه‌بندی', unlocked: budgets.length >= 1 },
    { label: 'یک هفته پیاپی', hint: 'استریک ۷ روزه', unlocked: streak >= 7 },
    { label: 'یک ماه پیاپی', hint: 'استریک ۳۰ روزه', unlocked: streak >= 30 },
    { label: 'آینه‌ی درون', hint: 'حداقل ۷ بار ثبت حال روحی', unlocked: Object.keys(moodByDate).length >= 7 },
  ];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-screen pb-16" style={{ background: '#262F5E' }}>
      <div className="px-5 pt-8 pb-6" style={{ background: 'linear-gradient(180deg, #333D74 0%, #262F5E 100%)' }}>
        <div className="max-w-lg mx-auto">
          <button onClick={onBack} className="text-xs text-[#CDD3F0] hover:text-[#F5A623] mb-3">← بازگشت به داشبورد</button>
          <h1 className="text-xl font-extrabold text-[#F7F4EE] mb-1">سیستم انگیزشی</h1>
          <p className="text-[#CDD3F0] text-sm">هرچی منظم‌تر باشی، این صفحه رشدت رو نشونت میده.</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 mt-5">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-[#333D74] border border-[#F5A623]/40 p-4 text-center">
            <p className="text-3xl mb-1">🔥</p>
            <p className="text-2xl font-extrabold text-[#F5A623]">{toFa(streak)}</p>
            <p className="text-xs text-[#CDD3F0]">روز استریک</p>
          </div>
          <div className="rounded-2xl bg-[#333D74] border border-[#F5A623]/40 p-4 text-center">
            <p className="text-3xl mb-1">⭐</p>
            <p className="text-2xl font-extrabold text-[#F5A623]">{toFa(level)}</p>
            <p className="text-xs text-[#CDD3F0]">سطح</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#2E3768] border border-[#4A5890] p-4 mb-5">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm text-[#CDD3F0]">XP سطح {toFa(level)}</span>
            <span className="text-sm text-[#F5A623] font-bold">{toFa(xpIntoLevel)} / ۱۰۰</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#333D74] overflow-hidden">
            <div className="h-full rounded-full bg-[#F5A623] transition-all" style={{ width: `${xpIntoLevel}%` }} />
          </div>
          <p className="text-xs text-[#9AA3CC] mt-2">مجموع XP: {toFa(xp)} — از ثبت آزمون، تست‌برگ، کارهای روزانه، حال روحی و منابع به‌دست میاد.</p>
        </div>

        <h2 className="text-[#F7F4EE] font-bold mb-3">مأموریت امروز</h2>
        <div className="space-y-2 mb-5">
          {dailyMissions.map((m, i) => (
            <div key={i} className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border ${m.done ? 'bg-[#5FA777]/10 border-[#5FA777]' : 'bg-[#2E3768] border-[#4A5890]'}`}>
              <span>{m.done ? '✅' : '⬜️'}</span>
              <span className={`text-sm ${m.done ? 'text-[#5FA777]' : 'text-[#F7F4EE]'}`}>{m.label}</span>
            </div>
          ))}
        </div>

        <h2 className="text-[#F7F4EE] font-bold mb-3">مأموریت هفتگی</h2>
        <div className="space-y-2 mb-5">
          {weeklyMissions.map((m, i) => (
            <div key={i} className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 border ${m.done ? 'bg-[#5FA777]/10 border-[#5FA777]' : 'bg-[#2E3768] border-[#4A5890]'}`}>
              <div className="flex items-center gap-2.5">
                <span>{m.done ? '✅' : '⬜️'}</span>
                <span className={`text-sm ${m.done ? 'text-[#5FA777]' : 'text-[#F7F4EE]'}`}>{m.label}</span>
              </div>
              <span className="text-xs text-[#9AA3CC]">{m.progress}</span>
            </div>
          ))}
        </div>

        <h2 className="text-[#F7F4EE] font-bold mb-1">دستاوردها</h2>
        <p className="text-xs text-[#9AA3CC] mb-3">{toFa(unlockedCount)} از {toFa(achievements.length)} باز شده</p>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a, i) => (
            <div key={i} className={`rounded-xl p-3.5 border text-center ${a.unlocked ? 'bg-[#333D74] border-[#F5A623]/50' : 'bg-[#2E3768] border-[#4A5890] opacity-50'}`}>
              <p className="text-2xl mb-1">{a.unlocked ? '🏅' : '🔒'}</p>
              <p className="text-xs font-bold text-[#F7F4EE]">{a.label}</p>
              <p className="text-[10px] text-[#9AA3CC] mt-0.5">{a.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   اپلیکیشن اصلی
   ============================================================ */
export default function App() {
  const [screen, setScreen] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [level, setLevel] = useState('متوسط');
  const [exams, setExams] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [resources, setResources] = useState([]);
  const [tasksByDate, setTasksByDate] = useState({});
  const [moodByDate, setMoodByDate] = useState({});
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800&family=Noto+Naskh+Arabic:wght@500&display=swap';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = '@keyframes konkooryarFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } } .konkooryar-fade { animation: konkooryarFadeIn 0.35s ease; }';
    document.head.appendChild(style);
    document.documentElement.dir = 'rtl';
    document.body.style.fontFamily = "'Vazirmatn', sans-serif";
    document.body.style.background = '#262F5E';
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    (async () => {
      let hadError = false;
      let hasProfile = false;
      try {
        const res = await window.storage.get('profile');
        if (res && res.value) { setProfile(JSON.parse(res.value)); hasProfile = true; }
      } catch (e) { hadError = true; }
      try {
        const lv = await window.storage.get('goalLevel');
        if (lv && lv.value) setLevel(lv.value);
      } catch (e) {}
      try {
        const ex = await window.storage.get('exams');
        if (ex && ex.value) setExams(JSON.parse(ex.value));
      } catch (e) {}
      try {
        const sh = await window.storage.get('testsheets');
        if (sh && sh.value) setSheets(JSON.parse(sh.value));
      } catch (e) {}
      try {
        const bg = await window.storage.get('budgets');
        if (bg && bg.value) setBudgets(JSON.parse(bg.value));
      } catch (e) {}
      try {
        const rs = await window.storage.get('resources');
        if (rs && rs.value) setResources(JSON.parse(rs.value));
      } catch (e) {}
      try {
        const td = await window.storage.get('tasksByDate');
        if (td && td.value) setTasksByDate(JSON.parse(td.value));
      } catch (e) {}
      try {
        const md = await window.storage.get('moodByDate');
        if (md && md.value) setMoodByDate(JSON.parse(md.value));
      } catch (e) {}
      setStorageError(hadError);
      setScreen(hasProfile ? 'dashboard' : 'welcome');
    })();
  }, []);

  const saveProfile = useCallback(async (data) => {
    setProfile(data);
    setScreen('dashboard');
    try { await window.storage.set('profile', JSON.stringify(data)); } catch (e) { setStorageError(true); }
  }, []);

  const changeLevel = useCallback(async (lv) => {
    setLevel(lv);
    try { await window.storage.set('goalLevel', lv); } catch (e) {}
  }, []);

  const addExam = useCallback(async (exam) => {
    setExams((prev) => {
      const next = [exam, ...prev];
      window.storage.set('exams', JSON.stringify(next)).catch(() => setStorageError(true));
      return next;
    });
  }, []);

  const addSheet = useCallback(async (sheet) => {
    setSheets((prev) => {
      const next = [sheet, ...prev];
      window.storage.set('testsheets', JSON.stringify(next)).catch(() => setStorageError(true));
      return next;
    });
  }, []);

  const deleteSheet = useCallback(async (id) => {
    setSheets((prev) => {
      const next = prev.filter((s) => s.id !== id);
      window.storage.set('testsheets', JSON.stringify(next)).catch(() => setStorageError(true));
      return next;
    });
  }, []);

  const addBudget = useCallback(async (budget) => {
    setBudgets((prev) => {
      const next = [budget, ...prev];
      window.storage.set('budgets', JSON.stringify(next)).catch(() => setStorageError(true));
      return next;
    });
  }, []);

  const deleteBudget = useCallback(async (id) => {
    setBudgets((prev) => {
      const next = prev.filter((b) => b.id !== id);
      window.storage.set('budgets', JSON.stringify(next)).catch(() => setStorageError(true));
      return next;
    });
  }, []);

  const addResource = useCallback(async (resource) => {
    setResources((prev) => {
      const next = [resource, ...prev];
      window.storage.set('resources', JSON.stringify(next)).catch(() => setStorageError(true));
      return next;
    });
  }, []);

  const updateResource = useCallback(async (resource) => {
    setResources((prev) => {
      const next = prev.map((r) => (r.id === resource.id ? resource : r));
      window.storage.set('resources', JSON.stringify(next)).catch(() => setStorageError(true));
      return next;
    });
  }, []);

  const deleteResource = useCallback(async (id) => {
    setResources((prev) => {
      const next = prev.filter((r) => r.id !== id);
      window.storage.set('resources', JSON.stringify(next)).catch(() => setStorageError(true));
      return next;
    });
  }, []);

  const updateTaskDay = useCallback(async (dateKey, tasks) => {
    setTasksByDate((prev) => {
      const next = { ...prev, [dateKey]: tasks };
      window.storage.set('tasksByDate', JSON.stringify(next)).catch(() => setStorageError(true));
      return next;
    });
  }, []);

  const saveMood = useCallback(async (dateKey, entry) => {
    setMoodByDate((prev) => {
      const next = { ...prev, [dateKey]: entry };
      window.storage.set('moodByDate', JSON.stringify(next)).catch(() => setStorageError(true));
      return next;
    });
  }, []);

  if (screen === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#262F5E' }}>
        <div className="w-10 h-10 rounded-full border-2 border-[#F5A623] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl">
      {storageError && (
        <div className="fixed top-0 inset-x-0 z-50 text-center text-xs py-1.5 bg-[#E4634E] text-white">
          ذخیره‌سازی موقتاً در دسترس نیست — بعضی اطلاعات ممکنه با رفرش پاک بشن.
        </div>
      )}
      <div key={screen} className="konkooryar-fade">
        {screen === 'welcome' && <Welcome onStart={() => setScreen('profile')} />}
        {screen === 'profile' && <ProfileForm initial={profile} onSave={saveProfile} />}
        {screen === 'dashboard' && profile && (
          <Dashboard profile={profile} exams={exams} sheets={sheets} tasksByDate={tasksByDate} onEdit={() => setScreen('profile')} onOpenGoals={() => setScreen('goals')} onOpenExams={() => setScreen('exams')} onOpenSimulator={() => setScreen('simulator')} onOpenTestSheet={() => setScreen('testsheet')} onOpenBudget={() => setScreen('budget')} onOpenResources={() => setScreen('resources')} onOpenTasks={() => setScreen('tasks')} onOpenMood={() => setScreen('mood')} onOpenCharts={() => setScreen('charts')} onOpenMotivation={() => setScreen('motivation')} />
        )}
        {screen === 'goals' && profile && (
          <GoalPlanner profile={profile} level={level} onChangeLevel={changeLevel} onBack={() => setScreen('dashboard')} />
        )}
        {screen === 'exams' && profile && (
          <ExamAnalyzer profile={profile} level={level} exams={exams} onAdd={addExam} onBack={() => setScreen('dashboard')} />
        )}
        {screen === 'simulator' && profile && (
          <RankSimulator profile={profile} level={level} onBack={() => setScreen('dashboard')} />
        )}
        {screen === 'testsheet' && profile && (
          <TestSheetPage profile={profile} sheets={sheets} onAdd={addSheet} onDelete={deleteSheet} onBack={() => setScreen('dashboard')} />
        )}
        {screen === 'budget' && profile && (
          <BudgetPage profile={profile} budgets={budgets} onAdd={addBudget} onDelete={deleteBudget} onBack={() => setScreen('dashboard')} />
        )}
        {screen === 'resources' && profile && (
          <ResourcesPage profile={profile} resources={resources} onAdd={addResource} onUpdate={updateResource} onDelete={deleteResource} onBack={() => setScreen('dashboard')} />
        )}
        {screen === 'tasks' && profile && (
          <DailyTasksPage tasksByDate={tasksByDate} onUpdateDay={updateTaskDay} onBack={() => setScreen('dashboard')} />
        )}
        {screen === 'mood' && profile && (
          <MoodPage moodByDate={moodByDate} onSave={saveMood} onBack={() => setScreen('dashboard')} />
        )}
        {screen === 'charts' && profile && (
          <ChartsPage profile={profile} exams={exams} sheets={sheets} tasksByDate={tasksByDate} onBack={() => setScreen('dashboard')} />
        )}
        {screen === 'motivation' && profile && (
          <MotivationPage profile={profile} exams={exams} sheets={sheets} resources={resources} budgets={budgets} tasksByDate={tasksByDate} moodByDate={moodByDate} onBack={() => setScreen('dashboard')} />
        )}
      </div>
    </div>
  );
}
