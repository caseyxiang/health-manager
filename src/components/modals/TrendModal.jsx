import { useState } from 'react';
import Icons from '../icons/Icons';
import { TrendChart, MedicationGantt } from '../charts';
import { CHART_COLORS } from '../../constants';
import { getLocalDateStr } from '../../utils';
import { exportTrendToPDF } from '../../utils/pdfExport';

const TrendModal = ({
  show,
  onClose,
  selectedItems,
  labReports,
  meds,
  dateRange,
  setDateRange,
  onClearSelection,
  memberName = ''
}) => {
  if (!show) return null;

  // 快速选择时间范围
  const quickRanges = [
    { label: '近1月', months: 1 },
    { label: '近3月', months: 3 },
    { label: '近6月', months: 6 },
    { label: '近1年', months: 12 },
    { label: '全部', months: 0 }
  ];

  const setQuickRange = (months) => {
    const end = new Date();
    let start;
    if (months === 0) {
      // 全部数据
      const allDates = labReports.map(r => r.date).sort();
      start = allDates.length > 0 ? new Date(allDates[0]) : new Date();
      start.setDate(start.getDate() - 1);
    } else {
      start = new Date();
      start.setMonth(start.getMonth() - months);
    }
    setDateRange({ start: getLocalDateStr(start), end: getLocalDateStr(end) });
  };

  // 解析选中项的key，格式为 "名称||单位"
  const parseItemKey = (key) => {
    const parts = key.split('||');
    return { name: parts[0], unit: parts[1] || '' };
  };

  // 构建趋势数据
  const buildTrendDatasets = () => {
    const datasets = [];

    selectedItems.forEach((itemKey, index) => {
      const points = [];
      const { name: itemName, unit: itemUnit } = parseItemKey(itemKey);

      // 遍历所有检验报告找这个指标（名称和单位都要匹配，单位忽略大小写）
      labReports.forEach(report => {
        if (!report.items) return;

        const item = report.items.find(i => i.name === itemName && (i.unit || '').toLowerCase() === itemUnit);
        if (item && item.result) {
          // 解析数值
          const numVal = parseFloat(item.result);
          if (!isNaN(numVal)) {
            points.push({
              dateStr: report.date,
              val: numVal,
              original: item
            });
          }
        }
      });

      if (points.length > 0) {
        datasets.push({
          key: itemKey,
          name: itemName,
          unit: itemUnit,
          points: points.sort((a, b) => a.dateStr.localeCompare(b.dateStr))
        });
      }
    });

    return datasets;
  };

  const datasets = buildTrendDatasets();

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Icons.TrendingUp size={20} className="text-indigo-600" />
            趋势分析
          </h3>
          <div className="flex items-center gap-2">
            {datasets.length > 0 && (
              <button
                onClick={() => exportTrendToPDF({ datasets, dateRange, meds, memberName })}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-200"
              >
                <Icons.Download size={16} />
                导出PDF
              </button>
            )}
            <button onClick={onClose}><Icons.X size={24} className="text-gray-400" /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* 已选指标 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">已选指标 ({selectedItems.length})</span>
              {selectedItems.length > 0 && (
                <button onClick={onClearSelection} className="text-xs text-red-500 flex items-center gap-1">
                  <Icons.Trash2 size={12} /> 清空
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedItems.map((itemKey, idx) => {
                const { name, unit } = parseItemKey(itemKey);
                return (
                  <div
                    key={itemKey}
                    className="px-3 py-1 rounded-full text-sm font-medium text-white flex items-center gap-1"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  >
                    {name}{unit && <span className="opacity-75 text-xs">({unit})</span>}
                  </div>
                );
              })}
              {selectedItems.length === 0 && (
                <div className="text-gray-400 text-sm">请在检验报告中选择要查看趋势的指标</div>
              )}
            </div>
          </div>

          {/* 时间范围 */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">时间范围</div>
            <div className="flex gap-2 flex-wrap mb-3">
              {quickRanges.map(r => (
                <button
                  key={r.label}
                  onClick={() => setQuickRange(r.months)}
                  className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600"
                >
                  {r.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">开始日期</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">结束日期</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* 趋势图 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <TrendChart datasets={datasets} dateRange={dateRange} />
          </div>

          {/* 同期用药甘特图 */}
          {meds && meds.length > 0 && (
            <MedicationGantt meds={meds} dateRange={dateRange} />
          )}

          {/* 数据明细 */}
          {datasets.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">数据明细</div>
              <div className="space-y-3">
                {datasets.map((ds, idx) => (
                  <div key={ds.key} className="bg-white border rounded-xl overflow-hidden">
                    <div
                      className="px-4 py-2 text-sm font-medium text-white flex items-center gap-2"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    >
                      {ds.name}{ds.unit && <span className="opacity-75 text-xs">({ds.unit})</span>}
                    </div>
                    <div className="divide-y">
                      {ds.points
                        .filter(p => p.dateStr >= dateRange.start && p.dateStr <= dateRange.end)
                        .sort((a, b) => b.dateStr.localeCompare(a.dateStr))
                        .map((p, pIdx) => {
                          const flagColor = p.original.flag === 'High' ? 'text-rose-600' : p.original.flag === 'Low' ? 'text-orange-500' : 'text-gray-700';
                          return (
                            <div key={pIdx} className="px-4 py-2 flex justify-between items-center text-sm">
                              <span className="text-gray-500">{p.dateStr}</span>
                              <div className="flex items-center gap-1">
                                <span className={`font-bold ${flagColor}`}>{p.val}</span>
                                <span className="text-xs text-gray-400">{p.original.unit}</span>
                                {p.original.flag === 'High' && <span className="text-rose-600 text-xs font-bold">↑</span>}
                                {p.original.flag === 'Low' && <span className="text-orange-500 text-xs font-bold">↓</span>}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 用药计划明细 */}
          {meds && meds.length > 0 && (() => {
            const startTs = new Date(dateRange.start).getTime();
            const endTs = new Date(dateRange.end).getTime();
            const visibleMeds = meds.filter(m => {
              const mStart = new Date(m.startTime).getTime();
              const mEnd = m.endTime ? new Date(m.endTime).getTime() : endTs;
              return mStart <= endTs && mEnd >= startTs;
            });
            if (visibleMeds.length === 0) return null;
            return (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">用药计划明细</div>
                <div className="bg-white border rounded-xl overflow-hidden">
                  <div className="divide-y">
                    {visibleMeds.map(m => {
                      const isActive = !m.endTime || new Date(m.endTime) >= new Date();
                      return (
                        <div key={m.id} className="px-4 py-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                <span className="font-medium text-gray-800">{m.name}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 ml-4">
                                {m.startTime} {m.endTime ? `至 ${m.endTime}` : '起 (长期)'}
                              </div>
                              {m.dosagePerTime && (
                                <div className="text-xs text-indigo-600 mt-1 ml-4">
                                  每次{m.dosagePerTime} · 每日{m.frequency}次 · {m.relation}
                                  {(m.timePeriods && m.timePeriods.length > 0) && ` · ${m.timePeriods.join('/')}`}
                                </div>
                              )}
                              {m.cycleEnabled && m.cycleDays && m.cycleRestDays && (
                                <div className="text-xs text-green-600 mt-1 ml-4 flex items-center gap-1">
                                  <Icons.Repeat size={10} />
                                  循环: 服{m.cycleDays}天停{m.cycleRestDays}天
                                </div>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded ${isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                              {isActive ? '进行中' : '已结束'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 关闭按钮 */}
          <div className="pt-4">
            <button onClick={onClose} className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendModal;
