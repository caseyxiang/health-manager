// 健康管家 Pro - 工具函数库
// Version: v15.72

// ========== LeanCloud REST API 封装 ==========
const LeanCloud = {
  // 基础请求
  async request(path, method = 'GET', body = null, sessionToken = null) {
    const headers = {
      'Content-Type': 'application/json',
      'X-LC-Id': LC_CONFIG.appId,
      'X-LC-Key': LC_CONFIG.appKey
    };
    if (sessionToken) headers['X-LC-Session'] = sessionToken;
    
    const options = { 
      method, 
      headers,
      mode: 'cors'
    };
    if (body) options.body = JSON.stringify(body);
    
    try {
      const response = await fetch(`${LC_CONFIG.serverURL}/1.1${path}`, options);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      // 更详细的错误信息
      if (err.message === 'Failed to fetch') {
        throw new Error('网络连接失败,请检查网络或稍后重试');
      }
      throw err;
    }
  },
  
  // 用户注册
  async signUp(username, password) {
    return this.request('/users', 'POST', { username, password });
  },
  
  // 用户登录
  async login(username, password) {
    return this.request('/login', 'POST', { username, password });
  },
  
  // 获取当前用户
  async getCurrentUser(sessionToken) {
    return this.request('/users/me', 'GET', null, sessionToken);
  },
  
  // 保存用户数据
  async saveUserData(userId, sessionToken, data) {
    // 先查询是否已有数据
    const query = encodeURIComponent(JSON.stringify({ userId }));
    const existing = await this.request(`/classes/UserData?where=${query}`, 'GET', null, sessionToken);
    
    if (existing.results && existing.results.length > 0) {
      // 更新现有记录
      const objectId = existing.results[0].objectId;
      return this.request(`/classes/UserData/${objectId}`, 'PUT', { ...data, userId }, sessionToken);
    } else {
      // 创建新记录
      return this.request('/classes/UserData', 'POST', { ...data, userId }, sessionToken);
    }
  },
  
  // 加载用户数据
  async loadUserData(userId, sessionToken) {
    const query = encodeURIComponent(JSON.stringify({ userId }));
    const result = await this.request(`/classes/UserData?where=${query}`, 'GET', null, sessionToken);
    return result.results && result.results.length > 0 ? result.results[0] : null;
  }
};

// ========== 数据加载和保存函数 ==========
const loadData = (key, defaultData) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultData;
  } catch (e) {
    console.error("加载数据失败:", key, e);
    return defaultData;
  }
};

// 加载成员特定数据
const loadMemberData = (memberId, dataType, defaultData) => {
  const key = `health_pro_${memberId}_${dataType}`;
  return loadData(key, defaultData);
};

// 保存成员特定数据
const saveMemberData = (memberId, dataType, data) => {
  const key = `health_pro_${memberId}_${dataType}`;
  localStorage.setItem(key, JSON.stringify(data));
};

// 迁移旧数据到默认成员
const migrateOldData = () => {
  const oldKeys = ['meds', 'catalog', 'checkups', 'labReports', 'imagingReports', 'vitals'];
  const needMigration = oldKeys.some(k => localStorage.getItem(`health_pro_${k}`) !== null);
  const alreadyMigrated = localStorage.getItem('health_pro_data_migrated');
  
  if (needMigration && !alreadyMigrated) {
    oldKeys.forEach(dataType => {
      const oldKey = `health_pro_${dataType}`;
      const newKey = `health_pro_default_${dataType}`;
      const oldData = localStorage.getItem(oldKey);
      if (oldData && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldData);
      }
    });
    localStorage.setItem('health_pro_data_migrated', 'true');
  }
};

// ========== 医学指标处理函数 ==========
// 清理指标名称
function cleanIndicatorName(name) {
  if (!name) return '';
  let cleaned = name;
  cleaned = cleaned.replace(/测定/g, '');
  const preserveSerum = ['血清白蛋白', '血清球蛋白', '血清总蛋白'];
  const hasPreserve = preserveSerum.some(term => cleaned.includes(term));
  if (!hasPreserve) {
    cleaned = cleaned.replace(/^血清\s*/, '');
  }
  return cleaned.trim();
}

// 计算指标异常状态
function calculateFlag(result, refRange) {
  if (!result || !refRange) return 'Normal';
  const valMatch = result.toString().match(/-?\d+(?:\.\d+)?/);
  if (!valMatch) return 'Normal';
  const val = parseFloat(valMatch[0]);
  let cleanRange = refRange.toString()
    .replace(/[\u2013\u2014\u2212~~]/g, '-')
    .replace(/-+/g, '-')
    .replace(/[^\d.\-><]/g, '');
  
  if (cleanRange.includes('-')) {
    const parts = cleanRange.split('-').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      if (val < parts[0]) return 'Low';
      if (val > parts[1]) return 'High';
      return 'Normal';
    }
  }
  if (cleanRange.startsWith('<')) {
    const max = parseFloat(cleanRange.substring(1));
    if (!isNaN(max) && val > max) return 'High';
    return 'Normal';
  }
  if (cleanRange.startsWith('>')) {
    const min = parseFloat(cleanRange.substring(1));
    if (!isNaN(min) && val < min) return 'Low';
    return 'Normal';
  }
  return 'Normal';
}

// ========== 医学指标词典匹配和管理函数 ==========
// 标准化指标名称:去除空格、括号内容等
function normalizeIndicatorName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, '')  // 移除所有空格
    .replace(/\([^)]*\)/g, '')  // 移除括号及内容
    .toLowerCase();  // 转小写(用于英文匹配)
}

// 在词典中查找匹配项
function findDictionaryMatch(newItem, dictionary) {
  const newCn = newItem.name || '';
  const newEn = (newItem.name.match(/[A-Za-z]/g) || []).join('');  // 提取英文部分
  
  // 步骤1: 如果新数据有英文,优先匹配英文
  if (newEn) {
    const normalizedNewEn = normalizeIndicatorName(newEn);
    for (const entry of dictionary) {
      // 检查主名称
      if (entry.enName && normalizeIndicatorName(entry.enName) === normalizedNewEn) {
        return { match: entry, matchType: 'en-main' };
      }
      // 检查别名
      if (entry.enAliases) {
        for (const alias of entry.enAliases) {
          if (normalizeIndicatorName(alias) === normalizedNewEn) {
            return { match: entry, matchType: 'en-alias' };
          }
        }
      }
    }
  }
  
  // 步骤2: 英文未匹配,尝试匹配中文
  if (newCn) {
    const normalizedNewCn = normalizeIndicatorName(newCn);
    for (const entry of dictionary) {
      // 检查主名称
      if (entry.cnName && normalizeIndicatorName(entry.cnName) === normalizedNewCn) {
        return { match: entry, matchType: 'cn-main' };
      }
      // 检查别名
      if (entry.cnAliases) {
        for (const alias of entry.cnAliases) {
          if (normalizeIndicatorName(alias) === normalizedNewCn) {
            return { match: entry, matchType: 'cn-alias' };
          }
        }
      }
    }
  }
  
  return null;  // 未找到匹配
}

// 应用词典标准化到检验报告项目
function applyDictionaryToLabItem(item, dictionary) {
  const matchResult = findDictionaryMatch(item, dictionary);
  
  if (!matchResult) {
    // 未匹配:返回原始数据,不添加到词典
    return { ...item };
  }
  
  const { match, matchType } = matchResult;
  
  // 根据匹配类型标准化名称
  const standardizedItem = { ...item };
  
  if (matchType.startsWith('en-')) {
    // 英文匹配:使用词典的中文名称
    standardizedItem.name = match.cnName;
  } else if (matchType.startsWith('cn-')) {
    // 中文匹配:如果词典有英文,可以添加到显示中
    standardizedItem.name = match.cnName;
    if (match.enName) {
      standardizedItem.displayName = `${match.cnName} (${match.enName})`;
    }
  }
  
  // 补充单位和参考范围(如果词典有而原数据没有)
  if (!standardizedItem.unit && match.unit) {
    standardizedItem.unit = match.unit;
  }
  if (!standardizedItem.refRange && match.normalRange) {
    standardizedItem.refRange = match.normalRange;
  }
  
  standardizedItem.dictionaryId = match.id;
  standardizedItem.description = match.description;
  
  return standardizedItem;
}

// 批量应用词典到检验报告
function applyDictionaryToLabReport(report, dictionary) {
  const processedItems = report.items.map(item => 
    applyDictionaryToLabItem(item, dictionary)
  );
  
  return {
    ...report,
    items: processedItems
  };
}

// ========== AI 图像识别函数 ==========
async function analyzeMedicalImage(base64Data, mimeType, mode, setDebug) {
  var currentKey = getApiKeyFor(CURRENT_API);
  if (!currentKey) {
    if (setDebug) setDebug('错误: 未配置API Key');
    return { error: 'NO_API_KEY' };
  }
  const providerName = API_PROVIDERS.find(p => p.id === CURRENT_API)?.name || CURRENT_API;
  if (setDebug) setDebug(`使用: ${providerName}\n文件类型: ${mimeType}\n数据大小: ${Math.round(base64Data.length/1024)}KB`);
  let prompt = "";
  if (mode === 'lab') {
    prompt = `分析这份医学检验报告。提取所有检验指标数据,返回JSON格式: { "reportDate": "YYYY-MM-DD格式的检查日期", "hospital": "医院名称", "items": [ { "name": "中文指标名称", "result": "数值结果", "unit": "单位", "refRange": "参考范围" } ] }。请提取所有能找到的检验指标。只返回JSON,不要其他内容。`;
  } else {
    prompt = `分析这份医学影像/检查报告。请仔细查找以下内容并提取为JSON格式: 1. reportDate: 检查日期,格式YYYY-MM-DD 2. hospital: 医院名称 3. modality: 检查类型 4. region: 检查部位 5. findings: 影像所见完整内容 6. impression: 诊断意见完整内容 返回格式: { "reportDate": "YYYY-MM-DD", "hospital": "医院名称", "modality": "检查类型", "region": "检查部位", "findings": "影像所见完整内容", "impression": "诊断意见完整内容" } 只返回JSON,不要其他内容。`;
  }
  try {
    if (setDebug) setDebug(prev => prev + '\n发送请求中...');
    let response, data, text;
    if (CURRENT_API === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${currentKey}`;
      response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: mimeType, data: base64Data } }, { text: prompt }] }] }) });
      data = await response.json();
      if (data.error) throw new Error(JSON.stringify(data.error).substring(0, 200));
      text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (CURRENT_API === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentKey}` }, body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }, { type: 'text', text: prompt }] }], max_tokens: 4096 }) });
      data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error).substring(0, 200));
      text = data.choices?.[0]?.message?.content;
    } else if (CURRENT_API === 'claude') {
      response = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': currentKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4096, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } }, { type: 'text', text: prompt }] }] }) });
      data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error).substring(0, 200));
      text = data.content?.[0]?.text;
    } else if (CURRENT_API === 'qwen') {
      response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentKey}` }, body: JSON.stringify({ model: 'qwen-vl-max', messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }, { type: 'text', text: prompt }] }] }) });
      data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error).substring(0, 200));
      text = data.choices?.[0]?.message?.content;
    } else if (CURRENT_API === 'siliconflow') {
      response = await fetch('https://api.siliconflow.cn/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentKey}` }, body: JSON.stringify({ model: 'Qwen/Qwen2-VL-72B-Instruct', messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }, { type: 'text', text: prompt }] }] }) });
      data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error).substring(0, 200));
      text = data.choices?.[0]?.message?.content;
    }
    if (setDebug) setDebug(prev => prev + `\n响应状态: ${response.status}`);
    if (!text) { if (setDebug) setDebug(prev => prev + `\nAPI返回无内容`); return { error: 'NO_CONTENT', detail: data }; }
    const jsonStr = text.replace(/```json|```/g, '').trim();
    try { return JSON.parse(jsonStr); } catch (parseErr) { if (setDebug) setDebug(prev => prev + `\nJSON解析失败`); return { error: 'JSON_PARSE_ERROR', detail: jsonStr }; }
  } catch (error) { console.error('AI分析失败:', error); if (setDebug) setDebug(prev => prev + `\n请求失败: ${error.message}`); return { error: 'FETCH_ERROR', detail: error.message }; }
}

// ========== 辅助工具函数 ==========
// 获取本地日期字符串
function getLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// 获取本地时间字符串
function getLocalTimeStr(d) {
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

// 检查指标名称是否在医学词汇表中
const hasInfo = (name) => Object.keys(MEDICAL_GLOSSARY).some(k => name.includes(k));
