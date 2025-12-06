// app/_layout.tsx
import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { Stack, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { BottomTabs } from '../components/BottomTabs';
import { ErrorBoundary } from '../components/ErrorBoundary';

// 全局错误处理器
if (typeof ErrorUtils !== 'undefined') {
  const defaultHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('全局错误捕获:', error, '是否致命:', isFatal);
    if (defaultHandler) {
      defaultHandler(error, isFatal);
    }
  });
}

export default function RootLayout() {
  const pathname = usePathname();
  const showTabs =
    pathname && pathname !== '/' && !pathname.startsWith('/(auth)') && pathname !== '/index';

  // 添加控制台日志，帮助调试
  useEffect(() => {
    console.log('RootLayout mounted, pathname:', pathname);
    console.log('showTabs:', showTabs);
  }, [pathname, showTabs]);

  return (
    <ErrorBoundary>
      <GluestackUIProvider config={config}>
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: true,
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen 
              name="home" 
              options={{ 
                title: '智慧校园',
                headerShown: false, // home 页面不显示顶部导航
              }} 
            />
            <Stack.Screen name="filter" options={{ title: '我的课表', headerShown: false }} />
            <Stack.Screen name="listing" options={{ title: '发布中心', headerBackVisible: false }} />
            <Stack.Screen name="inbox" options={{ title: '消息中心', headerBackVisible: false }} />
            <Stack.Screen name="schedule" options={{ title: '课表查询' }} />
            <Stack.Screen name="cet" options={{ title: '四六级报名及查询' }} />
            <Stack.Screen name="dormitory" options={{ title: '宿舍信息' }} />
            <Stack.Screen name="tuition" options={{ title: '学费查询' }} />
            <Stack.Screen name="campus-card" options={{ title: '校园卡充值' }} />
            <Stack.Screen name="campus-network" options={{ title: '校园网' }} />
            <Stack.Screen name="campus-run" options={{ title: '校园跑' }} />
            <Stack.Screen name="products" options={{ title: '商城系统' }} />
            <Stack.Screen name="textbook-answers" options={{ title: '教材答案' }} />
            <Stack.Screen name="profile" options={{ title: '个人中心', headerBackVisible: false }} />
          </Stack>
          {showTabs ? <BottomTabs /> : null}
        </View>
      </GluestackUIProvider>
    </ErrorBoundary>
  );
}
