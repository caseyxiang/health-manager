// 应用版本
export const VERSION = "v16.74";

// 单位选项
export const UNITS = ['mg', 'g', 'mcg', 'ml', 'L', 'IU', '片', '粒', '支', '瓶', '盒', '包'];

// 剂型选项
export const DOSAGE_FORMS = ['片剂', '胶囊', '颗粒剂', '口服液', '注射剂', '软膏', '滴剂', '喷雾剂', '贴剂', '其他'];

// 服药时间关系
export const RELATIONS = ['无关', '餐前', '随餐', '餐后'];

// 成员头像颜色选项
export const MEMBER_COLORS = [
  { id: 'indigo', bg: 'bg-indigo-500', text: 'text-white', hex: '#6366f1' },
  { id: 'pink', bg: 'bg-pink-500', text: 'text-white', hex: '#ec4899' },
  { id: 'green', bg: 'bg-green-500', text: 'text-white', hex: '#22c55e' },
  { id: 'orange', bg: 'bg-orange-500', text: 'text-white', hex: '#f97316' },
  { id: 'cyan', bg: 'bg-cyan-500', text: 'text-white', hex: '#06b6d4' },
  { id: 'purple', bg: 'bg-purple-500', text: 'text-white', hex: '#a855f7' },
];

// 默认成员
export const DEFAULT_MEMBER = { id: 'default', name: '我', relation: '本人', color: 'indigo' };
export const DEFAULT_MEMBERS = [DEFAULT_MEMBER];

// 时间段
export const TIME_PERIODS = ['早餐', '午餐', '晚餐', '睡前'];

// 图表颜色
export const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// 健康指标类型定义
export const VITAL_TYPES = [
  { id: 'blood_pressure', name: '血压', icon: 'Heart', unit: 'mmHg', hasTwo: true, label1: '收缩压', label2: '舒张压', normalRange: '90-140 / 60-90', color: '#ef4444' },
  { id: 'heart_rate', name: '心率', icon: 'Activity', unit: 'bpm', hasTwo: false, normalRange: '60-100', color: '#f97316' },
  { id: 'weight', name: '体重', icon: 'Scale', unit: 'kg', hasTwo: false, normalRange: '-', color: '#8b5cf6' },
  { id: 'blood_sugar', name: '血糖', icon: 'Droplet', unit: 'mmol/L', hasTwo: false, normalRange: '3.9-6.1(空腹)', color: '#10b981' },
  { id: 'temperature', name: '体温', icon: 'Thermometer', unit: '°C', hasTwo: false, normalRange: '36.1-37.2', color: '#06b6d4' },
  { id: 'oxygen', name: '血氧', icon: 'Wind', unit: '%', hasTwo: false, normalRange: '95-100', color: '#3b82f6' },
];

// 检验报告分类
export const LAB_CATEGORIES = [
  '血常规', '尿常规', '便常规', '生化全套', '肝功能', '肾功能',
  '血脂', '血糖', '甲状腺功能', '肿瘤标志物', '凝血功能',
  '电解质', '心肌酶谱', '免疫检查', '感染指标', '激素检查',
  '维生素检查', '微量元素', '过敏原检测', '综合检验', '其他'
];

// 影像报告检查类型
export const IMAGING_MODALITIES = [
  'CT', 'MRI', 'X光', 'B超', 'PET-CT', '内镜', '心电图', '脑电图', '其他'
];

// 病历文书类型
export const MEDICAL_RECORD_TYPES = [
  '出院小结', '出院诊断书', '入院记录', '门诊病历', '诊断证明书',
  '手术记录', '病理报告', '会诊记录', '病程记录', '其他'
];

// 检查预约类型
export const CHECKUP_TYPES = [
  { id: 'lab', name: '检验检查', icon: 'FileSpreadsheet', color: '#6366f1' },
  { id: 'imaging', name: '影像检查', icon: 'FileImage', color: '#3b82f6' },
  { id: 'specialist', name: '专科门诊', icon: 'Stethoscope', color: '#10b981' },
  { id: 'followup', name: '复诊随访', icon: 'Calendar', color: '#f59e0b' },
  { id: 'treatment', name: '治疗操作', icon: 'Syringe', color: '#ef4444' },
  { id: 'other', name: '其他', icon: 'ClipboardList', color: '#6b7280' },
];

// AI API 配置
export const API_PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', placeholder: 'AIzaSy...' },
  { id: 'openai', name: 'OpenAI GPT-4o', placeholder: 'sk-...' },
  { id: 'claude', name: 'Claude API', placeholder: 'sk-ant-...' },
  { id: 'qwen', name: '阿里通义千问', placeholder: 'sk-...', defaultKey: 'sk-43aaa7b36c9d4303bc916e184a523790' },
  { id: 'siliconflow', name: '硅基流动', placeholder: 'sk-...' },
];

// 默认数据
export const DEFAULT_MEDS = [];
export const DEFAULT_CATALOG = [];
export const DEFAULT_CHECKUPS = [];
export const DEFAULT_LAB_REPORTS = [];
export const DEFAULT_IMAGING_REPORTS = [];
export const DEFAULT_MEDICAL_RECORDS = [];
export const DEFAULT_VITALS = [];

// 医学术语解释
export const MEDICAL_GLOSSARY = {
  '白细胞': '免疫系统的重要组成部分,升高通常提示感染或炎症,降低可能提示免疫力低下。',
  '红细胞': '负责运输氧气。偏低可能提示贫血,偏高可能见于缺氧。',
  '血红蛋白': '红细胞内运输氧气的蛋白质,是判断贫血及其程度的主要指标。',
  '血糖': '血液中的葡萄糖含量。空腹血糖升高是诊断糖尿病的重要依据。',
  '肌酐': '肌肉代谢产物,是反映肾功能的重要指标。',
};

// 默认医学指标词典
export const DEFAULT_MEDICAL_DICTIONARY = [
  { id: '1', cnName: '白细胞计数', cnAliases: ['白细胞', 'WBC计数'], enName: 'WBC', enAliases: ['White Blood Cell'], description: '评估免疫系统功能,升高常见于感染、炎症', unit: '10^9/L', normalRange: '4.0-10.0' },
  { id: '2', cnName: '红细胞计数', cnAliases: ['红细胞', 'RBC计数'], enName: 'RBC', enAliases: ['Red Blood Cell'], description: '评估携氧能力,偏低提示贫血', unit: '10^12/L', normalRange: '男4.0-5.5,女3.5-5.0' },
  { id: '3', cnName: '血红蛋白', cnAliases: ['血红蛋白浓度'], enName: 'HGB', enAliases: ['Hemoglobin', 'Hb'], description: '诊断贫血的主要指标', unit: 'g/L', normalRange: '男120-160,女110-150' },
  { id: '4', cnName: '血小板计数', cnAliases: ['血小板', 'PLT计数'], enName: 'PLT', enAliases: ['Platelet'], description: '评估凝血功能', unit: '10^9/L', normalRange: '100-300' },
  { id: '5', cnName: '中性粒细胞百分比', cnAliases: ['中性粒细胞%'], enName: 'NEUT%', enAliases: ['Neutrophil%'], description: '细菌感染时升高', unit: '%', normalRange: '50-70' },
  { id: '6', cnName: '淋巴细胞百分比', cnAliases: ['淋巴细胞%'], enName: 'LYMPH%', enAliases: ['Lymphocyte%'], description: '病毒感染时升高', unit: '%', normalRange: '20-40' },
  { id: '7', cnName: '丙氨酸氨基转移酶', cnAliases: ['谷丙转氨酶'], enName: 'ALT', enAliases: ['GPT', 'SGPT'], description: '肝功能指标,升高提示肝损伤', unit: 'U/L', normalRange: '0-40' },
  { id: '8', cnName: '天门冬氨酸氨基转移酶', cnAliases: ['谷草转氨酶'], enName: 'AST', enAliases: ['GOT', 'SGOT'], description: '肝功能指标,心肌损伤时也升高', unit: 'U/L', normalRange: '0-40' },
  { id: '9', cnName: '总胆红素', cnAliases: ['胆红素'], enName: 'TBIL', enAliases: ['Total Bilirubin'], description: '肝功能指标,升高出现黄疸', unit: 'μmol/L', normalRange: '3.4-20.5' },
  { id: '10', cnName: '直接胆红素', cnAliases: ['结合胆红素'], enName: 'DBIL', enAliases: ['Direct Bilirubin'], description: '胆道梗阻时升高', unit: 'μmol/L', normalRange: '0-6.8' },
  { id: '11', cnName: '总蛋白', cnAliases: ['血清总蛋白'], enName: 'TP', enAliases: ['Total Protein'], description: '营养状态和肝功能指标', unit: 'g/L', normalRange: '60-80' },
  { id: '12', cnName: '白蛋白', cnAliases: ['血清白蛋白'], enName: 'ALB', enAliases: ['Albumin'], description: '肝脏合成功能指标', unit: 'g/L', normalRange: '35-55' },
  { id: '13', cnName: '球蛋白', cnAliases: ['血清球蛋白'], enName: 'GLO', enAliases: ['Globulin'], description: '免疫球蛋白', unit: 'g/L', normalRange: '20-35' },
  { id: '14', cnName: '尿素氮', cnAliases: ['尿素'], enName: 'BUN', enAliases: ['Blood Urea Nitrogen'], description: '肾功能指标', unit: 'mmol/L', normalRange: '2.9-8.2' },
  { id: '15', cnName: '肌酐', cnAliases: ['血清肌酐'], enName: 'Cr', enAliases: ['Creatinine'], description: '肾功能重要指标', unit: 'μmol/L', normalRange: '男53-106,女44-97' },
  { id: '16', cnName: '尿酸', cnAliases: ['血尿酸'], enName: 'UA', enAliases: ['Uric Acid'], description: '痛风诊断指标', unit: 'μmol/L', normalRange: '男208-428,女155-357' },
  { id: '17', cnName: '葡萄糖', cnAliases: ['血糖', '空腹血糖'], enName: 'GLU', enAliases: ['Glucose', 'FPG'], description: '糖尿病诊断指标', unit: 'mmol/L', normalRange: '3.9-6.1(空腹)' },
  { id: '18', cnName: '甘油三酯', cnAliases: ['三酰甘油'], enName: 'TG', enAliases: ['Triglyceride'], description: '血脂指标', unit: 'mmol/L', normalRange: '<1.7' },
  { id: '19', cnName: '总胆固醇', cnAliases: ['胆固醇'], enName: 'TC', enAliases: ['Total Cholesterol'], description: '血脂指标', unit: 'mmol/L', normalRange: '<5.2' },
  { id: '20', cnName: '高密度脂蛋白胆固醇', cnAliases: ['高密度脂蛋白', '好胆固醇'], enName: 'HDL-C', enAliases: ['HDL'], description: '保护性胆固醇', unit: 'mmol/L', normalRange: '>1.0' },
  { id: '21', cnName: '低密度脂蛋白胆固醇', cnAliases: ['低密度脂蛋白', '坏胆固醇'], enName: 'LDL-C', enAliases: ['LDL'], description: '致动脉硬化胆固醇', unit: 'mmol/L', normalRange: '<3.4' },
  { id: '22', cnName: '钾', cnAliases: ['血清钾'], enName: 'K', enAliases: ['Potassium'], description: '电解质,影响心脏功能', unit: 'mmol/L', normalRange: '3.5-5.5' },
  { id: '23', cnName: '钠', cnAliases: ['血清钠'], enName: 'Na', enAliases: ['Sodium'], description: '电解质,维持渗透压', unit: 'mmol/L', normalRange: '135-145' },
  { id: '24', cnName: '氯', cnAliases: ['血清氯'], enName: 'Cl', enAliases: ['Chloride'], description: '电解质', unit: 'mmol/L', normalRange: '96-108' },
  { id: '25', cnName: '钙', cnAliases: ['血清钙'], enName: 'Ca', enAliases: ['Calcium'], description: '骨骼健康指标', unit: 'mmol/L', normalRange: '2.1-2.7' },
  { id: '26', cnName: '糖化血红蛋白', cnAliases: ['糖化血红蛋白A1c'], enName: 'HbA1c', enAliases: ['Glycated Hemoglobin', 'A1C'], description: '反映近3个月血糖控制', unit: '%', normalRange: '<6.5' },
  { id: '27', cnName: '促甲状腺激素', cnAliases: ['促甲状腺素'], enName: 'TSH', enAliases: ['Thyroid Stimulating Hormone'], description: '甲状腺功能筛查', unit: 'mIU/L', normalRange: '0.27-4.2' },
  { id: '28', cnName: '游离甲状腺素', cnAliases: ['游离T4'], enName: 'FT4', enAliases: ['Free T4'], description: '甲状腺功能指标', unit: 'pmol/L', normalRange: '12-22' },
  { id: '29', cnName: '游离三碘甲状腺原氨酸', cnAliases: ['游离T3'], enName: 'FT3', enAliases: ['Free T3'], description: '甲状腺功能指标', unit: 'pmol/L', normalRange: '3.1-6.8' },
  { id: '30', cnName: 'C反应蛋白', cnAliases: ['超敏C反应蛋白'], enName: 'CRP', enAliases: ['C-Reactive Protein', 'hs-CRP'], description: '炎症指标', unit: 'mg/L', normalRange: '<10' },
];
