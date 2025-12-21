import { CHART_COLORS } from '../../constants';

const TrendChart = ({ datasets, dateRange }) => {
  if (!datasets?.length) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed">
        请选择指标
      </div>
    );
  }

  let allPoints = [];
  datasets.forEach((ds, i) => {
    ds.points.forEach(p => {
      if (p.dateStr >= dateRange.start && p.dateStr <= dateRange.end) {
        allPoints.push({ ...p, color: CHART_COLORS[i % CHART_COLORS.length] });
      }
    });
  });

  if (!allPoints.length) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed">
        该时间段内无数据
      </div>
    );
  }

  const uniqueDates = [...new Set(allPoints.map(p => p.dateStr))].sort();
  const minVal = Math.min(...allPoints.map(p => p.val));
  const maxVal = Math.max(...allPoints.map(p => p.val));
  let valSpan = maxVal - minVal || 1;
  const yPad = valSpan * 0.2;
  const yMin = minVal - yPad, yMax = maxVal + yPad;
  const W = 300, H = 180, PL = 35, PR = 15, PT = 20, PB = 25;

  const getX = (d) => {
    const idx = uniqueDates.indexOf(d);
    if (uniqueDates.length === 1) return (W - PL - PR) / 2 + PL;
    return PL + (idx / (uniqueDates.length - 1)) * (W - PL - PR);
  };

  const getY = (v) => H - PB - ((v - yMin) / (yMax - yMin)) * (H - PT - PB);

  const getVisibleDateLabels = () => {
    const totalDates = uniqueDates.length;
    if (totalDates <= 6) return uniqueDates;
    const step = Math.ceil(totalDates / 6);
    const result = [];
    for (let i = 0; i < totalDates; i += step) {
      result.push(uniqueDates[i]);
    }
    if (result[result.length - 1] !== uniqueDates[totalDates - 1]) {
      result.push(uniqueDates[totalDates - 1]);
    }
    return result;
  };

  const visibleDateLabels = getVisibleDateLabels();

  return (
    <div className="w-full">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {[0, 1, 2, 3].map(i => {
          const y = PT + i * (H - PT - PB) / 3;
          const val = yMax - (i / 3) * (yMax - yMin);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e5e7eb" strokeDasharray="3" />
              <text x={PL - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#9ca3af">{val.toFixed(1)}</text>
            </g>
          );
        })}
        {visibleDateLabels.map((d, i) => (
          <text key={i} x={getX(d)} y={H - 8} textAnchor="middle" fontSize="8" fill="#6b7280">{d.slice(5)}</text>
        ))}
        {datasets.map((ds, i) => {
          const color = CHART_COLORS[i % CHART_COLORS.length];
          const sorted = ds.points.filter(p => p.dateStr >= dateRange.start && p.dateStr <= dateRange.end).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
          if (!sorted.length) return null;
          const pathD = sorted.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.dateStr)} ${getY(p.val)}`).join(' ');
          return (
            <g key={i}>
              {sorted.length > 1 && <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />}
              {sorted.map((p, idx) => {
                const isAbnormal = p.original.flag === 'High' || p.original.flag === 'Low';
                const dotColor = isAbnormal ? (p.original.flag === 'High' ? '#f97316' : '#fb923c') : color;
                return (
                  <g key={idx}>
                    <circle cx={getX(p.dateStr)} cy={getY(p.val)} r={3} fill={dotColor} />
                    <text x={getX(p.dateStr)} y={getY(p.val) - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill={dotColor}>
                      {p.val}{p.original.flag === 'High' ? '↑' : p.original.flag === 'Low' ? '↓' : ''}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {datasets.map((ds, i) => (
          <div key={i} className="flex items-center gap-1 text-xs">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="text-gray-600">{ds.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendChart;
