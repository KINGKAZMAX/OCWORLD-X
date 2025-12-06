import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const todaysCourses = [
  { time: '08:00 - 09:35', name: '高等数学', location: '教学楼 A-302' },
  { time: '10:00 - 11:35', name: '大学物理', location: '理科楼 C-201' },
  { time: '14:00 - 15:35', name: '数据结构', location: '信息楼 5F-06' },
];

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>今日课表</Text>
        {todaysCourses.map((course) => (
          <View key={course.time} style={styles.card}>
            <Text style={styles.time}>{course.time}</Text>
            <Text style={styles.name}>{course.name}</Text>
            <Text style={styles.location}>{course.location}</Text>
          </View>
        ))}
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
    gap: 12,
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
    gap: 6,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  time: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  location: {
    fontSize: 14,
    color: '#475569',
  },
});
