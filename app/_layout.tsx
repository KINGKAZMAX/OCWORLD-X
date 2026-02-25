// app/_layout.tsx
import { config } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { Stack, usePathname, router } from 'expo-router';
import { useEffect } from 'react';
import { View, Pressable, Text } from 'react-native';
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
  // 登录页和注册页不显示底部导航
  const hiddenTabsPages = ['/', '/index', '/register', '/space-reservation', '/study-room-bindlogin', '/study-room', '/favorite-seats', '/study-room-profile', '/study-room-history', '/study-room-member', '/study-room-forget'];
  const showTabs =
    pathname && !hiddenTabsPages.includes(pathname) && !pathname.startsWith('/(auth)');

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
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen 
              name="home" 
              options={{ 
                title: '首页',
                headerBackVisible: false,
                headerTitleAlign: 'center',
              }} 
            />
            <Stack.Screen name="filter" options={{ title: '我的课表', headerShown: false }} />
            <Stack.Screen name="listing" options={{ headerShown: false }} />
            <Stack.Screen name="inbox" options={{ title: '消息中心', headerBackVisible: false }} />
            <Stack.Screen name="schedule" options={{ title: '课表查询' }} />
            <Stack.Screen name="cet" options={{ title: '四六级报名及查询' }} />
            <Stack.Screen name="dormitory" options={{ title: '宿舍信息' }} />
            <Stack.Screen 
              name="tuition" 
              options={{ 
                title: '学费查询',
                headerTitleAlign: 'center',
                headerStyle: { backgroundColor: '#1684ff' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '600' },
              }} 
            />
            <Stack.Screen name="campus-card" options={{ title: '校园卡充值' }} />
            <Stack.Screen name="campus-network" options={{ title: '校园网' }} />
            <Stack.Screen name="campus-run" options={{ title: '校园跑' }} />
            <Stack.Screen name="products" options={{ title: '商城系统' }} />
            <Stack.Screen name="textbook-answers" options={{ title: '教材答案' }} />
            <Stack.Screen 
              name="space-reservation" 
              options={{ 
                title: '空间预约', 
                headerShown: true, 
                headerBackVisible: false,
                headerLeft: () => (
                  <Pressable onPress={() => router.replace('/listing')} style={{ paddingRight: 16 }}>
                    <Text style={{ fontSize: 24 }}>←</Text>
                  </Pressable>
                ),
              }} 
            />
            <Stack.Screen name="study-room-bindlogin" options={{ title: '账号绑定', headerShown: false }} />
            <Stack.Screen name="study-room" options={{ title: '座位预约', headerShown: false }} />
            <Stack.Screen name="favorite-seats" options={{ title: '常用预约', headerShown: false }} />
            <Stack.Screen name="study-room-profile" options={{ title: '我的中心', headerShown: false }} />
            <Stack.Screen name="study-room-history" options={{ title: '座位预约记录', headerShown: false }} />
            <Stack.Screen name="study-room-member" options={{ title: '个人信息', headerShown: false }} />
            <Stack.Screen name="study-room-forget" options={{ title: '忘记密码', headerShown: false }} />
            <Stack.Screen name="profile" options={{ title: '个人中心', headerBackVisible: false }} />
            <Stack.Screen name="account-security" options={{ title: '账号安全' }} />
          </Stack>
          {showTabs ? <BottomTabs /> : null}
        </View>
      </GluestackUIProvider>
    </ErrorBoundary>
  );
}
