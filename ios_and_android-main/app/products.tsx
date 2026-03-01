import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const featuredItems = [
  { id: '1', title: '高数教材（九成新）', price: '￥25' },
  { id: '2', title: 'iPad Pro 2018（二手）', price: '￥3200' },
  { id: '3', title: '机械键盘 Keychron K2', price: '￥380' },
];

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0 }]}>
      <View style={styles.container}>
        <Text style={styles.title}>今日精选</Text>
        {featuredItems.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardPrice}>{item.price}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 0,
  },
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
    paddingBottom: 200,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
});
