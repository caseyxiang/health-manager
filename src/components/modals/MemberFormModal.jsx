import Icons from '../icons/Icons';
import { MEMBER_COLORS } from '../../constants';

const MemberFormModal = ({
  show,
  onClose,
  editingMember,
  memberInput,
  setMemberInput,
  onSave,
  onDelete
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">{editingMember ? '编辑成员' : '添加成员'}</h3>
          <button onClick={onClose}><Icons.X size={24} className="text-gray-400" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">姓名/称呼</label>
            <input
              type="text"
              value={memberInput.name}
              onChange={e => setMemberInput({ ...memberInput, name: e.target.value })}
              placeholder="如: 爸爸、妈妈、小明"
              className="w-full mt-1 px-4 py-3 border rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">关系</label>
            <input
              type="text"
              value={memberInput.relation}
              onChange={e => setMemberInput({ ...memberInput, relation: e.target.value })}
              placeholder="如: 父亲、母亲、自己"
              className="w-full mt-1 px-4 py-3 border rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">头像颜色</label>
            <div className="flex gap-3 mt-2">
              {MEMBER_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => setMemberInput({ ...memberInput, color: color.id })}
                  className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center ${
                    memberInput.color === color.id ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                  }`}
                >
                  {memberInput.color === color.id && <Icons.Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {editingMember && editingMember.id !== 'default' && (
              <button
                onClick={() => onDelete(editingMember.id)}
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

export default MemberFormModal;
