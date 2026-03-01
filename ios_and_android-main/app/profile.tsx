import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

type MenuItem = {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  danger?: boolean;
};

const menuItems: MenuItem[] = [
  { label: '个人信息', icon: 'account-circle-outline', color: '#3b82f6' },
  { label: '账号安全', icon: 'shield-check-outline', color: '#10b981' },
  { label: '设置', icon: 'cog-outline', color: '#f97316' },
  { label: '帮助与反馈', icon: 'message-text-outline', color: '#a855f7' },
  { label: '关于', icon: 'information-outline', color: '#06b6d4' },
  { label: '退出登录', icon: 'power-standby', color: '#f43f5e', danger: true },
];

type UserInfo = {
  nickname: string;
  email: string;
};

export default function ProfileScreen() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // 获取用户信息
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: any = await response.json();
          if (data) {
            setUserInfo({
              nickname: String(data.nickname ?? ''),
              email: String(data.email ?? ''),
            });
          }
        }
      } catch (e) {
        console.error('获取用户信息失败:', e);
      }
    };

    fetchUserInfo();
  }, []);

  // 退出登录
  const handleLogout = useCallback(() => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('access_token');
          await AsyncStorage.removeItem('refresh_token');
          router.replace('/');
        },
      },
    ]);
  }, []);

  // 菜单点击处理
  const handleMenuPress = useCallback((label: string) => {
    if (label === '退出登录') {
      handleLogout();
    } else if (label === '账号安全') {
      router.push('/account-security');
    } else if (label === '设置') {
      router.push('/settings');
    }
  }, [handleLogout]);

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={46} color="#ffffff" />
          </View>
          <Text style={styles.name}>{userInfo?.nickname || '未登录'}</Text>
          <Text style={styles.meta}>{userInfo?.email || '请先登录'}</Text>
        </View>

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <Pressable key={item.label} style={styles.row} onPress={() => handleMenuPress(item.label)}>
              <View style={[styles.iconBadge, { backgroundColor: `${item.color}1A` }]}>
                <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={[styles.rowLabel, item.danger && styles.rowLabelDanger]}>{item.label}</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={item.danger ? '#fda4af' : '#cbd5f5'}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 0,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 200,
    gap: 20,
  },
  headerCard: {
    backgroundColor: '#4f9dff',
    borderRadius: 28,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#2563eb',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 8,
  },
  avatar: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#80bfff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#f8fafc',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  meta: {
    fontSize: 14,
    color: '#e0f2ff',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
  },
  rowLabelDanger: {
    color: '#f43f5e',
    fontWeight: '600',
  },
});
