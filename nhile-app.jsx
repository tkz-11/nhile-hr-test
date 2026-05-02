const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* MOCK DATA */
const PROFILES = {
  hr_manager: { person_id: 'hr-01', full_name: 'Nguyễn Thanh Trang', primary_role: 'hr_manager' },
  leader:     { person_id: 'ld-01', full_name: 'Trần Văn Bình',       primary_role: 'leader' },
  member:     { person_id: 'mb-01', full_name: 'Lê Thị Minh Thư',     primary_role: 'member' },
};

const RETENTION_DASHBOARD = {
  total_members: 130, high_risk: 12, stuck_count: 5, checkpoints_due: 8,
  recent_alerts: [
    { member_name: 'Nguyễn Minh Anh', risk_level: 'high',   type: 'stuck',         days_ago: 2 },
    { member_name: 'Lê Thị Thu Hà',   risk_level: 'medium', type: 'checkpoint_90', days_ago: 5 },
  ],
};

const MEMBERS = [
  { id: '1', risk_level: 'high',   days_in_team: 85, user: { name: 'Nguyễn Minh Anh' },  team: { name: 'Editor' },
    current_assignment: { status: 'stuck', stuck_since: new Date(Date.now() - 8 * 86400000).toISOString(), leader: { name: 'Trần Văn Bình' } },
    emotional: 'Cảm thấy bị cô lập do thiếu kết nối liên tục 2 tuần qua' },
  { id: '2', risk_level: 'medium', days_in_team: 68, user: { name: 'Lê Thị Thu Hà' },    team: { name: 'Design' },
    current_assignment: { status: 'talking', leader: { name: 'Phạm Ngọc Lan' } },
    emotional: 'Đang chịu áp lực cao nhưng có xu hướng im lặng chịu đựng' },
  { id: '3', risk_level: 'low',    days_in_team: 30, user: { name: 'Đinh Quốc Việt' },   team: { name: 'IT/Tech' },
    current_assignment: { status: 'none', leader: { name: 'Hoàng Minh Tuấn' } } },
  { id: '4', risk_level: 'none',   days_in_team: 80, user: { name: 'Vũ Thị Bảo Châu' }, team: { name: 'Editor' } },
  { id: '5', risk_level: 'low',    days_in_team: 45, user: { name: 'Phạm Đức Dũng' },    team: { name: 'Product' } },
  { id: '6', risk_level: 'none',   days_in_team: 90, user: { name: 'Nguyễn Thu Hà' },    team: { name: 'HR' } },
];

const LEADER_METRICS = [
  { id: 'lm1', team_size: 8,  turnover_rate_3m: 25, engage_score: 4.2, leader: { name: 'Trần Văn Bình' },    team: { name: 'Editor' },  coaching_flag: true },
  { id: 'lm2', team_size: 5,  turnover_rate_3m: 10, engage_score: 7.8, leader: { name: 'Phạm Ngọc Lan' },    team: { name: 'Design' },  coaching_flag: false },
  { id: 'lm3', team_size: 12, turnover_rate_3m: 8,  engage_score: 8.5, leader: { name: 'Hoàng Minh Tuấn' },  team: { name: 'IT/Tech' }, coaching_flag: false },
];

const PASSPORT_PROFILE = { culture_xp: 340, streak_days: 7, directness_score: 6.8 };
const SAFETY_7D = [7.2, 7.5, 7.1, 7.8, 8.2, 8.0, 8.5];
const DAY_LABELS = ['T2','T3','T4','T5','T6','T7','CN'];

const LEADER_INTEGRITY = {
  feedback_timeliness: 7.5, wyfl_compliance: 8.0, language_standard: 6.5,
  scenario_completion: 9.0, directness: 7.0, integrity_score: 0.76,
};
const IMPROVEMENT_SUGGESTIONS = [
  'Đặt deadline cụ thể khi giao task cho team — tránh "sẽ xem" hoặc "có thể".',
  'Tránh dùng "sẽ cố" — thay bằng ngày/giờ cam kết rõ ràng.',
  'Khi phản hồi định kỳ, nêu rõ điểm cần cải thiện thay vì gói chung "tạm ổn".',
];

const HR_PASSPORT_DASHBOARD = {
  avg_directness_score: 6.8, banned_word_pct: 23,
  weekly_trend: [
    { week: '24/03', avg_score: 6.2 },
    { week: '31/03', avg_score: 6.5 },
    { week: '07/04', avg_score: 6.8 },
    { week: '14/04', avg_score: 7.1 },
  ],
  members_needing_attention: [
    { user_id: 'u5', name: 'Trần Văn Cường', directness_score: 3.2, trend: 'down' },
    { user_id: 'u6', name: 'Nguyễn Thị Dương', directness_score: 4.0, trend: 'flat' },
    { user_id: 'u7', name: 'Hoàng Anh Vũ',   directness_score: 4.4, trend: 'down' },
  ],
};

const MIRROR = { leaderDirectness: 61, teamDirectness: 74, leaderVaguePhrases: ['sẽ xem', 'để tính sau', 'ok thôi', 'có thể'] };

const SILENCE_PATTERNS = ['không sao','bình thường thôi','ok em','dạ được','em sẽ cố','để em xem','có lẽ','thôi được'];
const VAGUE_PATTERNS   = ['sẽ cố gắng','sẽ làm','sẽ xem','hy vọng','mong là','có thể','thử xem','cố thôi'];
const DIRECT_PATTERNS  = ['tôi không thể','tôi không đồng ý','cụ thể là','tôi cần','deadline là','tôi sẽ gửi lúc','giải pháp là'];
const FACE_PATTERNS    = ['thôi không sao','để sau tính','không cần thiết','ngại quá','kỳ cục lắm'];

const SCENARIO_GROUPS = {
  A: [
    'Leader giao thêm task khi bạn đang quá tải. Bạn sẽ nói gì?',
    'Bạn không đồng ý với quyết định của leader nhưng cuộc họp đang diễn ra. Bạn làm gì?',
    'Leader giải thích quy trình mà bạn thấy có lỗ hổng. Bạn phản hồi thế nào?',
  ],
  B: [
    'Đồng đội nộp bài thiếu thông tin lần thứ 3. Tin nhắn bạn gửi là gì?',
    'Bạn thấy đồng nghiệp dùng từ mơ hồ trong nhóm chat. Bạn phản hồi công khai hay riêng tư?',
    'Đồng đội hỏi câu mà bạn nghĩ họ nên tự tìm hiểu trước. Bạn trả lời thế nào?',
  ],
  C: [
    'Bạn phát hiện mình sẽ trễ deadline 2 tiếng. Bạn nhắn gì và nhắn lúc nào?',
    'Bạn không hiểu yêu cầu task nhưng đã hỏi 1 lần rồi. Bạn làm gì tiếp theo?',
    'Bạn phát hiện lỗi do người khác gây ra nhưng team sẽ thấy là lỗi chung. Bạn xử lý thế nào?',
  ],
};

const TRAINING_SLIDES = [
  { title: '2000 năm lập trình hành vi', sub: 'Bước 1 / 3',
    body: 'Văn hóa Nho giáo dạy chúng ta: im lặng là lịch sự, tránh xung đột là khôn ngoan. Nhưng trong tổ chức hiện đại, im lặng = thông tin bị chặn = quyết định sai = chi phí tăng.' },
  { title: 'Khi bạn im lặng, bạn đang gánh hộ', sub: 'Bước 2 / 3',
    body: 'Mỗi lần bạn không nói ra — bạn giữ lại rủi ro cho riêng mình. Sau 7 ngày, chi phí sửa lỗi gấp 10 lần chi phí nói thẳng ngay lúc đầu.' },
  { title: 'Nói thẳng sớm = tử tế nhất', sub: 'Bước 3 / 3',
    body: '"Tôi thấy có vấn đề ở điểm X" nói trong 15 giây — giúp tránh 3 ngày xử lý hậu quả. Giao tiếp thẳng thắn = ngôn ngữ của người chuyên nghiệp.' },
];

const STORIES = [
  { id: 'st1', experience_type: 'communication', courage_level: 'big', is_public: true,
    content: 'Tuần này tôi đã mạnh dạn nói thẳng với leader về deadline không thực tế. Kết quả là cả team được điều chỉnh scope hợp lý hơn.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    user: { name: 'Nguyễn Minh Anh' }, team: { name: 'Editor' },
    reactions: { brave: 12, respect: 8, learn: 5 } },
  { id: 'st2', experience_type: 'execution', courage_level: 'small', is_public: true,
    content: 'Lần đầu tôi dám hỏi lại khi không hiểu brief thay vì âm thầm làm sai. Tiết kiệm được cả ngày sửa.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user: { name: 'Lê Thị Thu Hà' }, team: { name: 'Design' },
    reactions: { brave: 7, respect: 11, learn: 9 } },
  { id: 'st3', experience_type: 'judgement', courage_level: 'breakthrough', is_public: true,
    content: 'Tôi đề xuất thay đổi quy trình deploy và được leader chấp nhận sau khi trình bày data cụ thể. Lần đầu cảm thấy tiếng nói của mình có giá trị.',
    created_at: new Date().toISOString(),
    user: { name: 'Đinh Quốc Việt' }, team: { name: 'IT/Tech' },
    reactions: { brave: 18, respect: 15, learn: 11 } },
  { id: 'st4', experience_type: 'late_ask', courage_level: 'big', is_public: false,
    content: 'Tôi công khai xin lỗi khi lỡ gửi sai quy chế làm việc từ xa vì không check bản cập nhật. Gửi đính chính trong vòng 1h.',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    user: { name: 'Nguyễn Thu Hà' }, team: { name: 'HR' },
    reactions: { brave: 9, respect: 14, learn: 10 } },
];

const CHALLENGES = {
  weekly: { id: 'ch1', type: 'weekly', points: 50,
    text: 'Tuần này, hãy nói thẳng 1 điều bạn chưa hài lòng trong công việc với leader của mình. Ghi lại phản ứng và kết quả.' },
  daily: [
    { id: 'ch2', type: 'daily', points: 10, text: 'Hôm nay, khi nhận task, hãy hỏi rõ "Done" nghĩa là gì và deadline cụ thể là khi nào.' },
    { id: 'ch3', type: 'daily', points: 10, text: 'Viết 1 tin nhắn cam kết với deadline cụ thể (ngày/giờ) thay vì dùng "sẽ cố gắng".' },
    { id: 'ch4', type: 'daily', points: 10, text: 'Hỏi thăm 1 đồng đội có vẻ mệt mỏi trong cuộc họp gần nhất.' },
  ],
};

const BEHAVIOR_SCORES = { try_score: 7.5, share_score: 6.0, learn_score: 8.2, help_score: 7.0, streak: 12, total_xp: 580 };

const MILESTONES = [
  { milestone: '1m',  completed_at: '2026-02-15', recap_note: 'Hoàn thành tháng đầu tiên. Đã quen với quy trình làm việc.' },
  { milestone: '3m',  completed_at: '2026-04-15', recap_note: 'Hoàn thành 3 tháng. Đã có đóng góp rõ ràng cho team.' },
];
const MILESTONE_DEFS = [
  { key: '1m', label: '1 Tháng' }, { key: '3m', label: '3 Tháng' },
  { key: '6m', label: '6 Tháng' }, { key: '1y', label: '1 Năm' }, { key: 'out', label: 'Tốt nghiệp' },
];

const TEAM_HEALTH = [
  { team_id: 'o3', team_name: 'Editor',  member_count: 15, health_index: 72, support_rate: 85,
    avg_scores_json: { try: 7.2, share: 6.5, learn: 8.0, help: 7.8, insights: 'Team đang có xu hướng giao tiếp cải thiện rõ rệt. Tỷ lệ chia sẻ công khai còn thấp so với mục tiêu.' } },
  { team_id: 'o7', team_name: 'Design',  member_count: 8,  health_index: 88, support_rate: 92,
    avg_scores_json: { try: 8.5, share: 7.8, learn: 8.2, help: 9.0, insights: 'Team có điểm cao đồng đều, văn hóa hỗ trợ nội bộ mạnh. Đề xuất nhân rộng làm hình mẫu.' } },
  { team_id: 'o5', team_name: 'IT/Tech', member_count: 20, health_index: 65, support_rate: 70,
    avg_scores_json: { try: 6.8, share: 5.5, learn: 7.5, help: 6.2, insights: 'Chỉ số chia sẻ thấp so với trung bình. Cần khuyến khích story sharing và challenge daily.' } },
];

const EXP_LABELS = { judgement:'Phán đoán', communication:'Giao tiếp', execution:'Thực thi', priority:'Ưu tiên', late_ask:'Thiếu hỏi sớm', overstepping:'Vượt quyền' };
const COURAGE_LABELS = { small: 'Nhỏ', big: 'Lớn', breakthrough: 'Đột phá' };
const ROLE_LABELS = { hr_manager: 'HR Manager', leader: 'Leader', member: 'Thành viên' };

/* HOOKS */
function useCountUp(target, duration = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0, start = null;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      setValue(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* SVG CHARTS */
function RadarChart({ labels, data, color = '#4F46E5', max = 10, size = 240 }) {
  const cx = size/2, cy = size/2, R = size*0.38;
  const n = labels.length;
  const angle = (i) => -Math.PI/2 + (2*Math.PI*i)/n;
  const point = (v, i) => { const r = (v/max) * R; return [cx + r*Math.cos(angle(i)), cy + r*Math.sin(angle(i))]; };
  const rings = [0.25, 0.5, 0.75, 1];
  const polyForRing = (ratio) => labels.map((_, i) => { const r = R * ratio; return `${cx + r*Math.cos(angle(i))},${cy + r*Math.sin(angle(i))}`; }).join(' ');
  const dataPoly = data.map((v, i) => point(v, i).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{ maxHeight: '100%' }}>
      {rings.map((r, k) => (<polygon key={k} points={polyForRing(r)} fill="none" stroke="#E5E7EB" strokeWidth="1" />))}
      {labels.map((_, i) => { const [x, y] = point(max, i); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E7EB" strokeWidth="1" />; })}
      <polygon points={dataPoly} fill={color} fillOpacity="0.12" stroke={color} strokeWidth="2" />
      {data.map((v, i) => { const [x, y] = point(v, i); return <circle key={i} cx={x} cy={y} r="3.5" fill={color} />; })}
      {labels.map((lb, i) => {
        const [x, y] = point(max * 1.18, i);
        return (<text key={i} x={x} y={y} fontSize="11" fontWeight="500" fontFamily="Be Vietnam Pro" fill="#4B5563" textAnchor="middle" dominantBaseline="middle">{lb}</text>);
      })}
    </svg>
  );
}

function LineChart({ labels, data, color = '#059669', max = 10, fill = true }) {
  const W = 300, H = 110, padL = 14, padR = 14, padT = 10, padB = 22;
  const cw = W - padL - padR, ch = H - padT - padB;
  const xAt = (i) => padL + (i/(labels.length-1)) * cw;
  const yAt = (v) => padT + (1 - v/max) * ch;
  const line = data.map((v, i) => `${i===0?'M':'L'}${xAt(i)},${yAt(v)}`).join(' ');
  const area = `${line} L${xAt(data.length-1)},${padT+ch} L${xAt(0)},${padT+ch} Z`;
  const gradId = `g${color.replace('#','')}`;
  const lastIdx = data.length - 1;
  const lastX = xAt(lastIdx), lastY = yAt(data[lastIdx]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((r, i) => (<line key={i} x1={padL} x2={W-padR} y1={padT + ch*r} y2={padT + ch*r} stroke="#F3F4F6" strokeWidth="1" />))}
      {fill && <path d={area} fill={`url(#${gradId})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (<circle key={i} cx={xAt(i)} cy={yAt(v)} r="2" fill={color} />))}
      <circle cx={lastX} cy={lastY} r="4" fill={color} stroke="#fff" strokeWidth="2" />
      <text x={lastX} y={lastY - 8} fontSize="11" fontWeight="500" fill={color} textAnchor="middle" fontFamily="Be Vietnam Pro" className="num-tab">{data[lastIdx]}</text>
      {labels.map((lb, i) => (<text key={i} x={xAt(i)} y={H-6} fontSize="11" fill="#9CA3AF" textAnchor="middle" fontFamily="Be Vietnam Pro">{lb}</text>))}
    </svg>
  );
}

function MiniBar({ label, value, max = 10, color }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] font-medium text-[#9CA3AF] mb-1">
        <span>{label}</span><span style={{ color }} className="num-tab">{value.toFixed(1)}</span>
      </div>
      <div className="h-1.5 bg-[#F4F5F8] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${(value/max)*100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

/* SHARED COMPONENTS */
function Badge({ variant = 'neutral', children }) {
  const variants = {
    high:    'bg-red-50 text-red-700 border-red-200',
    danger:  'bg-red-50 text-red-700 border-red-200',
    medium:  'bg-amber-50 text-amber-700 border-amber-200',
    warn:    'bg-amber-50 text-amber-700 border-amber-200',
    low:     'bg-green-50 text-green-700 border-green-200',
    ok:      'bg-green-50 text-green-700 border-green-200',
    info:    'bg-indigo-50 text-indigo-700 border-indigo-200',
    active:  'bg-indigo-50 text-indigo-700 border-indigo-200',
    neutral: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return <span className={`inline-flex items-center font-medium rounded-lg border px-2 py-0.5 text-[11px] ${variants[variant] || variants.neutral}`}>{children}</span>;
}

function Modal({ open, onClose, title, size = 'md', children }) {
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [open]);
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-[#111827]/50 backdrop-blur-sm"></div>
      <div className={`relative w-full ${sizes[size]} bg-white rounded-xl shadow-modal animate-scale-in max-h-[90vh] flex flex-col`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAECF0]">
            <h3 className="text-[16px] font-semibold text-[#111827] font-header">{title}</h3>
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-[#F4F5F8] text-[#4B5563] text-[12px] font-medium hover:bg-[#EAECF0]">✕</button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p className="text-[14px] font-semibold text-[#111827] font-header">{title}</p>
      <p className="text-[12px] text-[#9CA3AF] mt-1 max-w-xs">{description}</p>
    </div>
  );
}

/* HEATMAP */
function CultureHeatmap({ streakDays = 7 }) {
  const data = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const dd = String(d.getDate()).padStart(2,'0');
      days.push({ date: dd, deadline: Math.random() > 0.2 ? 1 : 0, wyfls: Math.random() > 0.3 ? 1 : 0, banned_words: Math.random() > 0.8 ? 1 : 0, direct_score: Math.floor(Math.random() * 6) });
    }
    return days;
  }, []);

  const rows = [
    { key: 'deadline', label: 'Tuân thủ deadline', getScore: d => d.deadline, getColor: s => s ? '#059669' : '#F4F5F8', getLabel: s => s ? 'Đúng hạn' : 'Trễ hạn' },
    { key: 'wyfls', label: 'Check-in WYFLS', getScore: d => d.wyfls, getColor: s => s ? '#4F46E5' : '#F4F5F8', getLabel: s => s ? 'Đã check-in' : 'Bỏ qua' },
    { key: 'banned', label: 'Ngôn ngữ sạch', getScore: d => d.banned_words ? 0 : 1, getColor: s => s ? '#111827' : '#FEF2F2', getLabel: s => s ? 'Ngôn ngữ sạch' : 'Có từ cấm' },
    { key: 'direct', label: 'Giao tiếp thẳng', getScore: d => d.direct_score, getColor: s => ['#F8F9FB','#E0E7FF','#C7D2FE','#A5B4FC','#818CF8','#4F46E5'][Math.max(0, Math.min(5, s))], getLabel: s => s === 0 ? 'Chưa đạt' : `Mức ${s}/5` },
  ];

  const last7 = data.slice(-7);
  const deadlineRate = Math.round((last7.filter(d => d.deadline).length / 7) * 100);
  const directAvg = Math.round(last7.reduce((s, d) => s + d.direct_score, 0) / 7 * 20);
  const bannedCount = data.filter(d => d.banned_words).length;

  return (
    <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1.5">14 NGÀY GẦN NHẤT</p>
          <h3 className="text-[16px] font-semibold text-[#111827] font-header">Bản đồ nhiệt văn hóa</h3>
        </div>
        <div className="flex items-center gap-2 bg-[#F8F9FB] border border-[#EAECF0] rounded-lg px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-[#059669]"></div>
          <p className="text-[12px] font-medium text-[#111827] num-tab">{streakDays} ngày streak</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 640 }}>
          <div className="grid mb-2" style={{ gridTemplateColumns: '140px repeat(14, 1fr)', gap: '4px' }}>
            <div />
            {data.map((d, i) => (<div key={i} className="text-[11px] text-center font-medium text-[#9CA3AF] num-tab">{d.date}</div>))}
          </div>
          <div className="space-y-1.5">
            {rows.map(row => (
              <div key={row.key} className="grid items-center" style={{ gridTemplateColumns: '140px repeat(14, 1fr)', gap: '4px' }}>
                <p className="text-[12px] font-medium text-[#4B5563]">{row.label}</p>
                {data.map((day, i) => {
                  const s = row.getScore(day);
                  return (<div key={i} title={`${day.date} · ${row.getLabel(s)}`} className="h-7 rounded-md border border-[#EAECF0] hover:scale-110 transition-all cursor-pointer" style={{ backgroundColor: row.getColor(s) }} />);
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#EAECF0]">
        <div className="text-center">
          <p className="text-[28px] font-semibold text-[#059669] font-header num-tab">{deadlineRate}%</p>
          <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.08em] mt-1">Deadline 7 ngày</p>
        </div>
        <div className="text-center">
          <p className="text-[28px] font-semibold text-[#4F46E5] font-header num-tab">{directAvg}</p>
          <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.08em] mt-1">Directness TB</p>
        </div>
        <div className="text-center">
          <p className={`text-[28px] font-semibold font-header num-tab ${bannedCount > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`}>{bannedCount}</p>
          <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.08em] mt-1">Từ cấm 14 ngày</p>
        </div>
      </div>
    </div>
  );
}

/* SIDEBAR + TOPBAR */
const IC = {
  home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  radar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  passport: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M7 21v-1a5 5 0 0 1 10 0v1"/></svg>,
  culture: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  chevron: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
};

const NAV = [
  { key: 'home',      label: 'Trang chủ',              sub: '',                        icon: IC.home },
  { key: 'retention', label: 'Radar Giữ Chân Nhân Sự', sub: 'Bản đồ rủi ro nhân sự',  icon: IC.radar },
  { key: 'passport',  label: 'Hộ Chiếu Giao Tiếp',     sub: 'Giao tiếp thẳng thắn',   icon: IC.passport },
  { key: 'culture',   label: 'Văn Hóa Đội Nhóm',       sub: 'Hệ điều hành văn hóa',   icon: IC.culture },
];

const PILLARS = [
  { label: 'Dám Làm',   color: '#4F46E5' },
  { label: 'Dám Sai',   color: '#DC2626' },
  { label: 'Nói Thẳng', color: '#059669' },
];

function Sidebar({ user, activePage, onNav }) {
  const [pillarsOpen, setPillarsOpen] = useState(false);

  const renderItem = (item) => {
    const active = activePage === item.key;
    return (
      <button key={item.key} onClick={() => onNav(item.key)}
        className={`w-full flex items-center gap-2.5 py-2 rounded-r-lg text-[13px] text-left transition-all ${active ? 'bg-transparent' : 'hover:bg-[#F4F5F8]'}`}
        style={active ? { borderLeft: '2px solid #4F46E5', paddingLeft: '10px', paddingRight: '12px' } : { paddingLeft: '12px', paddingRight: '12px' }}>
        <span style={{ color: active ? '#4F46E5' : '#9CA3AF' }}>{item.icon}</span>
        <div className="flex-1 min-w-0">
          <span className={`block truncate leading-tight font-medium ${active ? 'text-[#111827]' : 'text-[#4B5563]'}`}>{item.label}</span>
          {item.sub && <span className="text-[11px] font-normal truncate block mt-0.5 text-[#9CA3AF]">{item.sub}</span>}
        </div>
      </button>
    );
  };

  return (
    <aside className="w-[256px] min-h-screen bg-white flex flex-col flex-shrink-0 border-r border-[#EAECF0]">
      <div className="px-5 pt-5 pb-4 border-b border-[#EAECF0]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#C0392B] rounded-[10px] flex items-center justify-center text-white font-semibold text-base font-header">N</div>
          <div>
            <div className="text-[15px] font-semibold text-[#111827] font-header leading-tight">NhiLe HR</div>
            <div className="text-[11px] text-[#9CA3AF] font-normal mt-0.5">Culture OS · NhiLe Team</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        <div>
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] px-3 mb-1.5">Workspace</p>
          {renderItem(NAV[0])}
        </div>
        <div>
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] px-3 mb-1.5">HR Tools</p>
          <div className="space-y-0.5">{NAV.slice(1).map(renderItem)}</div>
        </div>
        <div>
          <button onClick={() => setPillarsOpen(o => !o)} className="w-full flex items-center justify-between px-3 mb-1.5 group">
            <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em]">Trụ cột văn hóa</p>
            <span className={`text-[#9CA3AF] transition-transform ${pillarsOpen ? 'rotate-180' : ''}`}>{IC.chevron}</span>
          </button>
          {pillarsOpen && (
            <div className="space-y-1 px-1 animate-fade-in">
              {PILLARS.map(p => (
                <div key={p.label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-medium text-[#4B5563]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                  {p.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
      <div className="px-3 py-4 border-t border-[#EAECF0]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-semibold text-sm" style={{ background: user.primary_role === 'hr_manager' ? '#C0392B' : user.primary_role === 'leader' ? '#4F46E5' : '#111827' }}>
            {user.full_name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-[#111827] truncate leading-tight">{user.full_name}</p>
            <p className="text-[11px] text-[#9CA3AF] font-normal mt-0.5">{ROLE_LABELS[user.primary_role]}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#059669]"></div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ user, onSwitchRole }) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Chào buổi sáng';
    if (h < 18) return 'Buổi chiều hiệu quả';
    return 'Chào buổi tối';
  })();
  return (
    <header className="h-[60px] border-b border-[#EAECF0] bg-white sticky top-0 z-40 flex items-center justify-between px-6">
      <div>
        <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] leading-none">{greeting}, {ROLE_LABELS[user.primary_role]}</p>
        <p className="text-[14px] font-semibold text-[#111827] font-header leading-tight mt-1">{user.full_name}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-[#F4F5F8] border border-[#EAECF0] rounded-[10px] p-1">
          <span className="text-[10px] font-medium text-[#9CA3AF] mr-1 ml-1.5 uppercase tracking-[0.08em]">Role</span>
          {['hr_manager','leader','member'].map(r => (
            <button key={r} onClick={() => onSwitchRole(r)}
              className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-all ${user.primary_role === r ? 'bg-white text-[#111827] shadow-sm' : 'text-[#9CA3AF] hover:text-[#4B5563]'}`}>
              {r === 'hr_manager' ? 'HR' : r === 'leader' ? 'Leader' : 'Member'}
            </button>
          ))}
        </div>
        <button className="relative w-9 h-9 rounded-lg bg-[#F4F5F8] border border-[#EAECF0] flex items-center justify-center text-[#4B5563] hover:bg-[#EAECF0]">
          {IC.bell}
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#DC2626] rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-medium num-tab">2</span>
          </span>
        </button>
      </div>
    </header>
  );
}

/* HOMEPAGE */
const IDENTITY_CHOICES = [
  { id: 'direct',  label: 'Người Dám Nói Thẳng', xp: '+20 XP', desc: 'Hôm nay tôi cam kết nói rõ ý kiến của mình, không dùng từ ngữ mập mờ.', color: '#4F46E5' },
  { id: 'learn',   label: 'Người Dám Sai', xp: '+15 XP', desc: 'Hôm nay tôi sẽ chia sẻ một bài học từ lỗi lầm nhỏ để team cùng tiến bộ.', color: '#D97706' },
  { id: 'support', label: 'Người Nâng Đỡ Đội Ngũ', xp: '+10 XP', desc: 'Hôm nay tôi sẽ chủ động nhắn tin hỏi thăm một đồng nghiệp ít nói.', color: '#059669' },
];

const REWRITE_HINTS = {
  'cố gắng': 'Hãy đưa ra thời gian hoàn thành cụ thể (VD: Xong trước 10h sáng mai)',
  'hy vọng': 'Đổi thành xác nhận hành động cụ thể.',
  'bình thường': 'Nếu có vấn đề, hãy nói rõ ràng điểm mà bạn thấy chưa ổn.',
  'sẽ cố': 'Thay bằng: "Tôi sẽ hoàn thành lúc [giờ cụ thể]".',
};

/* Card header utility */
function CardHeader({ eyebrow, title, right }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        {eyebrow && <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1.5">{eyebrow}</p>}
        <h3 className="text-[16px] font-semibold text-[#111827] font-header">{title}</h3>
      </div>
      {right}
    </div>
  );
}

/* Metric card per spec */
function MetricCard({ value, label, trend, trendVariant = 'neutral', urgent = false }) {
  return (
    <div className="bg-[#F8F9FB] rounded-xl p-5 relative">
      {urgent && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#DC2626] animate-urgent"></span>}
      <p className="text-[36px] font-semibold text-[#111827] font-header num-tab leading-none">{value}</p>
      <p className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-[0.08em] mt-3">{label}</p>
      {trend && <div className="mt-2"><Badge variant={trendVariant}>{trend}</Badge></div>}
    </div>
  );
}

function HomePage({ user, onNav }) {
  const [identity, setIdentity] = useState('direct');
  const [interventionOpen, setInterventionOpen] = useState(null);
  const xpDisplay = useCountUp(1240);
  const directness = 74;
  const directnessDisplay = useCountUp(directness);
  const dpColor = directness >= 70 ? '#059669' : directness >= 50 ? '#D97706' : '#DC2626';
  const identityConfig = IDENTITY_CHOICES.find(i => i.id === identity);
  const safetyAction = 'Hỏi thăm 1 đồng đội có vẻ mệt mỏi trong cuộc họp gần nhất';
  const showRetention = user.primary_role === 'hr_manager' || user.primary_role === 'leader';

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Hero card — dark gradient (replaces red) */}
      <div data-hero="brand" className="rounded-2xl p-6 relative overflow-hidden text-white" style={{ background: 'linear-gradient(90deg, #111827 0%, #1E293B 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-10 translate-x-10" style={{ background: 'rgba(192, 57, 43, 0.18)' }}></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <p className="text-[10px] font-medium text-white/50 uppercase tracking-[0.1em] mb-2">Chào buổi sáng, {ROLE_LABELS[user.primary_role]}</p>
            <h1 className="text-[24px] font-semibold text-white font-header leading-tight">{user.full_name}</h1>
            {identityConfig && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mt-3 text-[11px] font-medium" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: identityConfig.color }}></span>
                <span className="text-white/90">Hôm nay bạn là {identityConfig.label}</span>
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-white/50 font-medium uppercase tracking-[0.1em] mb-1">Điểm Văn Hóa</p>
            <p className="text-[32px] font-semibold font-header num-tab" style={{ color: '#C0392B' }}>{xpDisplay} <span className="text-[14px] text-white/50 font-medium">XP</span></p>
            <p className="text-[12px] text-[#059669] font-medium mt-1">7 ngày liên tiếp</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-5 relative z-10">
          <p className="text-[10px] font-medium text-white/50 uppercase tracking-[0.1em] mb-2">Nhiệm vụ hôm nay</p>
          <p className="text-[14px] text-white/90 font-normal leading-relaxed">"{safetyAction}"</p>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button onClick={() => onNav('culture')} className="px-4 py-2 bg-[#C0392B] text-white text-[12px] font-medium rounded-lg hover:bg-[#a8331f] transition-all">Ghi vào Bảng tin</button>
            <button onClick={() => onNav('passport')} className="px-4 py-2 bg-white/10 text-white border border-white/15 text-[12px] font-medium rounded-lg hover:bg-white/15">Vào Phòng Tập</button>
          </div>
        </div>
      </div>

      {/* Identity picker */}
      <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
        <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1.5">Hôm nay bạn chọn là ai?</p>
        <h3 className="text-[16px] font-semibold text-[#111827] font-header mb-4">Chọn vai trò bản thân</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {IDENTITY_CHOICES.map(c => (
            <button key={c.id} onClick={() => setIdentity(c.id)}
              className={`text-left p-4 rounded-xl border transition-all ${identity === c.id ? 'bg-[#F8F9FB]' : 'bg-white border-[#EAECF0] hover:bg-[#F8F9FB]'}`}
              style={identity === c.id ? { borderColor: c.color, borderWidth: '1.5px' } : {}}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[13px] font-semibold font-header text-[#111827]">{c.label}</h4>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md num-tab" style={{ background: identity === c.id ? c.color : '#F4F5F8', color: identity === c.id ? '#fff' : '#9CA3AF' }}>{c.xp}</span>
              </div>
              <p className="text-[12px] leading-relaxed text-[#4B5563]">{c.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div onClick={() => onNav('passport')} className="bg-white rounded-xl p-6 shadow-card border border-[#EAECF0] cursor-pointer hover:shadow-card-hover transition-all">
            <CardHeader eyebrow="MỨC ĐỘ MINH BẠCH" title="Chỉ số Thẳng Thắn" right={<span className="text-[24px] font-semibold font-header num-tab" style={{ color: dpColor }}>{directnessDisplay}</span>} />
            <div className="h-2 bg-[#F4F5F8] rounded-full overflow-hidden mb-2">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: directness + '%', backgroundColor: dpColor }}></div>
            </div>
            <p className="text-[12px] text-[#9CA3AF] flex justify-between">
              <span>Đang giữ phong độ tốt</span>
              <span className="text-[#4F46E5] font-medium">Cải thiện →</span>
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-card border border-[#EAECF0]">
            <CardHeader eyebrow="BIỂU ĐỒ 7 NGÀY" title="An Toàn Tâm Lý" right={<Badge variant="ok">8.4</Badge>} />
            <div className="h-[110px] w-full">
              <LineChart labels={DAY_LABELS} data={SAFETY_7D} color="#059669" max={10} fill />
            </div>
          </div>

          <MiniRewrite />
        </div>

        <div className="space-y-6">
          {showRetention && (
            <div className="bg-white border border-[#EAECF0] rounded-xl overflow-hidden shadow-card">
              <div className="px-5 py-4 border-b border-[#EAECF0] flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-0.5">Cảnh báo đỏ</p>
                  <h3 className="text-[14px] font-semibold text-[#111827] font-header flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-urgent"></span>
                    Cần can thiệp (2)
                  </h3>
                </div>
                <button onClick={() => onNav('retention')} className="text-[11px] font-medium text-[#4B5563] bg-[#F4F5F8] px-3 py-1.5 rounded-lg hover:bg-[#EAECF0] border border-[#EAECF0]">Mở Radar</button>
              </div>
              <div className="divide-y divide-[#EAECF0]">
                {MEMBERS.filter(m => m.risk_level === 'high' || m.risk_level === 'medium').slice(0, 2).map(m => (
                  <div key={m.id} className="p-4 hover:bg-[#F8F9FB] cursor-pointer transition-all" onClick={() => setInterventionOpen(m)}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full" style={{ background: m.risk_level === 'high' ? '#DC2626' : '#D97706' }}></span>
                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-[12px] font-medium" style={{ background: m.risk_level === 'high' ? '#DC2626' : '#D97706' }}>{m.user.name.charAt(0)}</div>
                        <div>
                          <p className="text-[13px] font-medium text-[#111827]">{m.user.name}</p>
                          <p className="text-[11px] text-[#9CA3AF]">{m.team.name}</p>
                        </div>
                      </div>
                      <Badge variant={m.risk_level === 'high' ? 'high' : 'medium'}>
                        Bế tắc {m.current_assignment?.stuck_since ? Math.floor((Date.now() - new Date(m.current_assignment.stuck_since).getTime()) / 86400000) : 5}d
                      </Badge>
                    </div>
                    {m.emotional && <p className="text-[12px] text-[#4B5563] bg-[#F8F9FB] p-3 rounded-lg italic leading-relaxed">{m.emotional}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 shadow-card border border-[#EAECF0]">
            <CardHeader eyebrow="CỘNG ĐỒNG" title="Nhịp Đập Văn Hóa" right={<button onClick={() => onNav('culture')} className="text-[11px] font-medium text-[#4F46E5] bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-100">Chia sẻ</button>} />
            <div className="space-y-3">
              {STORIES.slice(0, 2).map(s => (
                <div key={s.id} className="p-4 rounded-lg bg-[#F8F9FB] border border-[#EAECF0]">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-[10px] bg-[#C0392B] flex items-center justify-center text-white text-[12px] font-medium">{s.user.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#111827] truncate">{s.user.name}</p>
                      <p className="text-[11px] text-[#9CA3AF]">{s.team.name}</p>
                    </div>
                    <Badge variant={s.courage_level === 'breakthrough' ? 'info' : 'neutral'}>{EXP_LABELS[s.experience_type]}</Badge>
                  </div>
                  <p className="text-[12px] text-[#4B5563] leading-relaxed line-clamp-2">"{s.content}"</p>
                </div>
              ))}
            </div>
            <button onClick={() => onNav('culture')} className="w-full mt-4 py-2.5 text-[12px] font-medium text-[#4B5563] border border-dashed border-[#D1D5DB] rounded-lg hover:bg-[#F8F9FB]">Xem thêm câu chuyện</button>
          </div>
        </div>
      </div>

      {interventionOpen && <QuickInterventionModal member={interventionOpen} onClose={() => setInterventionOpen(null)} />}
    </div>
  );
}

function MiniRewrite() {
  const [text, setText] = useState('');
  const suggestion = (() => {
    const lo = text.toLowerCase();
    const k = Object.keys(REWRITE_HINTS).find(x => lo.includes(x));
    return k ? REWRITE_HINTS[k] : null;
  })();
  return (
    <div className="bg-white rounded-xl p-6 shadow-card border border-[#EAECF0]">
      <CardHeader eyebrow="REALTIME" title="Huấn luyện Giao Tiếp" />
      <textarea value={text} onChange={e => setText(e.target.value)}
        placeholder='Dán tin nhắn... VD: "Tôi sẽ cố hoàn thành trước thứ 6."'
        className="w-full h-20 bg-[#F8F9FB] border border-[#EAECF0] rounded-xl px-4 py-3 text-[13px] text-[#111827] resize-none focus:outline-none focus:border-[#4F46E5]/40 focus:bg-white transition-all placeholder-[#9CA3AF]" />
      {text.length > 5 && suggestion && (
        <div className="text-[12px] font-normal text-amber-700 bg-amber-50 px-4 py-3 mt-3 rounded-lg border border-amber-200">
          <strong className="font-medium">Gợi ý:</strong> {suggestion}
        </div>
      )}
      {text.length > 5 && !suggestion && (
        <div className="text-[12px] font-medium text-green-700 bg-green-50 px-4 py-3 mt-3 rounded-lg border border-green-200">
          ✓ Cách viết rõ ràng, giữ phong độ!
        </div>
      )}
    </div>
  );
}

function QuickInterventionModal({ member, onClose }) {
  const [sent, setSent] = useState(false);
  return (
    <Modal open onClose={onClose} title="Gợi ý Can thiệp" size="md">
      {!sent ? (
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-[#DC2626] font-semibold text-base border border-red-200">{member.user.name.charAt(0)}</div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#111827] font-header">{member.user.name}</h3>
              <div className="mt-1"><Badge variant="high">Đang có dấu hiệu bế tắc</Badge></div>
            </div>
          </div>
          {member.emotional && (
            <div className="bg-[#F8F9FB] border border-[#EAECF0] rounded-xl p-4">
              <p className="text-[12px] text-[#4B5563] italic leading-relaxed">"{member.emotional}"</p>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em]">Chọn kịch bản tiếp cận</p>
            <button onClick={() => setSent(true)} className="w-full text-left p-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              <p className="text-[13px] font-medium text-[#4F46E5] mb-1">Quan Tâm Chân Thành</p>
              <p className="text-[12px] text-[#4F46E5]/80">"Mình thấy bạn có vẻ đang mang áp lực. Mình ở đây để nghe bạn nói, không phán xét."</p>
            </button>
            <button onClick={() => setSent(true)} className="w-full text-left p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors">
              <p className="text-[13px] font-medium text-amber-700 mb-1">Đối Thoại Trực Diện</p>
              <p className="text-[12px] text-amber-700/80">"Thấy bạn bế tắc mấy ngày rồi. Mình ngồi với nhau 15 phút nhé để xem vấn đề ở đâu."</p>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto border border-green-200">
            <svg className="w-8 h-8 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
          </div>
          <h3 className="text-[20px] font-semibold text-[#111827] font-header">Đã ghi nhận!</h3>
          <p className="text-[13px] text-[#4B5563]">Cuộc trò chuyện đã được log. Sự quan tâm của bạn sẽ là chìa khóa mở nút thắt.</p>
          <button onClick={onClose} className="w-full py-3 bg-[#C0392B] text-white rounded-xl text-[13px] font-medium hover:bg-[#a8331f] transition-all">Hoàn thành</button>
        </div>
      )}
    </Modal>
  );
}

/* RETENTION */
function RetentionPage({ user }) {
  const [interventionMember, setInterventionMember] = useState(null);
  const [warnLeader, setWarnLeader] = useState(null);
  const [coachLeader, setCoachLeader] = useState(null);
  const highRiskMembers = MEMBERS.filter(m => m.risk_level === 'high' || m.risk_level === 'medium');
  const stableMembers = MEMBERS.filter(m => m.risk_level === 'low');

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1.5">Không gian HR & Leader</p>
        <h1 className="text-[24px] font-semibold text-[#111827] font-header tracking-tight">Radar Giữ Chân Nhân Sự</h1>
        <p className="text-[13px] text-[#4B5563] mt-1.5 max-w-xl">Khám phá sớm các rào cản để can thiệp kịp thời. Đừng để sự im lặng kéo dài.</p>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#DC2626] flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div className="flex-1">
          <h3 className="text-[11px] font-medium text-[#DC2626] uppercase tracking-[0.1em] mb-2">Đang cần bạn lúc này</h3>
          <div className="flex flex-col gap-1.5">
            {RETENTION_DASHBOARD.recent_alerts.map((a, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-[12px] text-[#4B5563] bg-white rounded-lg px-3 py-2 border border-red-200">
                <span className="font-medium text-[#111827]">{a.member_name}</span>
                <span className="text-[#D1D5DB]">•</span>
                <span>Bế tắc <strong className="font-medium num-tab text-[#DC2626]">{a.days_ago} ngày</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard value={RETENTION_DASHBOARD.high_risk} label="Cần can thiệp" trend="cao" trendVariant="high" urgent />
        <MetricCard value={RETENTION_DASHBOARD.stuck_count} label="Đang bế tắc" trend="theo dõi" trendVariant="medium" urgent />
        <MetricCard value={RETENTION_DASHBOARD.checkpoints_due} label="Sắp đến hạn" trend="tuần này" trendVariant="info" />
        <MetricCard value={RETENTION_DASHBOARD.total_members} label="Thành viên" trend="ổn định" trendVariant="ok" />
      </div>

      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAECF0] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1">Nguy cơ cao</p>
            <h2 className="text-[16px] font-semibold text-[#111827] font-header">Ưu tiên xử lý ({highRiskMembers.length})</h2>
          </div>
        </div>
        <div className="divide-y divide-[#EAECF0]">
          {highRiskMembers.map(m => <UrgentMember key={m.id} member={m} onIntervene={() => setInterventionMember(m)} />)}
        </div>
      </div>

      <div className="bg-white border border-[#EAECF0] rounded-xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EAECF0]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1">Tốt</p>
          <h2 className="text-[16px] font-semibold text-[#111827] font-header">Đang hòa nhập tốt ({stableMembers.length})</h2>
        </div>
        <div className="divide-y divide-[#EAECF0]">
          {stableMembers.map(m => <StableMemberRow key={m.id} member={m} />)}
        </div>
      </div>

      {user.primary_role === 'hr_manager' && (
        <div className="bg-white border border-[#EAECF0] rounded-xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EAECF0]">
            <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1">Lãnh đạo</p>
            <h2 className="text-[16px] font-semibold text-[#111827] font-header">Phân tích Leader</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {LEADER_METRICS.map(lm => (<LeaderCard key={lm.id} lm={lm} onWarn={() => setWarnLeader(lm)} onCoach={() => setCoachLeader(lm)} />))}
          </div>
        </div>
      )}

      {interventionMember && <InterventionModal member={interventionMember} onClose={() => setInterventionMember(null)} />}
      {warnLeader && (
        <Modal open onClose={() => setWarnLeader(null)} title="Nhắc nhở nhẹ" size="sm">
          <div className="p-6 text-center">
            <p className="text-[13px] text-[#4B5563] mb-5">Xác nhận gửi thông báo nhắc nhở 1-on-1 cho <br /><strong className="text-[#111827] font-medium">{warnLeader.leader.name}</strong>?</p>
            <button onClick={() => setWarnLeader(null)} className="w-full py-3 bg-[#D97706] text-white font-medium text-[13px] rounded-xl hover:bg-[#b45309]">Đã gửi nhắc nhở</button>
          </div>
        </Modal>
      )}
      {coachLeader && (
        <Modal open onClose={() => setCoachLeader(null)} title="Yêu cầu Coaching" size="sm">
          <div className="p-6 text-center">
            <p className="text-[13px] text-[#4B5563] mb-5">Team của <strong className="text-[#111827] font-medium">{coachLeader.leader.name}</strong> đang có tỷ lệ nghỉ việc cao. Tạo request Coaching?</p>
            <button onClick={() => setCoachLeader(null)} className="w-full py-3 bg-[#4F46E5] text-white font-medium text-[13px] rounded-xl hover:bg-[#4338ca]">Tạo lịch hẹn</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function UrgentMember({ member, onIntervene }) {
  const stuckDays = member.current_assignment?.stuck_since ? Math.floor((Date.now() - new Date(member.current_assignment.stuck_since).getTime()) / 86400000) : 0;
  const isHigh = member.risk_level === 'high';
  const dotColor = isHigh ? '#DC2626' : '#D97706';
  return (
    <div className="px-6 py-4 hover:bg-[#F8F9FB] transition-all">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }}></span>
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white text-[13px] font-medium" style={{ background: dotColor }}>{member.user.name.charAt(0)}</div>
          <div>
            <p className="text-[13px] font-medium text-[#111827]">{member.user.name}</p>
            <p className="text-[11px] text-[#9CA3AF]">{member.team.name} · {member.current_assignment?.leader?.name || 'Chưa rõ'}</p>
          </div>
        </div>
        <div className="flex bg-[#F8F9FB] rounded-lg px-4 py-2.5 gap-5 border border-[#EAECF0]">
          <div className="text-center">
            <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-[0.08em] mb-0.5">Bế tắc</p>
            <p className={`text-[14px] font-semibold font-header num-tab ${stuckDays >= 14 ? 'text-[#DC2626]' : 'text-[#111827]'}`}>{stuckDays > 0 ? `${stuckDays}d` : '—'}</p>
          </div>
          <div className="w-px bg-[#EAECF0]"></div>
          <div className="text-center">
            <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-[0.08em] mb-0.5">Thích nghi</p>
            <p className="text-[14px] font-semibold font-header text-[#111827] num-tab">{member.days_in_team}/90</p>
          </div>
        </div>
        <button onClick={onIntervene} className="w-full md:w-auto px-4 py-2.5 bg-[#C0392B] text-white font-medium text-[12px] rounded-lg hover:bg-[#a8331f] active:scale-[0.97]">Can thiệp ngay</button>
      </div>
    </div>
  );
}

function StableMemberRow({ member }) {
  return (
    <div className="px-6 py-3.5 flex items-center gap-3 hover:bg-[#F8F9FB] transition-all">
      <span className="w-2 h-2 rounded-full bg-[#059669] flex-shrink-0"></span>
      <div className="w-9 h-9 rounded-[10px] bg-green-50 text-[#059669] flex items-center justify-center text-[12px] font-medium border border-green-200">{member.user.name.charAt(0)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-[#111827] truncate">{member.user.name}</p>
        <p className="text-[11px] text-[#9CA3AF]"><span className="num-tab">{member.days_in_team}/90</span> ngày · {member.team.name}</p>
      </div>
      <Badge variant="ok">Tốt</Badge>
    </div>
  );
}

function LeaderCard({ lm, onWarn, onCoach }) {
  const turnoverHigh = (lm.turnover_rate_3m ?? 0) > 20;
  return (
    <div className="bg-[#F8F9FB] rounded-xl p-5 text-center">
      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5] font-semibold text-base mx-auto mb-3 border border-indigo-200">{lm.leader.name.charAt(0)}</div>
      <h3 className="text-[14px] font-semibold text-[#111827] font-header">{lm.leader.name}</h3>
      <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.06em] mt-0.5">{lm.team.name} · <span className="num-tab">{lm.team_size}</span> người</p>
      <div className="mt-3 flex gap-2 justify-center flex-wrap">
        <Badge variant={turnoverHigh ? 'high' : 'neutral'}>Rời đi: <span className="num-tab ml-1">{lm.turnover_rate_3m}%</span></Badge>
        <Badge variant="info">Năng lượng: <span className="num-tab ml-1">{lm.engage_score}/10</span></Badge>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={onWarn} className="py-2 border border-amber-200 bg-amber-50 text-amber-700 font-medium text-[11px] rounded-lg hover:bg-amber-100">Nhắc nhẹ</button>
        <button onClick={onCoach} className="py-2 bg-[#4F46E5] text-white font-medium text-[11px] rounded-lg hover:bg-[#4338ca]">Huấn luyện</button>
      </div>
    </div>
  );
}

function InterventionModal({ member, onClose }) {
  const [step, setStep] = useState('info');
  const stuckDays = member.current_assignment?.stuck_since ? Math.floor((Date.now() - new Date(member.current_assignment.stuck_since).getTime()) / 86400000) : 0;
  return (
    <Modal open onClose={onClose} title="Can thiệp" size="md">
      {step === 'info' ? (
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-[#DC2626] font-semibold text-base border border-red-200">{member.user.name.charAt(0)}</div>
            <div>
              <h2 className="text-[16px] font-semibold text-[#111827] font-header">{member.user.name}</h2>
              <p className="text-[12px] text-[#9CA3AF]">{member.team.name} · Bế tắc <strong className="text-[#DC2626] font-medium num-tab">{stuckDays} ngày</strong></p>
            </div>
          </div>
          <div className="bg-[#F8F9FB] border border-[#EAECF0] rounded-xl p-4">
            <p className="text-[12px] text-[#4B5563] italic leading-relaxed">"Nhân sự có xu hướng muốn nghỉ việc do thiếu gắn kết và phản hồi từ Trưởng nhóm."</p>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em]">Chọn kịch bản phù hợp</p>
            <button onClick={() => setStep('done')} className="w-full text-left p-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100">
              <p className="text-[13px] font-medium text-[#4F46E5] mb-1">Nhắn tin trò chuyện nhanh</p>
              <p className="text-[12px] text-[#4F46E5]/80">Bắt chuyện nhẹ nhàng, không tạo áp lực.</p>
            </button>
            <button onClick={() => setStep('done')} className="w-full text-left p-4 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100">
              <p className="text-[13px] font-medium text-amber-700 mb-1">Đặt lịch 1-on-1 khẩn cấp</p>
              <p className="text-[12px] text-amber-700/80">Mời gọi thảo luận trực tiếp qua Coffee Meeting.</p>
            </button>
          </div>
          <button onClick={onClose} className="w-full py-2.5 bg-[#F4F5F8] text-[#4B5563] font-medium text-[12px] rounded-lg hover:bg-[#EAECF0] border border-[#EAECF0]">Chưa làm bây giờ</button>
        </div>
      ) : (
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto border border-green-200">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-[18px] font-semibold font-header text-[#111827]">Đã ghi nhận!</h2>
          <p className="text-[13px] text-[#4B5563]">Hành động vừa tạo ra sự an toàn tâm lý. Cuộc trò chuyện đã được log vào hệ thống.</p>
          <button onClick={onClose} className="w-full py-3 bg-[#C0392B] text-white font-medium text-[13px] rounded-xl hover:bg-[#a8331f]">Hoàn thành</button>
        </div>
      )}
    </Modal>
  );
}

/* PASSPORT */
const PASSPORT_TABS = [
  { key: 'member',       label: 'Cá nhân' },
  { key: 'leader',       label: 'Quản lý',       roles: ['leader','hr_manager'] },
  { key: 'mirror',       label: 'Gương Soi',     roles: ['leader','hr_manager'] },
  { key: 'hr_dashboard', label: 'Góc nhìn HR',   roles: ['hr_manager'] },
  { key: 'train',        label: 'Phòng Tập Giao Tiếp' },
];

function PassportPage({ user }) {
  const visibleTabs = PASSPORT_TABS.filter(t => !t.roles || t.roles.includes(user.primary_role));
  const [tab, setTab] = useState('member');
  useEffect(() => { if (!visibleTabs.find(t => t.key === tab)) setTab('member'); }, [user.primary_role]);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1.5">Hộ Chiếu Giao Tiếp</p>
        <h1 className="text-[24px] font-semibold text-[#111827] font-header tracking-tight">Hộ Chiếu Giao Tiếp</h1>
        <p className="text-[13px] text-[#4B5563] mt-1.5 max-w-xl">Nơi bạn rèn luyện và đo lường độ phản xạ khi giải quyết vấn đề. Từ chối sự mập mờ, hướng tới thẳng thắn.</p>
      </div>
      <div className="flex gap-1 flex-wrap bg-white p-1 rounded-xl border border-[#EAECF0] w-max shadow-card">
        {visibleTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${tab === t.key ? 'bg-[#111827] text-white' : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F8F9FB]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="animate-fade-in" key={tab}>
        {tab === 'member' && <MemberDashboard />}
        {tab === 'leader' && <LeaderDashboard />}
        {tab === 'mirror' && <MirrorView />}
        {tab === 'train' && <RewriteLab />}
        {tab === 'hr_dashboard' && <HRPassportDashboard />}
      </div>
    </div>
  );
}

function MemberDashboard() {
  const [showSlides, setShowSlides] = useState(false);
  const xpDisplay = useCountUp(PASSPORT_PROFILE.culture_xp);
  const todayPrompt = 'Có điều gì bạn biết nhưng chưa nói với team trong 3 ngày qua không? Hôm nay là ngày để nói.';

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] rounded-xl p-5 flex items-start gap-4">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-medium text-white/50 uppercase tracking-[0.1em] mb-1.5">Câu hỏi khai phá hôm nay</p>
          <p className="text-[13px] text-white/90 leading-relaxed">{todayPrompt}</p>
        </div>
        <button onClick={() => setShowSlides(true)} className="text-[11px] font-medium text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg whitespace-nowrap">Ôn lại bài</button>
      </div>

      <div data-hero="brand" className="rounded-2xl p-7 text-white relative overflow-hidden" style={{ background: 'linear-gradient(90deg, #111827 0%, #1E293B 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-8 translate-x-8" style={{ background: 'rgba(192,57,43,0.15)' }}></div>
        <div className="relative z-10">
          <p className="text-white/50 text-[10px] uppercase tracking-[0.1em] font-medium mb-2">Điểm Văn Hóa Tích Lũy</p>
          <h2 className="text-[48px] font-semibold font-header mb-3 num-tab" style={{ color: '#C0392B' }}>{xpDisplay} <span className="text-[18px] text-white/50 font-medium">XP</span></h2>
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
            <span className="text-[12px] font-medium num-tab">Giữ nhịp: {PASSPORT_PROFILE.streak_days} ngày</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
          <CardHeader eyebrow="ĐIỂM CÁ NHÂN" title="Chỉ số Thẳng Thắn" />
          <div className="flex items-end gap-2 mb-3">
            <span className="text-[36px] font-semibold font-header text-[#4F46E5] num-tab leading-none">{PASSPORT_PROFILE.directness_score}</span>
            <span className="text-[#9CA3AF] font-medium mb-1 text-sm">/ 10</span>
          </div>
          <div className="h-2 bg-[#F4F5F8] rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full bg-[#4F46E5] transition-all duration-1000" style={{ width: `${PASSPORT_PROFILE.directness_score * 10}%` }}></div>
          </div>
          <p className="text-[12px] text-[#9CA3AF]">Tiếp tục rèn luyện trong Phòng Tập để tăng điểm.</p>
        </div>

        <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
          <CardHeader eyebrow="BIỂU ĐỒ 7 NGÀY" title="Cảm giác An Toàn" />
          <div className="h-[120px]">
            <LineChart labels={DAY_LABELS} data={SAFETY_7D} color="#059669" max={10} fill />
          </div>
        </div>
      </div>

      <CultureHeatmap streakDays={PASSPORT_PROFILE.streak_days} />
      {showSlides && <TrainingSlides onClose={() => setShowSlides(false)} />}
    </div>
  );
}

function LeaderDashboard() {
  const scoreRaw = Math.round(LEADER_INTEGRITY.integrity_score * 100);
  const score = useCountUp(scoreRaw);
  const isGood = scoreRaw >= 70;

  return (
    <div className="space-y-6">
      <div data-hero={isGood ? undefined : "brand"} className="rounded-2xl p-7 text-white relative overflow-hidden" style={{ background: isGood ? 'linear-gradient(90deg, #059669 0%, #047857 100%)' : 'linear-gradient(90deg, #111827 0%, #1E293B 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
        <div className="relative z-10">
          <p className="text-white/60 text-[10px] uppercase tracking-[0.1em] font-medium mb-2">Độ tin cậy của Quản lý</p>
          <h2 className="text-[48px] font-semibold font-header num-tab leading-none">{score} <span className="text-[18px] opacity-50">/ 100</span></h2>
          <p className="text-[13px] font-normal mt-3 text-white/70">Dẫn dắt bằng sự Thẳng Thắn. Đội ngũ sẽ học theo bạn.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
          <CardHeader eyebrow="MA TRẬN" title="Ma trận Chuyên Nghiệp" />
          <div className="h-[280px]">
            <RadarChart labels={['Tốc độ PH','Minh bạch','Ngôn ngữ','Hoàn thành','Thẳng thắn']}
              data={[LEADER_INTEGRITY.feedback_timeliness, LEADER_INTEGRITY.wyfl_compliance, LEADER_INTEGRITY.language_standard, LEADER_INTEGRITY.scenario_completion, LEADER_INTEGRITY.directness]}
              max={10} color="#4F46E5" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
          <CardHeader eyebrow="KHUYẾN NGHỊ" title="Gợi ý thay đổi hành vi" />
          <div className="space-y-3">
            {IMPROVEMENT_SUGGESTIONS.map((s, i) => (
              <div key={i} className="flex gap-3 p-4 bg-[#F8F9FB] border border-[#EAECF0] rounded-lg">
                <span className="text-[#4F46E5] font-medium text-base flex-shrink-0">→</span>
                <span className="text-[13px] text-[#4B5563] leading-relaxed">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MirrorView() {
  const lScore = MIRROR.leaderDirectness;
  const tScore = MIRROR.teamDirectness;
  const diff = lScore - tScore;
  const lDisp = useCountUp(lScore);
  const tDisp = useCountUp(tScore);
  const lColor = lScore >= 70 ? '#059669' : lScore >= 50 ? '#D97706' : '#DC2626';
  const tColor = tScore >= 70 ? '#059669' : tScore >= 50 ? '#D97706' : '#DC2626';
  let gap = { variant: 'ok', text: 'Đang đồng thuận tốt' };
  if (diff > 10) gap = { variant: 'info', text: 'Leader đang dẫn đầu về thẳng thắn' };
  if (diff < -10) gap = { variant: 'high', text: 'Cảnh báo: Đội ngũ thẳng thắn hơn leader — hãy dẫn đầu bằng ví dụ.' };

  const Dial = ({ score, disp, color, label }) => (
    <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card text-center">
      <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-4">{label}</p>
      <div className="relative w-28 h-28 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#F4F5F8" strokeWidth="10" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10" strokeDasharray={`${score * 2.638} 263.8`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[28px] font-semibold text-[#111827] font-header num-tab">{disp}</span>
        </div>
      </div>
      <p className="text-[12px] text-[#9CA3AF]">/ 100 điểm thẳng thắn</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#111827] rounded-xl p-5 text-white">
        <p className="text-[13px] text-white/70 leading-relaxed italic">"Trước khi xem data của team – đây là data của bạn."</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Dial score={lScore} disp={lDisp} color={lColor} label="Chỉ số của leader" />
        <Dial score={tScore} disp={tDisp} color={tColor} label="Chỉ số trung bình đội nhóm" />
      </div>
      <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
        <div className="mb-4"><Badge variant={gap.variant}>{gap.text}</Badge></div>
        <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-3">Cụm từ mơ hồ leader dùng tuần này</p>
        <div className="flex flex-wrap gap-2">
          {MIRROR.leaderVaguePhrases.map((p, i) => (<Badge key={i} variant="medium">"{p}"</Badge>))}
        </div>
      </div>
    </div>
  );
}

function parseHighlights(text) {
  const all = [
    ...SILENCE_PATTERNS.map(t => ({ term: t, cls: 'hl-silence' })),
    ...VAGUE_PATTERNS.map(t => ({ term: t, cls: 'hl-vague' })),
    ...DIRECT_PATTERNS.map(t => ({ term: t, cls: 'hl-direct' })),
    ...FACE_PATTERNS.map(t => ({ term: t, cls: 'hl-face' })),
  ];
  const lo = text.toLowerCase();
  const ranges = [];
  all.forEach(it => {
    let i = lo.indexOf(it.term);
    while (i !== -1) { ranges.push({ start: i, end: i + it.term.length, cls: it.cls }); i = lo.indexOf(it.term, i + it.term.length); }
  });
  ranges.sort((a, b) => a.start - b.start || b.end - a.end);
  const merged = [];
  ranges.forEach(r => { const last = merged[merged.length - 1]; if (!last || r.start >= last.end) merged.push(r); });
  const segs = []; let cur = 0;
  merged.forEach(r => { if (r.start > cur) segs.push({ text: text.slice(cur, r.start) }); segs.push({ text: text.slice(r.start, r.end), cls: r.cls }); cur = r.end; });
  if (cur < text.length) segs.push({ text: text.slice(cur) });
  return segs;
}

function computeScore(text) {
  if (!text || text.trim().length < 3) return null;
  let s = 50;
  const sil = text.match(/không sao|bình thường|ok em|dạ được|chờ xem|thôi bỏ qua|để tính|có lẽ/gi) || [];
  const vag = text.match(/cố gắng|sẽ làm|hy vọng|mong là|có thể|thử xem|cố thôi/gi) || [];
  const dir = text.match(/không đồng ý|cụ thể là|cần|thời hạn|vì lý do|giải pháp|chốt|đề xuất/gi) || [];
  s -= sil.length * 15; s -= vag.length * 10; s += dir.length * 20;
  if (/\d{1,2}[:h]\d{0,2}/i.test(text)) s += 15;
  return Math.max(0, Math.min(100, s));
}

function buildRewrite(text) {
  let r = text.trim();
  const rules = { 'sẽ cố gắng hoàn thành': 'sẽ hoàn thành và gửi lúc 17:00 hôm nay', 'có lẽ ok': 'được, tôi xác nhận', 'không sao': 'Tôi thấy có điểm chưa hợp lý tại...', 'sẽ cố': 'Tôi cam kết hoàn thành vào [Thứ/Giờ]', 'hy vọng': 'Tôi cam kết', 'bình thường': 'Thực tế tôi mong đợi' };
  const lo = r.toLowerCase();
  Object.entries(rules).forEach(([k, v]) => { if (lo.includes(k)) r = r.replace(new RegExp(k, 'gi'), v); });
  if (!/\b\d{1,2}[:h]\d{0,2}/i.test(r)) r += ' Tôi sẽ phản hồi mốc tiếp theo lúc 16:00 hôm nay.';
  if (!/tôi\s+sẽ|tôi\s+không\s+thể|tôi\s+cần/i.test(r)) r = `Tôi cần làm rõ như sau: ${r}`;
  return r;
}

function RewriteLab() {
  const [text, setText] = useState('');
  const [group, setGroup] = useState('A');
  const [sIdx, setSIdx] = useState(0);
  const [sResp, setSResp] = useState('');
  const [showSilence, setShowSilence] = useState(false);
  const [showSlides, setShowSlides] = useState(false);

  const score = useMemo(() => computeScore(text), [text]);
  const sScore = useMemo(() => computeScore(sResp), [sResp]);
  const highlights = text ? parseHighlights(text) : [];
  const rewrite = text.trim() ? buildRewrite(text) : '';
  const isDirect = score !== null && score >= 70;
  const isVague = score !== null && score >= 50 && score < 70;
  const isSilent = score !== null && score < 50;
  const statusColor = isDirect ? '#059669' : isVague ? '#D97706' : isSilent ? '#DC2626' : '#9CA3AF';
  const statusLabel = isDirect ? 'NÓI THẲNG' : isVague ? 'CÒN MƠ HỒ' : isSilent ? 'ĐANG NÉ TRÁNH' : 'CHƯA ĐÁNH GIÁ';
  const currentScenario = SCENARIO_GROUPS[group][sIdx % SCENARIO_GROUPS[group].length];
  const sColor = sScore !== null ? (sScore >= 70 ? '#059669' : sScore >= 50 ? '#D97706' : '#DC2626') : '#9CA3AF';
  const sLabel = sScore !== null ? (sScore >= 70 ? 'NÓI THẲNG' : sScore >= 50 ? 'CÒN MƠ HỒ' : 'ĐANG NÉ TRÁNH') : 'CHƯA ĐÁNH GIÁ';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#EAECF0] shadow-card">
        <div>
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1.5">Phòng Tập</p>
          <h2 className="text-[16px] font-semibold text-[#111827] font-header">Phòng Tập Giao Tiếp</h2>
          <p className="text-[12px] text-[#4B5563] mt-1">Viết thử vào ô bên dưới, hệ thống sẽ chỉ ra lỗi né tránh của bạn.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowSlides(true)} className="px-4 py-2 border border-[#EAECF0] bg-[#F8F9FB] text-[#4B5563] font-medium text-[12px] rounded-lg hover:bg-[#EAECF0]">Ôn lại bài</button>
          <button onClick={() => setShowSilence(true)} className="px-4 py-2 border border-red-200 bg-red-50 text-[#DC2626] font-medium text-[12px] rounded-lg hover:bg-red-100">Xem Thiệt Hại Của Im Lặng</button>
        </div>
      </div>

      {score !== null && (
        <div className="bg-white rounded-xl border border-[#EAECF0] p-4 shadow-card flex items-center gap-4">
          <div className="px-3 py-1.5 rounded-lg font-medium text-[11px] uppercase tracking-[0.06em] bg-[#F8F9FB]" style={{ color: statusColor }}>{statusLabel}</div>
          <div className="flex-1 h-2 bg-[#F4F5F8] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${score}%`, backgroundColor: statusColor }}></div>
          </div>
          <div className="font-semibold font-header text-[20px] num-tab" style={{ color: statusColor }}>{score}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card flex flex-col gap-4">
          <h3 className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span> Bản Nháp
          </h3>
          <textarea value={text} onChange={e => setText(e.target.value)}
            className="w-full h-44 bg-[#F8F9FB] border border-[#EAECF0] focus:border-[#4F46E5]/40 focus:bg-white rounded-xl p-4 text-[13px] text-[#111827] resize-none outline-none transition-all placeholder-[#9CA3AF]"
            placeholder="VD: Tuần này chắc sẽ hơi trễ xíu, mong mọi người thông cảm bình thường thôi vì task nhiều quá..." />
        </div>
        <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card flex flex-col gap-4">
          {!text.trim() ? (
            <div className="flex-1 border border-dashed border-[#D1D5DB] rounded-xl flex flex-col items-center justify-center text-[#9CA3AF] p-6 text-center min-h-[180px]">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <p className="text-[12px] font-medium text-[#9CA3AF]">Bắt đầu gõ để nhận phân tích từ hệ thống</p>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span> Phát hiện rào cản
                </h3>
                <div className="bg-[#F8F9FB] rounded-xl p-4 text-[13px] leading-loose border border-[#EAECF0]">
                  {highlights.map((seg, i) => seg.cls ? <span key={i} className={seg.cls}>{seg.text}</span> : <span key={i}>{seg.text}</span>)}
                </div>
              </div>
              <div>
                <h3 className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#059669]"></span> Gợi ý viết lại
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-[13px] text-green-800 leading-relaxed">{rewrite}</div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#EAECF0]">
                <Badge variant="high">Im lặng</Badge>
                <Badge variant="medium">Mơ hồ</Badge>
                <Badge variant="ok">Thẳng thắn</Badge>
                <Badge variant="info">Giữ thể diện</Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
        <CardHeader eyebrow="LUYỆN TẬP" title="Luyện Phản Xạ Tình Huống" />
        <div className="flex gap-1 mb-4 bg-[#F4F5F8] p-1 rounded-lg w-max border border-[#EAECF0]">
          {[['A','Leader & Bạn'],['B','Đồng nghiệp'],['C','Tự chịu trách nhiệm']].map(([k, l]) => (
            <button key={k} onClick={() => { setGroup(k); setSIdx(0); setSResp(''); }}
              className={`text-[11px] font-medium px-3 py-1.5 rounded-md transition-all ${group === k ? 'bg-white text-[#111827] shadow-sm' : 'text-[#9CA3AF] hover:text-[#4B5563]'}`}>
              {k} – {l}
            </button>
          ))}
        </div>
        <div className="bg-[#F8F9FB] border border-[#EAECF0] rounded-xl p-4 mb-3">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1.5">Tình huống</p>
          <p className="text-[13px] text-[#111827] leading-relaxed">{currentScenario}</p>
        </div>
        <textarea value={sResp} onChange={e => setSResp(e.target.value)} rows="3"
          className="w-full bg-[#F8F9FB] border border-[#EAECF0] focus:border-[#4F46E5]/40 focus:bg-white rounded-xl p-4 text-[13px] resize-none outline-none placeholder-[#9CA3AF] mb-3"
          placeholder="Gõ phản hồi của bạn..." />
        <div className="flex items-center justify-between flex-wrap gap-3">
          {sScore !== null && <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-[#F8F9FB] uppercase tracking-[0.06em]" style={{ color: sColor }}>{sLabel}</span>}
          <button onClick={() => { setSIdx(sIdx + 1); setSResp(''); }} className="ml-auto px-4 py-2 bg-[#111827] text-white font-medium text-[12px] rounded-lg hover:bg-[#1F2937]">Kịch bản tiếp theo</button>
        </div>
      </div>

      {showSilence && <SilenceCost onClose={() => setShowSilence(false)} />}
      {showSlides && <TrainingSlides onClose={() => setShowSlides(false)} />}
    </div>
  );
}

function SilenceCost({ onClose }) {
  const [days, setDays] = useState(3);
  const [people, setPeople] = useState(3);
  const hours = Math.round(days * people * 2);
  const money = Math.round((days * people * 200000) / 1000) * 1000;
  const hDisp = useCountUp(hours, 600);
  const mDisp = useCountUp(money, 600);
  return (
    <Modal open onClose={onClose} title="Tính Tổn Thất Của Im Lặng" size="md">
      <div className="p-6 space-y-4">
        <div className="bg-[#F8F9FB] p-5 rounded-xl border border-[#EAECF0]">
          <label className="text-[11px] font-medium text-[#4B5563] block mb-3">Bạn đã trì hoãn nói chuyện bao nhiêu ngày?</label>
          <div className="flex items-center gap-4">
            <input type="range" min="1" max="30" value={days} onChange={e => setDays(Number(e.target.value))} className="flex-1 accent-[#DC2626]" />
            <span className="w-14 text-right font-semibold text-[#DC2626] text-[18px] num-tab">{days}D</span>
          </div>
        </div>
        <div className="bg-[#F8F9FB] p-5 rounded-xl border border-[#EAECF0]">
          <label className="text-[11px] font-medium text-[#4B5563] block mb-3">Vấn đề này dính líu bao nhiêu người?</label>
          <div className="flex items-center gap-4">
            <input type="range" min="1" max="20" value={people} onChange={e => setPeople(Number(e.target.value))} className="flex-1 accent-[#111827]" />
            <span className="w-14 text-right font-semibold text-[#111827] text-[18px] num-tab">{people}P</span>
          </div>
        </div>
        <div className="border-t border-[#EAECF0] pt-4">
          <p className="text-center text-[10px] uppercase font-medium text-[#9CA3AF] mb-3 tracking-[0.1em]">Sự mập mờ đang gây thiệt hại</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center bg-red-50 rounded-xl p-5 border border-red-200">
              <p className="text-[10px] font-medium text-[#DC2626] mb-1 uppercase tracking-[0.06em]">Lãng phí</p>
              <p className="text-[36px] font-semibold font-header text-[#DC2626] num-tab leading-none">{hDisp}h</p>
              <p className="text-[10px] text-[#DC2626]/70 mt-1">xử lý hậu quả</p>
            </div>
            <div className="text-center bg-amber-50 rounded-xl p-5 border border-amber-200">
              <p className="text-[10px] font-medium text-amber-700 mb-1 uppercase tracking-[0.06em]">Ước tính</p>
              <p className="text-[20px] font-semibold font-header text-amber-700 mt-1 num-tab">{mDisp.toLocaleString('vi-VN')}₫</p>
              <p className="text-[10px] text-amber-700/70 mt-1">mất trắng</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-3 bg-[#C0392B] text-white rounded-xl font-medium text-[13px] hover:bg-[#a8331f]">Tôi Sẽ Nói Thẳng Ngay Bây Giờ</button>
      </div>
    </Modal>
  );
}

function TrainingSlides({ onClose }) {
  const [slide, setSlide] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const isLast = slide === TRAINING_SLIDES.length - 1;
  const canClose = !isLast || countdown === 0;

  useEffect(() => { if (!isLast || countdown === 0) return; const t = setTimeout(() => setCountdown(c => c - 1), 1000); return () => clearTimeout(t); }, [isLast, countdown]);
  useEffect(() => { if (slide !== TRAINING_SLIDES.length - 1) setCountdown(5); }, [slide]);

  const cur = TRAINING_SLIDES[slide];
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: 'rgba(17,24,39,0.95)' }}>
      <div className="w-full max-w-lg animate-slide-up">
        <div className="flex items-center justify-center gap-2 mb-6">
          {TRAINING_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} className={`transition-all duration-300 rounded-full ${i === slide ? 'w-8 h-2.5 bg-[#059669]' : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'}`}></button>
          ))}
        </div>
        <div className="bg-[#1E293B] rounded-2xl p-8 border border-white/10 shadow-modal">
          <p className="text-[10px] font-medium text-white/40 uppercase tracking-[0.12em] mb-3">{cur.sub}</p>
          <h2 className="text-[24px] font-semibold text-white font-header leading-tight mb-4">{cur.title}</h2>
          <p className="text-[14px] text-white/70 leading-relaxed">{cur.body}</p>
        </div>
        <div className="flex items-center justify-between mt-6">
          <button onClick={() => setSlide(Math.max(0, slide - 1))} disabled={slide === 0} className="px-4 py-2.5 text-[12px] font-medium text-white/50 hover:text-white/80 disabled:opacity-30">Quay lại</button>
          {isLast ? (
            <button onClick={onClose} disabled={!canClose} className={`px-6 py-3 rounded-xl text-[13px] font-medium transition-all ${canClose ? 'bg-[#059669] text-white hover:bg-[#047857]' : 'bg-white/10 text-white/40 cursor-not-allowed'}`}>
              {canClose ? 'Tôi hiểu — bắt đầu luyện tập' : `Tiếp tục đọc (${countdown}s)`}
            </button>
          ) : (
            <button onClick={() => setSlide(slide + 1)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-[13px] font-medium rounded-xl">Tiếp theo</button>
          )}
        </div>
      </div>
    </div>
  );
}

function HRPassportDashboard() {
  const d = HR_PASSPORT_DASHBOARD;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard value={d.avg_directness_score} label="Chỉ số nói thẳng trung bình" trend="+5% so với tuần trước" trendVariant="ok" />
        <MetricCard value={`${d.banned_word_pct}%`} label="Tỷ lệ dùng từ cấm (Vague/Silent)" trend="Mục tiêu: < 10%" trendVariant="medium" />
      </div>
      <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
        <CardHeader eyebrow="XU HƯỚNG" title="Xu hướng giao tiếp toàn tổ chức" />
        <div className="h-[260px]">
          <LineChart labels={d.weekly_trend.map(t => t.week)} data={d.weekly_trend.map(t => t.avg_score)} color="#4F46E5" max={10} fill />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#EAECF0] overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-[#EAECF0]">
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1">Cần hỗ trợ</p>
          <h3 className="text-[16px] font-semibold text-[#111827] font-header">Nhân sự cần hỗ trợ giao tiếp</h3>
          <p className="text-[12px] text-[#9CA3AF] mt-1 font-normal">Dựa trên xu hướng giảm trong 14 ngày gần nhất</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F8F9FB] text-[10px] text-[#9CA3AF] font-medium uppercase tracking-[0.08em] border-b border-[#EAECF0]">
                <th className="text-left px-6 py-3">Thành viên</th>
                <th className="text-center px-6 py-3">Điểm hiện tại</th>
                <th className="text-center px-6 py-3">Xu hướng</th>
                <th className="text-right px-6 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAECF0]">
              {d.members_needing_attention.map(m => (
                <tr key={m.user_id} className="hover:bg-[#F8F9FB] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-[#4F46E5] flex items-center justify-center text-white text-[12px] font-medium">{m.name.charAt(0)}</div>
                      <span className="text-[13px] font-medium text-[#111827]">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-[14px] font-semibold text-[#111827] num-tab">{m.directness_score.toFixed(1)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant={m.trend === 'down' ? 'high' : 'medium'}>{m.trend === 'down' ? 'GIẢM MẠNH' : 'BIẾN ĐỘNG'}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[12px] font-medium text-[#4F46E5] border border-indigo-200 px-4 py-2 rounded-lg hover:bg-[#4F46E5] hover:text-white transition-all">Gửi bài luyện tập</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* CULTURE */
const CULTURE_TABS = [
  { key: 'home',       label: 'Bảng Tin' },
  { key: 'challenges', label: 'Thử Thách' },
  { key: 'knowledge',  label: 'Kho Bài Học' },
  { key: 'journey',    label: 'Hành Trình' },
  { key: 'health',     label: 'Sức Khỏe Đội Ngũ', roles: ['hr_manager'] },
];

function CulturePage({ user }) {
  const visible = CULTURE_TABS.filter(t => !t.roles || t.roles.includes(user.primary_role));
  const [tab, setTab] = useState('home');
  const [showShare, setShowShare] = useState(false);
  useEffect(() => { if (!visible.find(t => t.key === tab)) setTab('home'); }, [user.primary_role]);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1.5">Không Gian Chung</p>
          <h1 className="text-[24px] font-semibold text-[#111827] font-header tracking-tight">Nhịp Đập Văn Hóa</h1>
          <p className="text-[13px] text-[#4B5563] mt-1.5 max-w-xl">Lan tỏa tinh thần Dám Sai - Nói Thẳng. Hành động nhỏ tạo nên văn hóa lớn.</p>
        </div>
        <button onClick={() => setShowShare(true)} className="w-full md:w-auto px-5 py-2.5 bg-[#C0392B] text-white font-medium text-[13px] rounded-lg hover:bg-[#a8331f] active:scale-[0.97]">+ Kể câu chuyện</button>
      </div>
      <div className="flex gap-1 flex-wrap bg-white p-1 rounded-xl border border-[#EAECF0] w-max shadow-card">
        {visible.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${tab === t.key ? 'bg-[#111827] text-white' : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F8F9FB]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="animate-fade-in" key={tab}>
        {tab === 'home' && <HomeFeed user={user} />}
        {tab === 'challenges' && <ChallengesTab />}
        {tab === 'knowledge' && <KnowledgeBase user={user} />}
        {tab === 'journey' && <JourneyTab />}
        {tab === 'health' && <TeamHealthTab />}
      </div>
      {showShare && <ShareStoryModal onClose={() => setShowShare(false)} />}
    </div>
  );
}

function HomeFeed() { return (<div className="space-y-4">{STORIES.map(s => <StoryCard key={s.id} story={s} />)}</div>); }

function StoryCard({ story }) {
  const [reacted, setReacted] = useState(null);
  const isBreak = story.courage_level === 'breakthrough';
  return (
    <div className="bg-white rounded-xl border border-[#EAECF0] shadow-card p-6">
      {isBreak && (
        <div className="inline-flex items-center gap-2 mb-3"><Badge variant="medium">Dám Sai — Đột Phá</Badge></div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-50 text-[#C0392B] rounded-[10px] flex items-center justify-center font-medium text-sm border border-red-200">{story.user.name.charAt(0)}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[#111827]">{story.user.name}</p>
          <p className="text-[11px] text-[#9CA3AF]">{story.team.name} · {new Date(story.created_at).toLocaleDateString('vi-VN')}</p>
        </div>
        <Badge variant="neutral">{EXP_LABELS[story.experience_type]}</Badge>
      </div>
      <div className="bg-[#F8F9FB] rounded-xl px-4 py-3.5 border border-[#EAECF0] mb-4">
        <p className="text-[13px] text-[#111827] leading-relaxed">"{story.content}"</p>
      </div>
      <div className="flex gap-2 border-t border-[#EAECF0] pt-3 flex-wrap">
        {[['brave','Dám làm'],['respect','Tôn trọng'],['learn','Học được']].map(([k, l]) => (
          <button key={k} onClick={() => setReacted(reacted === k ? null : k)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${reacted === k ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-[#F8F9FB] text-[#4B5563] border-[#EAECF0] hover:bg-[#F4F5F8]'}`}>
            {l} <span className={`num-tab ${reacted === k ? 'text-white/70' : 'text-[#9CA3AF]'}`}>{story.reactions[k]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChallengesTab() {
  const [submitOpen, setSubmitOpen] = useState(false);
  return (
    <div className="space-y-6">
      <div data-hero="brand" className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(90deg, #111827 0%, #1E293B 100%)' }}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-8 translate-x-8" style={{ background: 'rgba(192,57,43,0.18)' }}></div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg text-[10px] font-medium mb-3 uppercase tracking-[0.1em]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>Thử thách tuần này
          </div>
          <h2 className="text-[18px] font-semibold font-header mb-5 leading-snug">{CHALLENGES.weekly.text}</h2>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="font-medium bg-white/10 px-3 py-1.5 rounded-lg text-[12px] num-tab">+{CHALLENGES.weekly.points} Điểm Văn Hóa</span>
            <button onClick={() => setSubmitOpen(true)} className="px-5 py-2 bg-[#C0392B] text-white font-medium text-[12px] rounded-lg hover:bg-[#a8331f]">Thực hiện ngay</button>
          </div>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-3">Thử thách hàng ngày</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHALLENGES.daily.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-[#EAECF0] p-5 flex flex-col justify-between gap-3 hover:shadow-card-hover transition-all shadow-card">
              <p className="text-[13px] text-[#111827] leading-relaxed">{c.text}</p>
              <div className="flex justify-between items-center">
                <Badge variant="info">+<span className="num-tab">{c.points}</span> Điểm</Badge>
                <button className="text-[11px] font-medium text-[#4B5563] hover:text-[#111827]">Báo cáo</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {submitOpen && <SubmitEvidenceModal onClose={() => setSubmitOpen(false)} />}
    </div>
  );
}

function SubmitEvidenceModal({ onClose }) {
  const [proof, setProof] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const submit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const approved = proof.length > 80;
      setResult({ approved, awarded_points: approved ? 50 : 0, ai_feedback: approved ? 'Bằng chứng rõ ràng và có hành động cụ thể. Xuất sắc!' : 'Cần mô tả hành động cụ thể hơn, có thể đo lường được.', ai_reason: approved ? 'Đạt tiêu chí hành động + kết quả' : 'Chưa có bằng chứng hành động cụ thể' });
    }, 900);
  };
  return (
    <Modal open onClose={onClose} title="Nộp bằng chứng" size="md">
      <div className="p-6 space-y-4">
        <div className="bg-[#F8F9FB] rounded-xl p-4 border border-[#EAECF0]">
          <p className="text-[12px] text-[#111827] leading-relaxed">{CHALLENGES.weekly.text}</p>
          <p className="text-[10px] font-medium text-[#4F46E5] mt-2 num-tab">+{CHALLENGES.weekly.points} điểm tối đa</p>
        </div>
        {!result ? (
          <>
            <textarea value={proof} onChange={e => setProof(e.target.value)} rows="5"
              className="w-full bg-[#F8F9FB] border border-[#EAECF0] rounded-xl p-4 text-[13px] resize-none focus:border-[#4F46E5]/40 outline-none placeholder-[#9CA3AF]"
              placeholder="Mô tả bằng chứng cụ thể: Bạn đã làm gì, với ai, kết quả ra sao (tối thiểu 80 ký tự)..." />
            <p className={`text-[11px] num-tab ${proof.length < 80 ? 'text-[#9CA3AF]' : 'text-[#059669]'}`}>{proof.length}/80 ký tự tối thiểu</p>
            <button onClick={submit} disabled={loading || proof.length < 20} className="w-full py-3 bg-[#C0392B] text-white font-medium text-[13px] rounded-xl hover:bg-[#a8331f] disabled:opacity-50">
              {loading ? 'AI đang chấm điểm...' : 'Nộp & chấm điểm AI'}
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div className={`${result.approved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <Badge variant={result.approved ? 'ok' : 'high'}>{result.approved ? 'ĐƯỢC CHẤP NHẬN' : 'CHƯA ĐẠT'}</Badge>
                <span className="text-[14px] font-semibold font-header num-tab">+{result.awarded_points} điểm</span>
              </div>
              <p className="text-[12px] text-[#111827] leading-relaxed">{result.ai_feedback}</p>
              <p className="text-[11px] text-[#4B5563] italic mt-2">Lý do: {result.ai_reason}</p>
            </div>
            <button onClick={onClose} className="w-full py-3 bg-[#F4F5F8] text-[#4B5563] font-medium text-[13px] rounded-xl border border-[#EAECF0]">Đóng</button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function KnowledgeBase({ user }) {
  const [search, setSearch] = useState('');
  const [expType, setExpType] = useState('');
  const [courage, setCourage] = useState('');
  const canSeeAll = user.primary_role === 'hr_manager' || user.primary_role === 'leader';
  const visible = STORIES.filter(s => canSeeAll || s.is_public);
  const filtered = visible.filter(s => {
    const matchSearch = !search || s.content.toLowerCase().includes(search.toLowerCase());
    const matchType = !expType || s.experience_type === expType;
    const matchCourage = !courage || s.courage_level === courage;
    return matchSearch && matchType && matchCourage;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#EAECF0] p-4 shadow-card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm bài học, từ khóa..."
              className="w-full bg-[#F8F9FB] border border-[#EAECF0] rounded-lg pl-9 pr-4 py-2.5 text-[13px] outline-none focus:border-[#4F46E5]/40 placeholder-[#9CA3AF]" />
          </div>
          <select value={expType} onChange={e => setExpType(e.target.value)} className="bg-[#F8F9FB] border border-[#EAECF0] rounded-lg px-3 py-2.5 text-[13px] text-[#4B5563] outline-none">
            <option value="">Tất cả loại</option>
            {Object.entries(EXP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={courage} onChange={e => setCourage(e.target.value)} className="bg-[#F8F9FB] border border-[#EAECF0] rounded-lg px-3 py-2.5 text-[13px] text-[#4B5563] outline-none">
            <option value="">Tất cả mức</option>
            {Object.entries(COURAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {!canSeeAll && <p className="text-[11px] text-[#9CA3AF] mt-2.5">Hiển thị bài học được công khai. HR & Leader thấy tất cả.</p>}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Không tìm thấy bài học" description="Hãy thử từ khóa khác hoặc xóa bộ lọc." />
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-[#EAECF0] p-5 shadow-card hover:shadow-card-hover transition-all">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="ok">{EXP_LABELS[s.experience_type]}</Badge>
                <Badge variant="neutral">{COURAGE_LABELS[s.courage_level]}</Badge>
                {!s.is_public && <Badge variant="high">Nội bộ</Badge>}
              </div>
              <p className="text-[13px] text-[#111827] leading-relaxed line-clamp-3">{s.content}</p>
              <p className="text-[11px] text-[#9CA3AF] mt-2">{s.user.name} · {new Date(s.created_at).toLocaleDateString('vi-VN')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function JourneyTab() {
  const [selected, setSelected] = useState(null);
  const xpDisp = useCountUp(BEHAVIOR_SCORES.total_xp);
  const streakDisp = useCountUp(BEHAVIOR_SCORES.streak);
  const completedKeys = new Set(MILESTONES.map(m => m.milestone));

  return (
    <div className="space-y-6">
      <div data-hero="brand" className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(90deg, #111827 0%, #1E293B 100%)' }}>
        <div className="absolute top-0 right-0 w-28 h-28 rounded-full -translate-y-6 translate-x-6" style={{ background: 'rgba(192,57,43,0.15)' }}></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-4">
          <div>
            <p className="text-white/50 text-[10px] uppercase tracking-[0.1em] font-medium mb-1.5">Tổng Điểm Văn Hóa</p>
            <h2 className="text-[48px] font-semibold font-header num-tab leading-none" style={{ color: '#C0392B' }}>{xpDisp} <span className="text-[18px] text-white/50">XP</span></h2>
          </div>
          <div className="md:text-right">
            <p className="text-white/50 text-[10px] uppercase tracking-[0.1em] font-medium mb-1.5">Chuỗi duy trì</p>
            <h2 className="text-[40px] font-semibold font-header num-tab leading-none">{streakDisp} <span className="text-[16px] text-white/50">ngày</span></h2>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
        <CardHeader eyebrow="HÀNH TRÌNH" title="Chặng Đường Phát Triển" />
        <div className="flex gap-3 overflow-x-auto pb-2">
          {MILESTONE_DEFS.map((m, i) => {
            const done = completedKeys.has(m.key);
            const rec = MILESTONES.find(r => r.milestone === m.key);
            return (
              <button key={m.key} onClick={() => done && rec && setSelected(rec)} disabled={!done}
                className={`min-w-[110px] rounded-xl p-4 flex flex-col items-center text-center border transition-all ${done ? 'bg-indigo-50 border-indigo-200 hover:shadow-card-hover cursor-pointer' : 'bg-[#F8F9FB] border-[#EAECF0] border-dashed'}`}>
                <div className={`w-9 h-9 rounded-lg mb-2 flex items-center justify-center ${done ? 'bg-[#4F46E5] text-white' : 'bg-[#EAECF0] text-[#9CA3AF]'}`}>
                  {done ? (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>) : (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>)}
                </div>
                <p className={`text-[12px] font-medium ${done ? 'text-[#4F46E5]' : 'text-[#9CA3AF]'}`}>{m.label}</p>
                {done && rec && <p className="text-[10px] mt-1 text-[#9CA3AF] num-tab">{new Date(rec.completed_at).toLocaleDateString('vi-VN')}</p>}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[#9CA3AF] mt-3">Bấm vào cột mốc đã hoàn thành để xem chi tiết.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card">
        <CardHeader eyebrow="HÀNH VI" title="Phân bố hành vi (4 trục)" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[260px]">
            <RadarChart labels={['Dám làm','Chia sẻ','Học hỏi','Hỗ trợ']}
              data={[BEHAVIOR_SCORES.try_score, BEHAVIOR_SCORES.share_score, BEHAVIOR_SCORES.learn_score, BEHAVIOR_SCORES.help_score]}
              color="#4F46E5" max={10} size={260} />
          </div>
          <div className="space-y-4">
            <MiniBar label="Dám làm (Try)"    value={BEHAVIOR_SCORES.try_score}   color="#C0392B" />
            <MiniBar label="Chia sẻ (Share)"  value={BEHAVIOR_SCORES.share_score} color="#D97706" />
            <MiniBar label="Học hỏi (Learn)"  value={BEHAVIOR_SCORES.learn_score} color="#4F46E5" />
            <MiniBar label="Hỗ trợ (Help)"    value={BEHAVIOR_SCORES.help_score}  color="#059669" />
          </div>
        </div>
      </div>

      {selected && (
        <Modal open onClose={() => setSelected(null)} title={`Cột mốc ${MILESTONE_DEFS.find(m => m.key === selected.milestone)?.label}`} size="md">
          <div className="p-6 space-y-3">
            <p className="text-[11px] text-[#9CA3AF] num-tab">Hoàn thành: {new Date(selected.completed_at).toLocaleDateString('vi-VN')}</p>
            <div className="bg-[#F8F9FB] rounded-xl p-4 border border-[#EAECF0]">
              <p className="text-[13px] text-[#111827] leading-relaxed italic">"{selected.recap_note}"</p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-2">Video tổng kết</p>
              <p className="text-[12px] text-[#4F46E5] font-medium">Tính năng video sẽ sẵn sàng sớm.</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TeamHealthTab() {
  const [analyzing, setAnalyzing] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const runAnalyze = (team) => {
    setAnalyzing(team.team_id); setAiResult(null);
    setTimeout(() => {
      setAnalyzing(null);
      setAiResult({ team_id: team.team_id, insights: 'Team đang có xu hướng giao tiếp cải thiện rõ rệt trong tháng qua. Tuy nhiên, tỷ lệ chia sẻ câu chuyện công khai vẫn còn thấp so với mục tiêu.', patterns: ['Thành viên mới (< 3 tháng) có xu hướng im lặng hơn khi gặp khó khăn','Leader có số lần feedback đúng hạn cao → team có điểm giao tiếp tốt hơn','Thử thách tuần được hoàn thành chủ yếu bởi nhóm senior'], recommendations: ['Tổ chức 1-on-1 định kỳ với thành viên < 3 tháng','Nhân rộng mô hình leader phản hồi đúng hạn ra toàn team','Thiết kế thử thách daily dễ hơn để tăng participation rate'] });
    }, 1600);
  };

  return (
    <div className="space-y-4">
      {TEAM_HEALTH.map(t => (
        <div key={t.team_id} className="bg-white rounded-xl border border-[#EAECF0] p-6 shadow-card hover:shadow-card-hover transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em] mb-1">Team</p>
              <h3 className="text-[16px] font-semibold text-[#111827] font-header">{t.team_name}</h3>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">Quy mô: <span className="num-tab">{t.member_count}</span> nhân sự · Hỗ trợ: <span className="num-tab">{t.support_rate}%</span></p>
            </div>
            <Badge variant={t.health_index >= 70 ? 'ok' : t.health_index >= 50 ? 'medium' : 'high'}>Sức khỏe: <span className="num-tab ml-1">{t.health_index}/100</span></Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <MiniBar label="Dám làm" value={t.avg_scores_json.try} color="#C0392B" />
            <MiniBar label="Chia sẻ" value={t.avg_scores_json.share} color="#D97706" />
            <MiniBar label="Học hỏi" value={t.avg_scores_json.learn} color="#4F46E5" />
            <MiniBar label="Hỗ trợ"  value={t.avg_scores_json.help}  color="#059669" />
          </div>
          {t.avg_scores_json.insights && (<p className="text-[13px] text-[#4B5563] italic bg-[#F8F9FB] p-4 rounded-lg border border-[#EAECF0] mb-3 leading-relaxed">"{t.avg_scores_json.insights}"</p>)}
          <button onClick={() => runAnalyze(t)} disabled={analyzing === t.team_id} className="px-4 py-2 border border-[#EAECF0] text-[#4B5563] font-medium rounded-lg text-[12px] hover:bg-[#F8F9FB] disabled:opacity-60">
            {analyzing === t.team_id ? 'Đang phân tích AI...' : 'Phân tích AI chi tiết'}
          </button>

          {aiResult && aiResult.team_id === t.team_id && (
            <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-5 animate-slide-up">
              <p className="text-[10px] font-medium text-[#4F46E5] uppercase tracking-[0.1em] mb-2">AI Insights</p>
              <p className="text-[13px] text-[#111827] italic leading-relaxed mb-4">"{aiResult.insights}"</p>
              <div className="mb-4">
                <p className="text-[11px] font-medium text-[#4F46E5] mb-2">Patterns phát hiện:</p>
                <ul className="space-y-1.5">
                  {aiResult.patterns.map((p, i) => <li key={i} className="text-[12px] text-[#4B5563] flex gap-2"><span className="text-[#4F46E5]">•</span>{p}</li>)}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#4F46E5] mb-2">Khuyến nghị:</p>
                <ul className="space-y-1.5">
                  {aiResult.recommendations.map((r, i) => <li key={i} className="text-[12px] text-[#4B5563] flex gap-2"><span className="text-[#059669]">→</span>{r}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ShareStoryModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [tried, setTried] = useState('');
  const [expType, setExpType] = useState('');
  const [courage, setCourage] = useState('');
  const [support, setSupport] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canStep2 = tried.length >= 20 && expType && courage;
  const canStep3 = support !== '';

  return (
    <Modal open onClose={onClose} title={`Kể câu chuyện — Bước ${step}/3`} size="md">
      <div className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-[#111827] rounded-xl p-4">
              <p className="text-[13px] text-white/80 italic leading-relaxed">"Bạn đã làm gì khác đi tuần này?"</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#4B5563] uppercase tracking-[0.08em] block mb-2">Mô tả điều bạn đã thử</label>
              <textarea value={tried} onChange={e => setTried(e.target.value)} rows="4"
                className="w-full bg-[#F8F9FB] border border-[#EAECF0] rounded-xl p-4 text-[13px] resize-none focus:border-[#4F46E5]/40 outline-none placeholder-[#9CA3AF]"
                placeholder="Tôi đã chủ động nêu ra vấn đề trong cuộc họp..." />
              <p className={`text-[11px] mt-1 num-tab ${tried.length < 20 ? 'text-[#9CA3AF]' : 'text-[#059669]'}`}>{tried.length}/20 ký tự tối thiểu</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#4B5563] uppercase tracking-[0.08em] block mb-2">Loại kinh nghiệm</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(EXP_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => setExpType(k)}
                    className={`py-2 px-3 rounded-lg text-[12px] font-medium text-left transition-all border ${expType === k ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-[#F8F9FB] text-[#4B5563] border-[#EAECF0] hover:border-[#4F46E5]/40'}`}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#4B5563] uppercase tracking-[0.08em] block mb-2">Mức độ can đảm</label>
              <div className="flex gap-2">
                {Object.entries(COURAGE_LABELS).map(([k, v]) => (
                  <button key={k} onClick={() => setCourage(k)}
                    className={`flex-1 py-2 rounded-lg text-[12px] font-medium transition-all border ${courage === k ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-[#F8F9FB] text-[#4B5563] border-[#EAECF0]'}`}>{v}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!canStep2} className="w-full py-3 bg-[#C0392B] text-white font-medium text-[13px] rounded-xl hover:bg-[#a8331f] disabled:opacity-40 disabled:cursor-not-allowed">Tiếp theo</button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-[#F8F9FB] rounded-xl p-4 border border-[#EAECF0]">
              <p className="text-[13px] text-[#111827] font-normal italic">"Sự hỗ trợ đúng lúc giúp sai lầm nhỏ không thành vấn đề lớn."</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#4B5563] uppercase tracking-[0.08em] block mb-2">Bạn có được hỗ trợ từ team/leader?</label>
              <div className="space-y-2">
                {[['many','Có nhiều — team/leader phản hồi ngay'],['enough','Có vừa đủ — cần nhưng đủ để làm'],['late','Có nhưng chậm'],['none','Hầu như không — tự xử lý một mình']].map(([k, v]) => (
                  <button key={k} onClick={() => setSupport(k)}
                    className={`w-full py-2.5 px-4 rounded-lg text-[13px] text-left transition-all border ${support === k ? 'bg-indigo-50 border-[#4F46E5] text-[#4F46E5] font-medium' : 'bg-[#F8F9FB] border-[#EAECF0] text-[#4B5563] hover:border-[#4F46E5]/40'}`}>{v}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 py-3 border border-[#EAECF0] text-[#4B5563] font-medium text-[13px] rounded-xl hover:bg-[#F8F9FB]">Quay lại</button>
              <button onClick={() => setStep(3)} disabled={!canStep3} className="flex-[2] py-3 bg-[#C0392B] text-white font-medium text-[13px] rounded-xl hover:bg-[#a8331f] disabled:opacity-40">Tiếp theo</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-[#F8F9FB] rounded-xl p-4 border border-[#EAECF0] space-y-2">
              <p className="text-[10px] font-medium text-[#9CA3AF] uppercase tracking-[0.1em]">Xem trước</p>
              <p className="text-[13px] text-[#111827] leading-relaxed">"{tried.slice(0, 80)}{tried.length > 80 ? '...' : ''}"</p>
            </div>
            <label className="flex items-center justify-between bg-[#F8F9FB] rounded-xl p-4 border border-[#EAECF0] cursor-pointer">
              <div>
                <p className="text-[13px] font-medium text-[#111827]">Công khai trên Feed</p>
                <p className="text-[11px] text-[#9CA3AF]">{isPublic ? 'Mọi người trong NhiLe sẽ thấy' : 'Chỉ team và HR thấy'}</p>
              </div>
              <button onClick={() => setIsPublic(!isPublic)} className={`w-11 h-6 rounded-full transition-all relative ${isPublic ? 'bg-[#4F46E5]' : 'bg-[#D1D5DB]'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isPublic ? 'left-5' : 'left-0.5'}`}></span>
              </button>
            </label>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 py-3 border border-[#EAECF0] text-[#4B5563] font-medium text-[13px] rounded-xl">Quay lại</button>
              <button onClick={() => { setSubmitting(true); setTimeout(onClose, 700); }} disabled={submitting} className="flex-[2] py-3 bg-[#C0392B] text-white font-medium text-[13px] rounded-xl hover:bg-[#a8331f] disabled:opacity-60">
                {submitting ? 'Đang gửi...' : 'Gửi câu chuyện ngay'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* N-BOT */
const NBOT_MESSAGES = {
  home: [
    { type: 'tip', text: 'Bạn đã chọn identity hôm nay chưa? Cam kết cụ thể tăng hành động thực tế lên 3,5 lần!' },
    { type: 'warning', text: 'Có 2 trường hợp URGENT chưa được can thiệp. Nhấn vào nhân sự để xem gợi ý script.' },
  ],
  retention: [
    { type: 'warning', text: 'Nguyễn Minh Anh đã bế tắc 8 ngày. Sau 21 ngày, khả năng nghỉ việc tăng 4x.' },
    { type: 'tip', text: 'Tip: "Mình không phán xét, mình chỉ muốn hiểu để hỗ trợ." — câu này giảm defensive reaction ngay.' },
  ],
  passport: [
    { type: 'tip', text: 'Thử gõ "không sao ạ" vào Rewrite Lab — xem hệ thống nhận diện ngay. Real-time coaching!' },
    { type: 'info', text: 'Directness Score tuần này: 74/100. Mục tiêu tuần tới: 80+. Thêm mốc thời gian cụ thể để tăng điểm.' },
  ],
  culture: [
    { type: 'success', text: '2 câu chuyện mới được chia sẻ hôm nay. Mỗi reaction của bạn = tạo cảm giác an toàn cho người khác nói thật hơn.' },
    { type: 'tip', text: 'Challenge tuần này: Nói thẳng với 1 người bạn hay né tránh. Streak 3 ngày = Culture XP x2!' },
  ],
};

function NBotCoach({ user, page }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (user.primary_role === 'member') return null;
  const msgs = NBOT_MESSAGES[page] || NBOT_MESSAGES.home;
  const cur = msgs[idx % msgs.length];
  const cfg = {
    info:    { variant: 'info', label: 'Thông tin' },
    warning: { variant: 'medium', label: 'Cảnh báo' },
    success: { variant: 'ok', label: 'Tin tốt' },
    tip:     { variant: 'info', label: 'Mẹo' },
  }[cur.type];

  const Sparkle = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );

  return (
    <div className="fixed bottom-6 right-6 z-[400] flex flex-col items-end gap-3">
      {open && (
        <div className="w-72 bg-white rounded-2xl shadow-modal border border-[#EAECF0] overflow-hidden animate-scale-in" style={{ transformOrigin: 'bottom right' }}>
          <div className="flex items-center gap-3 px-5 py-4 bg-[#F8F9FB] border-b border-[#EAECF0]">
            <div className="w-9 h-9 rounded-xl bg-[#111827] flex items-center justify-center text-white">{Sparkle}</div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[#111827] font-header">N-Bot Coach</p>
              <p className="text-[10px] text-[#9CA3AF] capitalize">{page === 'home' ? 'Dashboard' : page}</p>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-white border border-[#EAECF0] text-[#4B5563] text-[12px] hover:bg-[#F4F5F8]">✕</button>
          </div>
          <div className="px-5 py-4">
            <div className="mb-2"><Badge variant={cfg.variant}>{cfg.label}</Badge></div>
            <p className="text-[13px] text-[#111827] leading-relaxed">{cur.text}</p>
          </div>
          <div className="px-5 pb-4 flex items-center justify-between border-t border-[#EAECF0] pt-3">
            <p className="text-[11px] text-[#9CA3AF] num-tab">{idx % msgs.length + 1}/{msgs.length} gợi ý</p>
            <button onClick={() => setIdx(i => i + 1)} className="text-[11px] font-medium text-[#4F46E5] hover:text-[#4338ca]">Gợi ý khác →</button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen(o => !o)}
        className={`relative w-12 h-12 rounded-2xl bg-[#111827] text-white flex items-center justify-center hover:bg-[#1F2937] transition-all ${!open ? 'animate-bot-border' : ''}`}>
        {open ? '✕' : Sparkle}
        {!open && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DC2626] border-2 border-white flex items-center justify-center">
            <span className="text-[8px] font-medium text-white num-tab">{msgs.length}</span>
          </div>
        )}
      </button>
    </div>
  );
}

/* TWEAKS */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "mood": "editorial",
  "numerics": "tabular"
}/*EDITMODE-END*/;

const MOOD_PRESETS = {
  editorial: {
    label: 'Editorial',
    bg: '#F4F5F8', surface: '#FFFFFF', surfaceAlt: '#F8F9FB',
    text: '#111827', text2: '#4B5563', muted: '#9CA3AF', borderL: '#EAECF0',
    brand: '#C0392B', accent: '#4F46E5', danger: '#DC2626', warn: '#D97706', ok: '#059669',
    radius: 12, radiusLg: 16, radiusSm: 8,
    heroBg: 'linear-gradient(90deg, #111827 0%, #1E293B 100%)',
    headFont: '"Lexend", sans-serif', bodyFont: '"Be Vietnam Pro", sans-serif',
    metricBg: '#F8F9FB',
  },
  clinical: {
    label: 'Clinical',
    bg: '#FFFFFF', surface: '#FFFFFF', surfaceAlt: '#FAFAFA',
    text: '#0A0A0A', text2: '#525252', muted: '#A3A3A3', borderL: '#E5E5E5',
    brand: '#171717', accent: '#0EA5E9', danger: '#DC2626', warn: '#A16207', ok: '#0F766E',
    radius: 4, radiusLg: 6, radiusSm: 2,
    heroBg: 'linear-gradient(180deg, #0A0A0A 0%, #171717 100%)',
    headFont: '"Lexend", sans-serif', bodyFont: '"Be Vietnam Pro", sans-serif',
    metricBg: '#FAFAFA',
  },
  vibrant: {
    label: 'Vibrant',
    bg: '#FEF7F0', surface: '#FFFFFF', surfaceAlt: '#FFF1E5',
    text: '#1C1917', text2: '#57534E', muted: '#A8A29E', borderL: '#F5E6D3',
    brand: '#EA580C', accent: '#9333EA', danger: '#E11D48', warn: '#CA8A04', ok: '#16A34A',
    radius: 18, radiusLg: 24, radiusSm: 12,
    heroBg: 'linear-gradient(115deg, #EA580C 0%, #9333EA 100%)',
    headFont: '"Lexend", sans-serif', bodyFont: '"Be Vietnam Pro", sans-serif',
    metricBg: '#FFF1E5',
  },
};

const DENSITY_PRESETS = {
  compact:     { scale: 0.88, gap: 4, padCard: 16, padSection: 16, sidebar: 224, topbar: 52 },
  comfortable: { scale: 1.00, gap: 6, padCard: 24, padSection: 24, sidebar: 256, topbar: 60 },
  spacious:    { scale: 1.12, gap: 8, padCard: 32, padSection: 36, sidebar: 280, topbar: 72 },
};

const NUMERICS_PRESETS = {
  plain:    { font: 'inherit', feature: 'normal', weight: 600, scale: 1.0,  letter: '0' },
  tabular:  { font: 'inherit', feature: 'tabular-nums', weight: 600, scale: 1.0,  letter: '0' },
  monoXL:   { font: '"JetBrains Mono", "Fira Code", ui-monospace, monospace', feature: 'tabular-nums', weight: 500, scale: 1.18, letter: '-0.02em' },
};

function applyTokens(mood, density, numerics) {
  const m = MOOD_PRESETS[mood] || MOOD_PRESETS.editorial;
  const d = DENSITY_PRESETS[density] || DENSITY_PRESETS.comfortable;
  const n = NUMERICS_PRESETS[numerics] || NUMERICS_PRESETS.tabular;
  const root = document.documentElement;
  const v = {
    '--nl-bg': m.bg, '--nl-surface': m.surface, '--nl-surface-alt': m.surfaceAlt,
    '--nl-text': m.text, '--nl-text-2': m.text2, '--nl-muted': m.muted, '--nl-border': m.borderL,
    '--nl-brand': m.brand, '--nl-accent': m.accent, '--nl-danger': m.danger, '--nl-warn': m.warn, '--nl-ok': m.ok,
    '--nl-radius-sm': m.radiusSm + 'px', '--nl-radius': m.radius + 'px', '--nl-radius-lg': m.radiusLg + 'px',
    '--nl-hero-bg': m.heroBg, '--nl-metric-bg': m.metricBg,
    '--nl-head-font': m.headFont, '--nl-body-font': m.bodyFont,
    '--nl-scale': d.scale, '--nl-pad-card': d.padCard + 'px', '--nl-pad-section': d.padSection + 'px',
    '--nl-sidebar': d.sidebar + 'px', '--nl-topbar': d.topbar + 'px',
    '--nl-num-font': n.font, '--nl-num-feature': n.feature, '--nl-num-weight': n.weight,
    '--nl-num-scale': n.scale, '--nl-num-letter': n.letter,
  };
  Object.entries(v).forEach(([k, val]) => root.style.setProperty(k, val));
  document.body.style.background = m.bg;
  document.body.style.color = m.text;
  document.body.style.fontFamily = m.bodyFont;
}

function NhiLeStyleOverrides() {
  return (
    <style>{`
      body { background: var(--nl-bg) !important; color: var(--nl-text); font-family: var(--nl-body-font); font-size: calc(14px * var(--nl-scale)); }
      h1,h2,h3,h4,h5,h6 { font-family: var(--nl-head-font) !important; }
      .num-tab {
        font-variant-numeric: var(--nl-num-feature) !important;
        font-family: var(--nl-num-font) !important;
        font-weight: var(--nl-num-weight) !important;
        letter-spacing: var(--nl-num-letter);
      }
      [class*="font-header"] .num-tab, h1 .num-tab, h2 .num-tab, h3 .num-tab, p.num-tab, span.num-tab {
        font-size: calc(1em * var(--nl-num-scale));
      }
      /* surface remap */
      .bg-white { background-color: var(--nl-surface) !important; }
      .bg-\\[\\#F4F5F8\\], .bg-\\[\\#f4f5f8\\] { background-color: var(--nl-bg) !important; }
      .bg-\\[\\#F8F9FB\\], .bg-\\[\\#f8f9fb\\] { background-color: var(--nl-surface-alt) !important; }
      .border-\\[\\#EAECF0\\] { border-color: var(--nl-border) !important; }
      .text-\\[\\#111827\\] { color: var(--nl-text) !important; }
      .text-\\[\\#4B5563\\] { color: var(--nl-text-2) !important; }
      .text-\\[\\#9CA3AF\\] { color: var(--nl-muted) !important; }
      /* radius remap */
      .rounded-xl { border-radius: var(--nl-radius) !important; }
      .rounded-2xl { border-radius: var(--nl-radius-lg) !important; }
      .rounded-lg { border-radius: var(--nl-radius-sm) !important; }
      /* density */
      .p-5 { padding: calc(var(--nl-pad-card) * 0.83) !important; }
      .p-6 { padding: var(--nl-pad-card) !important; }
      .p-7 { padding: calc(var(--nl-pad-card) * 1.15) !important; }
      .p-8 { padding: calc(var(--nl-pad-card) * 1.3) !important; }
      .gap-4 { gap: calc(var(--nl-pad-card) * 0.66) !important; }
      .gap-6 { gap: var(--nl-pad-card) !important; }
      /* sidebar width */
      .w-\\[256px\\] { width: var(--nl-sidebar) !important; }
      /* topbar height */
      .h-\\[60px\\] { height: var(--nl-topbar) !important; }
      /* hero gradient: any inline that uses #111827→#1E293B will be overridden by data-hero */
      [data-hero="brand"] { background: var(--nl-hero-bg) !important; }
      /* CTA buttons that use #C0392B */
      .bg-\\[\\#C0392B\\] { background-color: var(--nl-brand) !important; }
      .hover\\:bg-\\[\\#a8331f\\]:hover { background-color: var(--nl-brand) !important; filter: brightness(0.9); }
      .text-\\[\\#C0392B\\] { color: var(--nl-brand) !important; }
      .bg-\\[\\#4F46E5\\] { background-color: var(--nl-accent) !important; }
      .text-\\[\\#4F46E5\\] { color: var(--nl-accent) !important; }
      .border-\\[\\#4F46E5\\] { border-color: var(--nl-accent) !important; }
      .bg-\\[\\#DC2626\\] { background-color: var(--nl-danger) !important; }
      .text-\\[\\#DC2626\\] { color: var(--nl-danger) !important; }
      .bg-\\[\\#059669\\] { background-color: var(--nl-ok) !important; }
      .text-\\[\\#059669\\] { color: var(--nl-ok) !important; }
      .bg-\\[\\#D97706\\] { background-color: var(--nl-warn) !important; }
      .text-\\[\\#D97706\\] { color: var(--nl-warn) !important; }
      /* metric card */
      [data-metric] { background: var(--nl-metric-bg) !important; }
    `}</style>
  );
}

/* APP */
function App() {
  const [role, setRole] = useState('hr_manager');
  const [page, setPage] = useState('home');
  const [t, setTweak] = (typeof useTweaks === 'function' ? useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}]);
  const user = PROFILES[role];

  useEffect(() => { applyTokens(t.mood, t.density, t.numerics); }, [t.mood, t.density, t.numerics]);

  const PanelOK = typeof TweaksPanel === 'function';

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--nl-bg)' }}>
      <NhiLeStyleOverrides />
      <Sidebar user={user} activePage={page} onNav={setPage} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar user={user} onSwitchRole={setRole} />
        <main className="flex-1 overflow-auto">
          {page === 'home' && <HomePage user={user} onNav={setPage} />}
          {page === 'retention' && <RetentionPage user={user} />}
          {page === 'passport' && <PassportPage user={user} />}
          {page === 'culture' && <CulturePage user={user} />}
        </main>
      </div>
      <NBotCoach user={user} page={page} />
      {PanelOK && (
        <TweaksPanel>
          <TweakSection label="Aesthetic mood" />
          <TweakRadio
            label="Mood"
            value={t.mood}
            options={[
              { value: 'editorial', label: 'Editorial' },
              { value: 'clinical', label: 'Clinical' },
              { value: 'vibrant', label: 'Vibrant' },
            ]}
            onChange={(v) => setTweak('mood', v)}
          />
          <TweakSection label="Density" />
          <TweakRadio
            label="Spacing"
            value={t.density}
            options={[
              { value: 'compact', label: 'Compact' },
              { value: 'comfortable', label: 'Comfy' },
              { value: 'spacious', label: 'Spacious' },
            ]}
            onChange={(v) => setTweak('density', v)}
          />
          <TweakSection label="Numerics" />
          <TweakRadio
            label="Style"
            value={t.numerics}
            options={[
              { value: 'plain', label: 'Plain' },
              { value: 'tabular', label: 'Tabular' },
              { value: 'monoXL', label: 'Mono XL' },
            ]}
            onChange={(v) => setTweak('numerics', v)}
          />
        </TweaksPanel>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
