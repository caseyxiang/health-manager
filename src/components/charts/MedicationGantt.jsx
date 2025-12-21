import Icons from '../icons/Icons';

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

  if (visibleMeds.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center text-xs text-gray-400 border border-dashed rounded-xl mt-3">
        该时间段内无用药记录
      </div>
    );
  }

  const totalH = visibleMeds.length * ROW_H + PAD_T + 30;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50 mt-4">
      <h4 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-1">
        <Icons.Clock size={14} className="text-indigo-500" /> 同期用药记录
      </h4>
      <svg width="100%" viewBox={`0 0 ${W} ${totalH}`} className="overflow-visible">
        <defs>
          <filter id="medShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.15" />
          </filter>
        </defs>
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={totalH - 20} stroke="#cbd5e1" strokeWidth="1.5" />
        {visibleMeds.map((m, i) => {
          const mStartTs = new Date(m.startTime).getTime();
          const mEndTs = m.endTime ? new Date(m.endTime).getTime() : endTs;
          const drawStart = Math.max(startTs, mStartTs);
          const drawEnd = Math.min(endTs, mEndTs);
          if (drawEnd < drawStart) return null;
          const isActive = !m.endTime || new Date(m.endTime) >= new Date();
          return (
            <g key={m.id}>
              <circle cx={2} cy={i * ROW_H + PAD_T + 12 + 6} r="2.5" fill={isActive ? "#10b981" : "#94a3b8"} />
              <rect x={getX(drawStart)} y={i * ROW_H + PAD_T + 12} width={Math.max(3, getX(drawEnd) - getX(drawStart))} height={14} rx={7} fill="#6366f1" opacity="0.85" filter="url(#medShadow)" />
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

export default MedicationGantt;
