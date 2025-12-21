// 环境检测
export const detectEnvironment = () => {
  const hostname = window.location.hostname;

  const isTestEnv =
    hostname.includes('-test.vercel.app') ||
    hostname.includes('git-test-') ||
    hostname.startsWith('test.') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1';

  return isTestEnv ? 'test' : 'production';
};

export const CURRENT_ENV = detectEnvironment();

// 从 localStorage 加载测试配置
const loadTestConfig = () => {
  try {
    const saved = localStorage.getItem('health_pro_test_leancloud_config');
    if (saved) {
      const config = JSON.parse(saved);
      console.log('✅ [配置] 从localStorage加载测试配置');
      return config;
    }
  } catch (e) {
    console.warn('⚠️ [配置] localStorage读取失败:', e);
  }

  // 默认测试配置
  return {
    appId: 'eLCaXADeu03uzVV5jPhaoZdx-gzGzoHsz',
    appKey: 'SwfVKRpnv4ePuxQzw3aPGOpc',
    serverURL: 'https://elcaxade.lc-cn-n1-shared.com'
  };
};

// LeanCloud 配置
export const LC_CONFIG = CURRENT_ENV === 'test' ? loadTestConfig() : {
  appId: 'CRfeDG3VSyidc5qcX3SVtibn-gzGzoHsz',
  appKey: 'mqv2BXZT7u9GhAwVe7mAO9PL',
  serverURL: 'https://crfedg3v.lc-cn-n1-shared.com'
};

// 检测是否需要配置
export const needsTestConfig = CURRENT_ENV === 'test' && (
  !LC_CONFIG.appId ||
  LC_CONFIG.appId === '你的测试AppID' ||
  LC_CONFIG.appId.includes('占位符')
);

// 日志输出
console.log('☁️ [LeanCloud] 环境:', CURRENT_ENV);
if (!needsTestConfig) {
  console.log('☁️ [LeanCloud] AppID:', LC_CONFIG.appId.substring(0, 10) + '...');
  console.log('☁️ [LeanCloud] ServerURL:', LC_CONFIG.serverURL);
}
