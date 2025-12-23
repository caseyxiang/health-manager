import { useState, useRef, useEffect } from 'react';
import Icons from '../icons/Icons';
import { analyzeMedicalImage, getApiKeyFor, getCurrentApi } from '../../services/ai';
import { getLocalDateStr, compressImages } from '../../utils';
import { API_PROVIDERS, LAB_CATEGORIES, IMAGING_MODALITIES } from '../../constants';

const ScanModal = ({
  show,
  onClose,
  scanType, // 'lab' or 'imaging'
  editingId,
  scanEditData,
  onSave,
  onDelete,
  customLabCategories = [],
  customImagingModalities = [],
  onAddCustomCategory
}) => {
  const [scanLoading, setScanLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const scanFileRef = useRef(null);

  // 报告数据
  const [reportData, setReportData] = useState(scanEditData || (
    scanType === 'lab'
      ? { date: getLocalDateStr(new Date()), hospital: '', items: [{ name: '', result: '', unit: '', refRange: '', flag: 'Normal' }] }
      : { date: getLocalDateStr(new Date()), hospital: '', modality: '', region: '', findings: '', impression: '' }
  ));

  // 每次弹窗打开时重置状态
  useEffect(() => {
    if (show) {
      // 重置上传和调试状态
      setUploadedFiles([]);
      setDebugInfo('');
      setScanLoading(false);
      setShowImagePreview(false);
      setPreviewImageIndex(0);

      // 重置报告数据
      if (scanEditData) {
        setReportData(scanEditData);
      } else {
        setReportData(
          scanType === 'lab'
            ? { date: getLocalDateStr(new Date()), hospital: '', items: [{ name: '', result: '', unit: '', refRange: '', flag: 'Normal' }] }
            : { date: getLocalDateStr(new Date()), hospital: '', modality: '', region: '', findings: '', impression: '' }
        );
      }
    }
  }, [show, scanType, scanEditData]);

  if (!show) return null;

  // 合并预定义列表和自定义列表
  const allLabCategories = [...LAB_CATEGORIES, ...customLabCategories.filter(c => !LAB_CATEGORIES.includes(c))];
  const allImagingModalities = [...IMAGING_MODALITIES, ...customImagingModalities.filter(c => !IMAGING_MODALITIES.includes(c))];

  // 根据结果和参考范围自动判断异常标记
  const detectFlag = (result, refRange) => {
    if (!result || !refRange) return 'Normal';

    // 提取数值结果
    const numResult = parseFloat(result.replace(/[^\d.-]/g, ''));
    if (isNaN(numResult)) return 'Normal';

    // 解析参考范围 - 支持多种格式
    // 格式1: "3.5-5.5" 或 "3.5~5.5"
    // 格式2: "<10" 或 ">1.0"
    // 格式3: "男4.0-5.5,女3.5-5.0" (取较宽范围)

    let minVal = null, maxVal = null;

    // 先尝试提取简单范围
    const rangeMatch = refRange.match(/([\d.]+)\s*[-~]\s*([\d.]+)/);
    if (rangeMatch) {
      minVal = parseFloat(rangeMatch[1]);
      maxVal = parseFloat(rangeMatch[2]);
    } else {
      // 尝试提取 <X 格式
      const ltMatch = refRange.match(/<\s*([\d.]+)/);
      if (ltMatch) {
        maxVal = parseFloat(ltMatch[1]);
        minVal = 0;
      }
      // 尝试提取 >X 格式
      const gtMatch = refRange.match(/>\s*([\d.]+)/);
      if (gtMatch) {
        minVal = parseFloat(gtMatch[1]);
        maxVal = Infinity;
      }
    }

    // 如果是 男/女 分开的格式，提取所有数值取最宽范围
    if (minVal === null && maxVal === null) {
      const allNumbers = refRange.match(/[\d.]+/g);
      if (allNumbers && allNumbers.length >= 2) {
        const nums = allNumbers.map(n => parseFloat(n)).filter(n => !isNaN(n));
        minVal = Math.min(...nums);
        maxVal = Math.max(...nums);
      }
    }

    if (minVal !== null && maxVal !== null) {
      if (numResult > maxVal) return 'High';
      if (numResult < minVal) return 'Low';
    }

    return 'Normal';
  };

  // 为识别结果添加异常标记
  const addFlagsToItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      ...item,
      flag: detectFlag(item.result, item.refRange)
    }));
  };

  // 匹配类别到预定义列表，如果匹配失败则添加为自定义类型
  const matchCategory = (aiCategory, categoryList, type) => {
    if (!aiCategory) return '';
    // 精确匹配
    if (categoryList.includes(aiCategory)) return aiCategory;
    // 模糊匹配（包含关系）
    const matched = categoryList.find(c =>
      aiCategory.includes(c) || c.includes(aiCategory)
    );
    if (matched) return matched;

    // 无法匹配，添加为自定义类型
    if (onAddCustomCategory && aiCategory.trim()) {
      onAddCustomCategory(type, aiCategory.trim());
    }
    return aiCategory.trim() || '其他';
  };

  // 添加检测项
  const addLabItem = () => {
    setReportData({
      ...reportData,
      items: [...(reportData.items || []), { name: '', result: '', unit: '', refRange: '', flag: 'Normal' }]
    });
  };

  // 删除检测项
  const removeLabItem = (index) => {
    const newItems = [...reportData.items];
    newItems.splice(index, 1);
    setReportData({ ...reportData, items: newItems });
  };

  // 更新检测项
  const updateLabItem = (index, field, value) => {
    const newItems = [...reportData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setReportData({ ...reportData, items: newItems });
  };

  // 处理文件上传和AI识别
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setScanLoading(true);
    setDebugInfo('开始处理文件...');

    try {
      // 转换文件为base64
      const filePromises = files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, data: reader.result, type: file.type });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const fileData = await Promise.all(filePromises);
      setUploadedFiles(fileData);
      setDebugInfo(prev => prev + `\n已加载 ${fileData.length} 个文件`);

      // 调用AI识别
      const currentApi = getCurrentApi();
      const apiKey = getApiKeyFor(currentApi);
      const providerName = API_PROVIDERS.find(p => p.id === currentApi)?.name || currentApi;

      if (!apiKey) {
        setDebugInfo(prev => prev + '\n❌ 未配置API密钥');
        alert('请先在设置中配置AI API密钥');
        setScanLoading(false);
        return;
      }

      setDebugInfo(prev => prev + `\n使用 ${providerName} 进行识别...`);

      const result = await analyzeMedicalImage(fileData, scanType, currentApi);

      if (result && result.success) {
        setDebugInfo(prev => prev + '\n✅ 识别成功');

        // 压缩图片用于保存
        setDebugInfo(prev => prev + '\n正在压缩图片...');
        const compressedFiles = await compressImages(fileData, 800, 0.7);
        const images = compressedFiles.map(f => f.data);
        setDebugInfo(prev => prev + `\n✅ 已压缩 ${images.length} 张图片`);

        if (scanType === 'lab') {
          const matchedCategory = matchCategory(result.category, allLabCategories, 'lab');
          // 自动检测异常值
          const itemsWithFlags = addFlagsToItems(result.items || []);
          const abnormalCount = itemsWithFlags.filter(i => i.flag !== 'Normal').length;

          setReportData({
            date: result.date || getLocalDateStr(new Date()),
            hospital: result.hospital || '',
            category: matchedCategory, // 匹配到预定义列表或添加为自定义
            items: itemsWithFlags,
            images // 保存压缩后的图片
          });
          if (result.category) {
            const isNewType = !allLabCategories.includes(result.category) && !allLabCategories.find(c => result.category.includes(c) || c.includes(result.category));
            setDebugInfo(prev => prev + `\n📋 AI识别类型: ${result.category}${matchedCategory !== result.category ? ` → 匹配为: ${matchedCategory}` : ''}${isNewType ? ' (已添加为新类型)' : ''}`);
          }
          if (abnormalCount > 0) {
            setDebugInfo(prev => prev + `\n⚠️ 检测到 ${abnormalCount} 项异常指标`);
          }
        } else {
          const matchedModality = matchCategory(result.modality, allImagingModalities, 'imaging');
          setReportData({
            date: result.date || getLocalDateStr(new Date()),
            hospital: result.hospital || '',
            modality: matchedModality, // 匹配到预定义列表或添加为自定义
            region: result.region || '',
            findings: result.findings || '',
            impression: result.impression || '',
            images // 保存压缩后的图片
          });
          if (result.modality) {
            const isNewType = !allImagingModalities.includes(result.modality) && !allImagingModalities.find(c => result.modality.includes(c) || c.includes(result.modality));
            setDebugInfo(prev => prev + `\n📋 AI识别类型: ${result.modality}${matchedModality !== result.modality ? ` → 匹配为: ${matchedModality}` : ''}${isNewType ? ' (已添加为新类型)' : ''}`);
          }
        }
      } else {
        const errorDetail = result?.detail ? `\n详情: ${result.detail}` : '';
        setDebugInfo(prev => prev + `\n❌ 识别失败: ${result?.error || '未知错误'}${errorDetail}`);
        const errorMsg = result?.error === 'FETCH_ERROR'
          ? `AI识别失败: ${result?.detail || '网络请求错误'}\n\n可能原因:\n1. API Key无效或过期\n2. 网络连接问题\n3. API服务商限制`
          : result?.error === 'NO_API_KEY'
          ? 'AI识别失败: 未配置API Key，请在设置中配置'
          : `AI识别失败: ${result?.error || '未知错误'}`;
        alert(errorMsg);
      }
    } catch (error) {
      console.error('处理文件失败:', error);
      setDebugInfo(prev => prev + `\n❌ 处理失败: ${error.message}`);
      alert('文件处理失败: ' + error.message);
    } finally {
      setScanLoading(false);
      e.target.value = '';
    }
  };

  // 保存报告
  const handleSave = () => {
    if (scanType === 'lab') {
      if (!reportData.date || !reportData.items || reportData.items.length === 0) {
        alert('请填写日期和至少一项检测结果');
        return;
      }
    } else {
      if (!reportData.date || !reportData.modality) {
        alert('请填写日期和检查类型');
        return;
      }
    }
    onSave({ ...reportData, id: editingId || Date.now().toString() });
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold">
            {editingId ? '编辑' : 'AI扫描'}{scanType === 'lab' ? '检验报告' : '影像报告'}
          </h3>
          <button onClick={onClose}><Icons.X size={24} className="text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* AI扫描区域 */}
          {!editingId && (
            <div className="bg-indigo-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icons.ScanLine size={20} className="text-indigo-600" />
                  <span className="font-medium text-indigo-900">AI智能识别</span>
                </div>
                <span className="text-xs text-gray-500">
                  {API_PROVIDERS.find(p => p.id === getCurrentApi())?.name || '未配置'}
                </span>
              </div>

              {/* 上传按钮 */}
              <input
                ref={scanFileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => scanFileRef.current?.click()}
                disabled={scanLoading}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {scanLoading ? (
                  <><Icons.Loader size={18} className="animate-spin" /> 识别中...</>
                ) : (
                  <><Icons.Upload size={18} /> 上传报告图片</>
                )}
              </button>

              {/* 已上传文件预览 */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {uploadedFiles.map((f, i) => (
                      <img
                        key={i}
                        src={f.data}
                        alt={f.name}
                        className="h-16 w-auto rounded-lg border cursor-pointer hover:opacity-80"
                        onClick={() => { setPreviewImageIndex(i); setShowImagePreview(true); }}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">点击图片可放大查看</div>
                </div>
              )}

              {/* 调试信息 */}
              {debugInfo && (
                <div className="mt-3 bg-gray-800 text-green-400 p-3 rounded-lg text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {debugInfo}
                </div>
              )}
            </div>
          )}

          {/* 已保存的图片（编辑模式显示） */}
          {reportData.images && reportData.images.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icons.FileImage size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">原始报告图片 ({reportData.images.length})</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {reportData.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`报告图片 ${i + 1}`}
                    className="h-20 w-auto rounded-lg border cursor-pointer hover:opacity-80"
                    onClick={() => { setPreviewImageIndex(i); setShowImagePreview(true); }}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-1">点击图片可放大查看</div>
            </div>
          )}

          {/* 表单区域 */}
          <div className="space-y-4">
            {/* 日期和医院 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">日期</label>
                <input
                  type="date"
                  value={reportData.date}
                  onChange={e => setReportData({ ...reportData, date: e.target.value })}
                  className="w-full mt-1 px-4 py-3 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">医院</label>
                <input
                  type="text"
                  value={reportData.hospital}
                  onChange={e => setReportData({ ...reportData, hospital: e.target.value })}
                  placeholder="医院名称"
                  className="w-full mt-1 px-4 py-3 border rounded-xl"
                />
              </div>
            </div>

            {/* 检验报告特有字段 */}
            {scanType === 'lab' && (
              <div className="space-y-4">
                {/* 报告分类 */}
                <div>
                  <label className="text-sm font-medium text-gray-700">报告分类</label>
                  <select
                    value={reportData.category || ''}
                    onChange={e => setReportData({ ...reportData, category: e.target.value })}
                    className="w-full mt-1 px-4 py-3 border rounded-xl"
                  >
                    <option value="">选择分类</option>
                    {allLabCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}{!LAB_CATEGORIES.includes(cat) ? ' (自定义)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">检测项目</label>
                    {(() => {
                      const abnormalCount = (reportData.items || []).filter(i => i.flag === 'High' || i.flag === 'Low').length;
                      if (abnormalCount > 0) {
                        return (
                          <span className="bg-rose-100 text-rose-600 text-xs px-2 py-0.5 rounded-full font-medium">
                            {abnormalCount} 项异常
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <button onClick={addLabItem} className="text-indigo-600 text-sm flex items-center gap-1">
                    <Icons.Plus size={14} /> 添加项目
                  </button>
                </div>
                <div className="space-y-2">
                  {(reportData.items || []).map((item, index) => {
                    const isAbnormal = item.flag === 'High' || item.flag === 'Low';
                    const bgColor = item.flag === 'High' ? 'bg-rose-50 border-rose-200' : item.flag === 'Low' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50';
                    const flagColor = item.flag === 'High' ? 'text-rose-600' : item.flag === 'Low' ? 'text-amber-600' : 'text-gray-600';

                    return (
                      <div key={index} className={`p-3 rounded-xl border ${bgColor}`}>
                        <div className="flex gap-2 mb-2">
                          <div className="flex-1 flex items-center gap-2">
                            {isAbnormal && (
                              <span className={`shrink-0 ${flagColor} font-bold text-sm`}>
                                {item.flag === 'High' ? '↑' : '↓'}
                              </span>
                            )}
                            <input
                              type="text"
                              value={item.name}
                              onChange={e => updateLabItem(index, 'name', e.target.value)}
                              placeholder="项目名称"
                              className={`flex-1 px-3 py-2 border rounded-lg text-sm ${isAbnormal ? 'font-medium ' + flagColor : ''}`}
                            />
                          </div>
                          <button onClick={() => removeLabItem(index)} className="text-red-500 p-2">
                            <Icons.Trash2 size={16} />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <input
                            type="text"
                            value={item.result}
                            onChange={e => updateLabItem(index, 'result', e.target.value)}
                            placeholder="结果"
                            className={`px-3 py-2 border rounded-lg text-sm ${isAbnormal ? 'font-bold ' + flagColor : ''}`}
                          />
                          <input
                            type="text"
                            value={item.unit}
                            onChange={e => updateLabItem(index, 'unit', e.target.value)}
                            placeholder="单位"
                            className="px-3 py-2 border rounded-lg text-sm"
                          />
                          <input
                            type="text"
                            value={item.refRange}
                            onChange={e => updateLabItem(index, 'refRange', e.target.value)}
                            placeholder="参考范围"
                            className="px-3 py-2 border rounded-lg text-sm"
                          />
                          <select
                            value={item.flag}
                            onChange={e => updateLabItem(index, 'flag', e.target.value)}
                            className={`px-2 py-2 border rounded-lg text-sm font-medium ${
                              item.flag === 'High' ? 'bg-rose-100 text-rose-700 border-rose-300' :
                              item.flag === 'Low' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                              'bg-green-50 text-green-700 border-green-200'
                            }`}
                          >
                            <option value="Normal">正常</option>
                            <option value="High">偏高↑</option>
                            <option value="Low">偏低↓</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
                </div>
              </div>
            )}

            {/* 影像报告特有字段 */}
            {scanType === 'imaging' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">检查类型</label>
                    <select
                      value={reportData.modality}
                      onChange={e => setReportData({ ...reportData, modality: e.target.value })}
                      className="w-full mt-1 px-4 py-3 border rounded-xl"
                    >
                      <option value="">选择类型</option>
                      {allImagingModalities.map(mod => (
                        <option key={mod} value={mod}>{mod}{!IMAGING_MODALITIES.includes(mod) ? ' (自定义)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">检查部位</label>
                    <input
                      type="text"
                      value={reportData.region}
                      onChange={e => setReportData({ ...reportData, region: e.target.value })}
                      placeholder="如: 胸部、腹部"
                      className="w-full mt-1 px-4 py-3 border rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">影像所见</label>
                  <textarea
                    value={reportData.findings}
                    onChange={e => setReportData({ ...reportData, findings: e.target.value })}
                    placeholder="描述影像学表现..."
                    rows={4}
                    className="w-full mt-1 px-4 py-3 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">诊断印象</label>
                  <textarea
                    value={reportData.impression}
                    onChange={e => setReportData({ ...reportData, impression: e.target.value })}
                    placeholder="诊断结论..."
                    rows={2}
                    className="w-full mt-1 px-4 py-3 border rounded-xl"
                  />
                </div>
              </>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            {editingId && (
              <button
                onClick={() => { if(confirm('确定删除此报告吗？')) { onDelete(editingId); onClose(); } }}
                className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold"
              >
                <Icons.Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">
              取消
            </button>
            <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">
              保存
            </button>
          </div>
        </div>
      </div>

      {/* 图片预览弹窗 */}
      {showImagePreview && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
          onClick={() => setShowImagePreview(false)}
        >
          <button
            onClick={() => setShowImagePreview(false)}
            className="absolute top-4 right-4 text-white p-2"
          >
            <Icons.X size={28} />
          </button>

          {/* 图片导航 */}
          {(() => {
            const images = reportData.images || uploadedFiles.map(f => f.data);
            if (images.length === 0) return null;
            return (
              <>
                <img
                  src={images[previewImageIndex]}
                  alt={`预览 ${previewImageIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain"
                  onClick={e => e.stopPropagation()}
                />

                {/* 图片计数 */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  {previewImageIndex + 1} / {images.length}
                </div>

                {/* 左右切换按钮 */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewImageIndex(i => i > 0 ? i - 1 : images.length - 1); }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 bg-black/50 rounded-full"
                    >
                      <Icons.ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewImageIndex(i => i < images.length - 1 ? i + 1 : 0); }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 bg-black/50 rounded-full"
                    >
                      <Icons.ChevronRight size={24} />
                    </button>
                  </>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ScanModal;
