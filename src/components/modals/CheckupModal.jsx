import { useState, useEffect } from 'react';
import Icons from '../icons/Icons';
import { getLocalDateStr } from '../../utils';
import { CHECKUP_TYPES } from '../../constants';

const CheckupModal = ({
  show,
  onClose,
  editingCheckup,
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    type: 'lab',
    name: '',
    date: '',
    time: '',
    hospital: '',
    department: '',
    doctor: '',
    notes: '',
    reminder: true,
    reminderDays: 1
  });

  useEffect(() => {
    if (show) {
      if (editingCheckup) {
        setFormData({
          type: editingCheckup.type || 'lab',
          name: editingCheckup.name || '',
          date: editingCheckup.date || '',
          time: editingCheckup.time || '',
          hospital: editingCheckup.hospital || '',
          department: editingCheckup.department || '',
          doctor: editingCheckup.doctor || '',
          notes: editingCheckup.notes || '',
          reminder: editingCheckup.reminder !== false,
          reminderDays: editingCheckup.reminderDays || 1
        });
      } else {
        // 新建时设置默认日期为明天
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormData({
          type: 'lab',
          name: '',
          date: getLocalDateStr(tomorrow),
          time: '09:00',
          hospital: '',
          department: '',
          doctor: '',
          notes: '',
          reminder: true,
          reminderDays: 1
        });
      }
    }
  }, [show, editingCheckup]);

  if (!show) return null;

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('请输入检查项目名称');
      return;
    }
    if (!formData.date) {
      alert('请选择预约日期');
      return;
    }

    const checkupData = {
      id: editingCheckup?.id || `checkup_${Date.now()}`,
      ...formData,
      createdAt: editingCheckup?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(checkupData);
    onClose();
  };

  const handleDelete = () => {
    if (editingCheckup && confirm('确定要删除这个预约吗？')) {
      onDelete(editingCheckup.id);
      onClose();
    }
  };

  const selectedType = CHECKUP_TYPES.find(t => t.id === formData.type) || CHECKUP_TYPES[0];

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Icons.CalendarPlus size={20} className="text-indigo-600" />
            {editingCheckup ? '编辑预约' : '新建预约'}
          </h3>
          <button onClick={onClose}><Icons.X size={24} className="text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* 预约类型选择 */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">预约类型</label>
            <div className="grid grid-cols-3 gap-2">
              {CHECKUP_TYPES.map(type => {
                const IconComponent = Icons[type.icon];
                const isSelected = formData.type === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setFormData({ ...formData, type: type.id })}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {IconComponent && <IconComponent size={20} style={{ color: type.color }} />}
                    <span className={`text-xs ${isSelected ? 'text-indigo-600 font-medium' : 'text-gray-600'}`}>
                      {type.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 检查项目名称 */}
          <div>
            <label className="text-sm font-medium text-gray-700">检查项目 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="如：血常规、CT检查、复诊等"
              className="w-full mt-1 px-4 py-3 border rounded-xl"
            />
          </div>

          {/* 日期和时间 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">预约日期 *</label>
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full mt-1 px-4 py-3 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">预约时间</label>
              <input
                type="time"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
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
                value={formData.hospital}
                onChange={e => setFormData({ ...formData, hospital: e.target.value })}
                placeholder="医院名称"
                className="w-full mt-1 px-4 py-3 border rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">科室</label>
              <input
                type="text"
                value={formData.department}
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                placeholder="科室名称"
                className="w-full mt-1 px-4 py-3 border rounded-xl"
              />
            </div>
          </div>

          {/* 医生 */}
          <div>
            <label className="text-sm font-medium text-gray-700">医生</label>
            <input
              type="text"
              value={formData.doctor}
              onChange={e => setFormData({ ...formData, doctor: e.target.value })}
              placeholder="医生姓名（选填）"
              className="w-full mt-1 px-4 py-3 border rounded-xl"
            />
          </div>

          {/* 备注 */}
          <div>
            <label className="text-sm font-medium text-gray-700">备注</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="注意事项、空腹要求等"
              rows={3}
              className="w-full mt-1 px-4 py-3 border rounded-xl resize-none"
            />
          </div>

          {/* 提醒设置 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Icons.Bell size={18} className="text-indigo-600" />
                <span className="font-medium text-gray-700">预约提醒</span>
              </div>
              <button
                onClick={() => setFormData({ ...formData, reminder: !formData.reminder })}
                className={`w-12 h-6 rounded-full transition-colors ${formData.reminder ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.reminder ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {formData.reminder && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>提前</span>
                <select
                  value={formData.reminderDays}
                  onChange={e => setFormData({ ...formData, reminderDays: parseInt(e.target.value) })}
                  className="px-2 py-1 border rounded-lg"
                >
                  <option value={0}>当天</option>
                  <option value={1}>1天</option>
                  <option value={2}>2天</option>
                  <option value={3}>3天</option>
                  <option value={7}>7天</option>
                </select>
                <span>提醒</span>
              </div>
            )}
          </div>

          {/* 按钮区 */}
          <div className="flex gap-3 pt-4">
            {editingCheckup && (
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <Icons.Trash2 size={18} />
                删除
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckupModal;
