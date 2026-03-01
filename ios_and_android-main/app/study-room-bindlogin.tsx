import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path, Rect, Circle, Ellipse } from 'react-native-svg';
import { API_BASE_URL } from '../config/api';

export default function StudyRoomBindLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingBind, setCheckingBind] = useState(true);

  // 页面加载时检查是否已有绑定账号
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      
      const checkBindAccount = async () => {
        setCheckingBind(true);
        try {
          const token = await AsyncStorage.getItem('access_token');
          if (!token) {
            Alert.alert('提示', '请先登录应用', [
              { text: '确定', onPress: () => router.replace('/') }
            ]);
            return;
          }

          // 检查是否已绑定自习室账号
          const response = await fetch(`${API_BASE_URL}/api/bindaccount/study_room/with-password`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok && isMounted) {
            const data: any = await response.json();
            if (data && data.username) {
              // 已有绑定账号，预填账号（但不跳转，让用户可以重新绑定）
              setUsername(data.username);
              // 密码不显示，用户需要重新输入或直接提交
            }
          }
        } catch (error) {
          console.log('检查绑定账号失败:', error);
        } finally {
          if (isMounted) {
            setCheckingBind(false);
          }
        }
      };
      checkBindAccount();
      
      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleSubmit = async () => {
    if (!username.trim()) {
      Alert.alert('提示', '请输入学号');
      return;
    }
    if (!password.trim()) {
      Alert.alert('提示', '请输入密码');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('提示', '请先登录应用');
        router.replace('/');
        return;
      }

      // 先验证自习室账号密码是否正确
      const verifyResponse = await fetch(`${API_BASE_URL}/api/study-room/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const verifyData: any = await verifyResponse.json();

      if (!verifyResponse.ok || verifyData?.code !== 0) {
        const errorMsg = verifyData?.detail || verifyData?.message || '账号或密码错误';
        Alert.alert('验证失败', typeof errorMsg === 'string' ? errorMsg : '账号或密码错误');
        setLoading(false);
        return;
      }

      // 验证成功后绑定账号
      console.log('绑定账号，token:', token ? `${token.substring(0, 20)}...` : 'null');
      const bindResponse = await fetch(`${API_BASE_URL}/api/bindaccount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          account_type: 'study_room',
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const bindData: any = await bindResponse.json();
      console.log('绑定响应:', bindResponse.status, JSON.stringify(bindData));

      if (bindResponse.ok) {
        Alert.alert('绑定成功', '账号已成功绑定，下次进入将自动使用该账号登录', [
          { text: '确定', onPress: () => router.replace('/space-reservation') },
        ]);
      } else {
        // 如果是401错误，可能是token过期，提示重新登录
        if (bindResponse.status === 401) {
          Alert.alert('登录已过期', '请重新登录应用', [
            { text: '确定', onPress: () => router.replace('/') }
          ]);
          return;
        }
        const errorMsg = bindData?.detail || '绑定失败';
        Alert.alert('绑定失败', typeof errorMsg === 'string' ? errorMsg : '绑定失败');
      }
    } catch (error) {
      console.error('绑定错误:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 检查绑定状态时显示加载
  if (checkingBind) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 16, color: '#666' }}>正在检查账号绑定状态...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 返回按钮 */}
      <Pressable style={styles.backButton} onPress={() => router.replace('/listing')}>
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M15 18L9 12L15 6" stroke="#333" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>

      {/* 顶部插图 */}
      <View style={styles.headerImageContainer}>
        <HeaderIllustration />
      </View>

      {/* 标题 */}
      <Text style={styles.title}>潍坊科技学院图书馆座位管理系统</Text>

      {/* 表单 */}
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="学号"
            placeholderTextColor="#999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="密码"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeIcon /> : <EyeOffIcon />}
          </Pressable>
        </View>

      </View>

      {/* 提交按钮 */}
      <Pressable
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>提 交</Text>
        )}
      </Pressable>

      {/* 忘记密码 */}
      <Pressable style={styles.forgotPassword} onPress={() => router.push('/study-room-forget')}>
        <Text style={styles.forgotPasswordText}>忘记密码?</Text>
      </Pressable>

      {/* 使用须知 */}
      <View style={styles.noticeCard}>
        <Text style={styles.noticeTitle}>使用须知</Text>
        <Text style={styles.noticeText}>输入学号密码点击登录即可登录系统</Text>
        <Text style={styles.noticeText}>
          默认密码为 <Text style={styles.noticeHighlight}>Lib+姓氏首字母大写+学号后六位</Text>
        </Text>
        <Text style={styles.noticeText}>已为您填入默认学号密码</Text>
        <View style={styles.noticeRow}>
          <Text style={styles.noticeLabel}>您的学号:</Text>
          <Text style={styles.noticeValue}>{username || '未填写'}</Text>
        </View>
        <View style={styles.noticeRow}>
          <Text style={styles.noticeLabel}>您的密码:</Text>
          <Text style={styles.noticeValue}>{password || '未填写'}</Text>
        </View>
      </View>
    </View>
  );
}

function EyeIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="#999"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 15a3 3 0 100-6 3 3 0 000 6z"
        stroke="#999"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function EyeOffIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"
        stroke="#999"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M1 1l22 22" stroke="#999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HeaderIllustration() {
  return (
    <Svg width={280} height={180} viewBox="0 0 280 180">
      {/* 背景云 */}
      <Ellipse cx={50} cy={40} rx={40} ry={20} fill="#e8f4fc" />
      <Ellipse cx={230} cy={50} rx={35} ry={18} fill="#e8f4fc" />
      <Ellipse cx={140} cy={30} rx={50} ry={22} fill="#f0f7fc" />
      
      {/* 地面 */}
      <Ellipse cx={140} cy={160} rx={120} ry={20} fill="#e8f4fc" />
      
      {/* 门框 */}
      <Rect x={80} y={60} width={80} height={100} rx={4} fill="#d4e5f7" stroke="#b8d4ed" strokeWidth={2} />
      <Rect x={85} y={65} width={70} height={90} rx={2} fill="#fff" />
      
      {/* 开着的门 */}
      <Path
        d="M155 65 L195 80 L195 155 L155 155 Z"
        fill="#5a9bd5"
        stroke="#4a8bc5"
        strokeWidth={1}
      />
      <Circle cx={165} cy={115} r={3} fill="#fff" />
      
      {/* 人物 */}
      {/* 头 */}
      <Circle cx={175} cy={95} r={12} fill="#ffd5c8" />
      {/* 头发 */}
      <Path
        d="M163 90 Q165 75 175 78 Q185 75 187 90"
        fill="#2c3e50"
      />
      {/* 身体 */}
      <Path
        d="M167 107 L167 140 Q175 145 183 140 L183 107 Q175 112 167 107"
        fill="#5a9bd5"
      />
      {/* 腿 */}
      <Rect x={169} y={140} width={4} height={15} fill="#ffd5c8" />
      <Rect x={177} y={140} width={4} height={15} fill="#ffd5c8" />
      
      {/* 装饰树 */}
      <Path d="M40 160 L40 140" stroke="#8bc34a" strokeWidth={3} />
      <Circle cx={40} cy={130} r={15} fill="#a5d6a7" />
      
      <Path d="M240 160 L240 145" stroke="#8bc34a" strokeWidth={3} />
      <Circle cx={240} cy={135} r={12} fill="#a5d6a7" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  headerImageContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  headerImage: {
    width: 280,
    height: 180,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  eyeButton: {
    padding: 8,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 28,
    paddingVertical: 16,
    marginTop: 40,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 8,
  },
  forgotPassword: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  forgotPasswordText: {
    color: '#2563eb',
    fontSize: 14,
  },
  noticeCard: {
    marginTop: 24,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  noticeText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 4,
  },
  noticeHighlight: {
    color: '#2563eb',
    fontWeight: '500',
  },
  noticeRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  noticeLabel: {
    fontSize: 14,
    color: '#64748b',
    width: 72,
  },
  noticeValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
});
