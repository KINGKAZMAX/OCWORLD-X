import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const materials = [
  { name: '线性代数（第 5 版）', chapter: '第 3 章 向量空间', status: '已上传' },
  { name: '概率论与数理统计', chapter: '第 6 章 大数定律', status: '已上传' },
  { name: '大学英语（综合教程）', chapter: 'Unit 4', status: '讲义整理中' },
];

export default function TextbookAnswersScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>教材答案</Text>
        <Text style={styles.subtitle}>同步更新课堂练习与习题解析</Text>
        {materials.map((material) => (
          <View key={material.name} style={styles.card}>
            <Text style={styles.materialName}>{material.name}</Text>
            <Text style={styles.chapter}>{material.chapter}</Text>
            <Text style={styles.status}>{material.status}</Text>
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
  subtitle: {
    fontSize: 15,
    color: '#475569',
  },
  card: {
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
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  chapter: {
    fontSize: 14,
    color: '#475569',
  },
  status: {
    fontSize: 13,
    color: '#22c55e',
  },
});
