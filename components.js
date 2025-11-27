// 健康管家 Pro - 图表组件库
// Version: v15.73

// ========== 趋势图表组件 ==========
const TrendChart = ({ datasets, dateRange }) => {
  if (!datasets?.length) return <div className="h-48 flex items-center justify-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed">请选择指标</div>;
  let allPoints = [];
  datasets.forEach((ds, i) => {
    ds.points.forEach(p => {
      if (p.dateStr >= dateRange.start && p.dateStr <= dateRange.end) {
        allPoints.push({ ...p, color: CHART_COLORS[i % CHART_COLORS.length] });
      }
    });
  });
  if (!allPoints.length) return <div className="h-48 flex items-center justify-center text-gray-400 text-xs bg-gray-50 rounded-xl border border-dashed">该时间段内无数据</div>;
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
        {[0,1,2,3].map(i => {
          const y = PT + i * (H - PT - PB) / 3;
          const val = yMax - (i / 3) * (yMax - yMin);
          return <g key={i}><line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#e5e7eb" strokeDasharray="3"/><text x={PL-4} y={y+3} textAnchor="end" fontSize="8" fill="#9ca3af">{val.toFixed(1)}</text></g>;
        })}
        {visibleDateLabels.map((d, i) => <text key={i} x={getX(d)} y={H-8} textAnchor="middle" fontSize="8" fill="#6b7280">{d.slice(5)}</text>)}
        {datasets.map((ds, i) => {
          const color = CHART_COLORS[i % CHART_COLORS.length];
          const sorted = ds.points.filter(p => p.dateStr >= dateRange.start && p.dateStr <= dateRange.end).sort((a,b) => a.dateStr.localeCompare(b.dateStr));
          if (!sorted.length) return null;
          const pathD = sorted.map((p, idx) => `${idx===0?'M':'L'} ${getX(p.dateStr)} ${getY(p.val)}`).join(' ');
          return (
            <g key={i}>
              {sorted.length > 1 && <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>}
              {sorted.map((p, idx) => {
                const isAbnormal = p.original.flag === 'High' || p.original.flag === 'Low';
                const dotColor = isAbnormal ? (p.original.flag === 'High' ? '#f97316' : '#fb923c') : color;
                return (
                  <g key={idx}>
                    <circle cx={getX(p.dateStr)} cy={getY(p.val)} r={3} fill={dotColor}/>
                    <text x={getX(p.dateStr)} y={getY(p.val) - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill={dotColor}>{p.val}{p.original.flag === 'High' ? '↑' : p.original.flag === 'Low' ? '↓' : ''}</text>
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
            <div className="w-2 h-2 rounded-full" style={{backgroundColor: CHART_COLORS[i % CHART_COLORS.length]}}/>
            <span className="text-gray-600">{ds.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ========== 健康指标迷你图表组件 ==========
const VitalMiniChart = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  const values = data.map(d => parseFloat(d.value1)).filter(v => !isNaN(v));
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 60, H = 24, P = 2;
  const points = values.slice(-7).map((v, i, arr) => {
    const x = P + (i / (arr.length - 1)) * (W - 2*P);
    const y = H - P - ((v - min) / range) * (H - 2*P);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={W} height={H} className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// ========== 健康指标趋势图组件 ==========
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
    [uniqueDates[0], uniqueDates[Math.floor(uniqueDates.length/2)], uniqueDates[uniqueDates.length - 1]];
  
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
        {[0,1,2,3,4].map(i => {
          const y = PT + i * (H - PT - PB) / 4;
          const val = yMax - (i / 4) * (yMax - yMin);
          return (<g key={i}><line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#f1f5f9" strokeWidth="1"/><text x={PL-4} y={y+3} textAnchor="end" fontSize="9" fill="#94a3b8">{val.toFixed(1)}</text></g>);
        })}
        {refLines.map((ref, idx) => (<line key={idx} x1={PL} y1={getY(ref.val)} x2={W-PR} y2={getY(ref.val)} stroke="#10b981" strokeWidth="1" strokeDasharray="4,2" opacity="0.6"/>))}
        {visibleDateLabels.map((d, i) => {
          const dataIdx = filteredData.findIndex(fd => fd.date === d);
          if (dataIdx === -1) return null;
          return (<text key={i} x={getX(dataIdx)} y={H-10} textAnchor="middle" fontSize="9" fill="#6b7280">{d.slice(5)}</text>);
        })}
        {pathD1 && (<><path d={pathD1} fill="none" stroke={type.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{filteredData.map((d, idx) => {const v = parseFloat(d.value1);if (isNaN(v)) return null;return (<g key={idx}><circle cx={getX(idx)} cy={getY(v)} r={4} fill="white" stroke={type.color} strokeWidth="2"/>{(idx === 0 || idx === filteredData.length - 1) && (<text x={getX(idx)} y={getY(v) - 8} textAnchor="middle" fontSize="10" fontWeight="bold" fill={type.color}>{v}</text>)}</g>);})}</>)}
        {type.hasTwo && pathD2 && (<><path d={pathD2} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4,2"/>{filteredData.map((d, idx) => {const v = parseFloat(d.value2);if (isNaN(v)) return null;return (<g key={idx}><circle cx={getX(idx)} cy={getY(v)} r={3} fill="#f97316"/>{(idx === 0 || idx === filteredData.length - 1) && (<text x={getX(idx)} y={getY(v) + 14} textAnchor="middle" fontSize="9" fill="#f97316">{v}</text>)}</g>);})}</>)}
      </svg>
      {type.hasTwo && (<div className="flex gap-4 justify-center mt-2 text-xs"><div className="flex items-center gap-1"><div className="w-3 h-0.5 rounded" style={{ backgroundColor: type.color }}/><span className="text-gray-500">{type.label1}</span></div><div className="flex items-center gap-1"><div className="w-3 h-0.5 rounded bg-orange-500"/><span className="text-gray-500">{type.label2}</span></div></div>)}
    </div>
  );
};

// ========== 用药甘特图组件 ==========
const MedicationGantt = ({ meds, dateRange, selectedMeds }) => {
  if (!meds || meds.length === 0) return null;
  const W = 300, ROW_H = 28, PAD_L = 35, PAD_R = 15, PAD_T = 10;
  const startTs = new Date(dateRange.start).getTime();
  const endTs = new Date(dateRange.end).getTime();
  const totalDuration = endTs - startTs;
  if (totalDuration <= 0) return null;
  const getX = (ts) => PAD_L + ((ts - startTs) / totalDuration) * (W - PAD_L - PAD_R);
  
  const medsToShow = selectedMeds && selectedMeds.length > 0 
    ? meds.filter(m => selectedMeds.includes(m.id)) 
    : meds;
  
  const visibleMeds = medsToShow.filter(m => {
    const mStart = new Date(m.startTime).getTime();
    const mEnd = m.endTime ? new Date(m.endTime).getTime() : endTs;
    return mStart <= endTs && mEnd >= startTs;
  });
  if (visibleMeds.length === 0) return <div className="h-20 flex items-center justify-center text-xs text-gray-400 border border-dashed rounded-xl mt-3">该时间段内无用药记录</div>;
  const totalH = visibleMeds.length * ROW_H + PAD_T + 30;
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50 mt-4">
      <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1"><Icons.Clock size={14} className="text-indigo-500"/> 同期用药记录</h4>
      <svg width="100%" viewBox={`0 0 ${W} ${totalH}`} className="overflow-visible">
        <defs><filter id="medShadow"><feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15"/></filter></defs>
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={totalH - 20} stroke="#cbd5e1" strokeWidth="1.5"/>
        {visibleMeds.map((m, i) => {
          const mStartTs = new Date(m.startTime).getTime();
          const mEndTs = m.endTime ? new Date(m.endTime).getTime() : endTs;
          const drawStart = Math.max(startTs, mStartTs);
          const drawEnd = Math.min(endTs, mEndTs);
          if (drawEnd < drawStart) return null;
          const isActive = !m.endTime || new Date(m.endTime) >= new Date();
          return (
            <g key={m.id}>
              <circle cx={2} cy={i * ROW_H + PAD_T + 12 + 6} r="2.5" fill={isActive ? "#10b981" : "#94a3b8"}/>
              <rect x={getX(drawStart)} y={i * ROW_H + PAD_T + 12} width={Math.max(3, getX(drawEnd) - getX(drawStart))} height={14} rx={7} fill="#6366f1" opacity="0.85" filter="url(#medShadow)"/>
              <text x={8} y={i * ROW_H + PAD_T + 12 - 3} fontSize="9" fill="#334155" fontWeight="600">{m.name}</text>
            </g>
          );
        })}
        <text x={PAD_L} y={totalH - 5} textAnchor="start" fontSize="9" fill="#94a3b8" fontWeight="500">{dateRange.start}</text>
        <text x={W - PAD_R} y={totalH - 5} textAnchor="end" fontSize="9" fill="#94a3b8" fontWeight="500">{dateRange.end}</text>
      </svg>
    </div>
  );
};
