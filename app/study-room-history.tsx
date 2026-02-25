import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { API_BASE_URL } from '../config/api';

interface HistoryItem {
  id?: string;
  nameMerge?: string;
  no?: string;
  name?: string;
  beginTime?: string;
  endTime?: string;
  start?: string;
  end?: string;
  day?: string;
  status_name?: string;
  // 违约记录特有字段
  renegeTime?: string;
  time?: string;
}

function SeatIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={16} height={12} rx={2} stroke="#6b7280" strokeWidth={1.5} />
      <Path d="M8 16v4M16 16v4M6 20h12" stroke="#6b7280" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke="#9ca3af" strokeWidth={1.5} />
      <Path d="M12 7v5l3 3" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
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

function EmptyIcon() {
  return (
    <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={6} width={16} height={12} rx={2} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={1} />
      <Path d="M8 10h8M8 14h4" stroke="#9ca3af" strokeWidth={1} strokeLinecap="round" />
    </Svg>
  );
}



export default function StudyRoomHistoryScreen() {
  const [activeTab, setActiveTab] = useState<'reservation' | 'violation'>('reservation');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reservationData, setReservationData] = useState<HistoryItem[]>([]);
  const [violationData, setViolationData] = useState<HistoryItem[]>([]);
  const [reservationPage, setReservationPage] = useState(1);
  const [violationPage, setViolationPage] = useState(1);
  const [reservationHasMore, setReservationHasMore] = useState(true);
  const [violationHasMore, setViolationHasMore] = useState(true);

  const fetchReservationData = useCallback(async (page: number, isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/study-room/history`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: '1', page, limit: 10 }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`预约记录(page=${page}):`, JSON.stringify(data));
        
        if (data.code === 0 && data.data) {
          const list = Array.isArray(data.data) ? data.data : (data.data.data || []);
          const total = data.data.total ? parseInt(data.data.total) : list.length;
          const hasMore = page * 10 < total;
          
          if (isLoadMore) {
            setReservationData(prev => [...prev, ...list]);
          } else {
            setReservationData(list);
          }
          setReservationHasMore(hasMore);
        }
      }
    } catch (error) {
      console.error('获取预约记录失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const fetchViolationData = useCallback(async (page: number, isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/study-room/violation`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: '1', page, limit: 10 }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`违约记录(page=${page}):`, JSON.stringify(data));
        
        if (data.code === 0 && data.data) {
          const list = Array.isArray(data.data) ? data.data : (data.data.data || []);
          const total = data.data.total ? parseInt(data.data.total) : list.length;
          const hasMore = page * 10 < total;
          
          if (isLoadMore) {
            setViolationData(prev => [...prev, ...list]);
          } else {
            setViolationData(list);
          }
          setViolationHasMore(hasMore);
        }
      }
    } catch (error) {
      console.error('获取违约记录失败:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'reservation') {
        setReservationPage(1);
        fetchReservationData(1, false);
      } else {
        setViolationPage(1);
        fetchViolationData(1, false);
      }
    }, [activeTab, fetchReservationData, fetchViolationData])
  );

  const handleLoadMore = () => {
    if (loadingMore) return;
    
    if (activeTab === 'reservation' && reservationHasMore) {
      const nextPage = reservationPage + 1;
      setReservationPage(nextPage);
      fetchReservationData(nextPage, true);
    } else if (activeTab === 'violation' && violationHasMore) {
      const nextPage = violationPage + 1;
      setViolationPage(nextPage);
      fetchViolationData(nextPage, true);
    }
  };

  const getStatusColor = (status: string) => {
    if (status?.includes('取消')) return '#f97316';
    if (status?.includes('结束')) return '#2563eb';
    if (status?.includes('违约')) return '#ef4444';
    return '#6b7280';
  };

  const renderHistoryItem = ({ item, index }: { item: HistoryItem; index: number }) => {
    const location = item.nameMerge || '未知位置';
    const seatNo = item.no || item.name || '';
    const statusColor = getStatusColor(item.status_name || '');
    
    // 预约记录显示: 日期 时间段 (如: 2026-01-23 21:57 ~ 22:29)
    // 违约记录显示: 完整时间 (如: 2026-01-14 22:17:14)
    const timeStr = activeTab === 'violation' 
      ? (item.renegeTime || item.time || item.beginTime || '')
      : `${item.beginTime?.split(' ')[0] || ''} ${item.start || ''} ~ ${item.end || ''}`;
    
    return (
      <View style={styles.historyCard}>
        <View style={styles.historyContent}>
          <View style={styles.historyRow}>
            <SeatIcon />
            <Text style={styles.historyLocation}>{location}：{seatNo}</Text>
          </View>
          <View style={styles.historyRow}>
            <ClockIcon />
            <Text style={styles.historyTime}>{timeStr}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{item.status_name}</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <EmptyIcon />
      <Text style={styles.emptyText}>
        {activeTab === 'reservation' ? '暂无预约记录' : '暂无违约记录'}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.footerText}>加载中...</Text>
        </View>
      );
    }
    
    const hasMore = activeTab === 'reservation' ? reservationHasMore : violationHasMore;
    const data = activeTab === 'reservation' ? reservationData : violationData;
    
    if (!hasMore && data.length > 0) {
      return (
        <View style={styles.footerLoading}>
          <Text style={styles.footerText}>没有更多了</Text>
        </View>
      );
    }
    
    return null;
  };

  const currentData = activeTab === 'reservation' ? reservationData : violationData;

  const renderHeader = () => (
    <View style={styles.tabContainer}>
      <Pressable
        style={[styles.tabItem, activeTab === 'reservation' && styles.tabItemActive]}
        onPress={() => setActiveTab('reservation')}
      >
        <Text style={[styles.tabText, activeTab === 'reservation' && styles.tabTextActive]}>预约记录</Text>
      </Pressable>
      <Pressable
        style={[styles.tabItem, activeTab === 'violation' && styles.tabItemActive]}
        onPress={() => setActiveTab('violation')}
      >
        <Text style={[styles.tabText, activeTab === 'violation' && styles.tabTextActive]}>违约记录</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 内容区域 */}
      {loading ? (
        <View style={styles.loadingContainer}>
          {renderHeader()}
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderHistoryItem}
          keyExtractor={(item, index) => item.id || `${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
        />
      )}

      {/* 底部导航 */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => router.replace('/space-reservation')}>
          <HomeIcon />
          <Text style={styles.navText}>首页</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace('/favorite-seats')}>
          <ReservationIcon />
          <Text style={styles.navText}>当前预约</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => router.replace('/study-room-profile')}>
          <UserIcon active />
          <Text style={[styles.navText, styles.navTextActive]}>我的中心</Text>
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 16,
  },
  tabItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tabItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyContent: {
    flex: 1,
    gap: 10,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyLocation: {
    fontSize: 15,
    color: '#1f2937',
    flex: 1,
  },
  historyTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 15,
    color: '#9ca3af',
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingBottom: 28,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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
});
