const pad = (n: number) => String(n).padStart(2, '0');
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const WEEK = '日一二三四五六';

function parts(ts: number, now: number) {
  const d = new Date(ts);
  const n = new Date(now);
  const isToday = startOfDay(d) === startOfDay(n);
  const diffDays = Math.round((startOfDay(n) - startOfDay(d)) / 86400000);
  return { d, isToday, diffDays };
}

/** 会话列表右上角时间：今天 HH:mm / 周内 星期X / 今年 M月D日 / 往年 YY/MM/DD */
export function formatListTime(ts: number, now: number = Date.now()): string {
  if (!ts) return '';
  const { d, isToday, diffDays } = parts(ts, now);
  if (isToday) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (diffDays < 7) return `星期${WEEK[d.getDay()]}`;
  if (d.getFullYear() === new Date(now).getFullYear()) return `${d.getMonth() + 1}月${d.getDate()}日`;
  return `${String(d.getFullYear()).slice(2)}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

/** 消息上方时间：[M月D日 ]上午/下午HH:mm（24 小时制 + 上午/下午前缀，参考截图样式） */
export function formatMsgTime(ts: number, now: number = Date.now()): string {
  const { d, isToday } = parts(ts, now);
  const hm = `${d.getHours() < 12 ? '上午' : '下午'}${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return isToday ? hm : `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
}
