import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// API 服务器地址
const API_BASE_URL = 'http://101.43.234.149:8003';

// 计算当前是第几周（基于学期开始日期）
const calculateCurrentWeek = (semesterYear: number): number => {
    // 学期开始日期：秋季学期一般在9月第一个周一
    const semesterStart = new Date(semesterYear, 8, 1); // 9月1日
    
    // 找到9月1日所在周的周一
    const dayOfWeek = semesterStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const firstMonday = new Date(semesterStart);
    firstMonday.setDate(semesterStart.getDate() + mondayOffset);
    
    // 计算当前日期与开学周一的差距
    const today = new Date();
    const diffTime = today.getTime() - firstMonday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(diffDays / 7) + 1;
    
    // 确保周次在合理范围内 (1-30)
    return Math.max(1, Math.min(30, currentWeek));
};

type CourseSlot = {
    course?: string;
    name?: string;
    location?: string;
    classes?: string;
    slotLabel?: string;
    teacher?: string;
    timeDesc?: string;
    weeks?: string;
};

// 课程颜色配置
const COURSE_COLORS = [
    { bg: '#bfdbfe', text: '#1e40af' },
    { bg: '#fde68a', text: '#92400e' },
    { bg: '#bbf7d0', text: '#166534' },
    { bg: '#fbcfe8', text: '#9d174d' },
    { bg: '#c7d2fe', text: '#3730a3' },
    { bg: '#fed7aa', text: '#9a3412' },
    { bg: '#99f6e4', text: '#115e59' },
    { bg: '#ddd6fe', text: '#5b21b6' },
    { bg: '#fca5a5', text: '#b91c1c' },
    { bg: '#bef264', text: '#3f6212' },
];

const getCourseColor = (courseName: string | undefined): { bg: string; text: string } => {
    if (!courseName) return COURSE_COLORS[0];
    let hash = 0;
    for (let i = 0; i < courseName.length; i++) {
        hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COURSE_COLORS.length;
    return COURSE_COLORS[index];
};

const parseSections = (jcxx?: string, jcdm?: string): number[] => {
    const sections: number[] = [];
    if (jcxx) {
        const match = jcxx.match(/(\d+)-(\d+)/);
        if (match) {
            const start = parseInt(match[1], 10);
            const end = parseInt(match[2], 10);
            for (let i = start; i <= end; i++) {
                sections.push(i);
            }
            return sections;
        }
    }
    if (jcdm) {
        jcdm.split(',').forEach(s => {
            const num = parseInt(s.trim(), 10);
            if (!isNaN(num)) {
                sections.push(num);
            }
        });
    }
    return sections;
};

const normalizeScheduleSlots = (raw: any): Map<string, CourseSlot[]> => {
    const slotMap = new Map<string, CourseSlot[]>();
    if (!raw) return slotMap;

    const schedule = raw?.data?.schedule ?? raw?.schedule ?? raw?.data;
    if (!schedule) return slotMap;

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const weekKey = `week${dayIndex + 1}`;
        const dayCourses = schedule[weekKey];
        
        if (Array.isArray(dayCourses)) {
            dayCourses.forEach((item: any) => {
                if (!item || typeof item !== 'object') return;
                
                const sections = parseSections(item.jcxx, item.jcdm);
                if (sections.length === 0) return;
                
                const courseInfo: CourseSlot = {
                    course: item.kcmc ?? '课程',
                    name: item.kcmc ?? '课程',
                    location: item.skdd,
                    classes: item.skbj ?? item.skbjmc,
                    slotLabel: item.jcxx ? `第${item.jcxx}节` : undefined,
                    teacher: item.rkjs,
                    timeDesc: item.beginTime && item.endTime ? `${item.beginTime}-${item.endTime}` : undefined,
                    weeks: item.skzs,
                };
                
                sections.forEach(section => {
                    const key = `${section}-${dayIndex}`;
                    const existing = slotMap.get(key) ?? [];
                    existing.push(courseInfo);
                    slotMap.set(key, existing);
                });
            });
        }
    }
    
    return slotMap;
};

const removeTeacherNumber = (teacher: string | undefined): string | undefined => {
    if (!teacher) return teacher;
    return teacher.replace(/\d+$/, '').trim();
};

// 提取上课地点（只显示方括号里的内容）
const formatLocation = (location: string | undefined): string | undefined => {
    if (!location) return location;
    const match = location.match(/\[([^\]]+)\]/);
    return match ? match[1] : location;
};

export default function StudentScheduleScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        uuid: string;
        name: string;
        year: string;
    }>();
    
    const [scheduleData, setScheduleData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rowHeight, setRowHeight] = useState(60);
    const [activeSlotDetail, setActiveSlotDetail] = useState<{
        cellKey: string;
        courses: CourseSlot[];
    } | null>(null);
    
    const TOTAL_WEEKS = 30;
    
    // 根据当前日期自动计算默认周次
    const defaultWeek = useMemo(() => {
        const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
        return calculateCurrentWeek(year);
    }, [params.year]);
    
    const [weekNumber, setWeekNumber] = useState(defaultWeek);
    const [weekPickerVisible, setWeekPickerVisible] = useState(false);
    
    const weekOptions = useMemo(
        () =>
            Array.from({ length: TOTAL_WEEKS }, (_, index) => {
                const value = String(index + 1);
                return { label: `第 ${index + 1} 周`, value };
            }),
        [],
    );
    
    useEffect(() => {
        if (!params.uuid) {
            setError('缺少用户信息');
            setLoading(false);
            return;
        }
        
        // 清除旧数据，确保显示加载状态
        setScheduleData(null);
        
        let isCancelled = false;
        
        const fetchSchedule = async () => {
            setLoading(true);
            setError(null);
            console.log(`[学生课表] 开始请求第 ${weekNumber} 周的课表...`);
            try {
                const response = await fetch(`${API_BASE_URL}/api/schedule/state`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        username: '202314020131',
                        password: '200587Yyq__',
                        year: params.year ?? '2025',
                        query_userid: params.uuid,
                        xxdm: '12843',
                        week: String(weekNumber),
                    }),
                });
                
                if (isCancelled) return;
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`[学生课表] 第 ${weekNumber} 周数据获取成功`);
                    setScheduleData(data);
                } else {
                    setError('获取课表失败');
                }
            } catch (err) {
                if (!isCancelled) {
                    setError('网络请求失败');
                    console.log('获取同学课表失败:', err);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };
        
        fetchSchedule();
        
        return () => { isCancelled = true; };
    }, [params.uuid, params.year, weekNumber]);
    
    const days = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset);
        
        return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((label, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            const day = date.getDate();
            return { label, date: `${day}日` };
        });
    }, []);
    
    const courseSlotMap = useMemo(() => normalizeScheduleSlots(scheduleData), [scheduleData]);
    
    // 提取实践环节信息 sjhjinfo
    const sjhjInfo = useMemo(() => {
        const info = scheduleData?.data?.schedule?.sjhjinfo 
            ?? scheduleData?.data?.sjhjinfo
            ?? scheduleData?.sjhjinfo;
        
        if (Array.isArray(info)) {
            return info.map((item: { dm?: string; value?: string }) => item.value).filter(Boolean);
        }
        return [];
    }, [scheduleData]);
    
    const allPeriods = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // 计算合并单元格信息
    const mergedCellInfo = useMemo(() => {
        const info = new Map<string, { rowSpan: number; isStart: boolean }>();
        
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            let currentCourse: string | null = null;
            let startPeriod = 1;
            
            for (let period = 1; period <= 10; period++) {
                const cellKey = `${period}-${dayIndex}`;
                const slotCourses = courseSlotMap.get(cellKey);
                const courseName = slotCourses?.[0]?.course ?? slotCourses?.[0]?.name ?? null;
                
                if (courseName !== currentCourse) {
                    if (currentCourse !== null) {
                        const span = period - startPeriod;
                        for (let p = startPeriod; p < period; p++) {
                            const key = `${p}-${dayIndex}`;
                            info.set(key, { rowSpan: span, isStart: p === startPeriod });
                        }
                    }
                    currentCourse = courseName;
                    startPeriod = period;
                }
            }
            if (currentCourse !== null) {
                const span = 11 - startPeriod;
                for (let p = startPeriod; p <= 10; p++) {
                    const key = `${p}-${dayIndex}`;
                    info.set(key, { rowSpan: span, isStart: p === startPeriod });
                }
            }
        }
        
        return info;
    }, [courseSlotMap]);
    
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                {/* 顶部标题栏 */}
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <Pressable 
                        style={styles.backBtn}
                        onPress={() => router.back()}
                    >
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                            <Path
                                d="M15 18l-6-6 6-6"
                                stroke="#fff"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </Svg>
                    </Pressable>
                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>{params.name}的课表</Text>
                        <Pressable 
                            style={styles.weekPickerTrigger}
                            onPress={() => setWeekPickerVisible(true)}
                        >
                            <Text style={styles.weekText}>第{weekNumber}周</Text>
                            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                                <Path
                                    d="M6 9l6 6 6-6"
                                    stroke="#fff"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </Svg>
                            {loading && (
                                <Text style={styles.loadingText}> 加载中...</Text>
                            )}
                        </Pressable>
                    </View>
                    <View style={styles.backBtn} />
                </View>
                
                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : (
                    <View style={[styles.tableContainer, { marginBottom: insets.bottom + 56 + (sjhjInfo.length > 0 ? 56 : 0) }]}>
                        {/* 表头 */}
                        <View style={styles.tableHeaderRow}>
                            <View style={[styles.headerCell, styles.periodColumn]}>
                                <Text style={styles.headerText}>{new Date().getMonth() + 1}月</Text>
                            </View>
                            {days.map((day) => (
                                <View key={day.label} style={styles.headerCell}>
                                    <Text style={styles.dayDate}>{day.date}</Text>
                                    <Text style={styles.dayLabel}>{day.label}</Text>
                                </View>
                            ))}
                        </View>
                        {/* 表格内容 */}
                        <View 
                            style={styles.tableBody}
                            onLayout={(e) => setRowHeight(e.nativeEvent.layout.height / 10)}
                        >
                            {allPeriods.map((period) => (
                                <View key={period} style={styles.tableRow}>
                                    <View style={[styles.cell, styles.periodColumn]}>
                                        <Text style={styles.periodText}>{period}</Text>
                                    </View>
                                    {days.map((day, dayIndex) => {
                                        const cellKey = `${period}-${dayIndex}`;
                                        const slotCourses = courseSlotMap.get(cellKey);
                                        const active = Boolean(slotCourses && slotCourses.length);
                                        const topCourse = slotCourses?.[0];
                                        const cellInfo = mergedCellInfo.get(cellKey);
                                        const isStart = cellInfo?.isStart ?? true;
                                        const rowSpan = cellInfo?.rowSpan ?? 1;
                                        
                                        if (active && !isStart) {
                                            return (
                                                <View key={cellKey} style={styles.cell}>
                                                    <View style={styles.cellInner} />
                                                </View>
                                            );
                                        }
                                        
                                        const courseColor = active ? getCourseColor(topCourse?.course ?? topCourse?.name) : null;
                                        
                                        return (
                                            <View key={cellKey} style={[styles.cell, rowSpan > 1 && styles.cellMerged]}>
                                                <Pressable
                                                    style={[
                                                        styles.cellInner, 
                                                        active && { backgroundColor: courseColor?.bg },
                                                        rowSpan > 1 && active && styles.mergedCellInner,
                                                        rowSpan > 1 && active && { height: rowHeight * rowSpan - 4 }
                                                    ]}
                                                    disabled={!active}
                                                    onPress={() => {
                                                        if (slotCourses) {
                                                            setActiveSlotDetail({
                                                                cellKey,
                                                                courses: slotCourses,
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {active && courseColor && (
                                                        <>
                                                            <Text style={[styles.courseName, { color: courseColor.text }]} numberOfLines={rowSpan > 2 ? 6 : rowSpan > 1 ? 5 : 3}>
                                                                {topCourse?.course ?? topCourse?.name}
                                                            </Text>
                                                            {topCourse?.location && (
                                                                <Text style={[styles.courseLocation, { color: courseColor.text }]} numberOfLines={rowSpan > 1 ? 3 : 2}>
                                                                    {formatLocation(topCourse.location)}
                                                                </Text>
                                                            )}
                                                            {topCourse?.teacher && (
                                                                <Text style={[styles.courseTeacher, { color: courseColor.text }]} numberOfLines={rowSpan > 1 ? 2 : 1}>
                                                                    教师：{removeTeacherNumber(topCourse.teacher)}
                                                                </Text>
                                                            )}
                                                        </>
                                                    )}
                                                </Pressable>
                                            </View>
                                        );
                                    })}
                                </View>
                            ))}
                        </View>
                    </View>
                )}
                
                {/* 备注信息 - 固定在底部导航上方，可上下滑动 */}
                {sjhjInfo.length > 0 && (
                    <View style={[styles.remarksContainer, { bottom: insets.bottom + 56 }]}>
                        <Text style={styles.remarksTitle}>备注：</Text>
                        <ScrollView 
                            style={styles.remarksScroll}
                            showsVerticalScrollIndicator={false}
                        >
                            {sjhjInfo.map((item, index) => (
                                <Text key={index} style={styles.remarksText} numberOfLines={1}>
                                    {index + 1}、{item}
                                </Text>
                            ))}
                        </ScrollView>
                    </View>
                )}
                
                {/* 周次选择器弹窗 */}
                <Modal
                    visible={weekPickerVisible}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setWeekPickerVisible(false)}
                >
                    <View style={styles.weekPickerModal}>
                        <Pressable 
                            style={styles.weekPickerBackdrop} 
                            onPress={() => setWeekPickerVisible(false)}
                        />
                        <View style={[styles.weekPickerContent, { paddingBottom: insets.bottom }]}>
                            <View style={styles.weekPickerHeader}>
                                <Text style={styles.weekPickerTitle}>选择周次</Text>
                                <Pressable onPress={() => setWeekPickerVisible(false)}>
                                    <Text style={styles.weekPickerClose}>完成</Text>
                                </Pressable>
                            </View>
                            <ScrollView 
                                style={styles.weekPickerScroll}
                                showsVerticalScrollIndicator={false}
                            >
                                {weekOptions.map((option) => (
                                    <Pressable
                                        key={option.value}
                                        style={[
                                            styles.weekPickerItem,
                                            weekNumber === Number(option.value) && styles.weekPickerItemActive
                                        ]}
                                        onPress={() => {
                                            setWeekNumber(Number(option.value));
                                            setWeekPickerVisible(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.weekPickerItemText,
                                            weekNumber === Number(option.value) && styles.weekPickerItemTextActive
                                        ]}>
                                            {option.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
                
                {/* 课程详情弹窗 */}
                {activeSlotDetail && (
                    <Modal
                        visible
                        animationType="fade"
                        transparent
                        onRequestClose={() => setActiveSlotDetail(null)}
                    >
                        <View style={styles.detailModalContainer}>
                            <Pressable style={styles.detailBackdrop} onPress={() => setActiveSlotDetail(null)}/>
                            <View style={styles.detailCard}>
                                {(() => {
                                    const [sectionRaw, dayRaw] = activeSlotDetail.cellKey.split('-');
                                    const section = Number(sectionRaw);
                                    const dayIndex = Number(dayRaw);
                                    const dayLabel = days[dayIndex]?.label ?? `周${dayIndex + 1}`;
                                    return (
                                        <View style={styles.detailHeader}>
                                            <Text style={styles.detailTitle}>课程详情</Text>
                                            <Text style={styles.detailSubtitle}>
                                                {`${dayLabel} · 第 ${section} 节`}
                                            </Text>
                                        </View>
                                    );
                                })()}
                                <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailList}>
                                    {activeSlotDetail.courses.map((courseInfo, index) => {
                                        const detailRows = [
                                            {label: '课程', value: courseInfo.course},
                                            {label: '授课教师', value: removeTeacherNumber(courseInfo.teacher)},
                                            {label: '上课地点', value: formatLocation(courseInfo.location)},
                                            {label: '班级', value: courseInfo.classes},
                                            {label: '节次', value: courseInfo.slotLabel},
                                            {label: '时间', value: courseInfo.timeDesc},
                                            {label: '周次', value: courseInfo.weeks},
                                        ];
                                        return (
                                            <View key={`${courseInfo.course ?? 'course'}-${index}`}
                                                  style={styles.detailCourseCard}>
                                                {detailRows.map(({label, value}) => (
                                                    <View key={label} style={styles.detailRow}>
                                                        <Text style={styles.detailRowLabel}>{label}</Text>
                                                        <Text style={styles.detailRowValue}>{value ?? '—'}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        );
                                    })}
                                </ScrollView>
                            </View>
                        </View>
                    </Modal>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: '#1684ff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    backBtn: {
        position: 'absolute',
        left: 16,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#fff',
        marginBottom: 4,
    },
    weekPickerTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    weekText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    loadingText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#ef4444',
    },
    tableContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e2e8f0',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        height: 44,
    },
    headerCell: {
        flex: 1,
        minWidth: 44,
        height: 44,
        borderRightWidth: 0.5,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    periodColumn: {
        flex: 0,
        width: 36,
        minWidth: 36,
    },
    headerText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#334155',
    },
    dayLabel: {
        fontSize: 10,
        color: '#64748b',
        marginTop: 2,
    },
    dayDate: {
        fontSize: 13,
        fontWeight: '600',
        color: '#0f172a',
    },
    tableBody: {
        flex: 1,
    },
    tableRow: {
        flex: 1,
        flexDirection: 'row',
        borderTopWidth: 0.5,
        borderColor: '#e2e8f0',
    },
    cell: {
        flex: 1,
        minWidth: 44,
        borderRightWidth: 0.5,
        borderColor: '#e2e8f0',
        padding: 2,
    },
    cellMerged: {
        zIndex: 10,
        overflow: 'visible',
    },
    cellInner: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    mergedCellInner: {
        position: 'absolute',
        top: 2,
        left: 2,
        right: 2,
        bottom: 2,
    },
    periodText: {
        fontSize: 11,
        color: '#334155',
        textAlign: 'center',
    },
    courseName: {
        fontSize: 9,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 11,
    },
    courseLocation: {
        fontSize: 8,
        marginTop: 1,
        textAlign: 'center',
        lineHeight: 10,
    },
    courseTeacher: {
        fontSize: 8,
        marginTop: 1,
        textAlign: 'center',
        lineHeight: 10,
    },
    weekPickerModal: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    weekPickerBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
    },
    weekPickerContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
    },
    weekPickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    weekPickerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0f172a',
    },
    weekPickerClose: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1684ff',
    },
    weekPickerScroll: {
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    weekPickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 10,
        marginVertical: 2,
    },
    weekPickerItemActive: {
        backgroundColor: '#dbeafe',
    },
    weekPickerItemText: {
        fontSize: 16,
        color: '#334155',
    },
    weekPickerItemTextActive: {
        color: '#1e3a8a',
        fontWeight: '600',
    },
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
        color: '#475569',
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
    remarksContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 56,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 4,
    },
    remarksScroll: {
        flex: 1,
    },
    remarksTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#b91c1c',
        marginBottom: 4,
    },
    remarksText: {
        fontSize: 13,
        color: '#b91c1c',
        lineHeight: 20,
    },
});

