import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// 课表背景配置
export const SCHEDULE_BACKGROUNDS = [
    { id: 'default', name: '默认白色', color: '#ffffff', textColor: '#0f172a' },
    { id: 'light-blue', name: '淡蓝色', color: '#e0f2fe', textColor: '#0c4a6e' },
    { id: 'light-green', name: '淡绿色', color: '#dcfce7', textColor: '#14532d' },
    { id: 'light-pink', name: '淡粉色', color: '#fce7f3', textColor: '#831843' },
    { id: 'light-yellow', name: '淡黄色', color: '#fef9c3', textColor: '#854d09' },
    { id: 'light-purple', name: '淡紫色', color: '#ede9fe', textColor: '#5b21b6' },
    { id: 'light-orange', name: '淡橙色', color: '#fff7ed', textColor: '#9a3412' },
    { id: 'light-cyan', name: '淡青色', color: '#e0f7fa', textColor: '#006064' },
    { id: 'cream', name: '米白色', color: '#fffbeb', textColor: '#78350f' },
    { id: 'gray', name: '浅灰色', color: '#f1f5f9', textColor: '#334155' },
];

export const SCHEDULE_BG_STORAGE_KEY = 'schedule_background';
export const SCHEDULE_BG_IMAGE_KEY = 'schedule_background_image';
export const SCHEDULE_TIME_STORAGE_KEY = 'schedule_class_times';
export const SCHEDULE_SHOW_TIME_KEY = 'schedule_show_time';

// 默认上课时间配置
export const DEFAULT_CLASS_TIMES = [
    { period: 1, time: '08:00' },
    { period: 2, time: '08:50' },
    { period: 3, time: '10:00' },
    { period: 4, time: '10:50' },
    { period: 5, time: '14:00' },
    { period: 6, time: '14:50' },
    { period: 7, time: '16:00' },
    { period: 8, time: '16:50' },
    { period: 9, time: '19:00' },
    { period: 10, time: '19:50' },
];

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const [bgPickerVisible, setBgPickerVisible] = useState(false);
    const [selectedBg, setSelectedBg] = useState('default');
    const [customImageUri, setCustomImageUri] = useState<string | null>(null);
    
    // 上课时间设置
    const [showTime, setShowTime] = useState(false);
    const [timePickerVisible, setTimePickerVisible] = useState(false);
    const [classTimes, setClassTimes] = useState(DEFAULT_CLASS_TIMES);
    const [editingPeriod, setEditingPeriod] = useState<number | null>(null);
    const [editingHour, setEditingHour] = useState('08');
    const [editingMinute, setEditingMinute] = useState('00');

    // 加载保存的设置
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const savedBg = await AsyncStorage.getItem(SCHEDULE_BG_STORAGE_KEY);
                const savedImage = await AsyncStorage.getItem(SCHEDULE_BG_IMAGE_KEY);
                const savedShowTime = await AsyncStorage.getItem(SCHEDULE_SHOW_TIME_KEY);
                const savedTimes = await AsyncStorage.getItem(SCHEDULE_TIME_STORAGE_KEY);
                
                if (savedBg) {
                    setSelectedBg(savedBg);
                }
                if (savedImage) {
                    setCustomImageUri(savedImage);
                }
                if (savedShowTime) {
                    setShowTime(savedShowTime === 'true');
                }
                if (savedTimes) {
                    setClassTimes(JSON.parse(savedTimes));
                }
            } catch (e) {
                console.error('加载设置失败:', e);
            }
        };
        loadSettings();
    }, []);

    // 保存背景设置（颜色）
    const handleSelectBg = useCallback(async (bgId: string) => {
        try {
            await AsyncStorage.setItem(SCHEDULE_BG_STORAGE_KEY, bgId);
            // 选择颜色时清除自定义图片
            await AsyncStorage.removeItem(SCHEDULE_BG_IMAGE_KEY);
            setSelectedBg(bgId);
            setCustomImageUri(null);
            setBgPickerVisible(false);
        } catch (e) {
            console.error('保存设置失败:', e);
        }
    }, []);

    // 选择自定义图片
    const handlePickImage = useCallback(async () => {
        try {
            // 请求权限
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('提示', '需要访问相册权限才能选择图片');
                return;
            }

            // 打开图片选择器
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                const sourceUri = result.assets[0].uri;
                
                // 复制到应用目录以持久化
                const fileName = `schedule_bg_${Date.now()}.jpg`;
                const destUri = `${FileSystem.documentDirectory}${fileName}`;
                
                await FileSystem.copyAsync({
                    from: sourceUri,
                    to: destUri,
                });

                // 删除旧的自定义图片
                if (customImageUri && customImageUri !== destUri) {
                    try {
                        await FileSystem.deleteAsync(customImageUri, { idempotent: true });
                    } catch (e) {
                        // 忽略删除失败
                    }
                }

                // 保存设置
                await AsyncStorage.setItem(SCHEDULE_BG_STORAGE_KEY, 'custom');
                await AsyncStorage.setItem(SCHEDULE_BG_IMAGE_KEY, destUri);
                
                setSelectedBg('custom');
                setCustomImageUri(destUri);
                setBgPickerVisible(false);
            }
        } catch (e) {
            console.error('选择图片失败:', e);
            Alert.alert('错误', '选择图片失败，请重试');
        }
    }, [customImageUri]);

    // 清除自定义图片
    const handleClearCustomImage = useCallback(async () => {
        try {
            if (customImageUri) {
                await FileSystem.deleteAsync(customImageUri, { idempotent: true });
            }
            await AsyncStorage.removeItem(SCHEDULE_BG_IMAGE_KEY);
            await AsyncStorage.setItem(SCHEDULE_BG_STORAGE_KEY, 'default');
            setCustomImageUri(null);
            setSelectedBg('default');
        } catch (e) {
            console.error('清除图片失败:', e);
        }
    }, [customImageUri]);

    // 切换显示时间
    const handleToggleShowTime = useCallback(async () => {
        const newValue = !showTime;
        setShowTime(newValue);
        await AsyncStorage.setItem(SCHEDULE_SHOW_TIME_KEY, String(newValue));
    }, [showTime]);

    // 打开时间编辑
    const handleEditTime = useCallback((period: number) => {
        const current = classTimes.find(t => t.period === period);
        if (current) {
            const [h, m] = current.time.split(':');
            setEditingHour(h);
            setEditingMinute(m);
        }
        setEditingPeriod(period);
    }, [classTimes]);

    // 保存时间
    const handleSaveTime = useCallback(async () => {
        if (editingPeriod === null) return;
        
        const newTimes = classTimes.map(t => 
            t.period === editingPeriod 
                ? { ...t, time: `${editingHour}:${editingMinute}` }
                : t
        );
        setClassTimes(newTimes);
        setEditingPeriod(null);
        await AsyncStorage.setItem(SCHEDULE_TIME_STORAGE_KEY, JSON.stringify(newTimes));
    }, [editingPeriod, editingHour, editingMinute, classTimes]);

    // 重置为默认时间
    const handleResetTimes = useCallback(async () => {
        setClassTimes(DEFAULT_CLASS_TIMES);
        await AsyncStorage.setItem(SCHEDULE_TIME_STORAGE_KEY, JSON.stringify(DEFAULT_CLASS_TIMES));
    }, []);

    const currentBg = SCHEDULE_BACKGROUNDS.find(bg => bg.id === selectedBg) || SCHEDULE_BACKGROUNDS[0];
    const displayName = selectedBg === 'custom' ? '自定义图片' : currentBg.name;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* 顶部导航栏 */}
            <View style={styles.header}>
                <Pressable style={styles.backBtn} onPress={() => router.back()}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#0f172a" />
                </Pressable>
                <Text style={styles.headerTitle}>设置</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                {/* 课表设置分组 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>课表设置</Text>
                    <View style={styles.sectionContent}>
                        <Pressable 
                            style={styles.settingRow}
                            onPress={() => setBgPickerVisible(true)}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconBadge, { backgroundColor: '#dbeafe' }]}>
                                    <MaterialCommunityIcons name="palette-outline" size={20} color="#3b82f6" />
                                </View>
                                <Text style={styles.settingLabel}>课表背景</Text>
                            </View>
                            <View style={styles.settingRight}>
                                {customImageUri ? (
                                    <Image source={{ uri: customImageUri }} style={styles.colorPreview} />
                                ) : (
                                    <View style={[styles.colorPreview, { backgroundColor: currentBg.color }]} />
                                )}
                                <Text style={styles.settingValue}>{displayName}</Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
                            </View>
                        </Pressable>
                        <View style={styles.divider} />
                        <Pressable 
                            style={styles.settingRow}
                            onPress={() => setTimePickerVisible(true)}
                        >
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconBadge, { backgroundColor: '#fce7f3' }]}>
                                    <MaterialCommunityIcons name="clock-outline" size={20} color="#ec4899" />
                                </View>
                                <Text style={styles.settingLabel}>上课时间</Text>
                            </View>
                            <View style={styles.settingRight}>
                                <Text style={styles.settingValue}>{showTime ? '已开启' : '已关闭'}</Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
                            </View>
                        </Pressable>
                    </View>
                </View>

                {/* 其他设置 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>其他</Text>
                    <View style={styles.sectionContent}>
                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconBadge, { backgroundColor: '#fef3c7' }]}>
                                    <MaterialCommunityIcons name="bell-outline" size={20} color="#f59e0b" />
                                </View>
                                <Text style={styles.settingLabel}>消息通知</Text>
                            </View>
                            <View style={styles.settingRight}>
                                <Text style={styles.settingValue}>已开启</Text>
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.settingRow}>
                            <View style={styles.settingLeft}>
                                <View style={[styles.iconBadge, { backgroundColor: '#dcfce7' }]}>
                                    <MaterialCommunityIcons name="cached" size={20} color="#22c55e" />
                                </View>
                                <Text style={styles.settingLabel}>清除缓存</Text>
                            </View>
                            <View style={styles.settingRight}>
                                <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* 背景选择弹窗 */}
            <Modal
                visible={bgPickerVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setBgPickerVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <Pressable 
                        style={styles.modalBackdrop} 
                        onPress={() => setBgPickerVisible(false)}
                    />
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>选择课表背景</Text>
                            <Pressable onPress={() => setBgPickerVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
                            </Pressable>
                        </View>
                        <ScrollView 
                            style={styles.bgList}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* 自定义图片选项 */}
                            <Pressable
                                style={[
                                    styles.bgOption,
                                    selectedBg === 'custom' && styles.bgOptionActive
                                ]}
                                onPress={handlePickImage}
                            >
                                {customImageUri ? (
                                    <Image source={{ uri: customImageUri }} style={styles.bgImageBox} />
                                ) : (
                                    <View style={styles.bgUploadBox}>
                                        <MaterialCommunityIcons name="image-plus" size={24} color="#3b82f6" />
                                    </View>
                                )}
                                <Text style={[
                                    styles.bgName,
                                    selectedBg === 'custom' && styles.bgNameActive
                                ]}>
                                    {customImageUri ? '自定义图片' : '从相册选择'}
                                </Text>
                                {selectedBg === 'custom' && customImageUri && (
                                    <>
                                        <Pressable 
                                            style={styles.deleteBtn}
                                            onPress={handleClearCustomImage}
                                        >
                                            <MaterialCommunityIcons name="delete-outline" size={20} color="#ef4444" />
                                        </Pressable>
                                        <MaterialCommunityIcons name="check-circle" size={22} color="#3b82f6" />
                                    </>
                                )}
                            </Pressable>

                            <View style={styles.bgDivider} />

                            {/* 预设颜色选项 */}
                            {SCHEDULE_BACKGROUNDS.map((bg) => (
                                <Pressable
                                    key={bg.id}
                                    style={[
                                        styles.bgOption,
                                        selectedBg === bg.id && styles.bgOptionActive
                                    ]}
                                    onPress={() => handleSelectBg(bg.id)}
                                >
                                    <View style={[styles.bgColorBox, { backgroundColor: bg.color }]}>
                                        <View style={[styles.bgColorInner, { backgroundColor: bg.color }]}>
                                            <Text style={[styles.bgPreviewText, { color: bg.textColor }]}>课</Text>
                                        </View>
                                    </View>
                                    <Text style={[
                                        styles.bgName,
                                        selectedBg === bg.id && styles.bgNameActive
                                    ]}>
                                        {bg.name}
                                    </Text>
                                    {selectedBg === bg.id && (
                                        <MaterialCommunityIcons name="check-circle" size={22} color="#3b82f6" />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* 时间设置弹窗 */}
            <Modal
                visible={timePickerVisible}
                animationType="slide"
                transparent
                onRequestClose={() => {
                    if (editingPeriod !== null) {
                        setEditingPeriod(null);
                    } else {
                        setTimePickerVisible(false);
                    }
                }}
            >
                <View style={styles.modalContainer}>
                    <Pressable 
                        style={styles.modalBackdrop} 
                        onPress={() => {
                            if (editingPeriod !== null) {
                                setEditingPeriod(null);
                            } else {
                                setTimePickerVisible(false);
                            }
                        }}
                    />
                    <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20, maxHeight: '70%' }]}>
                        {editingPeriod === null ? (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>上课时间设置</Text>
                                    <Pressable onPress={() => setTimePickerVisible(false)}>
                                        <MaterialCommunityIcons name="close" size={24} color="#64748b" />
                                    </Pressable>
                                </View>
                                
                                {/* 开关 */}
                                <View style={styles.timeToggleRow}>
                                    <Text style={styles.timeToggleLabel}>在课表显示上课时间</Text>
                                    <Pressable 
                                        style={[styles.toggleBtn, showTime && styles.toggleBtnActive]}
                                        onPress={handleToggleShowTime}
                                    >
                                        <View style={[styles.toggleThumb, showTime && styles.toggleThumbActive]} />
                                    </Pressable>
                                </View>

                                <ScrollView 
                                    style={styles.timeList}
                                    showsVerticalScrollIndicator={false}
                                >
                                    {classTimes.map((item) => (
                                        <View key={item.period} style={styles.timeRow}>
                                            <Text style={styles.timePeriod}>第 {item.period} 节</Text>
                                            <View style={styles.timeValueRow}>
                                                <Text style={styles.timeText}>{item.time}</Text>
                                                <Pressable 
                                                    style={styles.editTimeBtn}
                                                    onPress={() => handleEditTime(item.period)}
                                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                                >
                                                    <MaterialCommunityIcons name="pencil" size={18} color="#3b82f6" />
                                                </Pressable>
                                            </View>
                                        </View>
                                    ))}
                                    
                                    <Pressable style={styles.resetBtn} onPress={handleResetTimes}>
                                        <Text style={styles.resetBtnText}>恢复默认时间</Text>
                                    </Pressable>
                                </ScrollView>
                            </>
                        ) : (
                            <>
                                <View style={styles.modalHeader}>
                                    <Pressable onPress={() => setEditingPeriod(null)} style={styles.backButton}>
                                        <MaterialCommunityIcons name="arrow-left" size={24} color="#64748b" />
                                    </Pressable>
                                    <Text style={styles.modalTitle}>设置第 {editingPeriod} 节时间</Text>
                                    <View style={{ width: 24 }} />
                                </View>
                                
                                <View style={styles.timeEditContent}>
                                    <View style={styles.currentTimeDisplay}>
                                        <Text style={styles.currentTimeText}>{editingHour}:{editingMinute}</Text>
                                    </View>
                                    
                                    <View style={styles.timePickerRow}>
                                        <View style={styles.pickerColumn}>
                                            <Text style={styles.pickerLabel}>小时</Text>
                                            <ScrollView 
                                                style={styles.hourPicker} 
                                                showsVerticalScrollIndicator={false}
                                                contentContainerStyle={styles.pickerContent}
                                            >
                                                {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                                                    <Pressable 
                                                        key={h} 
                                                        style={[styles.pickerItem, editingHour === h && styles.pickerItemActive]}
                                                        onPress={() => setEditingHour(h)}
                                                    >
                                                        <Text style={[styles.pickerItemText, editingHour === h && styles.pickerItemTextActive]}>{h}</Text>
                                                    </Pressable>
                                                ))}
                                            </ScrollView>
                                        </View>
                                        <Text style={styles.timeSeparator}>:</Text>
                                        <View style={styles.pickerColumn}>
                                            <Text style={styles.pickerLabel}>分钟</Text>
                                            <ScrollView 
                                                style={styles.minutePicker} 
                                                showsVerticalScrollIndicator={false}
                                                contentContainerStyle={styles.pickerContent}
                                            >
                                                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                                                    <Pressable 
                                                        key={m} 
                                                        style={[styles.pickerItem, editingMinute === m && styles.pickerItemActive]}
                                                        onPress={() => setEditingMinute(m)}
                                                    >
                                                        <Text style={[styles.pickerItemText, editingMinute === m && styles.pickerItemTextActive]}>{m}</Text>
                                                    </Pressable>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    </View>
                                    
                                    <Pressable style={styles.confirmTimeBtn} onPress={handleSaveTime}>
                                        <Text style={styles.confirmTimeBtnText}>确定</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e2e8f0',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 17,
        fontWeight: '600',
        color: '#0f172a',
        textAlign: 'center',
    },
    headerRight: {
        width: 32,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        gap: 20,
    },
    section: {
        gap: 10,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
        marginLeft: 4,
    },
    sectionContent: {
        backgroundColor: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBadge: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingLabel: {
        fontSize: 15,
        color: '#0f172a',
    },
    settingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    settingValue: {
        fontSize: 14,
        color: '#64748b',
    },
    colorPreview: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#e2e8f0',
        marginLeft: 62,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '60%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0f172a',
    },
    bgList: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    bgOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    bgOptionActive: {
        backgroundColor: '#eff6ff',
    },
    bgColorBox: {
        width: 48,
        height: 48,
        borderRadius: 10,
        padding: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    bgColorInner: {
        flex: 1,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bgPreviewText: {
        fontSize: 16,
        fontWeight: '600',
    },
    bgName: {
        flex: 1,
        fontSize: 15,
        color: '#374151',
        marginLeft: 14,
    },
    bgNameActive: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    bgImageBox: {
        width: 48,
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    bgUploadBox: {
        width: 48,
        height: 48,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#3b82f6',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
    },
    deleteBtn: {
        padding: 6,
        marginRight: 4,
    },
    bgDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 12,
        marginHorizontal: 12,
    },
    // 时间设置样式
    timeToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e2e8f0',
    },
    timeToggleLabel: {
        fontSize: 15,
        color: '#374151',
    },
    toggleBtn: {
        width: 50,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e5e7eb',
        padding: 2,
    },
    toggleBtnActive: {
        backgroundColor: '#3b82f6',
    },
    toggleThumb: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        transform: [{ translateX: 20 }],
    },
    timeList: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f1f5f9',
    },
    timePeriod: {
        fontSize: 15,
        color: '#374151',
    },
    timeValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    editTimeBtn: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#0f172a',
    },
    resetBtn: {
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 8,
    },
    resetBtnText: {
        fontSize: 14,
        color: '#64748b',
    },
    backButton: {
        padding: 4,
    },
    timeEditContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 20,
    },
    currentTimeDisplay: {
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
    },
    currentTimeText: {
        fontSize: 48,
        fontWeight: '300',
        color: '#3b82f6',
        letterSpacing: 2,
    },
    timePickerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 16,
    },
    pickerColumn: {
        alignItems: 'center',
        gap: 8,
    },
    pickerLabel: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: '500',
    },
    hourPicker: {
        width: 80,
        height: 200,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
    },
    minutePicker: {
        width: 80,
        height: 200,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
    },
    pickerContent: {
        paddingVertical: 8,
    },
    timeSeparator: {
        fontSize: 32,
        fontWeight: '300',
        color: '#94a3b8',
        marginTop: 36,
    },
    pickerItem: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
        borderRadius: 8,
    },
    pickerItemActive: {
        backgroundColor: '#3b82f6',
    },
    pickerItemText: {
        fontSize: 20,
        color: '#64748b',
    },
    pickerItemTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    confirmTimeBtn: {
        backgroundColor: '#3b82f6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    confirmTimeBtnText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
});

