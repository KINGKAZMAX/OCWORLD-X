import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { API_BASE_URL } from '../config/api';

interface SeatItem {
  id?: string;
  space_id?: string;
  space_name?: string;
  name_merge?: string;
  area_id?: string;
  segment?: string;
}

interface SubscribeItem {
  id?: string;
  space_id?: string;
  spaceName?: string;
  no?: string;
  nameMerge?: string;
  areaName?: string;
  beginTime?: string;
  endTime?: string;
  showTime?: string;
  lastSigninTime?: string;
  statusname?: string;
  cancel?: number;
}

function EmptyIcon() {
  return (
    <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={6} width={16} height={12} rx={2} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1} />
      <Path d="M8 10h8M8 14h4" stroke="#9ca3af" strokeWidth={1} strokeLinecap="round" />
      <Circle cx={18} cy={6} r={4} fill="#9ca3af" />
      <Path d="M16.5 5l3 2M19.5 5l-3 2" stroke="#fff" strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}

function HomeIcon({ active }: { active?: boolean }) {
  const color = active ? '#2563eb' : '#9ca3af';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReservationIcon({ active }: { active?: boolean }) {
  const color = active ? '#2563eb' : '#9ca3af';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke={color} strokeWidth={1.5} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function UserIcon({ active }: { active?: boolean }) {
  const color = active ? '#2563eb' : '#9ca3af';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export default function FavoriteSeatsScreen() {
  const [activeTab, setActiveTab] = useState<'collect' | 'often'>('often');
  const [loading, setLoading] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [collectData, setCollectData] = useState<SeatItem[]>([]);
  const [oftenData, setOftenData] = useState<SeatItem[]>([]);
  const [subscribeData, setSubscribeData] = useState<SubscribeItem[]>([]);
  const [oftenDate, setOftenDate] = useState('');
  const [oftenTime, setOftenTime] = useState('');

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchSubscribeData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/study-room/subscribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('当前预约数据:', JSON.stringify(data));
        if (data.code === 0 && data.data) {
          const list = Array.isArray(data.data) ? data.data : (data.data.list || []);
          setSubscribeData(list);
        } else {
          setSubscribeData([]);
        }
      } else {
        setSubscribeData([]);
      }
    } catch (error) {
      console.error('获取当前预约失败:', error);
      setSubscribeData([]);
    }
  }, []);

  const fetchCollectData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/study-room/collecttime`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: '1' }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('收藏数据:', JSON.stringify(data));
        if (data.code === 0 && data.data) {
          // 数据可能在 data.data.list 或 data.data 直接就是数组
          const list = Array.isArray(data.data) ? data.data : (data.data.list || []);
          setCollectData(list);
        } else {
          setCollectData([]);
        }
      } else {
        setCollectData([]);
      }
    } catch (error) {
      console.error('获取收藏数据失败:', error);
      setCollectData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOftenData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/');
        return;
      }

      const day = getTodayDate();
      const response = await fetch(`${API_BASE_URL}/api/study-room/often`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: '1',
          day: day,
          begin_time: '06:00',
          end_time: '22:30',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('常用数据:', JSON.stringify(data));
        if (data.code === 0 && data.data) {
          // 数据可能在 data.data.list 或 data.data 直接就是数组
          const list = Array.isArray(data.data) ? data.data : (data.data.list || []);
          console.log('常用座位列表:', JSON.stringify(list));
          if (list.length > 0) {
            console.log('第一个座位数据结构:', JSON.stringify(list[0]));
          }
          setOftenData(list);
          setOftenDate(day);
          setOftenTime('06:00~22:30');
        } else {
          setOftenData([]);
        }
      } else {
        setOftenData([]);
      }
    } catch (error) {
      console.error('获取常用数据失败:', error);
      setOftenData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      // 获取当前预约
      fetchSubscribeData();
      // 获取收藏或常用
      if (activeTab === 'collect') {
        fetchCollectData();
      } else {
        fetchOftenData();
      }
    }, [activeTab, fetchCollectData, fetchOftenData, fetchSubscribeData])
  );

  const handleTabChange = (tab: 'collect' | 'often') => {
    setActiveTab(tab);
  };

  const handleCancel = useCallback(async (item: SubscribeItem) => {
    if (reserveLoading) return;
    
    Alert.alert(
      '取消预约',
      `确定要取消座位 ${item.spaceName || item.no} 的预约吗？`,
      [
        { text: '再想想', style: 'cancel' },
        {
          text: '确定取消',
          style: 'destructive',
          onPress: async () => {
            setReserveLoading(true);
            try {
              const token = await AsyncStorage.getItem('access_token');
              if (!token) {
                Alert.alert('提示', '请先登录');
                router.replace('/');
                return;
              }

              const response = await fetch(`${API_BASE_URL}/api/study-room/cancel`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id: item.id,
                }),
              });

              const data = await response.json();
              console.log('取消预约返回:', JSON.stringify(data));

              if (response.ok && data.code === 0) {
                Alert.alert('取消成功', '座位预约已取消');
                // 刷新当前预约数据
                fetchSubscribeData();
              } else {
                const msg = data.message || data.msg || data.detail || '取消预约失败';
                Alert.alert('取消失败', msg);
              }
            } catch (error) {
              console.error('取消预约错误:', error);
              Alert.alert('取消失败', '网络错误，请稍后重试');
            } finally {
              setReserveLoading(false);
            }
          },
        },
      ]
    );
  }, [reserveLoading, fetchSubscribeData]);

  const handleReserve = useCallback(async (item: SeatItem) => {
    if (reserveLoading) return;
    
    Alert.alert(
      '确认预约',
      `确定要预约座位 ${item.space_name} 吗？\n地点：${item.name_merge}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            setReserveLoading(true);
            try {
              const token = await AsyncStorage.getItem('access_token');
              if (!token) {
                Alert.alert('提示', '请先登录');
                router.replace('/');
                return;
              }

              const day = getTodayDate();
              const response = await fetch(`${API_BASE_URL}/api/study-room/seat`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id: item.space_id || item.id,
                  segment: item.segment || '',
                  day: day,
                  start_time: '',
                  end_time: '',
                }),
              });

              const data = await response.json();
              console.log('预约返回:', JSON.stringify(data));

              if (response.ok && data.code === 0) {
                Alert.alert('预约成功', '座位预约成功！');
                // 刷新数据
                if (activeTab === 'often') {
                  fetchOftenData();
                } else {
                  fetchCollectData();
                }
              } else {
                const msg = data.message || data.msg || data.detail || '预约失败';
                Alert.alert('预约失败', msg);
              }
            } catch (error) {
              console.error('预约错误:', error);
              Alert.alert('预约失败', '网络错误，请稍后重试');
            } finally {
              setReserveLoading(false);
            }
          },
        },
      ]
    );
  }, [reserveLoading, activeTab, fetchOftenData, fetchCollectData]);

  const renderEmptyState = (message: string) => (
    <View style={styles.emptyContainer}>
      <EmptyIcon />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  const renderSeatItem = (item: SeatItem, index: number) => {
    // name_merge 是地点，space_name 是座位号
    const location = item.name_merge || '未知位置';
    const seatNumber = item.space_name || '';
    
    return (
      <View key={item.space_id || item.id || index} style={styles.seatCard}>
        <View style={styles.seatInfo}>
          <Text style={styles.seatLocation}>地点：{location}</Text>
          <Text style={styles.seatNumber}>座位：{seatNumber}</Text>
        </View>
        <Pressable style={styles.reserveButton} onPress={() => handleReserve(item)}>
          <Text style={styles.reserveButtonText}>预约</Text>
        </Pressable>
      </View>
    );
  };

  const renderSubscribeItem = (item: SubscribeItem, index: number) => {
    const location = item.nameMerge || item.areaName || '未知位置';
    const seatNo = item.spaceName || item.no || '';
    const showTime = item.showTime || `${item.beginTime || ''} 至 ${item.endTime || ''}`;
    const signTime = item.lastSigninTime || '';
    
    return (
      <View key={item.id || index} style={styles.subscribeCard}>
        <View style={styles.subscribeHeader}>
          <View style={styles.subscribeHeaderLeft}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#2563eb" strokeWidth={1.5} />
              <Path d="M16 2v4M8 2v4M3 10h18" stroke="#2563eb" strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
            <Text style={styles.subscribeTitle}>已约座位</Text>
          </View>
          <View style={styles.subscribeTypeBadge}>
            <Text style={styles.subscribeTypeText}>{item.statusname || '普通座位'}</Text>
          </View>
        </View>
        <View style={styles.subscribeBody}>
          <Text style={styles.subscribeLocation}>地点：{location}</Text>
          <View style={styles.subscribeSeatRow}>
            <Text style={styles.subscribeSeat}>座位：{seatNo}</Text>
            <Text style={styles.subscribeViewSeat}>查看位置</Text>
          </View>
          <Text style={styles.subscribeTime}>时间：{showTime}</Text>
          <View style={styles.subscribeSignRow}>
            <Text style={styles.subscribeSign}>请 {signTime} 之前签到</Text>
            {item.cancel === 0 && (
              <Pressable style={styles.cancelButton} onPress={() => handleCancel(item)}>
                <Text style={styles.cancelButtonText}>取消</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 当前预约 */}
        {subscribeData.length > 0 && (
          <View style={styles.subscribeSection}>
            {subscribeData.map((item, index) => renderSubscribeItem(item, index))}
          </View>
        )}

        {/* 座位区域 */}
        <View style={styles.seatSection}>
            {/* 标题 */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>座位</Text>
              <View style={styles.headerUnderline} />
            </View>

            {/* Tab切换 */}
            <View style={styles.tabContainer}>
              <Pressable
                style={[styles.tabItem, activeTab === 'collect' && styles.tabItemActive]}
                onPress={() => handleTabChange('collect')}
              >
                <Text style={[styles.tabText, activeTab === 'collect' && styles.tabTextActive]}>收藏</Text>
              </Pressable>
              <Pressable
                style={[styles.tabItem, activeTab === 'often' && styles.tabItemActive]}
                onPress={() => handleTabChange('often')}
              >
                <Text style={[styles.tabText, activeTab === 'often' && styles.tabTextActive]}>常用</Text>
              </Pressable>
            </View>

            {/* 内容区域 */}
            <View style={styles.content}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loadingText}>加载中...</Text>
                </View>
              ) : activeTab === 'collect' ? (
                collectData.length > 0 ? (
                  collectData.map((item, index) => renderSeatItem(item, index))
                ) : (
                  renderEmptyState('无收藏的座位')
                )
              ) : (
                <>
                  {oftenData.length > 0 && (
                    <View style={styles.dateTimeCard}>
                      <View style={styles.dateTimeRow}>
                        <Text style={styles.dateTimeLabel}>日期：</Text>
                        <View style={styles.dateTimeBadge} />
                        <Text style={styles.dateTimeValue}>{oftenDate}</Text>
                      </View>
                      <View style={styles.dateTimeRow}>
                        <Text style={styles.dateTimeLabel}>时间：</Text>
                        <View style={styles.dateTimeBadge} />
                        <Text style={styles.dateTimeValue}>{oftenTime}</Text>
                      </View>
                    </View>
                  )}
                  {oftenData.length > 0 ? (
                    oftenData.map((item, index) => renderSeatItem(item, index))
                  ) : (
                    renderEmptyState('无常用的座位')
                  )}
                </>
              )}
            </View>
        </View>
      </ScrollView>

      {/* 底部导航 */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => router.replace('/space-reservation')}>
          <HomeIcon />
          <Text style={styles.navText}>首页</Text>
        </Pressable>
        <Pressable style={styles.navItem}>
          <ReservationIcon active />
          <Text style={[styles.navText, styles.navTextActive]}>当前预约</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace('/study-room-profile')}>
          <UserIcon />
          <Text style={styles.navText}>我的中心</Text>
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
  scrollView: {
    flex: 1,
  },
  seatSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerUnderline: {
    width: 32,
    height: 3,
    backgroundColor: '#2563eb',
    marginTop: 8,
    borderRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 25,
    padding: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 22,
  },
  tabItemActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#9ca3af',
  },
  dateTimeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTimeLabel: {
    fontSize: 15,
    color: '#374151',
  },
  dateTimeBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
    marginRight: 8,
  },
  dateTimeValue: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  seatCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seatInfo: {
    flex: 1,
  },
  seatLocation: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 16,
  },
  seatNumber: {
    fontSize: 16,
    color: '#1f2937',
  },
  reserveButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingBottom: 28,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 11,
    color: '#9ca3af',
  },
  navTextActive: {
    color: '#2563eb',
  },
  subscribeSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  subscribeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  subscribeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  subscribeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subscribeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  subscribeTypeBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  subscribeTypeText: {
    fontSize: 12,
    color: '#2563eb',
  },
  subscribeBody: {
    padding: 16,
  },
  subscribeLocation: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 10,
  },
  subscribeSeatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  subscribeSeat: {
    fontSize: 15,
    color: '#374151',
  },
  subscribeViewSeat: {
    fontSize: 14,
    color: '#2563eb',
    marginLeft: 12,
  },
  subscribeTime: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 10,
  },
  subscribeSignRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscribeSign: {
    fontSize: 14,
    color: '#f59e0b',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#f59e0b',
  },
});
