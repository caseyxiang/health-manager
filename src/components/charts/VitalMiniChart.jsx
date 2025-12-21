// 健康指标迷你图表组件
const VitalMiniChart = ({ data, color }) => {
  if (!data || data.length < 2) return null;

  const values = data.map(d => parseFloat(d.value1)).filter(v => !isNaN(v));
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 60, H = 24, P = 2;

  const points = values.slice(-7).map((v, i, arr) => {
    const x = P + (i / (arr.length - 1)) * (W - 2 * P);
    const y = H - P - ((v - min) / range) * (H - 2 * P);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={W} height={H} className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export default VitalMiniChart;
