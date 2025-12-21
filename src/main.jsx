import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { VERSION } from './constants'
import { CURRENT_ENV } from './constants/config'

// 检测Safari并添加标记
if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
  document.documentElement.classList.add('is-safari');
}

// 动态更新页面标题
if (CURRENT_ENV === 'test') {
  document.title = `健康管家 Pro ${VERSION} [测试环境]`;
} else {
  document.title = `健康管家 Pro ${VERSION}`;
}

console.log('✅ 应用启动');
console.log('📱 版本:', VERSION);
console.log('🌍 环境:', CURRENT_ENV);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
