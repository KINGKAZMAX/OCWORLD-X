import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// API 服务器地址
const API_BASE_URL = 'http://101.43.234.149:8003';

type Student = {
    xm: string;      // 姓名
    xb: string;      // 性别（男/女）
    bjmc: string;    // 班级名称
    yhxh: string;    // 学号
    zymc: string;    // 专业名称
    yxbmc: string;   // 院系名称
    njmc: string;    // 年级名称
    uuid: string;    // 用户唯一标识，用于查询课表
};

export default function StudentListScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{
        skbj: string;
        course: string;
        year: string;
    }>();
    
    const [studentList, setStudentList] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!params.skbj) {
            setError('缺少班级信息');
            setLoading(false);
            return;
        }
        
        const fetchStudentList = async () => {
            setLoading(true);
            setError(null);
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
                        year: params.year ?? '2025',
                        skbj: params.skbj,
                    }),
                });
                
                if (response.ok) {
                    const data: any = await response.json();
                    const resultSet = data?.data?.resultSet;
                    if (Array.isArray(resultSet)) {
                        setStudentList(resultSet as Student[]);
                    }
                } else {
                    setError('获取学生列表失败');
                }
            } catch (err) {
                setError('网络请求失败');
                console.log('获取学生列表失败:', err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchStudentList();
    }, [params.skbj, params.year]);
    
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                {/* 顶部标题栏 */}
                <View style={[styles.header, { paddingTop: insets.top }]}>
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
                <Text style={styles.headerTitle}>同学列表</Text>
                <View style={styles.backBtn} />
            </View>
            
            {/* 课程信息 */}
            <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>
                    [{params.skbj}]{params.course}
                </Text>
                <Text style={styles.courseCount}>
                    人数：{loading ? '加载中...' : studentList.length}
                </Text>
            </View>
            
            {/* 学生列表 */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>加载中...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <ScrollView style={styles.listScroll}>
                    {studentList.map((student, index) => (
                        <View key={student.yhxh || index} style={styles.studentItem}>
                            <View 
                                style={[
                                    styles.avatar,
                                    { backgroundColor: student.xb === '男' ? '#22d3ee' : '#f87171' }
                                ]}
                            >
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                    <Path
                                        d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                                        fill="#fff"
                                    />
                                </Svg>
                            </View>
                            <View style={styles.studentInfo}>
                                <Text style={[
                                    styles.studentName,
                                    { color: student.xb === '男' ? '#0891b2' : '#f87171' }
                                ]}>
                                    {student.xm}
                                </Text>
                                <Text style={styles.studentClass}>{student.bjmc}</Text>
                            </View>
                            <Pressable 
                                style={styles.scheduleIcon}
                                onPress={() => {
                                    router.push({
                                        pathname: '/student-schedule',
                                        params: {
                                            uuid: student.uuid,
                                            name: student.xm,
                                            year: params.year ?? '2025',
                                        },
                                    });
                                }}
                            >
                                <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                                    <Path
                                        d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z"
                                        fill="#3b82f6"
                                    />
                                    <Path
                                        d="M16 2v4M8 2v4M3 10h18"
                                        stroke="#fff"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                    />
                                    <Path
                                        d="M8 14h2v2H8zM11 14h2v2h-2zM14 14h2v2h-2z"
                                        fill="#fff"
                                    />
                                </Svg>
                            </Pressable>
                        </View>
                    ))}
                    <View style={{ height: insets.bottom + 80 }} />
                </ScrollView>
            )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#1684ff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    courseInfo: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    courseTitle: {
        fontSize: 14,
        color: '#374151',
        marginBottom: 4,
    },
    courseCount: {
        fontSize: 13,
        color: '#6b7280',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6b7280',
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
    listScroll: {
        flex: 1,
        backgroundColor: '#fff',
    },
    studentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    studentInfo: {
        flex: 1,
    },
    studentName: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 2,
    },
    studentClass: {
        fontSize: 13,
        color: '#6b7280',
    },
    scheduleIcon: {
        marginLeft: 12,
    },
});

