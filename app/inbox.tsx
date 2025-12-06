import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const messages = [
  { title: '教务通知', preview: '本周五前完成选课确认，点击查看详情。', time: '09:15' },
  { title: '商城客服', preview: '你的订单买家已确认收货，记得查看收益。', time: '昨天' },
  { title: '校园跑提醒', preview: '今日打卡未完成，抓紧约上同学一起运动。', time: '昨天' },
];

export default function InboxScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {messages.map((message) => (
          <View key={message.title} style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>{message.title}</Text>
              <Text style={styles.cardPreview}>{message.preview}</Text>
            </View>
            <Text style={styles.cardTime}>{message.time}</Text>
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
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  cardPreview: {
    marginTop: 4,
    fontSize: 13,
    color: '#475569',
  },
  cardTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
