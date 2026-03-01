import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const networkStats = [
  { label: '账号', value: '20230001' },
  { label: '当前状态', value: '在线' },
  { label: '剩余流量', value: '43.2 GB' },
  { label: '下行带宽', value: '200 Mbps' },
];

export default function CampusNetworkScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>校园网</Text>
        <View style={styles.card}>
          {networkStats.map((item) => (
            <View key={item.label} style={styles.row}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>一键续费</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#94a3b8',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  button: {
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
