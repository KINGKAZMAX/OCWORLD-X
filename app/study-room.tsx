import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect, Ellipse } from 'react-native-svg';
import { API_BASE_URL } from '../config/api';

const STUDY_ROOM_API = `${API_BASE_URL}/api/study-room`;
const SCREEN_WIDTH = Dimensions.get('window').width;

// 类型定义
type StudyRoomCard = {
  id: string;
  name: string;
  floor?: string;
  total?: number;
  free?: number;
  facilities?: string;
  raw: any;
};

type AvailableSeat = {
  id: string;
  label: string;
  statusName?: string;
  area?: string;
  segment?: string;
};

// 工具函数
const formatDateLocal = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isPlainObject = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const pickFirstString = (obj: Record<string, any>, keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = obj[k];
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return undefined;
};

const pickFirstNumber = (obj: Record<string, any>, keys: string[]): number | undefined => {
  for (const k of keys) {
    const v = obj[k];
    if (v === null || v === undefined) continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};

const normalizeSpace = (raw: any, index: number): StudyRoomCard => {
  if (!isPlainObject(raw)) {
    return { id: String(index + 1), name: `自习室${index + 1}`, raw };
  }
  return {
    id: pickFirstString(raw, ['id', 'space_id', 'spaceId']) ?? String(index + 1),
    name: pickFirstString(raw, ['name', 'space_name', 'spaceName', 'title']) ?? `自习室${index + 1}`,
    floor: pickFirstString(raw, ['floor', 'floor_name', 'floorName', 'storey_name']) ?? '',
    total: pickFirstNumber(raw, ['total_num', 'total', 'capacity']),
    free: pickFirstNumber(raw, ['free_num', 'free', 'available']),
    facilities: Array.isArray(raw.boutiques) 
      ? raw.boutiques.map((b: any) => b.name || '').filter(Boolean).join('·') 
      : '',
    raw,
  };
};

// 底部导航图标
function HomeIcon({ active }: { active?: boolean }) {
  const color = active ? '#2563eb' : '#9ca3af';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke={color} strokeWidth={1.5} />
      <Path d="M9 22V12h6v10" stroke={color} strokeWidth={1.5} />
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
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={color} strokeWidth={1.5} />
      <Circle cx={12} cy={7} r={4} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

// 本地座位底图映射
const LOCAL_SEAT_MAPS: Record<string, any> = {
  '11': require('../assets/seat-maps/11.jpg'),
  '12': require('../assets/seat-maps/12.jpg'),
  '13': require('../assets/seat-maps/13.jpg'),
};

// 座位底图组件 - 使用本地图片
function SeatMapImage({ areaId }: { areaId: string }) {
  const ASPECT_RATIO = 1920 / 1080;
  const mapWidth = SCREEN_WIDTH - 24;
  const mapHeight = mapWidth / ASPECT_RATIO;

  // 优先使用本地图片，否则用远程
  const localImage = LOCAL_SEAT_MAPS[areaId];
  const remoteUrl = `http://rgyy.wfust.edu.cn/home/images/web/area/${areaId}/seat-free.jpg`;
  
  console.log('>>> SeatMapImage 渲染, areaId:', areaId, '使用本地:', !!localImage);

  return (
    <View style={{ width: mapWidth, height: mapHeight, backgroundColor: '#f0f0f0', margin: 12 }}>
      <Image
        source={localImage || { uri: remoteUrl }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
}

// 主组件
export default function StudyRoomScreen() {
  const todayStr = formatDateLocal(new Date());
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDateLocal(d);
  }, []);

  // 基础状态
  const [date, setDate] = useState(todayStr);
  const [rooms, setRooms] = useState<StudyRoomCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 筛选弹窗
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // 预约弹窗
  const [reserveVisible, setReserveVisible] = useState(false);
  const [reserveRoomList, setReserveRoomList] = useState<StudyRoomCard[]>([]);
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [currentAreaId, setCurrentAreaId] = useState('11');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  
  // 座位数据
  const [allSeats, setAllSeats] = useState<AvailableSeat[]>([]);
  const [availableSeats, setAvailableSeats] = useState<AvailableSeat[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState('');
  const [selectedSeatLabel, setSelectedSeatLabel] = useState('');
  const [reserveSegment, setReserveSegment] = useState('');
  const [reserveLoading, setReserveLoading] = useState(false);
  const [reserveStartTime, setReserveStartTime] = useState('');
  const [reserveEndTime, setReserveEndTime] = useState('22:30');

  // 获取自习室列表
  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError('请先登录');
        return;
      }

      const resp = await fetch(`${STUDY_ROOM_API}/spaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date,
          premises_ids: ['1'],
          storey_ids: [],
          category_ids: [],
          boutique_ids: [],
        }),
      });

      const data: any = await resp.json();
      if (!resp.ok) {
        if (resp.status === 404 && data.detail?.includes('未绑定')) {
          router.replace('/study-room-bindlogin');
          return;
        }
        setError(data.detail || '请求失败');
        return;
      }

      const spacesRaw = data.data?.area || [];
      setRooms(spacesRaw.map((r: any, i: number) => normalizeSpace(r, i)));
    } catch (e) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }, [date]);

  // 获取座位详情
  const fetchSeatDetails = useCallback(async (roomId: string) => {
    console.log('>>> fetchSeatDetails:', roomId);
    setSeatsLoading(true);
    setAllSeats([]);
    setAvailableSeats([]);
    
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const body = { id: roomId, day: date, start_time: currentTime, end_time: '22:30' };
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      const [mapResp, seatResp] = await Promise.all([
        fetch(`${STUDY_ROOM_API}/map`, { method: 'POST', headers, body: JSON.stringify(body) }),
        fetch(`${STUDY_ROOM_API}/seatList`, { method: 'POST', headers, body: JSON.stringify(body) }),
      ]);

      // 解析时段
      let defaultSegment = '';
      try {
        const mapData: any = await mapResp.json();
        const dateList = mapData.data?.date?.list || [];
        for (const item of dateList) {
          if (item.day === date && item.times?.length > 0) {
            defaultSegment = String(item.times[0].id || '');
            break;
          }
        }
      } catch {}

      // 解析座位
      try {
        const seatData: any = await seatResp.json();
        const seatList = seatData.data?.list || [];
        const resolvedArea = String(seatData.data?.area || seatList[0]?.area || roomId);
        
        console.log('>>> 更新 areaId:', resolvedArea);
        setCurrentAreaId(resolvedArea);

        const all: AvailableSeat[] = [];
        const free: AvailableSeat[] = [];
        
        for (const seat of seatList) {
          if (!isPlainObject(seat)) continue;
          const s: AvailableSeat = {
            id: String(seat.id || ''),
            label: String(seat.no || seat.name || seat.id || ''),
            statusName: String(seat.status_name || ''),
            area: resolvedArea,
            segment: defaultSegment,
          };
          if (s.id) {
            all.push(s);
            if (s.statusName === '空闲') free.push(s);
          }
        }
        
        setAllSeats(all);
        setAvailableSeats(free);
      } catch {}
    } catch (e) {
      console.error('fetchSeatDetails error:', e);
    } finally {
      setSeatsLoading(false);
    }
  }, [date]);

  // 打开预约弹窗
  const openReserve = useCallback((room: StudyRoomCard) => {
    const sameFloorRooms = rooms.filter(r => r.floor === room.floor);
    const index = sameFloorRooms.findIndex(r => r.id === room.id);
    
    setReserveRoomList(sameFloorRooms);
    setCurrentRoomIndex(index >= 0 ? index : 0);
    setCurrentAreaId(room.id);
    setSelectedSeatId('');
    setSelectedSeatLabel('');
    setReserveSegment('');
    
    const now = new Date();
    setReserveStartTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    setReserveEndTime('22:30');
    setReserveVisible(true);
    
    // 立即获取座位数据
    fetchSeatDetails(room.id);
  }, [rooms, fetchSeatDetails]);

  // 切换自习室 - 核心函数
  const switchRoom = useCallback((newIndex: number) => {
    if (newIndex < 0 || newIndex >= reserveRoomList.length) return;
    
    const newRoom = reserveRoomList[newIndex];
    console.log('>>> 切换到:', newRoom.name, 'id:', newRoom.id);
    
    setCurrentRoomIndex(newIndex);
    setCurrentAreaId(newRoom.id); // 立即更新 areaId
    setSelectedSeatId('');
    setSelectedSeatLabel('');
    setReserveSegment('');
    
    // 获取新房间的座位数据
    fetchSeatDetails(newRoom.id);
  }, [reserveRoomList, fetchSeatDetails]);

  // 选择座位
  const selectSeat = useCallback((seat: AvailableSeat) => {
    setSelectedSeatId(seat.id);
    setSelectedSeatLabel(seat.label);
    setReserveSegment(seat.segment || '');
  }, []);

  // 提交预约
  const doReserve = useCallback(async () => {
    if (!selectedSeatId || !reserveSegment) {
      Alert.alert('提示', '请选择座位');
      return;
    }

    setReserveLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        Alert.alert('提示', '请先登录');
        return;
      }

      const resp = await fetch(`${STUDY_ROOM_API}/seat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedSeatId,
          segment: reserveSegment,
          day: date,
        }),
      });

      const data: any = await resp.json();
      if (!resp.ok || data.code !== 0) {
        Alert.alert('预约失败', data.message || data.detail || '请重试');
        return;
      }

      Alert.alert('预约成功', '座位预约成功！');
      setReserveVisible(false);
      fetchSpaces();
    } catch {
      Alert.alert('预约失败', '网络错误');
    } finally {
      setReserveLoading(false);
    }
  }, [selectedSeatId, reserveSegment, date, fetchSpaces]);

  // 初始化
  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const currentRoom = reserveRoomList[currentRoomIndex];

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Pressable style={styles.dateBtn} onPress={() => setFilterVisible(true)}>
          <Text style={styles.dateText}>{date}{date === todayStr ? ' 今天' : ''}</Text>
          <Svg width={12} height={12} viewBox="0 0 24 24"><Path d="M6 9l6 6 6-6" stroke="#666" strokeWidth={2} /></Svg>
        </Pressable>
        <Pressable style={styles.filterBtn} onPress={() => setFilterVisible(true)}>
          <Text style={styles.filterText}>筛选</Text>
        </Pressable>
      </View>

      {/* 列表 */}
      <ScrollView contentContainerStyle={styles.content}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>加载中...</Text>
          </View>
        ) : null}

        {!loading && rooms.length === 0 && !error ? (
          <View style={styles.emptyBox}>
            <Svg width={120} height={120} viewBox="0 0 184 152">
              <Ellipse fill="#f5f5f5" cx={92} cy={140} rx={60} ry={12} />
              <Path d="M60 40h64a4 4 0 014 4v80a4 4 0 01-4 4H60a4 4 0 01-4-4V44a4 4 0 014-4z" fill="#e5e7eb" />
            </Svg>
            <Text style={styles.emptyText}>暂无数据</Text>
          </View>
        ) : null}

        {rooms.map((room) => (
          <View key={room.id} style={styles.roomCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&q=80' }} 
              style={styles.roomImage} 
            />
            <View style={styles.roomInfo}>
              <View style={styles.roomHeader}>
                <Text style={styles.roomName}>{room.name}</Text>
                <Text style={styles.roomFloor}>{room.floor}</Text>
              </View>
              <Text style={styles.roomStats}>
                总数 <Text style={styles.statNum}>{room.total ?? '-'}</Text>
                {'    '}空闲 <Text style={styles.statBlue}>{room.free ?? '-'}</Text>
              </Text>
              <View style={styles.roomBottom}>
                <Text style={styles.roomFacilities}>{room.facilities}</Text>
                <Pressable style={styles.bookBtn} onPress={() => openReserve(room)}>
                  <Text style={styles.bookBtnText}>预约</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

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
          <UserIcon />
          <Text style={styles.navText}>我的中心</Text>
        </Pressable>
      </View>

      {/* 筛选弹窗 */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.modalMask}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterVisible(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>选择日期</Text>
            <View style={styles.dateOptions}>
              <Pressable 
                style={[styles.dateOption, selectedDate === todayStr && styles.dateOptionActive]}
                onPress={() => setSelectedDate(todayStr)}
              >
                <Text style={selectedDate === todayStr ? styles.dateOptionTextActive : styles.dateOptionText}>
                  今天 {todayStr}
                </Text>
              </Pressable>
              <Pressable 
                style={[styles.dateOption, selectedDate === tomorrowStr && styles.dateOptionActive]}
                onPress={() => setSelectedDate(tomorrowStr)}
              >
                <Text style={selectedDate === tomorrowStr ? styles.dateOptionTextActive : styles.dateOptionText}>
                  明天 {tomorrowStr}
                </Text>
              </Pressable>
            </View>
            <View style={styles.modalBtnRow}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setFilterVisible(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </Pressable>
              <Pressable 
                style={styles.modalConfirmBtn} 
                onPress={() => { setDate(selectedDate); setFilterVisible(false); }}
              >
                <Text style={styles.modalConfirmText}>确认</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 预约弹窗 */}
      <Modal visible={reserveVisible} animationType="slide">
        <View style={styles.reservePage}>
          {/* Tab 切换 */}
          <View style={styles.tabBar}>
            <Pressable style={[styles.tabItem, viewMode === 'map' && styles.tabItemActive]} onPress={() => setViewMode('map')}>
              <Text style={[styles.tabText, viewMode === 'map' && styles.tabTextActive]}>地图模式</Text>
            </Pressable>
            <Pressable style={[styles.tabItem, viewMode === 'list' && styles.tabItemActive]} onPress={() => setViewMode('list')}>
              <Text style={[styles.tabText, viewMode === 'list' && styles.tabTextActive]}>列表模式</Text>
            </Pressable>
          </View>

          {/* 房间信息卡片 */}
          {currentRoom && (
            <View style={styles.roomInfoCard}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400&q=80' }} 
                style={styles.roomThumb} 
              />
              <View style={styles.roomInfoContent}>
                <View style={styles.roomInfoHeader}>
                  <Text style={styles.roomInfoName}>{currentRoom.name}</Text>
                  <Text style={styles.roomInfoFloor}>{currentRoom.floor}</Text>
                </View>
                <Text style={styles.roomInfoStats}>
                  总数 <Text style={styles.statBold}>{allSeats.length || currentRoom.total || '-'}</Text>
                  {'    '}空闲 <Text style={styles.statBlue}>{availableSeats.length || currentRoom.free || '-'}</Text>
                </Text>
              </View>
            </View>
          )}

          {/* 分页指示器和箭头 */}
          <View style={styles.paginationRow}>
            <Pressable 
              style={[styles.arrowBtn, currentRoomIndex === 0 && styles.arrowBtnDisabled]}
              onPress={() => switchRoom(currentRoomIndex - 1)}
              disabled={currentRoomIndex === 0}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M15 18l-6-6 6-6" stroke={currentRoomIndex === 0 ? '#ccc' : '#333'} strokeWidth={2} />
              </Svg>
            </Pressable>

            <View style={styles.dots}>
              {reserveRoomList.map((_, i) => (
                <View key={i} style={[styles.dot, i === currentRoomIndex && styles.dotActive]} />
              ))}
            </View>

            <Pressable 
              style={[styles.arrowBtn, styles.arrowBtnRight, currentRoomIndex >= reserveRoomList.length - 1 && styles.arrowBtnDisabled]}
              onPress={() => switchRoom(currentRoomIndex + 1)}
              disabled={currentRoomIndex >= reserveRoomList.length - 1}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24">
                <Path d="M9 18l6-6-6-6" stroke={currentRoomIndex >= reserveRoomList.length - 1 ? '#999' : '#fff'} strokeWidth={2} />
              </Svg>
            </Pressable>
          </View>

          {/* 地图/列表区域 */}
          {viewMode === 'map' ? (
            <View style={{ flex: 1 }}>
              {seatsLoading ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loadingText}>加载座位中...</Text>
                </View>
              ) : (
                <ScrollView>
                  <ScrollView horizontal>
                    <SeatMapImage key={currentAreaId} areaId={currentAreaId} />
                  </ScrollView>
                </ScrollView>
              )}
            </View>
          ) : (
            <ScrollView style={styles.seatList} contentContainerStyle={styles.seatGrid}>
              {seatsLoading ? (
                <ActivityIndicator style={{ marginTop: 40 }} />
              ) : (
                availableSeats.map((seat) => (
                  <Pressable
                    key={seat.id}
                    style={[styles.seatItem, selectedSeatId === seat.id && styles.seatItemSelected]}
                    onPress={() => selectSeat(seat)}
                  >
                    <Text style={[styles.seatLabel, selectedSeatId === seat.id && styles.seatLabelSelected]}>
                      {seat.label}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>
          )}

          {/* 底部信息 */}
          <View style={styles.bottomInfo}>
            <Text style={styles.timeText}>
              <Text style={styles.todayLabel}>今天</Text>  {date} {reserveStartTime}~{reserveEndTime}
            </Text>
            <Text style={styles.selectedText}>已选座位：{selectedSeatLabel || '-'}</Text>
          </View>

          {/* 底部按钮 */}
          <View style={styles.bottomBtnRow}>
            <Pressable style={styles.backBtn} onPress={() => setReserveVisible(false)}>
              <Text style={styles.backBtnText}>← 返回</Text>
            </Pressable>
            <Pressable 
              style={[styles.reserveBtn, (!selectedSeatId || reserveLoading) && styles.reserveBtnDisabled]}
              onPress={doReserve}
              disabled={!selectedSeatId || reserveLoading}
            >
              <Text style={styles.reserveBtnText}>{reserveLoading ? '预约中...' : '立即预约'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  dateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  dateText: { fontSize: 15, color: '#333', marginRight: 6 },
  filterBtn: { backgroundColor: '#f5f5f5', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  filterText: { fontSize: 15, color: '#2563eb' },
  content: { padding: 12, paddingBottom: 100 },
  errorText: { color: '#dc2626', marginBottom: 12 },
  loadingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  loadingText: { color: '#666', marginLeft: 10 },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#999', marginTop: 16 },
  roomCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12 },
  roomImage: { width: 100, height: 100, borderRadius: 8 },
  roomInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  roomHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  roomName: { fontSize: 16, fontWeight: '600', color: '#333' },
  roomFloor: { fontSize: 14, color: '#666' },
  roomStats: { fontSize: 14, color: '#666', marginTop: 6 },
  statNum: { fontWeight: '600', color: '#333' },
  statBlue: { fontWeight: '600', color: '#2563eb' },
  roomBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  roomFacilities: { fontSize: 12, color: '#999', flex: 1 },
  bookBtn: { borderWidth: 1, borderColor: '#2563eb', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 6 },
  bookBtnText: { color: '#2563eb', fontSize: 14 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 20 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  navText: { fontSize: 11, color: '#666', marginTop: 4 },
  modalMask: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 16 },
  dateOptions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  dateOption: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  dateOptionActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  dateOptionText: { color: '#666' },
  dateOptionTextActive: { color: '#2563eb', fontWeight: '600' },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, padding: 14, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  modalCancelText: { color: '#666' },
  modalConfirmBtn: { flex: 1, padding: 14, borderRadius: 8, backgroundColor: '#2563eb', alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '600' },
  reservePage: { flex: 1, backgroundColor: '#f5f5f5' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tabItem: { paddingVertical: 12, paddingHorizontal: 16, marginRight: 20 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: '#2563eb' },
  tabText: { fontSize: 16, color: '#999' },
  tabTextActive: { color: '#333', fontWeight: '600' },
  roomInfoCard: { flexDirection: 'row', backgroundColor: '#fff', margin: 12, padding: 12, borderRadius: 12 },
  roomThumb: { width: 80, height: 80, borderRadius: 8 },
  roomInfoContent: { flex: 1, marginLeft: 12 },
  roomInfoHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  roomInfoName: { fontSize: 16, fontWeight: '600', color: '#333' },
  roomInfoFloor: { fontSize: 14, color: '#666' },
  roomInfoStats: { fontSize: 14, color: '#666', marginTop: 8 },
  statBold: { fontWeight: '600', color: '#333' },
  paginationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  arrowBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  arrowBtnRight: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  arrowBtnDisabled: { opacity: 0.4 },
  dots: { flexDirection: 'row', marginHorizontal: 16, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ddd' },
  dotActive: { backgroundColor: '#2563eb' },
  mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  seatList: { flex: 1, backgroundColor: '#fff', margin: 12, borderRadius: 12 },
  seatGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  seatItem: { width: '24%', margin: '0.5%', padding: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, alignItems: 'center' },
  seatItemSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  seatLabel: { fontSize: 14, color: '#333' },
  seatLabelSelected: { color: '#2563eb', fontWeight: '600' },
  bottomInfo: { backgroundColor: '#fff', padding: 16 },
  timeText: { fontSize: 14, color: '#666' },
  todayLabel: { color: '#2563eb', fontWeight: '600' },
  selectedText: { fontSize: 14, color: '#666', marginTop: 8 },
  bottomBtnRow: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', gap: 12 },
  backBtn: { flex: 1, padding: 14, borderRadius: 24, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  backBtnText: { color: '#666' },
  reserveBtn: { flex: 2, padding: 14, borderRadius: 24, backgroundColor: '#2563eb', alignItems: 'center' },
  reserveBtnDisabled: { opacity: 0.5 },
  reserveBtnText: { color: '#fff', fontWeight: '600' },
});
