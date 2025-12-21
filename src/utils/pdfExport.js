// PDF导出工具函数 - 支持保存和分享

import { CHART_COLORS } from '../constants';

/**
 * 导出趋势分析结果
 * @param {Object} options - 导出选项
 * @param {Array} options.datasets - 趋势数据集
 * @param {Object} options.dateRange - 日期范围 {start, end}
 * @param {Array} options.meds - 用药计划列表
 * @param {string} options.memberName - 成员姓名
 */
export const exportTrendToPDF = async ({ datasets, dateRange, meds, memberName = '' }) => {
  // 过滤在日期范围内的用药
  const startTs = new Date(dateRange.start).getTime();
  const endTs = new Date(dateRange.end).getTime();
  const visibleMeds = meds ? meds.filter(m => {
    const mStart = new Date(m.startTime).getTime();
    const mEnd = m.endTime ? new Date(m.endTime).getTime() : endTs;
    return mStart <= endTs && mEnd >= startTs;
  }) : [];

  // 生成HTML内容
  const html = generatePDFContent({ datasets, dateRange, visibleMeds, memberName });

  // 生成文件名
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const fileName = `趋势分析报告${memberName ? `-${memberName}` : ''}-${dateStr}.html`;

  // 创建Blob
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });

  // 检测是否支持Web Share API（主要用于移动设备）
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && navigator.share && navigator.canShare) {
    // 移动设备：使用Web Share API分享文件
    try {
      const file = new File([blob], fileName, { type: 'text/html' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `趋势分析报告${memberName ? ` - ${memberName}` : ''}`,
          text: '健康管理系统趋势分析报告'
        });
        return;
      }
    } catch (err) {
      // 如果分享被取消或失败，继续使用下载方式
      if (err.name !== 'AbortError') {
        console.log('Share failed, falling back to download:', err);
      } else {
        return; // 用户取消分享
      }
    }
  }

  // 桌面设备或不支持分享：直接下载文件
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 生成趋势图SVG
 */
const generateTrendChartSVG = (datasets, dateRange) => {
  if (!datasets?.length) return '';

  let allPoints = [];
  datasets.forEach((ds, i) => {
    ds.points.forEach(p => {
      if (p.dateStr >= dateRange.start && p.dateStr <= dateRange.end) {
        allPoints.push({ ...p, color: CHART_COLORS[i % CHART_COLORS.length] });
      }
    });
  });

  if (!allPoints.length) return '';

  const uniqueDates = [...new Set(allPoints.map(p => p.dateStr))].sort();
  const minVal = Math.min(...allPoints.map(p => p.val));
  const maxVal = Math.max(...allPoints.map(p => p.val));
  let valSpan = maxVal - minVal || 1;
  const yPad = valSpan * 0.2;
  const yMin = minVal - yPad, yMax = maxVal + yPad;
  const W = 600, H = 300, PL = 60, PR = 30, PT = 40, PB = 50;

  const getX = (d) => {
    const idx = uniqueDates.indexOf(d);
    if (uniqueDates.length === 1) return (W - PL - PR) / 2 + PL;
    return PL + (idx / (uniqueDates.length - 1)) * (W - PL - PR);
  };

  const getY = (v) => H - PB - ((v - yMin) / (yMax - yMin)) * (H - PT - PB);

  const getVisibleDateLabels = () => {
    const totalDates = uniqueDates.length;
    if (totalDates <= 8) return uniqueDates;
    const step = Math.ceil(totalDates / 8);
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

  // 生成Y轴网格线和标签
  let gridLines = '';
  for (let i = 0; i <= 4; i++) {
    const y = PT + i * (H - PT - PB) / 4;
    const val = yMax - (i / 4) * (yMax - yMin);
    gridLines += `<line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}" stroke="#e5e7eb" stroke-dasharray="3"/>`;
    gridLines += `<text x="${PL - 8}" y="${y + 4}" text-anchor="end" font-size="12" fill="#9ca3af">${val.toFixed(1)}</text>`;
  }

  // 生成X轴日期标签
  let dateLabels = '';
  visibleDateLabels.forEach(d => {
    dateLabels += `<text x="${getX(d)}" y="${H - 20}" text-anchor="middle" font-size="11" fill="#6b7280">${d.slice(5)}</text>`;
  });

  // 生成数据线和点
  let dataLines = '';
  datasets.forEach((ds, i) => {
    const color = CHART_COLORS[i % CHART_COLORS.length];
    const sorted = ds.points
      .filter(p => p.dateStr >= dateRange.start && p.dateStr <= dateRange.end)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    if (!sorted.length) return;

    // 绘制连线
    if (sorted.length > 1) {
      const pathD = sorted.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(p.dateStr)} ${getY(p.val)}`).join(' ');
      dataLines += `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`;
    }

    // 绘制数据点和标签
    sorted.forEach(p => {
      const isAbnormal = p.original.flag === 'High' || p.original.flag === 'Low';
      const dotColor = isAbnormal ? (p.original.flag === 'High' ? '#dc2626' : '#f97316') : color;
      const flagSymbol = p.original.flag === 'High' ? '↑' : p.original.flag === 'Low' ? '↓' : '';

      dataLines += `<circle cx="${getX(p.dateStr)}" cy="${getY(p.val)}" r="5" fill="${dotColor}"/>`;
      dataLines += `<text x="${getX(p.dateStr)}" y="${getY(p.val) - 12}" text-anchor="middle" font-size="12" font-weight="bold" fill="${dotColor}">${p.val}${flagSymbol}</text>`;
    });
  });

  // 生成图例
  let legend = '';
  datasets.forEach((ds, i) => {
    const x = PL + i * 120;
    legend += `<circle cx="${x}" cy="${H - 5}" r="5" fill="${CHART_COLORS[i % CHART_COLORS.length]}"/>`;
    legend += `<text x="${x + 10}" y="${H}" font-size="12" fill="#4b5563">${ds.name}${ds.unit ? ` (${ds.unit})` : ''}</text>`;
  });

  return `
    <svg width="100%" viewBox="0 0 ${W} ${H}" style="max-width: 100%; height: auto;">
      <!-- 背景 -->
      <rect x="0" y="0" width="${W}" height="${H}" fill="#fafafa" rx="8"/>

      <!-- 网格线和Y轴标签 -->
      ${gridLines}

      <!-- X轴日期标签 -->
      ${dateLabels}

      <!-- 数据线和点 -->
      ${dataLines}

      <!-- 图例 -->
      ${legend}
    </svg>
  `;
};

/**
 * 生成PDF内容的HTML
 */
const generatePDFContent = ({ datasets, dateRange, visibleMeds, memberName }) => {
  const now = new Date();
  const exportTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const trendChartSVG = generateTrendChartSVG(datasets, dateRange);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>趋势分析报告${memberName ? ` - ${memberName}` : ''}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #333;
      line-height: 1.6;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #6366f1;
      font-size: 24px;
      margin-bottom: 10px;
    }
    .header .meta {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #374151;
      margin-bottom: 15px;
      padding-left: 10px;
      border-left: 4px solid #6366f1;
    }
    .date-range {
      background: #f3f4f6;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      color: #4b5563;
    }
    .chart-container {
      background: #fafafa;
      border-radius: 12px;
      padding: 20px;
      margin-top: 10px;
    }
    .indicator-tag {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      color: white;
      margin: 4px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 13px;
    }
    .data-table th {
      background: #f9fafb;
      padding: 10px;
      text-align: left;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;
    }
    .data-table td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .data-table tr:nth-child(even) {
      background: #f9fafb;
    }
    .value-high {
      color: #dc2626;
      font-weight: bold;
    }
    .value-low {
      color: #f97316;
      font-weight: bold;
    }
    .value-normal {
      color: #374151;
      font-weight: bold;
    }
    .arrow-up::after {
      content: " ↑";
      color: #dc2626;
    }
    .arrow-down::after {
      content: " ↓";
      color: #f97316;
    }
    .med-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 10px;
    }
    .med-name {
      font-weight: 600;
      color: #374151;
    }
    .med-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 8px;
    }
    .med-active {
      background: #dcfce7;
      color: #16a34a;
    }
    .med-ended {
      background: #f3f4f6;
      color: #6b7280;
    }
    .med-detail {
      font-size: 12px;
      color: #6b7280;
      margin-top: 6px;
    }
    .med-dosage {
      font-size: 12px;
      color: #6366f1;
      margin-top: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    .no-data {
      text-align: center;
      color: #9ca3af;
      padding: 20px;
    }
    @media print {
      body {
        padding: 0;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 趋势分析报告${memberName ? ` - ${memberName}` : ''}</h1>
    <div class="meta">导出时间: ${exportTime}</div>
  </div>

  <div class="section">
    <div class="section-title">分析时间范围</div>
    <div class="date-range">
      📅 ${dateRange.start} 至 ${dateRange.end}
    </div>
  </div>

  ${datasets.length > 0 ? `
  <div class="section">
    <div class="section-title">分析指标 (${datasets.length}项)</div>
    <div>
      ${datasets.map((ds, idx) => `
        <span class="indicator-tag" style="background-color: ${CHART_COLORS[idx % CHART_COLORS.length]}">
          ${ds.name}${ds.unit ? ` (${ds.unit})` : ''}
        </span>
      `).join('')}
    </div>
  </div>

  ${trendChartSVG ? `
  <div class="section">
    <div class="section-title">趋势图</div>
    <div class="chart-container">
      ${trendChartSVG}
    </div>
  </div>
  ` : ''}

  ${datasets.map((ds, idx) => {
    const filteredPoints = ds.points
      .filter(p => p.dateStr >= dateRange.start && p.dateStr <= dateRange.end)
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    if (filteredPoints.length === 0) return '';

    return `
    <div class="section">
      <div class="section-title" style="border-color: ${CHART_COLORS[idx % CHART_COLORS.length]}">
        ${ds.name}${ds.unit ? ` (${ds.unit})` : ''} - 数据明细
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40%">日期</th>
            <th style="width: 30%">结果</th>
            <th style="width: 30%">参考范围</th>
          </tr>
        </thead>
        <tbody>
          ${filteredPoints.map(p => {
            const flagClass = p.original.flag === 'High' ? 'value-high arrow-up' :
                             p.original.flag === 'Low' ? 'value-low arrow-down' : 'value-normal';
            return `
              <tr>
                <td>${p.dateStr}</td>
                <td class="${flagClass}">${p.val} ${p.original.unit || ''}</td>
                <td>${p.original.refRange || '-'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
    `;
  }).join('')}
  ` : `
  <div class="section">
    <div class="no-data">暂无指标数据</div>
  </div>
  `}

  ${visibleMeds.length > 0 ? `
  <div class="section">
    <div class="section-title">同期用药计划 (${visibleMeds.length}项)</div>
    ${visibleMeds.map(m => {
      const isActive = !m.endTime || new Date(m.endTime) >= new Date();
      return `
        <div class="med-card">
          <div>
            <span class="med-name">${m.name}</span>
            <span class="med-status ${isActive ? 'med-active' : 'med-ended'}">
              ${isActive ? '进行中' : '已结束'}
            </span>
          </div>
          <div class="med-detail">
            📅 ${m.startTime} ${m.endTime ? `至 ${m.endTime}` : '起 (长期)'}
          </div>
          ${m.dosagePerTime ? `
            <div class="med-dosage">
              💊 每次${m.dosagePerTime} · 每日${m.frequency}次 · ${m.relation}
              ${m.timePeriods && m.timePeriods.length > 0 ? ` · ${m.timePeriods.join('/')}` : ''}
            </div>
          ` : ''}
          ${m.cycleEnabled && m.cycleDays && m.cycleRestDays ? `
            <div class="med-dosage">
              🔄 循环: 服${m.cycleDays}天停${m.cycleRestDays}天
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}
  </div>
  ` : ''}

  <div class="footer">
    <p>本报告由健康管理系统自动生成，仅供参考</p>
    <p>如有疑问请咨询专业医生</p>
  </div>
</body>
</html>
  `;
};

export default exportTrendToPDF;
