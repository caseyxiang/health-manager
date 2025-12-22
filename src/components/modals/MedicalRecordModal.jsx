import { useState, useRef, useEffect } from 'react';
import Icons from '../icons/Icons';
import { analyzeMedicalImage, getApiKeyFor, getCurrentApi } from '../../services/ai';
import { getLocalDateStr, compressImages } from '../../utils';
import { API_PROVIDERS, MEDICAL_RECORD_TYPES } from '../../constants';

const MedicalRecordModal = ({
  show,
  onClose,
  editingId,
  editData,
  onSave,
  onDelete,
  customRecordTypes = [],
  onAddCustomType
}) => {
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [debugInfo, setDebugInfo] = useState('');
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const fileInputRef = useRef(null);

  // 报告数据
  const [recordData, setRecordData] = useState(editData || {
    date: getLocalDateStr(new Date()),
    recordType: '',
    hospital: '',
    department: '',
    diagnosis: '',
    treatmentSummary: '',
    dischargeMeds: '',
    followupAdvice: '',
    notes: ''
  });

  // 每次弹窗打开时重置状态
  useEffect(() => {
    if (show) {
      setUploadedFiles([]);
      setDebugInfo('');
      setLoading(false);
      setShowImagePreview(false);
      setPreviewImageIndex(0);

      if (editData) {
        setRecordData(editData);
      } else {
        setRecordData({
          date: getLocalDateStr(new Date()),
          recordType: '',
          hospital: '',
          department: '',
          diagnosis: '',
          treatmentSummary: '',
          dischargeMeds: '',
          followupAdvice: '',
          notes: ''
        });
      }
    }
  }, [show, editData]);

  if (!show) return null;

  // 合并预定义列表和自定义列表
  const allRecordTypes = [...MEDICAL_RECORD_TYPES, ...customRecordTypes.filter(c => !MEDICAL_RECORD_TYPES.includes(c))];

  // 匹配类型
  const matchRecordType = (aiType) => {
    if (!aiType) return '';
    if (allRecordTypes.includes(aiType)) return aiType;
    const matched = allRecordTypes.find(t =>
      aiType.includes(t) || t.includes(aiType)
    );
    if (matched) return matched;

    // 无法匹配，添加为自定义类型
    if (onAddCustomType && aiType.trim()) {
      onAddCustomType(aiType.trim());
    }
    return aiType.trim() || '其他';
  };

  // 处理文件上传和AI识别
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
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
        setLoading(false);
        return;
      }

      setDebugInfo(prev => prev + `\n使用 ${providerName} 进行识别...`);

      const result = await analyzeMedicalImage(fileData, 'medical_record', currentApi);

      if (result && result.success) {
        setDebugInfo(prev => prev + '\n✅ 识别成功');

        // 压缩图片用于保存
        setDebugInfo(prev => prev + '\n正在压缩图片...');
        const compressedFiles = await compressImages(fileData, 800, 0.7);
        const images = compressedFiles.map(f => f.data);
        setDebugInfo(prev => prev + `\n✅ 已压缩 ${images.length} 张图片`);

        const matchedType = matchRecordType(result.recordType);
        setRecordData({
          date: result.date || getLocalDateStr(new Date()),
          recordType: matchedType,
          hospital: result.hospital || '',
          department: result.department || '',
          diagnosis: result.diagnosis || '',
          treatmentSummary: result.treatmentSummary || '',
          dischargeMeds: result.dischargeMeds || '',
          followupAdvice: result.followupAdvice || '',
          notes: result.notes || '',
          admissionDate: result.admissionDate || '',
          dischargeDate: result.dischargeDate || '',
          images
        });

        if (result.recordType) {
          const isNewType = !allRecordTypes.includes(result.recordType) &&
            !allRecordTypes.find(t => result.recordType.includes(t) || t.includes(result.recordType));
          setDebugInfo(prev => prev + `\n📋 AI识别类型: ${result.recordType}${matchedType !== result.recordType ? ` → 匹配为: ${matchedType}` : ''}${isNewType ? ' (已添加为新类型)' : ''}`);
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
      setLoading(false);
      e.target.value = '';
    }
  };

  // 保存记录
  const handleSave = () => {
    if (!recordData.date || !recordData.recordType) {
      alert('请填写日期和文书类型');
      return;
    }
    onSave({ ...recordData, id: editingId || Date.now().toString() });
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold">
            {editingId ? '编辑' : 'AI扫描'}病历文书
          </h3>
          <button onClick={onClose}><Icons.X size={24} className="text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* AI扫描区域 */}
          {!editingId && (
            <div className="bg-emerald-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Icons.ScanLine size={20} className="text-emerald-600" />
                  <span className="font-medium text-emerald-900">AI智能识别</span>
                </div>
                <span className="text-xs text-gray-500">
                  {API_PROVIDERS.find(p => p.id === getCurrentApi())?.name || '未配置'}
                </span>
              </div>

              {/* 上传按钮 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Icons.Loader size={18} className="animate-spin" /> 识别中...</>
                ) : (
                  <><Icons.Upload size={18} /> 上传病历图片</>
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
          {recordData.images && recordData.images.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icons.FileImage size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-700">原始病历图片 ({recordData.images.length})</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {recordData.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`病历图片 ${i + 1}`}
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
            {/* 文书类型和日期 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">文书类型 *</label>
                <select
                  value={recordData.recordType || ''}
                  onChange={e => setRecordData({ ...recordData, recordType: e.target.value })}
                  className="w-full mt-1 px-4 py-3 border rounded-xl"
                >
                  <option value="">选择类型</option>
                  {allRecordTypes.map(type => (
                    <option key={type} value={type}>{type}{!MEDICAL_RECORD_TYPES.includes(type) ? ' (自定义)' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">日期 *</label>
                <input
                  type="date"
                  value={recordData.date}
                  onChange={e => setRecordData({ ...recordData, date: e.target.value })}
                  className="w-full mt-1 px-4 py-3 border rounded-xl"
                />
              </div>
            </div>

            {/* 医院和科室 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">医院</label>
                <input
                  type="text"
                  value={recordData.hospital}
                  onChange={e => setRecordData({ ...recordData, hospital: e.target.value })}
                  placeholder="医院名称"
                  className="w-full mt-1 px-4 py-3 border rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">科室</label>
                <input
                  type="text"
                  value={recordData.department}
                  onChange={e => setRecordData({ ...recordData, department: e.target.value })}
                  placeholder="科室名称"
                  className="w-full mt-1 px-4 py-3 border rounded-xl"
                />
              </div>
            </div>

            {/* 入院/出院日期（仅出院相关文书显示） */}
            {(recordData.recordType === '出院小结' || recordData.recordType === '出院诊断书') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">入院日期</label>
                  <input
                    type="date"
                    value={recordData.admissionDate || ''}
                    onChange={e => setRecordData({ ...recordData, admissionDate: e.target.value })}
                    className="w-full mt-1 px-4 py-3 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">出院日期</label>
                  <input
                    type="date"
                    value={recordData.dischargeDate || ''}
                    onChange={e => setRecordData({ ...recordData, dischargeDate: e.target.value })}
                    className="w-full mt-1 px-4 py-3 border rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* 诊断 */}
            <div>
              <label className="text-sm font-medium text-gray-700">诊断</label>
              <textarea
                value={recordData.diagnosis}
                onChange={e => setRecordData({ ...recordData, diagnosis: e.target.value })}
                placeholder="诊断内容..."
                rows={3}
                className="w-full mt-1 px-4 py-3 border rounded-xl"
              />
            </div>

            {/* 治疗/病情摘要 */}
            <div>
              <label className="text-sm font-medium text-gray-700">治疗/病情摘要</label>
              <textarea
                value={recordData.treatmentSummary}
                onChange={e => setRecordData({ ...recordData, treatmentSummary: e.target.value })}
                placeholder="治疗经过、病情摘要..."
                rows={4}
                className="w-full mt-1 px-4 py-3 border rounded-xl"
              />
            </div>

            {/* 出院用药（仅出院相关文书显示） */}
            {(recordData.recordType === '出院小结' || recordData.recordType === '出院诊断书') && (
              <div>
                <label className="text-sm font-medium text-gray-700">出院用药</label>
                <textarea
                  value={recordData.dischargeMeds}
                  onChange={e => setRecordData({ ...recordData, dischargeMeds: e.target.value })}
                  placeholder="出院带药..."
                  rows={3}
                  className="w-full mt-1 px-4 py-3 border rounded-xl"
                />
              </div>
            )}

            {/* 随访建议 */}
            <div>
              <label className="text-sm font-medium text-gray-700">随访建议</label>
              <textarea
                value={recordData.followupAdvice}
                onChange={e => setRecordData({ ...recordData, followupAdvice: e.target.value })}
                placeholder="复查、随访建议..."
                rows={2}
                className="w-full mt-1 px-4 py-3 border rounded-xl"
              />
            </div>

            {/* 备注 */}
            <div>
              <label className="text-sm font-medium text-gray-700">备注</label>
              <textarea
                value={recordData.notes}
                onChange={e => setRecordData({ ...recordData, notes: e.target.value })}
                placeholder="其他备注..."
                rows={2}
                className="w-full mt-1 px-4 py-3 border rounded-xl"
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            {editingId && (
              <button
                onClick={() => { if(confirm('确定删除此记录吗？')) { onDelete(editingId); onClose(); } }}
                className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold"
              >
                <Icons.Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">
              取消
            </button>
            <button onClick={handleSave} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold">
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

          {(() => {
            const images = recordData.images || uploadedFiles.map(f => f.data);
            if (images.length === 0) return null;
            return (
              <>
                <img
                  src={images[previewImageIndex]}
                  alt={`预览 ${previewImageIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain"
                  onClick={e => e.stopPropagation()}
                />

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                  {previewImageIndex + 1} / {images.length}
                </div>

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

export default MedicalRecordModal;
