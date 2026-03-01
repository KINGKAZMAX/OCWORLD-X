import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TuitionScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 标题区域 */}
        <View style={styles.headerCard}>
          <View style={styles.headerContent}>
            <Image
              source={require('../assets/images/wfust-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>潍坊科技学院</Text>
              <Text style={styles.headerSubtitle}>宿舍查询系统</Text>
            </View>
          </View>
        </View>

        {/* 个人信息卡片 */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>个人信息</Text>
          <View style={styles.infoList}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>姓名</Text>
              <Text style={styles.infoValue}>王老二</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>学号</Text>
              <Text style={styles.infoValue}>202406010212</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>身份证</Text>
              <Text style={styles.infoValue}>370502*******4810</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>专业</Text>
              <Text style={styles.infoValue}>护理学（本）</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>宿舍信息</Text>
              <Text style={styles.infoValue}>宿舍H座</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>住宿费</Text>
              <Text style={styles.infoValueHighlight}>¥1600</Text>
            </View>
          </View>
        </View>

        {/* 二维码卡片 */}
        <View style={styles.qrCard}>
          <Text style={styles.cardTitle}>扫码加入</Text>
          <View style={styles.qrSection}>
            <View style={styles.qrItem}>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QQ群</Text>
              </View>
              <Text style={styles.qrLabel}>新生QQ群</Text>
            </View>
            <View style={styles.qrItem}>
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>表白墙</Text>
              </View>
              <Text style={styles.qrLabel}>潍科表白墙</Text>
            </View>
          </View>
        </View>

        {/* 底部提示 */}
        <View style={styles.footerCard}>
          <Text style={styles.footerNote}>系统开放时间：8:00 - 22:00</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1565c0',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64b5f6',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  infoList: {
    gap: 0,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  infoValueHighlight: {
    fontSize: 15,
    color: '#1e88e5',
    fontWeight: '600',
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  qrSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  qrItem: {
    alignItems: 'center',
    gap: 6,
  },
  qrPlaceholder: {
    width: (SCREEN_WIDTH - 120) / 2.5,
    height: (SCREEN_WIDTH - 120) / 2.5,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  qrPlaceholderText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  qrLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  footerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
