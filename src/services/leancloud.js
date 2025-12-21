import { LC_CONFIG } from '../constants/config';

// 时间戳工具函数
const getTimestamp = () => {
  return new Date().toISOString().slice(11, 23);
};

// LeanCloud REST API 封装
const LeanCloud = {
  _getTimestamp() {
    return getTimestamp();
  },

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

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error(data.error || '用户名或密码错误');
        } else if (response.status === 404) {
          throw new Error(data.error || '请求的资源不存在');
        } else if (response.status >= 500) {
          throw new Error('服务器错误，请稍后重试');
        } else {
          throw new Error(data.error || `请求失败 (${response.status})`);
        }
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
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

  // 保存用户数据（防止重复记录）
  async saveUserData(userId, sessionToken, data) {
    const query = encodeURIComponent(JSON.stringify({ userId }));
    const existing = await this.request(`/classes/UserData?where=${query}`, 'GET', null, sessionToken);

    if (existing.results && existing.results.length > 0) {
      console.log(`📋 [saveUserData] 找到 ${existing.results.length} 条记录`);

      const sorted = existing.results.sort((a, b) =>
        new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      const keepRecord = sorted[0];
      const deleteRecords = sorted.slice(1);

      // 删除重复的旧记录
      if (deleteRecords.length > 0) {
        console.warn(`⚠️ [saveUserData] 发现 ${deleteRecords.length} 条重复记录，正在清理...`);
        for (const record of deleteRecords) {
          try {
            await this.request(`/classes/UserData/${record.objectId}`, 'DELETE', null, sessionToken);
            console.log(`🗑️ [saveUserData] 已删除重复记录: ${record.objectId}`);
          } catch (e) {
            console.error(`❌ [saveUserData] 删除失败:`, e);
          }
        }
      }

      // 智能合并：保留云端所有字段，只更新data中提供的字段
      const updateData = {
        userId,
        members: keepRecord.members,
        currentMemberId: keepRecord.currentMemberId,
        memberData: keepRecord.memberData,
        apiSettings: keepRecord.apiSettings,
        medicalDictionary: keepRecord.medicalDictionary,
        lastUpdated: keepRecord.lastUpdated,
        deviceId: keepRecord.deviceId,
        lastActiveTime: keepRecord.lastActiveTime,
      };

      Object.keys(data).forEach(key => {
        updateData[key] = data[key];
      });

      console.log('🔄 [saveUserData] PUT更新 - 更新字段:', Object.keys(data).join(', '));
      return this.request(`/classes/UserData/${keepRecord.objectId}`, 'PUT', updateData, sessionToken);
    } else {
      console.log('🆕 [saveUserData] 创建新记录');
      return this.request('/classes/UserData', 'POST', { ...data, userId }, sessionToken);
    }
  },

  // 加载用户数据
  async loadUserData(userId, sessionToken) {
    const query = encodeURIComponent(JSON.stringify({ userId }));
    const result = await this.request(`/classes/UserData?where=${query}`, 'GET', null, sessionToken);

    if (!result.results || result.results.length === 0) {
      console.log('📭 [loadUserData] 云端无数据');
      return null;
    }

    if (result.results.length > 1) {
      console.warn(`⚠️ [loadUserData] 发现 ${result.results.length} 条记录，将使用最新的`);
      const sorted = result.results.sort((a, b) =>
        new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
      );
      const latest = sorted[0];
      console.log(`📦 [loadUserData][${this._getTimestamp()}] 返回数据 - deviceId:`, latest.deviceId || '无');
      return latest;
    }

    const data = result.results[0];
    console.log(`📦 [loadUserData][${this._getTimestamp()}] 返回数据 - deviceId:`, data.deviceId || '无');
    return data;
  }
};

export default LeanCloud;
