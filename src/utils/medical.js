import { MEDICAL_GLOSSARY } from '../constants';

// 清理指标名称
export function cleanIndicatorName(name) {
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
export function calculateFlag(result, refRange) {
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

// 标准化指标名称
export function normalizeIndicatorName(name) {
  if (!name) return '';
  return name.trim()
    .replace(/\s+/g, '')
    .replace(/\([^)]*\)/g, '')
    .toLowerCase();
}

// 在词典中查找匹配项
export function findDictionaryMatch(newItem, dictionary) {
  const newCn = newItem.name || '';
  const newEn = (newItem.name.match(/[A-Za-z]/g) || []).join('');

  if (newEn) {
    const normalizedNewEn = normalizeIndicatorName(newEn);
    for (const entry of dictionary) {
      if (entry.enName && normalizeIndicatorName(entry.enName) === normalizedNewEn) {
        return { match: entry, matchType: 'en-main' };
      }
      if (entry.enAliases) {
        for (const alias of entry.enAliases) {
          if (normalizeIndicatorName(alias) === normalizedNewEn) {
            return { match: entry, matchType: 'en-alias' };
          }
        }
      }
    }
  }

  if (newCn) {
    const normalizedNewCn = normalizeIndicatorName(newCn);
    for (const entry of dictionary) {
      if (entry.cnName && normalizeIndicatorName(entry.cnName) === normalizedNewCn) {
        return { match: entry, matchType: 'cn-main' };
      }
      if (entry.cnAliases) {
        for (const alias of entry.cnAliases) {
          if (normalizeIndicatorName(alias) === normalizedNewCn) {
            return { match: entry, matchType: 'cn-alias' };
          }
        }
      }
    }
  }

  return null;
}

// 应用词典标准化到检验报告项目
export function applyDictionaryToLabItem(item, dictionary) {
  const matchResult = findDictionaryMatch(item, dictionary);

  if (!matchResult) {
    return { ...item };
  }

  const { match, matchType } = matchResult;
  const standardizedItem = { ...item };

  if (matchType.startsWith('en-')) {
    standardizedItem.name = match.cnName;
  } else if (matchType.startsWith('cn-')) {
    standardizedItem.name = match.cnName;
    if (match.enName) {
      standardizedItem.displayName = `${match.cnName} (${match.enName})`;
    }
  }

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
export function applyDictionaryToLabReport(report, dictionary) {
  const processedItems = report.items.map(item =>
    applyDictionaryToLabItem(item, dictionary)
  );

  return {
    ...report,
    items: processedItems
  };
}

// 检查是否有医学术语信息
export const hasInfo = (name) => Object.keys(MEDICAL_GLOSSARY).some(k => name.includes(k));

// 生成服药方法描述
export function getMedicationMethodString(med) {
  let methodStr = '';

  // 频次
  if (med.frequency) {
    methodStr += `每日${med.frequency}次`;
  }

  // 剂量
  if (med.dosagePerTime) {
    methodStr += ` 每次${med.dosagePerTime}`;
  }

  // 时段
  if (med.timePeriods && med.timePeriods.length > 0) {
    methodStr += ` (${med.timePeriods.join('、')})`;
  }

  // 用餐关系
  if (med.relation && med.relation !== '无关') {
    methodStr += ` ${med.relation}`;
  }

  // 循环用药
  if (med.cycleEnabled && med.cycleDays && med.cycleRestDays) {
    methodStr += ` 循环:服${med.cycleDays}天停${med.cycleRestDays}天`;
  }

  return methodStr.trim();
}
