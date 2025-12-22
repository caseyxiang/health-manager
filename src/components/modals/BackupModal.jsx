import { useState, useRef } from 'react';
import Icons from '../icons/Icons';

const BackupModal = ({
  show,
  onClose,
  backupFileName,
  backupStats,
  backupDataStr,
  onDownload,
  onCopy,
  onRestore
}) => {
  const [activeTab, setActiveTab] = useState('backup'); // 'backup' or 'restore'
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreData, setRestoreData] = useState(null);
  const [restoreStats, setRestoreStats] = useState(null);
  const [restoreError, setRestoreError] = useState('');
  const [restoreLoading, setRestoreLoading] = useState(false);
  const fileInputRef = useRef(null);

  if (!show) return null;

  // 处理文件选择
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError('');
    setRestoreLoading(true);
    setRestoreFile(file);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证数据格式
      if (!data.version || !data.exportDate) {
        throw new Error('无效的备份文件格式');
      }

      // 计算统计信息
      let totalMeds = 0, totalLabs = 0, totalImaging = 0, totalVitals = 0;

      if (data.membersData) {
        Object.values(data.membersData).forEach(memberData => {
          totalMeds += memberData.meds?.length || 0;
          totalLabs += memberData.labReports?.length || 0;
          totalImaging += memberData.imagingReports?.length || 0;
          totalVitals += memberData.vitals?.length || 0;
        });
      } else {
        // 兼容旧版本备份格式
        totalMeds = data.meds?.length || 0;
        totalLabs = data.labReports?.length || 0;
        totalImaging = data.imagingReports?.length || 0;
        totalVitals = data.vitals?.length || 0;
      }

      setRestoreStats({
        version: data.version,
        exportDate: new Date(data.exportDate).toLocaleString('zh-CN'),
        members: data.members?.length || 1,
        meds: totalMeds,
        labs: totalLabs,
        imaging: totalImaging,
        vitals: totalVitals,
        size: Math.round(text.length / 1024)
      });
      setRestoreData(data);
    } catch (err) {
      console.error('解析备份文件失败:', err);
      setRestoreError(err.message || '无法解析备份文件');
      setRestoreData(null);
      setRestoreStats(null);
    } finally {
      setRestoreLoading(false);
    }
  };

  // 执行恢复
  const handleRestore = () => {
    if (!restoreData) return;

    if (!confirm('确定要恢复数据吗？这将覆盖当前所有数据！')) {
      return;
    }

    onRestore(restoreData);
    // 重置状态
    setRestoreFile(null);
    setRestoreData(null);
    setRestoreStats(null);
    setActiveTab('backup');
  };

  // 重置恢复状态
  const resetRestore = () => {
    setRestoreFile(null);
    setRestoreData(null);
    setRestoreStats(null);
    setRestoreError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          {/* 标题栏 */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">数据备份与恢复</h3>
            <button onClick={onClose}><Icons.X size={24} className="text-gray-400" /></button>
          </div>

          {/* Tab 切换 */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
            <button
              onClick={() => { setActiveTab('backup'); resetRestore(); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'backup' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Icons.Download size={16} />
                备份
              </div>
            </button>
            <button
              onClick={() => setActiveTab('restore')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'restore' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Icons.Upload size={16} />
                恢复
              </div>
            </button>
          </div>

          {/* 备份 Tab */}
          {activeTab === 'backup' && (
            <>
              <div className="bg-green-50 p-4 rounded-xl mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icons.FileJson size={20} className="text-green-600" />
                  <span className="font-medium text-green-800">{backupFileName}</span>
                </div>
                <div className="text-xs text-green-600 space-y-1">
                  <p>文件大小: {backupStats.size} KB</p>
                  <p>成员: {backupStats.members} | 用药: {backupStats.meds} | 药品: {backupStats.catalog} | 报告: {backupStats.labs}</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onDownload}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Icons.Download size={20} />
                  下载文件
                </button>
                <button
                  onClick={onCopy}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Icons.FileJson size={20} />
                  复制数据
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                建议定期备份数据，以防数据丢失
              </p>
            </>
          )}

          {/* 恢复 Tab */}
          {activeTab === 'restore' && (
            <>
              {/* 文件上传区域 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!restoreData && !restoreLoading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                >
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <Icons.Upload size={32} className="text-gray-400" />
                    <span className="font-medium">点击选择备份文件</span>
                    <span className="text-xs">支持 .json 格式</span>
                  </div>
                </button>
              )}

              {restoreLoading && (
                <div className="py-8 text-center">
                  <Icons.Loader size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                  <span className="text-gray-500">正在解析文件...</span>
                </div>
              )}

              {restoreError && (
                <div className="bg-red-50 p-4 rounded-xl mb-4">
                  <div className="flex items-center gap-2 text-red-600">
                    <Icons.AlertTriangle size={20} />
                    <span className="font-medium">解析失败</span>
                  </div>
                  <p className="text-sm text-red-500 mt-1">{restoreError}</p>
                  <button
                    onClick={resetRestore}
                    className="mt-3 text-sm text-red-600 underline"
                  >
                    重新选择文件
                  </button>
                </div>
              )}

              {restoreStats && restoreData && (
                <>
                  <div className="bg-blue-50 p-4 rounded-xl mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icons.FileJson size={20} className="text-blue-600" />
                      <span className="font-medium text-blue-800">{restoreFile?.name}</span>
                    </div>
                    <div className="text-xs text-blue-600 space-y-1">
                      <p>备份版本: {restoreStats.version} | 备份时间: {restoreStats.exportDate}</p>
                      <p>文件大小: {restoreStats.size} KB</p>
                      <p>成员: {restoreStats.members} | 用药: {restoreStats.meds} | 检验: {restoreStats.labs} | 影像: {restoreStats.imaging}</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-xl mb-4">
                    <div className="flex items-start gap-2">
                      <Icons.AlertTriangle size={18} className="text-amber-600 mt-0.5" />
                      <div className="text-xs text-amber-700">
                        <p className="font-medium">注意事项</p>
                        <p className="mt-1">恢复将覆盖当前所有数据，请确保已备份当前数据。</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleRestore}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                    >
                      <Icons.RotateCcw size={20} />
                      确认恢复
                    </button>
                    <button
                      onClick={resetRestore}
                      className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold"
                    >
                      重新选择
                    </button>
                  </div>
                </>
              )}

              {!restoreData && !restoreLoading && !restoreError && (
                <p className="text-xs text-gray-400 text-center mt-4">
                  选择之前导出的备份文件进行数据恢复
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupModal;
