// PDF导出工具函数 - 使用浏览器打印功能生成PDF

import { CHART_COLORS } from '../constants';

/**
 * 导出趋势分析结果为PDF
 * @param {Object} options - 导出选项
 * @param {Array} options.datasets - 趋势数据集
 * @param {Object} options.dateRange - 日期范围 {start, end}
 * @param {Array} options.meds - 用药计划列表
 * @param {string} options.memberName - 成员姓名
 */
export const exportTrendToPDF = ({ datasets, dateRange, meds, memberName = '' }) => {
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

  // 创建新窗口进行打印
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('请允许弹出窗口以导出PDF');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // 等待内容加载完成后打印
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };
};

/**
 * 生成PDF内容的HTML
 */
const generatePDFContent = ({ datasets, dateRange, visibleMeds, memberName }) => {
  const now = new Date();
  const exportTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
