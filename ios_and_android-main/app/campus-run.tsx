import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const stats = {
  totalDistance: '36.2 km',
  weeklyGoal: '20 km',
  ranking: '全院第 12 名',
};

const history = [
  { date: '05-20', distance: '3.8 km', duration: '22:10' },
  { date: '05-18', distance: '5.2 km', duration: '31:42' },
  { date: '05-16', distance: '4.6 km', duration: '27:08' },
];

export default function CampusRunScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>校园跑</Text>
        <View style={styles.statsCard}>
          <Text style={styles.statLabel}>累计里程</Text>
          <Text style={styles.statValue}>{stats.totalDistance}</Text>
          <Text style={styles.statSub}>{`周目标 ${stats.weeklyGoal} ｜ ${stats.ranking}`}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>最近三次打卡</Text>
          {history.map((item) => (
            <View key={item.date} style={styles.row}>
              <Text style={styles.rowLabel}>{item.date}</Text>
              <Text style={styles.rowValue}>{`${item.distance} · ${item.duration}`}</Text>
            </View>
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
    padding: 20,
    gap: 16,
    paddingBottom: 200,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  statsCard: {
    backgroundColor: '#10b981',
    borderRadius: 18,
    padding: 20,
    gap: 6,
  },
  statLabel: {
    color: '#d1fae5',
    fontSize: 13,
  },
  statValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  statSub: {
    color: '#ecfdf5',
    fontSize: 14,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: '#475569',
  },
  rowValue: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
});
