import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { API_BASE_URL } from '../config/api';

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#666" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function StudyRoomForgetScreen() {
  const [card, setCard] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [repassword, setRepassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!card.trim()) {
      Alert.alert('提示', '请输入学工号');
      return;
    }
    if (!username.trim()) {
      Alert.alert('提示', '请输入姓名');
      return;
    }
    if (!mobile.trim()) {
      Alert.alert('提示', '请输入手机号');
      return;
    }
    if (!password.trim()) {
      Alert.alert('提示', '请输入新密码');
      return;
    }
    if (!repassword.trim()) {
      Alert.alert('提示', '请确认新密码');
      return;
    }
    if (password !== repassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/study-room/forget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card: card.trim(),
          username: username.trim(),
          mobile: mobile.trim(),
          password: password.trim(),
          repassword: repassword.trim(),
        }),
      });

      const data = await response.json();
      console.log('忘记密码响应:', JSON.stringify(data));

      if (response.ok && data.code === 0) {
        Alert.alert('成功', '密码重置成功，请使用新密码登录', [
          { text: '确定', onPress: () => router.back() }
        ]);
      } else {
        const msg = data.message || data.detail || '重置密码失败';
        Alert.alert('失败', msg);
      }
    } catch (error) {
      console.error('重置密码错误:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        {/* 学工号 */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>学工号</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入学工号"
            placeholderTextColor="#9ca3af"
            value={card}
            onChangeText={setCard}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.divider} />

        {/* 姓名 */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>姓名</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入姓名"
            placeholderTextColor="#9ca3af"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.divider} />

        {/* 手机号 */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>手机号</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入手机号"
            placeholderTextColor="#9ca3af"
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.divider} />

        {/* 新密码 */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>新密码</Text>
          <TextInput
            style={styles.input}
            placeholder="请输入新密码"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <View style={styles.divider} />

        {/* 确认密码 */}
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>确认密码</Text>
          <TextInput
            style={styles.input}
            placeholder="请再次输入新密码"
            placeholderTextColor="#9ca3af"
            value={repassword}
            onChangeText={setRepassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* 底部按钮 */}
      <View style={styles.bottomBtnRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <BackIcon />
          <Text style={styles.backBtnText}>返回</Text>
        </Pressable>

        <Pressable
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>提交</Text>
          )}
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
  form: {
    backgroundColor: '#fff',
    marginTop: 48,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  inputLabel: {
    width: 70,
    fontSize: 15,
    color: '#1f2937',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1f2937',
    textAlign: 'right',
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 16,
  },
  bottomBtnRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 30,
    backgroundColor: '#fff',
    gap: 12,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ddd',
    gap: 6,
  },
  backBtnText: {
    fontSize: 16,
    color: '#666',
  },
  submitBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: '#2563eb',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
