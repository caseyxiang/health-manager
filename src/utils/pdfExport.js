// 导出工具函数 - 生成图片并支持保存和分享

import { CHART_COLORS } from '../constants';

/**
 * 导出趋势分析结果为图片
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

  // 生成图片
  const canvas = await generateReportImage({ datasets, dateRange, visibleMeds, memberName });

  // 转换为Blob
  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));

  // 生成文件名
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const fileName = `趋势分析报告${memberName ? `-${memberName}` : ''}-${dateStr}.png`;

  // 检测是否支持Web Share API（主要用于移动设备）
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile && navigator.share && navigator.canShare) {
    // 移动设备：使用Web Share API分享文件
    try {
      const file = new File([blob], fileName, { type: 'image/png' });
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
      if (err.name === 'AbortError') {
        return; // 用户取消分享
      }
      console.log('Share failed, falling back to download:', err);
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
 * 生成报告图片
 */
const generateReportImage = async ({ datasets, dateRange, visibleMeds, memberName }) => {
  const now = new Date();
  const exportTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // 计算画布尺寸
  const WIDTH = 750; // 适合手机屏幕的宽度
  const PADDING = 30;
  const LINE_HEIGHT = 28;
  const SECTION_GAP = 25;

  // 预计算高度
  let totalHeight = PADDING * 2; // 顶部和底部边距
  totalHeight += 60; // 标题
  totalHeight += 30; // 导出时间
  totalHeight += SECTION_GAP + 50; // 时间范围区块
  totalHeight += SECTION_GAP + 40 + Math.ceil(datasets.length / 3) * 35; // 指标标签

  // 趋势图高度
  if (datasets.length > 0) {
    totalHeight += SECTION_GAP + 30 + 250; // 趋势图标题 + 图表
  }

  // 数据明细高度
  datasets.forEach(ds => {
    const filteredPoints = ds.points.filter(p => p.dateStr >= dateRange.start && p.dateStr <= dateRange.end);
    if (filteredPoints.length > 0) {
      totalHeight += SECTION_GAP + 35 + 35 + filteredPoints.length * 32; // 标题 + 表头 + 数据行
    }
  });

  // 用药计划高度
  if (visibleMeds.length > 0) {
    totalHeight += SECTION_GAP + 35;
    visibleMeds.forEach(m => {
      totalHeight += 75; // 每个药品卡片
    });
  }

  totalHeight += SECTION_GAP + 50; // 底部说明

  // 创建画布
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 2;
  canvas.width = WIDTH * dpr;
  canvas.height = totalHeight * dpr;
  canvas.style.width = WIDTH + 'px';
  canvas.style.height = totalHeight + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // 绘制背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, totalHeight);

  let y = PADDING;

  // 绘制标题
  ctx.fillStyle = '#6366f1';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`📊 趋势分析报告${memberName ? ` - ${memberName}` : ''}`, WIDTH / 2, y + 30);
  y += 45;

  // 导出时间
  ctx.fillStyle = '#666666';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`导出时间: ${exportTime}`, WIDTH / 2, y + 15);
  y += 30;

  // 分隔线
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();
  y += SECTION_GAP;

  // 时间范围
  ctx.textAlign = 'left';
  drawSectionTitle(ctx, '分析时间范围', PADDING, y);
  y += 30;

  ctx.fillStyle = '#f3f4f6';
  roundRect(ctx, PADDING, y, WIDTH - PADDING * 2, 35, 8);
  ctx.fill();
  ctx.fillStyle = '#4b5563';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(`📅 ${dateRange.start} 至 ${dateRange.end}`, PADDING + 15, y + 23);
  y += 50;

  // 分析指标
  if (datasets.length > 0) {
    y += SECTION_GAP;
    drawSectionTitle(ctx, `分析指标 (${datasets.length}项)`, PADDING, y);
    y += 30;

    // 绘制指标标签
    let tagX = PADDING;
    let tagY = y;
    datasets.forEach((ds, idx) => {
      const tagText = `${ds.name}${ds.unit ? ` (${ds.unit})` : ''}`;
      ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
      const tagWidth = ctx.measureText(tagText).width + 24;

      if (tagX + tagWidth > WIDTH - PADDING) {
        tagX = PADDING;
        tagY += 35;
      }

      ctx.fillStyle = CHART_COLORS[idx % CHART_COLORS.length];
      roundRect(ctx, tagX, tagY, tagWidth, 28, 14);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(tagText, tagX + 12, tagY + 19);
      tagX += tagWidth + 10;
    });
    y = tagY + 40;

    // 趋势图
    y += SECTION_GAP;
    drawSectionTitle(ctx, '趋势图', PADDING, y);
    y += 30;

    drawTrendChart(ctx, datasets, dateRange, PADDING, y, WIDTH - PADDING * 2, 220);
    y += 230;
  }

  // 数据明细
  datasets.forEach((ds, idx) => {
    const filteredPoints = ds.points
      .filter(p => p.dateStr >= dateRange.start && p.dateStr <= dateRange.end)
      .sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    if (filteredPoints.length === 0) return;

    y += SECTION_GAP;
    drawSectionTitle(ctx, `${ds.name}${ds.unit ? ` (${ds.unit})` : ''} - 数据明细`, PADDING, y, CHART_COLORS[idx % CHART_COLORS.length]);
    y += 30;

    // 表头
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(PADDING, y, WIDTH - PADDING * 2, 32);
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText('日期', PADDING + 15, y + 21);
    ctx.fillText('结果', PADDING + 200, y + 21);
    ctx.fillText('参考范围', PADDING + 420, y + 21);
    y += 35;

    // 数据行
    filteredPoints.forEach((p, pIdx) => {
      if (pIdx % 2 === 1) {
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(PADDING, y, WIDTH - PADDING * 2, 30);
      }

      ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(p.dateStr, PADDING + 15, y + 20);

      // 结果值（根据flag显示颜色）
      ctx.fillStyle = p.original.flag === 'High' ? '#dc2626' : p.original.flag === 'Low' ? '#f97316' : '#374151';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
      const flagSymbol = p.original.flag === 'High' ? ' ↑' : p.original.flag === 'Low' ? ' ↓' : '';
      ctx.fillText(`${p.val} ${p.original.unit || ''}${flagSymbol}`, PADDING + 200, y + 20);

      ctx.fillStyle = '#6b7280';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(p.original.refRange || '-', PADDING + 420, y + 20);
      y += 32;
    });
  });

  // 用药计划
  if (visibleMeds.length > 0) {
    y += SECTION_GAP;
    drawSectionTitle(ctx, `同期用药计划 (${visibleMeds.length}项)`, PADDING, y);
    y += 35;

    visibleMeds.forEach(m => {
      const isActive = !m.endTime || new Date(m.endTime) >= new Date();

      // 卡片背景
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      roundRect(ctx, PADDING, y, WIDTH - PADDING * 2, 65, 8);
      ctx.stroke();

      // 药品名称
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(m.name, PADDING + 15, y + 22);

      // 状态标签
      const statusText = isActive ? '进行中' : '已结束';
      const statusWidth = ctx.measureText(statusText).width + 16;
      ctx.fillStyle = isActive ? '#dcfce7' : '#f3f4f6';
      roundRect(ctx, PADDING + 15 + ctx.measureText(m.name).width + 10, y + 8, statusWidth, 20, 4);
      ctx.fill();
      ctx.fillStyle = isActive ? '#16a34a' : '#6b7280';
      ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(statusText, PADDING + 15 + ctx.measureText(m.name).width + 18, y + 21);

      // 日期
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`📅 ${m.startTime} ${m.endTime ? `至 ${m.endTime}` : '起 (长期)'}`, PADDING + 15, y + 42);

      // 用药详情
      if (m.dosagePerTime) {
        ctx.fillStyle = '#6366f1';
        let dosageText = `💊 每次${m.dosagePerTime} · 每日${m.frequency}次 · ${m.relation}`;
        if (m.timePeriods && m.timePeriods.length > 0) {
          dosageText += ` · ${m.timePeriods.join('/')}`;
        }
        ctx.fillText(dosageText, PADDING + 15, y + 58);
      }

      y += 75;
    });
  }

  // 底部说明
  y += SECTION_GAP;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, y);
  ctx.lineTo(WIDTH - PADDING, y);
  ctx.stroke();
  y += 15;

  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('本报告由健康管理系统自动生成，仅供参考', WIDTH / 2, y + 15);
  ctx.fillText('如有疑问请咨询专业医生', WIDTH / 2, y + 32);

  return canvas;
};

/**
 * 绘制章节标题
 */
const drawSectionTitle = (ctx, text, x, y, color = '#6366f1') => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 4, 20);
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(text, x + 12, y + 16);
};

/**
 * 绘制圆角矩形
 */
const roundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

/**
 * 绘制趋势图
 */
const drawTrendChart = (ctx, datasets, dateRange, x, y, width, height) => {
  // 背景
  ctx.fillStyle = '#fafafa';
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();

  const PL = 50, PR = 20, PT = 25, PB = 35;
  const chartX = x + PL;
  const chartY = y + PT;
  const chartW = width - PL - PR;
  const chartH = height - PT - PB;

  // 收集所有数据点
  let allPoints = [];
  datasets.forEach((ds, i) => {
    ds.points.forEach(p => {
      if (p.dateStr >= dateRange.start && p.dateStr <= dateRange.end) {
        allPoints.push({ ...p, color: CHART_COLORS[i % CHART_COLORS.length] });
      }
    });
  });

  if (!allPoints.length) return;

  const uniqueDates = [...new Set(allPoints.map(p => p.dateStr))].sort();
  const minVal = Math.min(...allPoints.map(p => p.val));
  const maxVal = Math.max(...allPoints.map(p => p.val));
  const valSpan = maxVal - minVal || 1;
  const yPad = valSpan * 0.2;
  const yMin = minVal - yPad, yMax = maxVal + yPad;

  const getPointX = (d) => {
    const idx = uniqueDates.indexOf(d);
    if (uniqueDates.length === 1) return chartX + chartW / 2;
    return chartX + (idx / (uniqueDates.length - 1)) * chartW;
  };

  const getPointY = (v) => chartY + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  // 绘制网格线和Y轴标签
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  for (let i = 0; i <= 4; i++) {
    const gridY = chartY + i * chartH / 4;
    const val = yMax - (i / 4) * (yMax - yMin);
    ctx.beginPath();
    ctx.moveTo(chartX, gridY);
    ctx.lineTo(chartX + chartW, gridY);
    ctx.stroke();

    ctx.fillStyle = '#9ca3af';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), chartX - 8, gridY + 4);
  }
  ctx.setLineDash([]);

  // 绘制X轴日期标签
  const visibleDates = uniqueDates.length <= 6 ? uniqueDates :
    uniqueDates.filter((_, i) => i === 0 || i === uniqueDates.length - 1 || i % Math.ceil(uniqueDates.length / 6) === 0);

  ctx.fillStyle = '#6b7280';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  visibleDates.forEach(d => {
    ctx.fillText(d.slice(5), getPointX(d), y + height - 10);
  });

  // 绘制数据线和点
  datasets.forEach((ds, i) => {
    const color = CHART_COLORS[i % CHART_COLORS.length];
    const sorted = ds.points
      .filter(p => p.dateStr >= dateRange.start && p.dateStr <= dateRange.end)
      .sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    if (!sorted.length) return;

    // 绘制连线
    if (sorted.length > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      sorted.forEach((p, idx) => {
        const px = getPointX(p.dateStr);
        const py = getPointY(p.val);
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // 绘制数据点和标签
    sorted.forEach(p => {
      const px = getPointX(p.dateStr);
      const py = getPointY(p.val);
      const isAbnormal = p.original.flag === 'High' || p.original.flag === 'Low';
      const dotColor = isAbnormal ? (p.original.flag === 'High' ? '#dc2626' : '#f97316') : color;

      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();

      // 数值标签
      ctx.fillStyle = dotColor;
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      const flagSymbol = p.original.flag === 'High' ? '↑' : p.original.flag === 'Low' ? '↓' : '';
      ctx.fillText(`${p.val}${flagSymbol}`, px, py - 10);
    });
  });

  // 绘制图例
  ctx.textAlign = 'left';
  let legendX = chartX;
  datasets.forEach((ds, i) => {
    ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
    ctx.beginPath();
    ctx.arc(legendX + 5, y + height - 8, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4b5563';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    const legendText = `${ds.name}${ds.unit ? ` (${ds.unit})` : ''}`;
    ctx.fillText(legendText, legendX + 14, y + height - 4);
    legendX += ctx.measureText(legendText).width + 30;
  });
};

export default exportTrendToPDF;
