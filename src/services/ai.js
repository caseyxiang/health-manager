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
export async function analyzeMedicalImage(base64Data, mimeType, mode, setDebug) {
  const currentKey = getApiKeyFor(CURRENT_API);
  if (!currentKey) {
    if (setDebug) setDebug('错误: 未配置API Key');
    return { error: 'NO_API_KEY' };
  }

  const providerName = API_PROVIDERS.find(p => p.id === CURRENT_API)?.name || CURRENT_API;
  if (setDebug) setDebug(`使用: ${providerName}\n文件类型: ${mimeType}\n数据大小: ${Math.round(base64Data.length / 1024)}KB`);

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
    } else if (CURRENT_API === 'openai') {
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
    } else if (CURRENT_API === 'claude') {
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
    } else if (CURRENT_API === 'qwen') {
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
    } else if (CURRENT_API === 'siliconflow') {
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

    if (setDebug) setDebug(prev => prev + `\n响应状态: ${response.status}`);
    if (!text) {
      if (setDebug) setDebug(prev => prev + `\nAPI返回无内容`);
      return { error: 'NO_CONTENT', detail: data };
    }

    const jsonStr = text.replace(/```json|```/g, '').trim();
    try {
      return JSON.parse(jsonStr);
    } catch (parseErr) {
      if (setDebug) setDebug(prev => prev + `\nJSON解析失败`);
      return { error: 'JSON_PARSE_ERROR', detail: jsonStr };
    }
  } catch (error) {
    console.error('AI分析失败:', error);
    if (setDebug) setDebug(prev => prev + `\n请求失败: ${error.message}`);
    return { error: 'FETCH_ERROR', detail: error.message };
  }
}
