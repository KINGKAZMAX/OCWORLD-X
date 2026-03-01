import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect, Circle, G } from 'react-native-svg';
import { API_BASE_URL } from '../config/api';

function HomeIcon({ active }: { active?: boolean }) {
  const color = active ? '#2563eb' : '#9ca3af';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReservationIcon({ active }: { active?: boolean }) {
  const color = active ? '#2563eb' : '#9ca3af';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function UserIcon({ active }: { active?: boolean }) {
  const color = active ? '#2563eb' : '#9ca3af';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

function LanguageIcon() {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke="#fff" strokeWidth={1.5} fill="rgba(255,255,255,0.2)" />
      <Path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="#fff" strokeWidth={1.5} />
      <Path d="M2 12h20" stroke="#fff" strokeWidth={1.5} />
      <Text x={8} y={16} fill="#fff" fontSize={8} fontWeight="bold">中</Text>
    </Svg>
  );
}

function OftenMenuIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={2} stroke="#3E3A39" strokeWidth={1.5} />
      <Path d="M3 9h18M9 3v18" stroke="#3E3A39" strokeWidth={1.5} />
    </Svg>
  );
}

function RecordIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#3E3A39" strokeWidth={1.5} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke="#3E3A39" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function PersonIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke="#3E3A39" strokeWidth={1.5} />
      <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="#3E3A39" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={14} height={10} rx={2} stroke="#3E3A39" strokeWidth={1.5} />
      <Path d="M8 11V7a4 4 0 018 0v4" stroke="#3E3A39" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function ChevronRightIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke="#c0c0c0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function StudyRoomProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');
  const [unbindLoading, setUnbindLoading] = useState(false);

  const fetchUserInfo = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/');
        return;
      }

      // 获取自习室系统用户信息（姓名、学号）
      const response = await fetch(`${API_BASE_URL}/api/study-room/userinfo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result: any = await response.json();
        if (result.code === 0 && result.data) {
          setUserName(result.data.name || '');
          setUserId(result.data.id || '');
        }
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserInfo();
    }, [fetchUserInfo])
  );

  const handleUnbind = useCallback(async () => {
    Alert.alert(
      '确认解绑',
      '解绑后需要重新登录自习室账号才能使用预约功能，确定要解绑吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定解绑',
          style: 'destructive',
          onPress: async () => {
            setUnbindLoading(true);
            try {
              const token = await AsyncStorage.getItem('access_token');
              if (!token) {
                Alert.alert('提示', '请先登录');
                return;
              }

              const response = await fetch(`${API_BASE_URL}/api/bindaccount/study_room`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert('成功', '解绑成功', [
                  {
                    text: '确定',
                    onPress: () => {
                      router.replace('/study-room-bindlogin');
                    },
                  },
                ]);
              } else {
                const data: any = await response.json();
                Alert.alert('解绑失败', data?.detail || '操作失败');
              }
            } catch (error) {
              console.error('解绑错误:', error);
              Alert.alert('错误', '网络错误');
            } finally {
              setUnbindLoading(false);
            }
          },
        },
      ]
    );
  }, []);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      '确认退出',
      '确定要退出自习室登录吗？退出后需要重新绑定账号。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('access_token');
              if (token) {
                // 解绑自习室账号
                await fetch(`${API_BASE_URL}/api/bindaccount/study_room`, {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                });
              }
            } catch (error) {
              console.error('解绑错误:', error);
            }
            // 跳转到自习室绑定登录页
            router.replace('/study-room-bindlogin');
          },
        },
      ]
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部蓝色背景 - 绝对定位 */}
      <LinearGradient
        colors={['rgb(26, 73, 192)', 'rgba(26, 73, 192, 0.7)']}
        style={styles.headerBackground}
      />

      {/* 内容区域 */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 用户信息 */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName || userId}</Text>
          <Text style={styles.userId}>{userId}</Text>
        </View>
        {/* 第一组菜单 */}
        <View style={styles.menuCard}>
          <Pressable style={styles.menuItem} onPress={() => router.push('/favorite-seats')}>
            <View style={styles.menuItemLeft}>
              <OftenMenuIcon />
              <Text style={styles.menuItemText}>常用预约</Text>
            </View>
            <ChevronRightIcon />
          </Pressable>
          <View style={styles.menuDivider} />
          <Pressable style={styles.menuItem} onPress={() => router.push('/study-room-history')}>
            <View style={styles.menuItemLeft}>
              <RecordIcon />
              <Text style={styles.menuItemText}>座位预约记录</Text>
            </View>
            <ChevronRightIcon />
          </Pressable>
        </View>

        {/* 第二组菜单 */}
        <View style={styles.menuCard}>
          <Pressable style={styles.menuItem} onPress={() => router.push('/study-room-member')}>
            <View style={styles.menuItemLeft}>
              <PersonIcon />
              <Text style={styles.menuItemText}>个人信息</Text>
            </View>
            <ChevronRightIcon />
          </Pressable>
          <View style={styles.menuDivider} />
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <LockIcon />
              <Text style={styles.menuItemText}>修改密码</Text>
            </View>
            <ChevronRightIcon />
          </Pressable>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionCard}>
          <Pressable style={styles.actionButtonFull} onPress={handleLogout}>
            <Text style={styles.actionButtonText}>退出登录</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* 底部导航 */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => router.replace('/space-reservation')}>
          <HomeIcon />
          <Text style={styles.navText}>首页</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace('/favorite-seats')}>
          <ReservationIcon />
          <Text style={styles.navText}>当前预约</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <UserIcon active />
          <Text style={[styles.navText, styles.navTextActive]}>我的中心</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgb(26, 73, 192)',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 210,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollView: {
    flex: 1,
  },
  userInfo: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  userId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  menuCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemText: {
    fontSize: 15,
    color: '#1f2937',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 44,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonLeft: {
    borderRightWidth: 0,
  },
  actionButtonRight: {
    borderLeftWidth: 0,
  },
  actionButtonFull: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 15,
    color: '#6b7280',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingBottom: 28,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  navTextActive: {
    color: '#2563eb',
  },
});
