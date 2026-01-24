export function formatTimeLabel(date: string | Date) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "เมื่อสักครู่";
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;

  return d.toLocaleDateString("th-TH");
}