import Icons from '../icons/Icons';

// 健康指标趋势图组件
const VitalTrendChart = ({ data, type, showDays = 30 }) => {
  if (!data || data.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed">
        数据不足,无法显示趋势图
      </div>
    );
  }

  const sortedData = [...data].sort((a, b) => {
    const dateA = `${a.date} ${a.time}`;
    const dateB = `${b.date} ${b.time}`;
    return dateA.localeCompare(dateB);
  });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - showDays);
  const filteredData = sortedData.filter(d => new Date(d.date) >= cutoffDate);

  if (filteredData.length < 2) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed">
        近{showDays}天内数据不足
      </div>
    );
  }

  const values1 = filteredData.map(d => parseFloat(d.value1)).filter(v => !isNaN(v));
  const values2 = type.hasTwo ? filteredData.map(d => parseFloat(d.value2)).filter(v => !isNaN(v)) : [];
  const allValues = type.hasTwo ? [...values1, ...values2] : values1;

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const valSpan = maxVal - minVal || 1;
  const yPad = valSpan * 0.15;
  const yMin = minVal - yPad;
  const yMax = maxVal + yPad;

  const W = 300, H = 160, PL = 40, PR = 15, PT = 20, PB = 30;
  const uniqueDates = [...new Set(filteredData.map(d => d.date))];

  const getX = (idx) => {
    if (filteredData.length === 1) return (W - PL - PR) / 2 + PL;
    return PL + (idx / (filteredData.length - 1)) * (W - PL - PR);
  };
  const getY = (v) => H - PB - ((v - yMin) / (yMax - yMin)) * (H - PT - PB);

  const pathD1 = filteredData.map((d, idx) => {
    const v = parseFloat(d.value1);
    if (isNaN(v)) return '';
    return `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(v)}`;
  }).filter(Boolean).join(' ');

  const pathD2 = type.hasTwo ? filteredData.map((d, idx) => {
    const v = parseFloat(d.value2);
    if (isNaN(v)) return '';
    return `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(v)}`;
  }).filter(Boolean).join(' ') : '';

  const visibleDateLabels = uniqueDates.length <= 5 ? uniqueDates :
    [uniqueDates[0], uniqueDates[Math.floor(uniqueDates.length / 2)], uniqueDates[uniqueDates.length - 1]];

  let refLines = [];
  if (type.normalRange && type.normalRange !== '-') {
    const rangeMatch = type.normalRange.match(/(\d+(?:\.\d+)?)\s*[-~]\s*(\d+(?:\.\d+)?)/);
    if (rangeMatch) {
      const refMin = parseFloat(rangeMatch[1]);
      const refMax = parseFloat(rangeMatch[2]);
      if (!isNaN(refMin) && refMin >= yMin && refMin <= yMax) refLines.push({ val: refMin });
      if (!isNaN(refMax) && refMax >= yMin && refMax <= yMax) refLines.push({ val: refMax });
    }
  }

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1">
          <Icons.BarChart2 size={14} style={{ color: type.color }} /> 趋势图
        </h4>
        <span className="text-xs text-gray-400">近{showDays}天</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
        {[0, 1, 2, 3, 4].map(i => {
          const y = PT + i * (H - PT - PB) / 4;
          const val = yMax - (i / 4) * (yMax - yMin);
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={PL - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8">{val.toFixed(1)}</text>
            </g>
          );
        })}
        {refLines.map((ref, idx) => (
          <line key={idx} x1={PL} y1={getY(ref.val)} x2={W - PR} y2={getY(ref.val)} stroke="#10b981" strokeWidth="1" strokeDasharray="4,2" opacity="0.6" />
        ))}
        {visibleDateLabels.map((d, i) => {
          const dataIdx = filteredData.findIndex(fd => fd.date === d);
          if (dataIdx === -1) return null;
          return (
            <text key={i} x={getX(dataIdx)} y={H - 10} textAnchor="middle" fontSize="9" fill="#6b7280">{d.slice(5)}</text>
          );
        })}
        {pathD1 && (
          <>
            <path d={pathD1} fill="none" stroke={type.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {filteredData.map((d, idx) => {
              const v = parseFloat(d.value1);
              if (isNaN(v)) return null;
              return (
                <g key={idx}>
                  <circle cx={getX(idx)} cy={getY(v)} r={4} fill="white" stroke={type.color} strokeWidth="2" />
                  {(idx === 0 || idx === filteredData.length - 1) && (
                    <text x={getX(idx)} y={getY(v) - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill={type.color}>{v}</text>
                  )}
                </g>
              );
            })}
          </>
        )}
        {type.hasTwo && pathD2 && (
          <>
            <path d={pathD2} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,2" />
            {filteredData.map((d, idx) => {
              const v = parseFloat(d.value2);
              if (isNaN(v)) return null;
              return (
                <g key={idx}>
                  <circle cx={getX(idx)} cy={getY(v)} r={3} fill="#f97316" />
                  {(idx === 0 || idx === filteredData.length - 1) && (
                    <text x={getX(idx)} y={getY(v) + 14} textAnchor="middle" fontSize="9" fill="#f97316">{v}</text>
                  )}
                </g>
              );
            })}
          </>
        )}
      </svg>
      {type.hasTwo && (
        <div className="flex gap-4 justify-center mt-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: type.color }} />
            <span className="text-gray-500">{type.label1}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 rounded bg-orange-500" />
            <span className="text-gray-500">{type.label2}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalTrendChart;
