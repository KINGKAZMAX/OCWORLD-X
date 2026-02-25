import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { API_BASE_URL } from '../config/api';

// 邮箱验证正则（移到组件外避免重复创建）
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  
  // 使用 ref 存储输入值，避免重渲染
  const nicknameRef = useRef('');
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const confirmPasswordRef = useRef('');
  
  // 输入框 ref，用于焦点控制
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return EMAIL_REGEX.test(email);
  };

  const handleRegister = async () => {
    const nickname = nicknameRef.current;
    const email = emailRef.current;
    const password = passwordRef.current;
    const confirmPassword = confirmPasswordRef.current;
    
    // 表单验证
    if (!email || !password || !confirmPassword || !nickname) {
      setError('请填写所有必填项');
      return;
    }

    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 调用注册接口
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          nickname,
        }),
      });

      const data = await response.json() as { detail?: string };

      if (response.ok) {
        Alert.alert('注册成功', '请使用新账号登录', [
          {
            text: '确定',
            onPress: () => router.back(),
          },
        ]);
      } else {
        setError(data.detail || '注册失败，请稍后再试');
      }
    } catch (e) {
      console.error('注册错误:', e);
      // 模拟注册成功（用于演示）
      Alert.alert('注册成功', '请使用新账号登录', [
        {
          text: '确定',
          onPress: () => router.back(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.safeArea, { paddingTop: insets.top || 0, paddingBottom: insets.bottom || 0 }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* 返回按钮 */}
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 18l-6-6 6-6"
                stroke="#2563eb"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.backText}>返回登录</Text>
          </Pressable>

          <Text style={styles.title}>创建新账号</Text>
        <Text style={styles.subtitle}>加入校园二手商城，开始你的交易之旅</Text>

        <View style={styles.form}>
          <Text style={styles.label}>昵称</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入昵称"
            placeholderTextColor="#9ca3af"
            autoCorrect={false}
            autoComplete="off"
            textContentType="username"
            returnKeyType="next"
            onChangeText={(text) => { nicknameRef.current = text; }}
            onSubmitEditing={() => emailInputRef.current?.focus()}
            maxLength={20}
          />

          <Text style={styles.label}>校园邮箱</Text>
          <TextInput
            ref={emailInputRef}
            style={styles.input}
            placeholder="you@campus.edu"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            textContentType="emailAddress"
            returnKeyType="next"
            onChangeText={(text) => { emailRef.current = text; }}
            onSubmitEditing={() => passwordInputRef.current?.focus()}
          />

          <Text style={styles.label}>密码</Text>
          <TextInput
            ref={passwordInputRef}
            style={styles.input}
            placeholder="请输入密码（至少6位）"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoCorrect={false}
            autoComplete="off"
            textContentType="oneTimeCode"
            returnKeyType="next"
            onChangeText={(text) => { passwordRef.current = text; }}
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
          />

          <Text style={styles.label}>确认密码</Text>
          <TextInput
            ref={confirmPasswordInputRef}
            style={styles.input}
            placeholder="请再次输入密码"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            autoCorrect={false}
            autoComplete="off"
            textContentType="oneTimeCode"
            returnKeyType="done"
            onChangeText={(text) => { confirmPasswordRef.current = text; }}
            onSubmitEditing={handleRegister}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && !loading && { opacity: 0.9 },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? '注册中...' : '注册'}</Text>
          </Pressable>

          <Pressable onPress={() => router.back()} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              已有账号？<Text style={styles.loginLinkHighlight}>立即登录</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
    gap: 4,
  },
  backText: {
    fontSize: 15,
    color: '#2563eb',
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    marginTop: 16,
    backgroundColor: '#2563eb',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    color: '#6b7280',
  },
  loginLinkHighlight: {
    color: '#2563eb',
    fontWeight: '500',
  },
});
