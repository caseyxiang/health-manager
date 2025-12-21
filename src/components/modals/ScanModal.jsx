import { useState, useRef } from 'react';
import Icons from '../icons/Icons';
import { analyzeMedicalImage, getApiKeyFor, getCurrentApi, setCurrentApi } from '../../services/ai';
import { getLocalDateStr } from '../../utils';
import { API_PROVIDERS } from '../../constants';

const ScanModal = ({
  show,
  onClose,
  scanType, // 'lab' or 'imaging'
  editingId,
  scanEditData,
  onSave,
  onDelete
}) => {
  const [scanLoading, setScanLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [apiProvider, setApiProvider] = useState(getCurrentApi());
  const scanFileRef = useRef(null);

  // 报告数据
  const [reportData, setReportData] = useState(scanEditData || (
    scanType === 'lab'
      ? { date: getLocalDateStr(new Date()), hospital: '', items: [{ name: '', result: '', unit: '', refRange: '', flag: 'Normal' }] }
      : { date: getLocalDateStr(new Date()), hospital: '', modality: '', region: '', findings: '', impression: '' }
  ));

  if (!show) return null;

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
      const apiKey = getApiKeyFor(apiProvider);
      if (!apiKey) {
        setDebugInfo(prev => prev + '\n❌ 未配置API密钥');
        alert('请先在设置中配置AI API密钥');
        setScanLoading(false);
        return;
      }

      setDebugInfo(prev => prev + `\n使用 ${apiProvider} API 进行识别...`);

      const result = await analyzeMedicalImage(fileData, scanType, apiProvider, apiKey);

      if (result && result.success) {
        setDebugInfo(prev => prev + '\n✅ 识别成功');
        if (scanType === 'lab') {
          setReportData({
            date: result.date || getLocalDateStr(new Date()),
            hospital: result.hospital || '',
            items: result.items || []
          });
        } else {
          setReportData({
            date: result.date || getLocalDateStr(new Date()),
            hospital: result.hospital || '',
            modality: result.modality || '',
            region: result.region || '',
            findings: result.findings || '',
            impression: result.impression || ''
          });
        }
      } else {
        setDebugInfo(prev => prev + `\n❌ 识别失败: ${result?.error || '未知错误'}`);
        alert('AI识别失败，请手动填写数据');
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
              <div className="flex items-center gap-3 mb-3">
                <Icons.ScanLine size={20} className="text-indigo-600" />
                <span className="font-medium text-indigo-900">AI智能识别</span>
              </div>

              {/* API选择 */}
              <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
                {API_PROVIDERS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setApiProvider(p.id); setCurrentApi(p.id); }}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                      apiProvider === p.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
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

              {/* 已上传文件 */}
              {uploadedFiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {uploadedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs text-gray-600">
                      <Icons.FileImage size={14} />
                      {f.name}
                    </div>
                  ))}
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
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">检测项目</label>
                  <button onClick={addLabItem} className="text-indigo-600 text-sm flex items-center gap-1">
                    <Icons.Plus size={14} /> 添加项目
                  </button>
                </div>
                <div className="space-y-2">
                  {(reportData.items || []).map((item, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-xl">
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={e => updateLabItem(index, 'name', e.target.value)}
                          placeholder="项目名称"
                          className="flex-1 px-3 py-2 border rounded-lg text-sm"
                        />
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
                          className="px-3 py-2 border rounded-lg text-sm"
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
                          className="px-2 py-2 border rounded-lg text-sm"
                        >
                          <option value="Normal">正常</option>
                          <option value="High">偏高↑</option>
                          <option value="Low">偏低↓</option>
                        </select>
                      </div>
                    </div>
                  ))}
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
                      <option value="CT">CT</option>
                      <option value="MRI">MRI</option>
                      <option value="X光">X光</option>
                      <option value="B超">B超</option>
                      <option value="PET-CT">PET-CT</option>
                      <option value="其他">其他</option>
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
    </div>
  );
};

export default ScanModal;
