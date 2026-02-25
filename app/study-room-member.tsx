import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { API_BASE_URL } from '../config/api';

interface MemberInfo {
  id?: string;
  name?: string;
  card?: string;
  status?: string;
  mobile?: string;
  email?: string;
  roleName?: string;
  deptName?: string;
  date?: string;
  joinTime?: string;
}

function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke="#6b7280" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EditIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#2563eb" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#2563eb" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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

export default function StudyRoomMemberScreen() {
  const [loading, setLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editType, setEditType] = useState<'mobile' | 'email'>('mobile');
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchMemberInfo = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/study-room/member`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('个人信息:', JSON.stringify(data));
        if (data.code === 0 && data.data) {
          setMemberInfo(data.data);
        }
      }
    } catch (error) {
      console.error('获取个人信息失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMemberInfo();
    }, [fetchMemberInfo])
  );

  const getStatusText = (status: string | undefined) => {
    if (status === '1') return '正常';
    if (status === '0') return '禁用';
    return '未知';
  };

  const handleEdit = (type: 'mobile' | 'email') => {
    setEditType(type);
    setEditValue(type === 'mobile' ? (memberInfo?.mobile || '') : (memberInfo?.email || ''));
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (saving) return;

    // 验证输入
    if (editType === 'mobile') {
      if (editValue && !/^1[3-9]\d{9}$/.test(editValue)) {
        Alert.alert('提示', '请输入正确的手机号');
        return;
      }
    } else {
      if (editValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editValue)) {
        Alert.alert('提示', '请输入正确的邮箱地址');
        return;
      }
    }

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('提示', '请先登录');
        router.replace('/');
        return;
      }

      const mobile = editType === 'mobile' ? editValue : (memberInfo?.mobile || '');
      const email = editType === 'email' ? editValue : (memberInfo?.email || '');

      const response = await fetch(`${API_BASE_URL}/api/study-room/update-member`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile, email }),
      });

      const data = await response.json();
      console.log('更新结果:', JSON.stringify(data));

      if (response.ok && data.code === 0) {
        Alert.alert('成功', '信息更新成功');
        setShowEditModal(false);
        fetchMemberInfo();
      } else {
        const msg = data.message || data.detail || '更新失败';
        Alert.alert('失败', msg);
      }
    } catch (error) {
      console.error('更新失败:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={() => router.replace('/space-reservation')}>
            <HomeIcon />
            <Text style={styles.navText}>首页</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => router.replace('/favorite-seats')}>
            <ReservationIcon />
            <Text style={styles.navText}>当前预约</Text>
          </Pressable>
          <Pressable style={styles.navItem} onPress={() => router.replace('/study-room-profile')}>
            <UserIcon active />
            <Text style={[styles.navText, styles.navTextActive]}>我的中心</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          {/* 手机号 */}
          <Pressable style={styles.infoRow} onPress={() => handleEdit('mobile')}>
            <Text style={styles.infoLabel}>手机号</Text>
            <View style={styles.infoValueRow}>
              <Text style={[styles.infoValue, !memberInfo?.mobile && styles.infoPlaceholder]}>
                {memberInfo?.mobile || '请输入手机号'}
              </Text>
              <EditIcon />
            </View>
          </Pressable>
          <View style={styles.infoDivider} />

          {/* 邮箱 */}
          <Pressable style={styles.infoRow} onPress={() => handleEdit('email')}>
            <Text style={styles.infoLabel}>邮箱</Text>
            <View style={styles.infoValueRow}>
              <Text style={[styles.infoValue, !memberInfo?.email && styles.infoPlaceholder]}>
                {memberInfo?.email || '请输入邮箱'}
              </Text>
              <EditIcon />
            </View>
          </Pressable>
          <View style={styles.infoDivider} />

          {/* 学工号 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>学工号</Text>
            <Text style={styles.infoValue}>{memberInfo?.id || ''}</Text>
          </View>
          <View style={styles.infoDivider} />

          {/* 部门 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>部门</Text>
            <Text style={styles.infoValue}>{memberInfo?.deptName || ''}</Text>
          </View>
          <View style={styles.infoDivider} />

          {/* 当前状态 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>当前状态</Text>
            <Text style={styles.infoValue}>{getStatusText(memberInfo?.status)}</Text>
          </View>
          <View style={styles.infoDivider} />

          {/* 卡有效期 */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>卡有效期</Text>
            <Text style={styles.infoValue}>{memberInfo?.date || ''}</Text>
          </View>
        </View>
      </ScrollView>

      {/* 编辑弹窗 */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editType === 'mobile' ? '修改手机号' : '修改邮箱'}
              </Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <CloseIcon />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <TextInput
                style={styles.modalInput}
                placeholder={editType === 'mobile' ? '请输入手机号' : '请输入邮箱'}
                placeholderTextColor="#9ca3af"
                value={editValue}
                onChangeText={setEditValue}
                keyboardType={editType === 'mobile' ? 'phone-pad' : 'email-address'}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.modalFooter}>
              <Pressable 
                style={styles.modalCancelButton} 
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalCancelText}>取消</Text>
              </Pressable>
              <Pressable 
                style={[styles.modalConfirmButton, saving && styles.modalButtonDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmText}>确定</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
        <Pressable style={styles.navItem} onPress={() => router.replace('/study-room-profile')}>
          <UserIcon active />
          <Text style={[styles.navText, styles.navTextActive]}>我的中心</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  infoCard: {
    backgroundColor: '#fff',
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoLabel: {
    fontSize: 15,
    color: '#1f2937',
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoValue: {
    fontSize: 15,
    color: '#1f2937',
  },
  infoPlaceholder: {
    color: '#2563eb',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 16,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxWidth: 340,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalBody: {
    padding: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1f2937',
  },
  modalFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#f3f4f6',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 12,
  },
  modalConfirmText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
});
