import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CetScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>四六级报名及查询</Text>
        <Text style={styles.description}>
          当前报名批次：2024 年上半年（报名截止：5 月 30 日）
        </Text>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>立即报名</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>历次成绩</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>2023.12 CET-4</Text>
            <Text style={styles.resultValue}>562</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>2023.06 CET-6</Text>
            <Text style={styles.resultValue}>待查</Text>
          </View>
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
    padding: 20,
    gap: 16,
    paddingBottom: 200,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 10,
  },
  resultLabel: {
    color: '#475569',
    fontSize: 14,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
});
