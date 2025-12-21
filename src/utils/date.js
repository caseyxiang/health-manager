// 日期格式化工具函数

// 获取本地日期字符串 YYYY-MM-DD
export function getLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 获取本地时间字符串 HH:MM
export function getLocalTimeStr(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 获取时间戳 HH:MM:SS.mmm
export function getTimestamp() {
  const now = new Date();
  return now.toISOString().slice(11, 23);
}

// 版本号比较
export function compareVersions(v1, v2) {
  const parse = (v) => {
    const match = v.match(/v?(\d+)\.(\d+)/);
    if (!match) return [0, 0];
    return [parseInt(match[1]), parseInt(match[2])];
  };

  const [major1, minor1] = parse(v1);
  const [major2, minor2] = parse(v2);

  if (major1 > major2) return 1;
  if (major1 < major2) return -1;
  if (minor1 > minor2) return 1;
  if (minor1 < minor2) return -1;
  return 0;
}
