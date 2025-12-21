import Icons from '../icons/Icons';

const BackupModal = ({
  show,
  onClose,
  backupFileName,
  backupStats,
  backupDataStr,
  onDownload,
  onCopy
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">备份数据</h3>
            <button onClick={onClose}><Icons.X size={24} className="text-gray-400" /></button>
          </div>

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
        </div>
      </div>
    </div>
  );
};

export default BackupModal;
