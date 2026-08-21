import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.surplusfate.accountbook',
  appName: '账号本子',
  webDir: 'dist',
  // 覆盖 WebView 沉浸模式，让 CSS safe-area-inset 生效
  android: {
    backgroundColor: '#0B0F0E',
  },
  plugins: {
    // StatusBar 插件配置：由 CSS safe-area-inset 处理内容安全区，
    // 背景色在运行时按主题动态设置
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0B0F0E',
      overlaysWebView: true,
    },
  },
};

export default config;
