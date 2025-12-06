import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CampusCardScreen() {
  const [amount, setAmount] = useState('50');
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>校园卡充值</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>当前余额</Text>
          <Text style={styles.balanceValue}>￥128.50</Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>充值金额</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>立即充值</Text>
        </Pressable>
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
    padding: 20,
    gap: 16,
    paddingBottom: 200,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  balanceCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    padding: 20,
    gap: 6,
  },
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  balanceValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  inputLabel: {
    fontSize: 14,
    color: '#475569',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
