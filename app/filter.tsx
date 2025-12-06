import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// API 服务器地址
const API_BASE_URL = 'http://101.43.234.149:8003';

// 计算当前是第几周（基于学期开始日期）
const calculateCurrentWeek = (semesterYear: number): number => {
    // 学期开始日期：秋季学期一般在9月第一个周一
    // 这里假设开学日期为9月1日所在周的周一
    const semesterStart = new Date(semesterYear, 8, 1); // 9月1日 (月份从0开始)
    
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
    skbj?: string;  // 班级编号，用于查询学生人数
};

type Student = {
    xm: string;      // 姓名
    xb: string;      // 性别（男/女）
    bjmc: string;    // 班级名称
    yhxh: string;    // 学号
    zymc: string;    // 专业名称
    yxbmc: string;   // 院系名称
    njmc: string;    // 年级名称
};

const ensureArray = <T, >(value: T | T[] | Record<string, T> | null | undefined): T[] => {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
        return Object.values(value).flatMap((entry) => ensureArray(entry));
    }
    if (value == null) return [];
    return [value];
};

// 去除教师名字后面的数字编号（用于课表显示）
const removeTeacherNumber = (teacher: string | undefined): string | undefined => {
    if (!teacher) return teacher;
    return teacher.replace(/\d+$/, '').trim();
};

// 提取上课地点（只显示方括号里的内容）
// 例如: "E06(文学院)[E06(文学院)210]" -> "E06(文学院)210"
const formatLocation = (location: string | undefined): string | undefined => {
    if (!location) return location;
    const match = location.match(/\[([^\]]+)\]/);
    return match ? match[1] : location;
};

// 课程颜色配置 - 颜色差异更明显
const COURSE_COLORS = [
    { bg: '#bfdbfe', text: '#1e40af' },  // 蓝色
    { bg: '#fde68a', text: '#92400e' },  // 黄色
    { bg: '#bbf7d0', text: '#166534' },  // 绿色
    { bg: '#fbcfe8', text: '#9d174d' },  // 粉色
    { bg: '#c7d2fe', text: '#3730a3' },  // 靛蓝
    { bg: '#fed7aa', text: '#9a3412' },  // 橙色
    { bg: '#99f6e4', text: '#115e59' },  // 青色
    { bg: '#ddd6fe', text: '#5b21b6' },  // 紫色
    { bg: '#fca5a5', text: '#b91c1c' },  // 红色
    { bg: '#bef264', text: '#3f6212' },  // 黄绿
];

// 根据课程名称获取颜色
const getCourseColor = (courseName: string | undefined): { bg: string; text: string } => {
    if (!courseName) return COURSE_COLORS[0];
    let hash = 0;
    for (let i = 0; i < courseName.length; i++) {
        hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % COURSE_COLORS.length;
    return COURSE_COLORS[index];
};

const parseWeeks = (weeksValue: any): string | undefined => {
    if (!weeksValue) return undefined;
    if (typeof weeksValue === 'string') return weeksValue;
    if (Array.isArray(weeksValue)) {
        return weeksValue.join(', ');
    }
    if (typeof weeksValue === 'object') {
        const entries = Object.values(weeksValue).flat();
        return entries.join(', ');
    }
    return String(weeksValue);
};

const parseSlotTuples = (slotValue: any): { section: number; dayIndex?: number }[] => {
    const tuples: { section: number; dayIndex?: number }[] = [];
    if (!slotValue) return tuples;

    const pushTuple = (sectionRaw: any, dayRaw?: any) => {
        const section = Number(sectionRaw);
        const dayIndex = dayRaw != null ? Number(dayRaw) - 1 : undefined;
        if (!Number.isNaN(section)) {
            tuples.push({section, dayIndex: Number.isNaN(dayIndex) ? undefined : dayIndex});
        }
    };

    if (typeof slotValue === 'string') {
        slotValue
            .split(/[,;\s]+/)
            .map((entry) => entry.trim())
            .filter(Boolean)
            .forEach((entry) => {
                const [first, second] = entry.split(/[-:]/);
                if (second != null) {
                    pushTuple(first, second);
                } else {
                    pushTuple(first);
                }
            });
        return tuples;
    }

    if (Array.isArray(slotValue)) {
        slotValue.forEach((value) => {
            if (typeof value === 'string') {
                tuples.push(...parseSlotTuples(value));
            } else if (typeof value === 'object' && value) {
                pushTuple(value.section ?? value.jc, value.day ?? value.xq ?? value.weekday);
            }
        });
        return tuples;
    }

    if (typeof slotValue === 'object') {
        pushTuple(slotValue.section ?? slotValue.jc ?? slotValue.period, slotValue.day ?? slotValue.xq);
    }

    return tuples;
};

// 解析节次字符串，如 "3-4" 或 "03,04" 返回节次数组
const parseSections = (jcxx?: string, jcdm?: string): number[] => {
    const sections: number[] = [];
    
    // 优先解析 jcxx 格式，如 "3-4"
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
    
    // 解析 jcdm 格式，如 "03,04"
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
    if (!raw) {
        return slotMap;
    }

    // 新接口格式：data.schedule.week1-week7
    const schedule = raw?.data?.schedule ?? raw?.schedule;
    if (schedule) {
        // 遍历 week1 到 week7
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
            const weekKey = `week${dayIndex + 1}`;
            const dayCourses = schedule[weekKey];
            
            if (Array.isArray(dayCourses)) {
                dayCourses.forEach((item: any) => {
                    if (!item || typeof item !== 'object') return;
                    
                    // 解析节次
                    const sections = parseSections(item.jcxx, item.jcdm);
                    if (sections.length === 0) return;
                    
                    // 构建课程信息
                    const courseInfo: CourseSlot = {
                        course: item.kcmc ?? '课程',
                        name: item.kcmc ?? '课程',
                        location: item.skdd,
                        classes: item.skbj ?? item.skbjmc,
                        slotLabel: item.jcxx ? `第${item.jcxx}节` : undefined,
                        teacher: item.rkjs,
                        timeDesc: item.beginTime && item.endTime ? `${item.beginTime}-${item.endTime}` : undefined,
                        weeks: item.skzs,
                        skbj: item.skbj,  // 保存班级编号用于查询学生人数
                    };
                    
                    // 将课程添加到对应的节次和星期
                    sections.forEach(section => {
                        const key = `${section}-${dayIndex}`;
                        const existing = slotMap.get(key) ?? [];
                        existing.push(courseInfo);
                        slotMap.set(key, existing);
                    });
                });
            }
        }
        
        // 如果已经解析到数据，直接返回
        if (slotMap.size > 0) {
            return slotMap;
        }
    }

    // 兼容旧接口格式
    const candidates = ensureArray(raw?.data ?? raw?.schedule ?? raw?.courses ?? raw);

    const pushRange = (collection: Set<number>, start?: number, end?: number) => {
        if (start == null) return;
        const rangeEnd = end ?? start;
        for (let section = Number(start); section <= Number(rangeEnd); section += 1) {
            if (!Number.isNaN(section)) {
                collection.add(section);
            }
        }
    };

    candidates.forEach((item, index) => {
        if (!item || typeof item !== 'object') return;

        const slotTuples = parseSlotTuples(item.slot ?? item.slotList ?? item.jxz ?? item.jk);

        const weekdayValue =
            slotTuples[0]?.dayIndex != null
                ? slotTuples[0].dayIndex + 1
                : item.weekday ??
                item.week_day ??
                item.day ??
                item.dayIndex ??
                item.day_of_week ??
                item.xq ??
                ((index % 7) + 1);
        const resolvedDayIndex = Number.isNaN(Number(weekdayValue))
            ? 0
            : Math.max(0, Math.min(6, Number(weekdayValue) - 1));

        const sectionSet = new Set<number>();

        ensureArray(item.sections ?? item.sectionList ?? item.jcList ?? item.sectionsList).forEach((section) => {
            const numeric = Number(section);
            if (!Number.isNaN(numeric)) {
                sectionSet.add(numeric);
            }
        });

        if (sectionSet.size === 0 && item.section != null) {
            sectionSet.add(Number(item.section));
        }

        pushRange(sectionSet, item.startSection ?? item.start ?? item.jcStart, item.endSection ?? item.end ?? item.jcEnd);
        pushRange(sectionSet, item.begin, item.finish);
        pushRange(sectionSet, item.jc, item.jc);
        pushRange(sectionSet, item.start_period, item.end_period);

        const name =
            item.course ??
            item.name ??
            item.courseName ??
            item.kcmc ??
            item.title ??
            item.course_name ??
            item.className ??
            '课程';

        const courseInfo: CourseSlot = {
            course: name,
            name: name,
            location: item.location ?? item.place ?? item.room ?? item.classroom ?? item.skdd ?? item.site,
            classes: item.classes ?? item.class ?? item.class_group ?? item.bjmc,
            slotLabel:
                item.slotLabel ??
                (slotTuples.length
                    ? slotTuples
                        .map((tuple) => `${tuple.section} 节 ${tuple.dayIndex != null ? `周${tuple.dayIndex + 1}` : ''}`.trim())
                        .join(' / ')
                    : undefined),
            teacher: item.teacher ?? item.teacherName ?? item.jsxm ?? item.instructor ?? item.rkjs,
            timeDesc: item.time_desc ?? item.timeDesc ?? item.time ?? item.sksj,
            weeks: parseWeeks(item.weeks ?? item.week_list ?? item.xqjmc ?? item.skzs),
        };

        if (slotTuples.length) {
            slotTuples.forEach(({section, dayIndex}) => {
                if (Number.isNaN(section)) return;
                const finalDay = dayIndex != null ? Math.max(0, Math.min(6, dayIndex)) : resolvedDayIndex;
                const key = `${section}-${finalDay}`;
                const existing = slotMap.get(key) ?? [];
                existing.push(courseInfo);
                slotMap.set(key, existing);
            });
            return;
        }

        if (sectionSet.size === 0) {
            sectionSet.add((index % 10) + 1);
        }

        sectionSet.forEach((section) => {
            if (Number.isNaN(section)) return;
            const key = `${section}-${resolvedDayIndex}`;
            const existing = slotMap.get(key) ?? [];
            existing.push(courseInfo);
            slotMap.set(key, existing);
        });
    });

    return slotMap;
};

function FilterScreen() {
    const router = useRouter();
    const termOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const label = `${currentYear}-${nextYear}`;
        return [{label, value: label, year: currentYear, semester: 0}];
    }, []);
    const selectedTerm = termOptions[0];
    const TOTAL_WEEKS = 30;
    
    // 根据当前日期自动计算默认周次
    const defaultWeek = useMemo(() => calculateCurrentWeek(selectedTerm.year), [selectedTerm.year]);
    
    const weekOptions = useMemo(
        () =>
            Array.from({length: TOTAL_WEEKS}, (_, index) => {
                const value = String(index + 1);
                return {label: `第 ${index + 1} 周`, value};
            }),
        [],
    );
    const [weekNumber, setWeekNumber] = useState(defaultWeek);
    const [weekPickerVisible, setWeekPickerVisible] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [scheduleData, setScheduleData] = useState<any>(null);
    const [activeSlotDetail, setActiveSlotDetail] = useState<{
        cellKey: string;
        courses: CourseSlot[];
    } | null>(null);
    const [rowHeight, setRowHeight] = useState(60);
    const [studentList, setStudentList] = useState<Student[]>([]);
    const [studentListLoading, setStudentListLoading] = useState(false);
    
    useEffect(() => {
        setActiveSlotDetail(null);
        setStudentList([]);
    }, [weekNumber]);
    
    // 获取学生列表
    useEffect(() => {
        if (!activeSlotDetail) {
            setStudentList([]);
            return;
        }
        
        const skbj = activeSlotDetail.courses[0]?.skbj;
        if (!skbj) {
            setStudentList([]);
            return;
        }
        
        let isCancelled = false;
        
        const fetchStudentList = async () => {
            setStudentListLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/schedule/userinfo`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        username: '202314020131',
                        password: '200587Yyq__',
                        year: String(selectedTerm?.year ?? '2025'),
                        skbj: skbj,
                    }),
                });
                
                if (response.ok && !isCancelled) {
                    const data: any = await response.json();
                    // 接口返回 { data: { resultSet: [...] } }
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
    }, [activeSlotDetail, selectedTerm]);

    useEffect(() => {
        // 清除旧数据，确保显示加载状态
        setScheduleData(null);
        
        let isCancelled = false;

        const fetchSchedule = async () => {
            setScheduleLoading(true);
            setScheduleError(null);
            console.log(`[我的课表] 开始请求第 ${weekNumber} 周的课表...`);

            try {
                const response = await fetch(`${API_BASE_URL}/api/schedule`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        username: '202314020131',
                        password: '200587Yyq__',
                        year: String(selectedTerm?.year ?? '2025'),
                        semester: String(selectedTerm?.semester ?? '0'),
                        week: String(weekNumber),
                    }),
                });

                if (isCancelled) return;

                if (!response.ok) {
                    throw new Error(`请求失败，状态码 ${response.status}`);
                }

                const data = await response.json();
                console.log(`[我的课表] 第 ${weekNumber} 周数据获取成功`);
                setScheduleData(data);
            } catch (error) {
                if (!isCancelled && (error as Error).name !== 'AbortError') {
                    setScheduleError((error as Error).message);
                }
            } finally {
                if (!isCancelled) {
                    setScheduleLoading(false);
                }
            }
        };

        fetchSchedule();

        return () => { isCancelled = true; };
    }, [weekNumber, selectedTerm]);

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
        // 正确路径: scheduleData.data.schedule.sjhjinfo
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
                    // 结束上一个课程的合并
                    if (currentCourse !== null) {
                        const span = period - startPeriod;
                        for (let p = startPeriod; p < period; p++) {
                            const key = `${p}-${dayIndex}`;
                            info.set(key, { rowSpan: span, isStart: p === startPeriod });
                        }
                    }
                    // 开始新课程
                    currentCourse = courseName;
                    startPeriod = period;
                }
            }
            // 处理最后一个课程
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

    const insets = useSafeAreaInsets();

    return (
        <View style={styles.safeArea}>
            <View style={[styles.headerBar, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTermText}>{selectedTerm.label}学年第一学期</Text>
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
                        {scheduleLoading && (
                            <Text style={styles.headerStatusText}> 加载中...</Text>
                        )}
                    </Pressable>
                </View>
                <Pressable style={styles.settingsBtn} onPress={() => {}}>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                        <Path
                            d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                            stroke="#fff"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <Path
                            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
                            stroke="#fff"
                            strokeWidth={1.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </Svg>
                </Pressable>
            </View>
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
                                
                                // 如果不是合并的起始单元格，只渲染空单元格
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
            <Modal
                visible={weekPickerVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setWeekPickerVisible(false)}
            >
                <View style={styles.weekPickerModalContainer}>
                    <Pressable 
                        style={styles.weekPickerBackdrop} 
                        onPress={() => setWeekPickerVisible(false)}
                    />
                    <View style={styles.weekPickerContent}>
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
                                    {weekNumber === Number(option.value) && (
                                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                                            <Path
                                                d="M20 6L9 17l-5-5"
                                                stroke="#1e3a8a"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </Svg>
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
                                            {`周${dayLabel} · 第 ${section} 节`}
                                        </Text>
                                    </View>
                                );
                            })()}
                            <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailList}>
                                {activeSlotDetail.courses.map((courseInfo, index) => {
                                    const detailRows = [
                                        {label: '课程', value: courseInfo.course},
                                        {label: '授课教师', value: courseInfo.teacher},
                                        {label: '上课地点', value: courseInfo.location},
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
                                {/* 学生人数和头像预览 */}
                                <Pressable 
                                    style={({ pressed }) => [
                                        styles.studentCountContainer,
                                        pressed && styles.studentCountPressed
                                    ]}
                                    onPress={() => {
                                        const course = activeSlotDetail?.courses[0];
                                        if (course?.skbj) {
                                            const params = {
                                                skbj: course.skbj,
                                                course: course.course ?? '',
                                                year: String(selectedTerm?.year ?? '2025'),
                                            };
                                            // 先关闭弹窗
                                            setActiveSlotDetail(null);
                                            // 延迟跳转，确保弹窗已关闭
                                            setTimeout(() => {
                                                router.push({
                                                    pathname: '/student-list',
                                                    params,
                                                });
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

export default FilterScreen

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    tableContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e2e8f0',
    },
    tableBody: {
        flex: 1,
    },
    headerBar: {
        backgroundColor: '#1684ff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTermText: {
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
    headerStatusText: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.7)',
    },
    headerErrorText: {
        fontSize: 11,
        color: '#fca5a5',
        fontWeight: '600',
    },
    settingsBtn: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    weekPickerModalContainer: {
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
        color: '#1e3a8a',
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
        color: '#1e40af',
        textAlign: 'center',
        lineHeight: 11,
    },
    courseLocation: {
        fontSize: 8,
        color: '#059669',
        marginTop: 1,
        textAlign: 'center',
        lineHeight: 10,
    },
    courseTeacher: {
        fontSize: 8,
        color: '#6366f1',
        marginTop: 1,
        textAlign: 'center',
        lineHeight: 10,
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
