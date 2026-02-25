import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { API_BASE_URL } from '../config/api';

type BindAccount = {
  id: number;
  account_type: string;
  username: string;
  created_at: string;
};

export default function AccountSecurityScreen() {
  const [jwxtAccount, setJwxtAccount] = useState<BindAccount | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 绑定表单
  const [showBindForm, setShowBindForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 获取绑定账号
  const fetchBindAccount = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/bindaccount/jwxt`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json() as BindAccount | null;
        setJwxtAccount(data);
        if (data) {
          setUsername(data.username);
        }
      }
    } catch (e) {
      console.error('获取绑定账号失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBindAccount();
  }, [fetchBindAccount]);

  // 绑定/更新账号
  const handleBind = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('提示', '请输入学号和密码');
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('提示', '请先登录');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/bindaccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_type: 'jwxt',
          username: username.trim(),
          password: password.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json() as BindAccount;
        setJwxtAccount(data);
        setShowBindForm(false);
        setPassword('');
        Alert.alert('成功', jwxtAccount ? '教务账号已更新' : '教务账号绑定成功');
      } else {
        const error = await response.json() as { detail?: string };
        Alert.alert('失败', error.detail || '绑定失败');
      }
    } catch (e) {
      console.error('绑定失败:', e);
      Alert.alert('错误', '网络错误，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  }, [username, password, jwxtAccount]);

  // 解绑账号
  const handleUnbind = useCallback(() => {
    Alert.alert('确认解绑', '解绑后将无法查询课表，确定要解绑吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('access_token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/api/bindaccount/jwxt`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });

            if (response.ok) {
              setJwxtAccount(null);
              setUsername('');
              setPassword('');
              Alert.alert('成功', '已解绑教务账号');
            }
          } catch (e) {
            console.error('解绑失败:', e);
          }
        },
      },
    ]);
  }, []);

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* 教务系统账号 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>教务系统账号</Text>
          <Text style={styles.sectionDesc}>绑定教务系统账号后可查询课表、成绩等信息</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : showBindForm ? (
            <View style={styles.formContainer}>
              <Text style={styles.label}>学号</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入学号"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
              />

              <Text style={styles.label}>密码</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入教务系统密码"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
              />

              <View style={styles.formButtons}>
                <Pressable
                  style={[styles.btn, styles.btnCancel]}
                  onPress={() => {
                    setShowBindForm(false);
                    setPassword('');
                    if (jwxtAccount) {
                      setUsername(jwxtAccount.username);
                    }
                  }}
                >
                  <Text style={styles.btnCancelText}>取消</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}
                  onPress={handleBind}
                  disabled={submitting}
                >
                  <Text style={styles.btnPrimaryText}>
                    {submitting ? '保存中...' : '保存'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : jwxtAccount ? (
            <View style={styles.boundContainer}>
              <View style={styles.boundInfo}>
                <MaterialCommunityIcons name="account-check" size={24} color="#10b981" />
                <View style={styles.boundTextContainer}>
                  <Text style={styles.boundLabel}>已绑定</Text>
                  <Text style={styles.boundValue}>{jwxtAccount.username}</Text>
                </View>
              </View>
              <View style={styles.boundActions}>
                <Pressable
                  style={[styles.btn, styles.btnOutline]}
                  onPress={() => setShowBindForm(true)}
                >
                  <Text style={styles.btnOutlineText}>修改</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnDanger]}
                  onPress={handleUnbind}
                >
                  <Text style={styles.btnDangerText}>解绑</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.bindButton}
              onPress={() => setShowBindForm(true)}
            >
              <MaterialCommunityIcons name="link-plus" size={24} color="#2563eb" />
              <Text style={styles.bindButtonText}>绑定教务系统账号</Text>
            </Pressable>
          )}
        </View>

        {/* 安全提示 */}
        <View style={styles.tipContainer}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#6b7280" />
          <Text style={styles.tipText}>
            您的密码将加密存储，仅用于查询课表等教务信息
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    gap: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  formContainer: {
    gap: 12,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: '#2563eb',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnCancel: {
    backgroundColor: '#f3f4f6',
  },
  btnCancelText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  boundContainer: {
    gap: 16,
  },
  boundInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  boundTextContainer: {
    flex: 1,
  },
  boundLabel: {
    fontSize: 12,
    color: '#10b981',
  },
  boundValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  boundActions: {
    flexDirection: 'row',
    gap: 12,
  },
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2563eb',
    backgroundColor: '#fff',
  },
  btnOutlineText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDanger: {
    flex: 1,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  btnDangerText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '600',
  },
  bindButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderStyle: 'dashed',
  },
  bindButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
});
