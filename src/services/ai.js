import { API_PROVIDERS } from '../constants';

// 获取当前 API 提供商
let CURRENT_API = localStorage.getItem('ai_api_provider') || 'qwen';

export const getCurrentApi = () => CURRENT_API;
export const setCurrentApi = (api) => {
  CURRENT_API = api;
  localStorage.setItem('ai_api_provider', api);
};

// 获取指定服务商的API Key
export function getApiKeyFor(providerId) {
  const provider = API_PROVIDERS.find(p => p.id === providerId);
  const key = localStorage.getItem('ai_api_key_' + providerId);
  return key || (provider && provider.defaultKey) || '';
}

// 保存指定服务商的API Key
export function saveApiKeyFor(providerId, key) {
  if (key) {
    localStorage.setItem('ai_api_key_' + providerId, key);
  }
}

// 医学影像分析
// files: 数组 [{name, data, type}] 其中 data 是完整的 dataURL (包含 data:image/...;base64, 前缀)
// mode: 'lab' 或 'imaging'
export async function analyzeMedicalImage(files, mode, providerId, setDebug) {
  // 如果传入了 providerId，使用它；否则使用当前设置的 API
  const apiToUse = providerId || CURRENT_API;
  const currentKey = getApiKeyFor(apiToUse);

  if (!currentKey) {
    return { error: 'NO_API_KEY', success: false };
  }

  const providerName = API_PROVIDERS.find(p => p.id === apiToUse)?.name || apiToUse;

  // 处理文件数据 - 提取第一张图片用于识别
  const firstFile = files[0];
  if (!firstFile) {
    return { error: 'NO_FILE', success: false };
  }

  // 从 dataURL 中提取 base64 数据和 mimeType
  const dataUrlMatch = firstFile.data.match(/^data:([^;]+);base64,(.+)$/);
  if (!dataUrlMatch) {
    return { error: 'INVALID_DATA_URL', success: false };
  }
  const mimeType = dataUrlMatch[1];
  const base64Data = dataUrlMatch[2];

  let prompt = "";
  if (mode === 'lab') {
    prompt = `分析这份医学检验报告。提取所有检验指标数据,返回JSON格式:
{
  "reportDate": "YYYY-MM-DD格式的检查日期",
  "hospital": "医院名称",
  "category": "报告类别，如：血常规、尿常规、生化全套、肝功能、肾功能、血脂、血糖、甲状腺功能、肿瘤标志物、凝血功能、电解质、心肌酶谱、免疫检查、感染指标等",
  "items": [ { "name": "中文指标名称", "result": "数值结果", "unit": "单位", "refRange": "参考范围" } ]
}
请根据检验项目内容判断报告类别。如果包含多种类型的指标，选择最主要的类别或填写"综合检验"。请提取所有能找到的检验指标。只返回JSON,不要其他内容。`;
  } else if (mode === 'medical_record') {
    prompt = `分析这份病历文书（如出院小结、诊断书、病历等）。提取关键信息,返回JSON格式:
{
  "date": "YYYY-MM-DD格式的日期（出院日期或文书日期）",
  "recordType": "文书类型，如：出院小结、出院诊断书、入院记录、门诊病历、诊断证明书、手术记录、病理报告、会诊记录、病程记录等",
  "hospital": "医院名称",
  "department": "科室名称",
  "admissionDate": "入院日期（如有）YYYY-MM-DD",
  "dischargeDate": "出院日期（如有）YYYY-MM-DD",
  "diagnosis": "诊断内容，包括主要诊断和其他诊断",
  "treatmentSummary": "治疗经过或病情摘要",
  "dischargeMeds": "出院用药（如有）",
  "followupAdvice": "随访建议或注意事项",
  "notes": "其他重要信息"
}
请尽量完整提取所有能找到的信息。只返回JSON,不要其他内容。`;
  } else {
    prompt = `分析这份医学影像/检查报告。请仔细查找以下内容并提取为JSON格式: 1. reportDate: 检查日期,格式YYYY-MM-DD 2. hospital: 医院名称 3. modality: 检查类型 4. region: 检查部位 5. findings: 影像所见完整内容 6. impression: 诊断意见完整内容 返回格式: { "reportDate": "YYYY-MM-DD", "hospital": "医院名称", "modality": "检查类型", "region": "检查部位", "findings": "影像所见完整内容", "impression": "诊断意见完整内容" } 只返回JSON,不要其他内容。`;
  }

  try {
    let response, data, text;

    if (apiToUse === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${currentKey}`;
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Data } },
              { text: prompt }
            ]
          }]
        })
      });
      data = await response.json();
      if (data.error) throw new Error(JSON.stringify(data.error).substring(0, 200));
      text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (apiToUse === 'openai') {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
              { type: 'text', text: prompt }
            ]
          }],
          max_tokens: 4096
        })
      });
      data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error).substring(0, 200));
      text = data.choices?.[0]?.message?.content;
    } else if (apiToUse === 'claude') {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': currentKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } },
              { type: 'text', text: prompt }
            ]
          }]
        })
      });
      data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error).substring(0, 200));
      text = data.content?.[0]?.text;
    } else if (apiToUse === 'qwen') {
      response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentKey}` },
        body: JSON.stringify({
          model: 'qwen-vl-max',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
              { type: 'text', text: prompt }
            ]
          }]
        })
      });
      data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error).substring(0, 200));
      text = data.choices?.[0]?.message?.content;
    } else if (apiToUse === 'siliconflow') {
      response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentKey}` },
        body: JSON.stringify({
          model: 'Qwen/Qwen2-VL-72B-Instruct',
          messages: [{
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
              { type: 'text', text: prompt }
            ]
          }]
        })
      });
      data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error).substring(0, 200));
      text = data.choices?.[0]?.message?.content;
    }

    if (!text) {
      return { error: 'NO_CONTENT', detail: data, success: false };
    }

    const jsonStr = text.replace(/```json|```/g, '').trim();
    try {
      const parsed = JSON.parse(jsonStr);
      // 返回解析结果，添加 success 标记
      return {
        success: true,
        date: parsed.reportDate || parsed.date,
        hospital: parsed.hospital,
        category: parsed.category, // 检验报告分类
        items: parsed.items, // 检验报告
        modality: parsed.modality, // 影像报告
        region: parsed.region,
        findings: parsed.findings,
        impression: parsed.impression,
        // 病历文书字段
        recordType: parsed.recordType,
        department: parsed.department,
        admissionDate: parsed.admissionDate,
        dischargeDate: parsed.dischargeDate,
        diagnosis: parsed.diagnosis,
        treatmentSummary: parsed.treatmentSummary,
        dischargeMeds: parsed.dischargeMeds,
        followupAdvice: parsed.followupAdvice,
        notes: parsed.notes
      };
    } catch (parseErr) {
      return { error: 'JSON_PARSE_ERROR', detail: jsonStr, success: false };
    }
  } catch (error) {
    console.error('AI分析失败:', error);
    return { error: 'FETCH_ERROR', detail: error.message, success: false };
  }
}
