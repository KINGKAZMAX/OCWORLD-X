import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Href } from 'expo-router';
import { router, useFocusEffect } from 'expo-router';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { API_BASE_URL, SCHEDULE_API_URL } from '../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 热门项目数据
type HotItem = {
  id: string;
  title: string;
  route: string;
  Icon: () => ReactNode;
};

const hotItems: HotItem[] = [
  { id: '1', title: '课表查询', route: '/schedule', Icon: ScheduleIcon },
  { id: '2', title: '学费查询', route: '/tuition', Icon: TuitionIcon },
  { id: '3', title: '校园网', route: '/campus-network', Icon: WifiIcon },
  { id: '4', title: '宿舍信息查询', route: '/dormitory', Icon: DormIcon },
];

// 学校资讯数据
const newsData = [
  {
    id: '1',
    title: '【微专业招生】关于启动14个微专业选学报名工作的通知',
    source: '教务处',
    date: '2025-09-25 15:44',
  },
  {
    id: '2',
    title: '【教学通知】2025年秋季学期选课安排',
    source: '教务处',
    date: '2025-09-24 10:30',
  },
  {
    id: '3',
    title: '【校园活动】第十届创新创业大赛报名开始',
    source: '学生处',
    date: '2025-09-23 14:20',
  },
  {
    id: '4',
    title: '【讲座预告】人工智能与未来教育',
    source: '计算机学院',
    date: '2025-09-22 09:15',
  },
  {
    id: '5',
    title: '【通知】图书馆国庆假期开放时间调整',
    source: '图书馆',
    date: '2025-09-21 16:00',
  },
  {
    id: '6',
    title: '【招聘】2025年秋季校园招聘会安排',
    source: '就业指导中心',
    date: '2025-09-20 11:30',
  },
  {
    id: '7',
    title: '【体育】校运动会报名通知',
    source: '体育部',
    date: '2025-09-19 08:45',
  },
  {
    id: '8',
    title: '【学术】研究生学术论坛征稿启事',
    source: '研究生院',
    date: '2025-09-18 14:00',
  },
  {
    id: '9',
    title: '【后勤】宿舍热水系统升级通知',
    source: '后勤处',
    date: '2025-09-17 17:20',
  },
  {
    id: '10',
    title: '【心理】心理健康月系列活动预告',
    source: '心理咨询中心',
    date: '2025-09-16 10:00',
  },
];

// 课程类型
type TodayCourse = {
  name: string;
  location: string;
  teacher: string;
  jcxx: string;  // 节次，如 "5-6"
  skbj?: string; // 班级编号
  skzs?: string; // 周次
  timeDesc?: string; // 时间描述
};

// 学生类型
type Student = {
    xm: string;      // 姓名
    xb: string;      // 性别（男/女）
    bjmc: string;    // 班级名称
    yhxh: string;    // 学号
};

// 星期标签
const WEEK_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// 计算当前是第几周
const calculateCurrentWeek = (semesterYear: number): number => {
  const semesterStart = new Date(semesterYear, 8, 1);
  const dayOfWeek = semesterStart.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const firstMonday = new Date(semesterStart);
  firstMonday.setDate(semesterStart.getDate() + mondayOffset);
  
  const today = new Date();
  const diffTime = today.getTime() - firstMonday.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentWeek = Math.floor(diffDays / 7) + 1;
  
  return Math.max(1, Math.min(30, currentWeek));
};

// 提取上课地点（只显示方括号里的内容）
const formatLocation = (location: string | undefined): string => {
  if (!location) return '';
  const match = location.match(/\[([^\]]+)\]/);
  return match ? match[1] : location;
};

export default function HomeScreen() {
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const newsListRef = useRef<FlatList>(null);
  
  // 今日课表状态
  const [todayCourses, setTodayCourses] = useState<TodayCourse[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  
  // 绑定账号信息（用于获取学生列表）
  const [bindAccount, setBindAccount] = useState<{ username: string; password: string } | null>(null);
  
  // 课程详情弹窗状态
  const [activeSlotDetail, setActiveSlotDetail] = useState<TodayCourse | null>(null);
  const [studentList, setStudentList] = useState<Student[]>([]);
  const [studentListLoading, setStudentListLoading] = useState(false);
  
  const currentYear = new Date().getFullYear();

  const handleNewsScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentNewsIndex(index);
  };

  // 获取今日课表
  const fetchTodaySchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      // 获取绑定账号
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setScheduleLoading(false);
        return;
      }

      const accountResponse = await fetch(`${API_BASE_URL}/api/bindaccount/jwxt/with-password`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!accountResponse.ok) {
        setScheduleLoading(false);
        return;
      }

      const account: any = await accountResponse.json();
      if (!account?.username || !account?.password) {
        setScheduleLoading(false);
        return;
      }
      
      // 保存绑定账号用于后续获取学生列表
      setBindAccount({ username: account.username, password: account.password });

      // 获取当前周次和星期
      const currentWeek = calculateCurrentWeek(currentYear);
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0=周日, 1=周一, ...
      const weekKey = dayOfWeek === 0 ? 'week7' : `week${dayOfWeek}`;

      // 获取课表数据
      const scheduleResponse = await fetch(`${SCHEDULE_API_URL}/api/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: account.username,
          password: account.password,
          year: String(currentYear),
          semester: '0',
          week: String(currentWeek),
        }),
      });

      if (!scheduleResponse.ok) {
        setScheduleLoading(false);
        return;
      }

      const scheduleData: any = await scheduleResponse.json();
      const todayData = scheduleData?.data?.schedule?.[weekKey];

      if (Array.isArray(todayData)) {
        const courses: TodayCourse[] = todayData
          .filter((item: any) => item?.kcmc)
          .map((item: any) => ({
            name: item.kcmc,
            location: item.skdd || '',
            teacher: item.rkjs || '',
            jcxx: item.jcxx || '',
            skbj: item.skbj,
            skzs: item.skzs || '',
            timeDesc: item.beginTime && item.endTime ? `${item.beginTime}-${item.endTime}` : undefined,
          }));
        
        setTodayCourses(courses);

        // 获取每门课的学生人数
        const counts: Record<string, number> = {};
        for (const course of courses) {
          if (course.skbj) {
            try {
              const studentResponse = await fetch(`${SCHEDULE_API_URL}/api/schedule/userinfo`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'application/json',
                },
                body: JSON.stringify({
                  username: account.username,
                  password: account.password,
                  year: String(currentYear),
                  skbj: course.skbj,
                }),
              });
              if (studentResponse.ok) {
                const studentData: any = await studentResponse.json();
                const resultSet = studentData?.data?.resultSet;
                if (Array.isArray(resultSet)) {
                  counts[course.skbj] = resultSet.length;
                }
              }
            } catch (e) {
              // 忽略学生人数获取失败
            }
          }
        }
        setStudentCounts(counts);
      }
    } catch (error) {
      console.error('获取今日课表失败:', error);
    } finally {
      setScheduleLoading(false);
    }
  }, [currentYear]);

  // 页面聚焦时刷新数据
  useFocusEffect(
    useCallback(() => {
      fetchTodaySchedule();
    }, [fetchTodaySchedule])
  );
  
  // 获取学生列表（弹窗打开时）
  useEffect(() => {
    if (!activeSlotDetail || !bindAccount) {
      setStudentList([]);
      return;
    }
    
    const skbj = activeSlotDetail.skbj;
    if (!skbj) {
      setStudentList([]);
      return;
    }
    
    let isCancelled = false;
    
    const fetchStudentList = async () => {
      setStudentListLoading(true);
      try {
        const response = await fetch(`${SCHEDULE_API_URL}/api/schedule/userinfo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            username: bindAccount.username,
            password: bindAccount.password,
            year: String(currentYear),
            skbj: skbj,
          }),
        });
        
        if (response.ok && !isCancelled) {
          const data: any = await response.json();
          const resultSet = data?.data?.resultSet;
          if (Array.isArray(resultSet)) {
            setStudentList(resultSet as Student[]);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.log('获取学生列表失败:', error);
        }
      } finally {
        if (!isCancelled) {
          setStudentListLoading(false);
        }
      }
    };
    
    fetchStudentList();
    
    return () => { isCancelled = true; };
  }, [activeSlotDetail, currentYear, bindAccount]);

  // 获取今天是星期几
  const todayWeekLabel = WEEK_LABELS[new Date().getDay()];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 顶部图片 */}
        <Image
          source={require('../assets/images/banner.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />

        {/* 热门项目 */}
        <View style={styles.hotItems}>
          {hotItems.map((item) => (
            <Pressable
              key={item.id}
              style={styles.hotItem}
              onPress={() => router.push(item.route as Href)}
            >
              <View style={styles.hotItemIconWrapper}>
                <item.Icon />
              </View>
              <Text style={styles.hotItemText}>{item.title}</Text>
            </Pressable>
          ))}
        </View>

        {/* 学校资讯 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <NewsIcon />
              <Text style={styles.sectionTitle}>学校资讯</Text>
            </View>
          </View>
          <View style={styles.newsContainer}>
            <FlatList
              ref={newsListRef}
              horizontal
              data={newsData}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              snapToInterval={SCREEN_WIDTH}
              decelerationRate="fast"
              onScroll={handleNewsScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.newsListContent}
              renderItem={({ item }) => (
                <View style={styles.newsCard}>
                  <Pressable style={styles.newsCardInner}>
                    <Text style={styles.newsTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.newsMeta}>
                      {item.source}   {item.date}
                    </Text>
                  </Pressable>
                </View>
              )}
            />
            {/* 分页指示器 */}
            <View style={styles.pagination}>
              {newsData.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentNewsIndex === index && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* 今日课表 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <CalendarIcon />
              <Text style={styles.sectionTitle}>今日课表</Text>
            </View>
          </View>
          
          {scheduleLoading ? (
            <View style={styles.scheduleLoading}>
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text style={styles.scheduleLoadingText}>加载中...</Text>
            </View>
          ) : todayCourses.length > 0 ? (
            <View style={styles.courseList}>
              {todayCourses.map((course, index) => (
                <View key={`${course.name}-${index}`} style={styles.courseCard}>
                  <View style={styles.courseHeader}>
                    <View style={styles.courseTimeRow}>
                      <ClockIcon />
                      <Text style={styles.courseTime}>{todayWeekLabel} {course.jcxx}节</Text>
                    </View>
                    {course.skbj && studentCounts[course.skbj] !== undefined && (
                      <Text style={styles.courseStudentCount}>{studentCounts[course.skbj]}人</Text>
                    )}
                  </View>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <View style={styles.courseLocationRow}>
                    <Text style={styles.courseLocation}>{formatLocation(course.location)}</Text>
                    <Pressable 
                      style={styles.interactButton}
                      onPress={() => setActiveSlotDetail(course)}
                    >
                      <Text style={styles.interactButtonText}>教学互动</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.scheduleEmpty}>
              <EmptyScheduleIcon />
              <Text style={styles.scheduleEmptyText}>暂无课表</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* 课程详情弹窗 */}
      {activeSlotDetail && (
        <Modal
          visible
          animationType="fade"
          transparent
          onRequestClose={() => setActiveSlotDetail(null)}
        >
          <View style={styles.detailModalContainer}>
            <Pressable style={styles.detailBackdrop} onPress={() => setActiveSlotDetail(null)} />
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailTitle}>课程详情</Text>
                <Text style={styles.detailSubtitle}>
                  {`周${todayWeekLabel} · 第 ${activeSlotDetail.jcxx?.split('-')[0] || ''} 节`}
                </Text>
              </View>
              <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailList}>
                <View style={styles.detailCourseCard}>
                  {[
                    { label: '课程', value: activeSlotDetail.name },
                    { label: '授课教师', value: activeSlotDetail.teacher },
                    { label: '上课地点', value: activeSlotDetail.location },
                    { label: '班级', value: activeSlotDetail.skbj },
                    { label: '节次', value: activeSlotDetail.jcxx ? `第${activeSlotDetail.jcxx}节` : undefined },
                    { label: '时间', value: activeSlotDetail.timeDesc },
                    { label: '周次', value: activeSlotDetail.skzs },
                  ].map(({ label, value }) => (
                    <View key={label} style={styles.detailRow}>
                      <Text style={styles.detailRowLabel}>{label}</Text>
                      <Text style={styles.detailRowValue}>{value ?? '—'}</Text>
                    </View>
                  ))}
                </View>
                
                {/* 学生人数和头像预览 */}
                <Pressable 
                  style={({ pressed }) => [
                    styles.studentCountContainer,
                    pressed && styles.studentCountPressed
                  ]}
                  onPress={() => {
                    if (activeSlotDetail?.skbj) {
                      const params = {
                        skbj: activeSlotDetail.skbj,
                        course: activeSlotDetail.name ?? '',
                        year: String(currentYear),
                      };
                      // 先关闭弹窗
                      setActiveSlotDetail(null);
                      // 延迟跳转，确保弹窗已关闭
                      setTimeout(() => {
                        router.push({
                          pathname: '/student-list',
                          params,
                        } as any);
                      }, 100);
                    }
                  }}
                >
                  <View style={styles.studentCountHeader}>
                    <Text style={styles.studentCountLabel}>人数：</Text>
                    <Text style={styles.studentCountValue}>
                      {studentListLoading ? '加载中...' : studentList.length}
                    </Text>
                  </View>
                  {studentList.length > 0 && (
                    <View style={styles.studentAvatarRow}>
                      {studentList.slice(0, 5).map((student, idx) => (
                        <View 
                          key={student.yhxh || idx} 
                          style={[
                            styles.avatarCircle,
                            { backgroundColor: student.xb === '男' ? '#22d3ee' : '#f87171' }
                          ]}
                        >
                          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                              fill="#fff"
                            />
                          </Svg>
                        </View>
                      ))}
                      {studentList.length > 5 && (
                        <View style={styles.avatarMore}>
                          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M9 6l6 6-6 6"
                              stroke="#9ca3af"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  bannerImage: {
    width: '100%',
    height: 200,
    marginBottom: 12,
  },
  hotItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  hotItem: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  hotItemIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotItemText: {
    fontSize: 12,
    color: '#1f2937',
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 12,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  newsContainer: {
    paddingHorizontal: 0,
  },
  newsListContent: {
    paddingHorizontal: 0,
  },
  newsCard: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 16,
  },
  newsCardInner: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 12,
  },
  newsMeta: {
    fontSize: 13,
    color: '#9ca3af',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  paginationDotActive: {
    backgroundColor: '#3b82f6',
  },
  scheduleLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  scheduleLoadingText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  scheduleEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  scheduleEmptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  courseList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  courseCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseTime: {
    fontSize: 13,
    color: '#6b7280',
  },
  courseStudentCount: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: '500',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  courseLocationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseLocation: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  interactButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  interactButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  // 课程详情弹窗样式
  detailModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  detailBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  detailCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
    gap: 12,
  },
  detailHeader: {
    gap: 4,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  detailSubtitle: {
    fontSize: 14,
    color: '#3b82f6',
  },
  detailScroll: {
    maxHeight: 320,
  },
  detailList: {
    gap: 12,
    paddingBottom: 12,
  },
  detailCourseCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailRowLabel: {
    fontSize: 13,
    color: '#475569',
  },
  detailRowValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    textAlign: 'right',
    flex: 1,
  },
  studentCountContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  studentCountPressed: {
    backgroundColor: '#f3f4f6',
  },
  studentCountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentCountLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  studentCountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  studentAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMore: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// 热门项目图标
function ScheduleIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Rect x={5} y={7} width={22} height={20} rx={4} stroke="#6366f1" strokeWidth={2} />
      <Path d="M9 5v6M23 5v6" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" />
      <Path d="M5 13h22" stroke="#6366f1" strokeWidth={2} />
      <Rect x={9} y={17} width={4} height={4} rx={1} fill="#6366f1" />
      <Rect x={9} y={23} width={4} height={2} rx={0.5} fill="#a5b4fc" />
      <Rect x={15} y={17} width={4} height={2} rx={0.5} fill="#a5b4fc" />
    </Svg>
  );
}

function TuitionIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Rect x={6} y={6} width={20} height={20} rx={4} stroke="#10b981" strokeWidth={2} />
      <Path
        d="M16 10v12M12 13h6a2 2 0 010 4h-4a2 2 0 100 4h6"
        stroke="#10b981"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WifiIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Path
        d="M6 14c6-5 14-5 20 0"
        stroke="#0ea5e9"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M10 18c4-3.5 8-3.5 12 0"
        stroke="#0ea5e9"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M13 22c2-1.5 4-1.5 6 0"
        stroke="#0ea5e9"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={16} cy={26} r={2} fill="#0ea5e9" />
    </Svg>
  );
}

function DormIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Path
        d="M6 15l10-8 10 8v10a2 2 0 01-2 2H8a2 2 0 01-2-2V15z"
        stroke="#0d9488"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Rect x={13} y={19} width={6} height={8} rx={1} stroke="#0d9488" strokeWidth={2} />
    </Svg>
  );
}

// Icons
function NewsIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={3} stroke="#3b82f6" strokeWidth={1.5} />
      <Path d="M7 8h10M7 12h6" stroke="#3b82f6" strokeWidth={1.5} strokeLinecap="round" />
      <Rect x={14} y={11} width={3} height={5} rx={0.5} fill="#3b82f6" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={16} rx={3} stroke="#3b82f6" strokeWidth={1.5} />
      <Path d="M7 3v4M17 3v4M3 10h18" stroke="#3b82f6" strokeWidth={1.5} strokeLinecap="round" />
      <Rect x={7} y={14} width={3} height={3} rx={0.5} fill="#3b82f6" />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke="#9ca3af" strokeWidth={1.5} />
      <Path d="M12 7v5l3 3" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function EmptyScheduleIcon() {
  return (
    <Svg width={80} height={80} viewBox="0 0 100 100" fill="none">
      {/* 日历主体 */}
      <Rect x={20} y={25} width={60} height={55} rx={8} fill="#e0e7ff" />
      <Rect x={20} y={25} width={60} height={15} rx={8} fill="#93c5fd" />
      {/* 日历挂钩 */}
      <Path d="M35 20v10M65 20v10" stroke="#60a5fa" strokeWidth={3} strokeLinecap="round" />
      {/* 日历格子 */}
      <Rect x={28} y={48} width={12} height={10} rx={2} fill="#c7d2fe" />
      <Rect x={44} y={48} width={12} height={10} rx={2} fill="#c7d2fe" />
      <Rect x={60} y={48} width={12} height={10} rx={2} fill="#c7d2fe" />
      <Rect x={28} y={62} width={12} height={10} rx={2} fill="#c7d2fe" />
      <Rect x={44} y={62} width={12} height={10} rx={2} fill="#c7d2fe" />
      <Rect x={60} y={62} width={12} height={10} rx={2} fill="#c7d2fe" />
      {/* "空" 字 */}
      <SvgText
        x={50}
        y={58}
        textAnchor="middle"
        fontSize={16}
        fill="#6366f1"
        fontWeight="bold"
      >
        空
      </SvgText>
      {/* 装饰星星 */}
      <Path d="M82 18l2 4 4 0.5-3 2.5 0.8 4-3.8-2-3.8 2 0.8-4-3-2.5 4-0.5z" fill="#fbbf24" />
      <Circle cx={18} cy={35} r={2} fill="#a5b4fc" />
    </Svg>
  );
}
