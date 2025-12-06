import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('请输入校园邮箱和密码');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      console.log('登录成功，准备跳转到 /home');
      // 使用 push 而不是 replace，避免路由栈问题
      router.push('/home');
    } catch (e) {
      console.error('登录错误:', e);
      setError('登录失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0, paddingBottom: insets.bottom || 0 }]}>
      <View style={styles.container}>
        <Text style={styles.title}>校园二手商城</Text>
        <Text style={styles.subtitle}>登录后发现更多同学转让的优质好物</Text>

        <View style={styles.form}>
          <Text style={styles.label}>校园邮箱</Text>
          <TextInput
            style={styles.input}
            placeholder="you@campus.edu"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>密码</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入密码"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && !loading && { opacity: 0.9 },
              loading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? '登录中...' : '登录'}</Text>
          </Pressable>

          <Pressable onPress={() => Alert.alert('提示', '请联系校园认证系统重置密码')}>
            <Text style={styles.helperText}>忘记密码？联系校园认证系统重置</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
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
  helperText: {
    marginTop: 12,
    fontSize: 13,
    color: '#2563eb',
    textAlign: 'center',
  },
});
