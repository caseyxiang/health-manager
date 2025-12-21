import Icons from '../icons/Icons';
import { VITAL_TYPES } from '../../constants';
import { getLocalDateStr, getLocalTimeStr } from '../../utils';

const VitalsFormModal = ({
  show,
  onClose,
  editingId,
  vitalsInput,
  setVitalsInput,
  onSave,
  onDelete
}) => {
  if (!show) return null;

  const selectedType = VITAL_TYPES.find(t => t.id === vitalsInput.type);

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">{editingId ? '编辑记录' : '添加记录'}</h3>
          <button onClick={onClose}><Icons.X size={24} className="text-gray-400" /></button>
        </div>

        <div className="space-y-4">
          {/* 指标类型选择 */}
          <div>
            <label className="text-sm font-medium text-gray-700">指标类型</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {VITAL_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setVitalsInput({ ...vitalsInput, type: type.id, value2: '' })}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 ${
                    vitalsInput.type === type.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: type.color + '20' }}>
                    {Icons[type.icon] && Icons[type.icon]({ size: 16, style: { color: type.color } })}
                  </div>
                  <span className="text-xs font-medium">{type.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 日期时间 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">日期</label>
              <input
                type="date"
                value={vitalsInput.date}
                onChange={e => setVitalsInput({ ...vitalsInput, date: e.target.value })}
                className="w-full mt-1 px-4 py-3 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">时间</label>
              <input
                type="time"
                value={vitalsInput.time}
                onChange={e => setVitalsInput({ ...vitalsInput, time: e.target.value })}
                className="w-full mt-1 px-4 py-3 border rounded-xl"
              />
            </div>
          </div>

          {/* 数值输入 */}
          <div className={`grid ${selectedType?.hasTwo ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
            <div>
              <label className="text-sm font-medium text-gray-700">
                {selectedType?.hasTwo ? selectedType.label1 : '数值'} ({selectedType?.unit})
              </label>
              <input
                type="number"
                value={vitalsInput.value1}
                onChange={e => setVitalsInput({ ...vitalsInput, value1: e.target.value })}
                placeholder={selectedType?.hasTwo ? '如: 120' : '输入数值'}
                className="w-full mt-1 px-4 py-3 border rounded-xl text-lg font-bold"
                style={{ color: selectedType?.color }}
              />
            </div>
            {selectedType?.hasTwo && (
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {selectedType.label2} ({selectedType.unit})
                </label>
                <input
                  type="number"
                  value={vitalsInput.value2}
                  onChange={e => setVitalsInput({ ...vitalsInput, value2: e.target.value })}
                  placeholder="如: 80"
                  className="w-full mt-1 px-4 py-3 border rounded-xl text-lg font-bold text-orange-500"
                />
              </div>
            )}
          </div>

          {/* 参考范围 */}
          {selectedType && (
            <div className="bg-gray-50 p-3 rounded-xl">
              <span className="text-xs text-gray-500">参考范围: </span>
              <span className="text-xs font-medium text-gray-700">{selectedType.normalRange}</span>
            </div>
          )}

          {/* 备注 */}
          <div>
            <label className="text-sm font-medium text-gray-700">备注 (可选)</label>
            <input
              type="text"
              value={vitalsInput.note || ''}
              onChange={e => setVitalsInput({ ...vitalsInput, note: e.target.value })}
              placeholder="如: 饭后测量"
              className="w-full mt-1 px-4 py-3 border rounded-xl"
            />
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            {editingId && (
              <button
                onClick={() => onDelete(editingId)}
                className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold"
              >
                <Icons.Trash2 size={20} />
              </button>
            )}
            <button onClick={onClose} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold">
              取消
            </button>
            <button onClick={onSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalsFormModal;
