import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { API_BASE_URL } from '../config/api';

const bannerImage = 'https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80';

function CloseIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke="#666" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UserAvatarIcon() {
  return (
    <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={11} fill="#e0e7ff" />
      <Path d="M18 19v-1a4 4 0 00-4-4H10a4 4 0 00-4 4v1" stroke="#6366f1" strokeWidth={1.5} strokeLinecap="round" />
      <Circle cx={12} cy={9} r={3} stroke="#6366f1" strokeWidth={1.5} />
    </Svg>
  );
}

const RULES_TEXT = `1、读者可以预约当日或次日的座位，预约成功后读者可以使用该座位至当日座位关闭时间；预约系统登录用户名为"一卡通号"。读者可在网页端修改密码（否则部分功能无法使用）。修改方法：打开图书馆网站lib.wfust.edu.cn，点击右上角"座位预约"登录后修改。

2、在图书馆外"未通过门禁闸机刷卡入馆"的读者预约当日座位，需在预约成功后30分钟内通过门禁闸机刷卡入馆，系统自动完成签到；已通过门禁闸机刷卡入馆的读者预约当日座位，预约成功后系统自动完成签到。

3、预约次日座位的读者，需在次日6：30前通过门禁闸机刷卡（刷脸）入馆（系统自动完成签到）。

4、预约成功后未签到的读者将被记"未签到"违规1次。

5、读者每天可以取消两次预约，取消两次之后的预约无法再取消。具体操作：点击我的中心--我的预约--取消预约。

6、临时离开：在选座机上刷卡或从网页及微信端选择"临时离开"，座位将保留30分钟。已选择"临时离开"的读者在保留时间内返回座位时，需签到方可继续使用原座位，签到方法有两种：（1）出馆读者从门禁闸机入馆即自动签到；（2）未出馆读者在选座机上刷卡完成签到。读者未在保留时间内返回签到，系统将自动释放座位供他人选用，并记"临时离开超时"违规1次。

7、10：50-13：30午饭期间，在选座机上刷卡或从网页及微信端选择"临时离开"座位将保留120分钟；16：00-19：00晚饭期间，"临时离开"座位将保留90分钟。

8、读者未选择"临时离开"，通过门禁闸机出馆时，座位将自动释放；未选择"临时离开"且未通过门禁闸机出馆的读者将被记"未签离"违规1次。

9、请读者自觉维护馆内秩序，勿随意移动桌椅，勿将个人物品遗留在座位上。每日闭馆后自习区进行清理，如有丢失，责任自负。

附：违规类型说明

1、未签到：指读者预约座位成功后，未在规定时间内刷卡签到（未通过门禁闸机入馆签到或者未在选座机上刷卡签到）所产生的违规。

2、未签离：指读者预约座位后，离开图书馆时未通过门禁出馆释放座位，或未在选座机上刷卡退出座位，每天闭馆后系统清场时所产生的违规。

3、临时离开未刷卡：指读者预约座位后，未通过门禁闸机离馆，再次从门禁闸机入馆时所产生的违规。（读者再次通过门禁闸机入馆时，系统将自动释放该读者预约的座位）。

4、临时离开超时：指读者办理了"临时离开"后，在保留时间内离馆读者未能通过门禁闸机入馆签到，或在馆内读者未在选座机上签到所产生的违规。

★累计违约满3次后，读者将被暂停预约选坐权利7天，同时禁止入馆7天。一周后自动解禁，违约次数清零。

★违规占座同学在领取本人物品时，会被禁止入馆7天。

★使用他人一卡通入馆或使用座位系统，一经查实永久取消入馆资格。

★遇到自己预约的座位上有物品时，请将物品移到一边，落座学习即可。

★遇到自己预约的座位上有人时，请提醒TA让座，对拒不让座的一律永久禁卡。

请大家珍惜在图书馆学习的机会，共同营造良好的学习氛围。`;

export default function SpaceReservationScreen() {
  const [loading, setLoading] = useState(true);
  const [isBound, setIsBound] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [boundUsername, setBoundUsername] = useState('');
  const [unbindLoading, setUnbindLoading] = useState(false);
  const hasRedirected = useRef(false); // 防止重复跳转

  const checkBindStatus = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        router.replace('/');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/bindaccount/study_room`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data: any = await response.json();
        // 检查返回的数据是否有效（有 username 字段表示已绑定）
        if (data && data.username) {
          setIsBound(true);
          setBoundUsername(data.username);
          setLoading(false);
          hasRedirected.current = false; // 绑定成功后重置标志
        } else {
          // 未绑定，跳转到绑定页面（使用push保留导航栈）
          setLoading(false);
          if (!hasRedirected.current) {
            hasRedirected.current = true;
            setTimeout(() => router.push('/study-room-bindlogin'), 0);
          }
        }
      } else if (response.status === 404) {
        // 未找到绑定记录，跳转到绑定页面
        setLoading(false);
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          setTimeout(() => router.push('/study-room-bindlogin'), 0);
        }
      } else {
        // 其他错误，也跳转到绑定页面
        setLoading(false);
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          setTimeout(() => router.push('/study-room-bindlogin'), 0);
        }
      }
    } catch (error) {
      console.error('检查绑定状态失败:', error);
      setLoading(false);
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        setTimeout(() => router.push('/study-room-bindlogin'), 0);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkBindStatus();
    }, [checkBindStatus])
  );

  const handleUnbind = useCallback(async () => {
    Alert.alert(
      '确认解绑',
      '解绑后需要重新登录自习室账号才能使用预约功能，确定要解绑吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定解绑',
          style: 'destructive',
          onPress: async () => {
            setUnbindLoading(true);
            try {
              const token = await AsyncStorage.getItem('access_token');
              if (!token) {
                Alert.alert('提示', '请先登录');
                return;
              }

              const response = await fetch(`${API_BASE_URL}/api/bindaccount/study_room`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert('成功', '解绑成功', [
                  {
                    text: '确定',
                    onPress: () => {
                      setShowUserModal(false);
                      setIsBound(false);
                      setBoundUsername('');
                      setTimeout(() => router.replace('/study-room-bindlogin'), 0);
                    },
                  },
                ]);
              } else {
                const data: any = await response.json();
                Alert.alert('解绑失败', data?.detail || '操作失败');
              }
            } catch (error) {
              console.error('解绑错误:', error);
              Alert.alert('错误', '网络错误');
            } finally {
              setUnbindLoading(false);
            }
          },
        },
      ]
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!isBound) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>正在跳转...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 顶部图片 */}
        <View style={styles.bannerContainer}>
          <Image source={{ uri: bannerImage }} style={styles.bannerImage} />
          <Pressable style={styles.ruleButton} onPress={() => setShowRulesModal(true)}>
            <Text style={styles.ruleButtonText}>预约规则</Text>
          </Pressable>
        </View>

        {/* 功能入口 */}
        <View style={styles.menuCard}>
          <Pressable style={styles.menuItem} onPress={() => router.push('/study-room')}>
            <View style={styles.menuIconWrapper}>
              <SeatIcon />
            </View>
            <Text style={styles.menuText}>座位预约</Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => router.push('/favorite-seats')}>
            <View style={styles.menuIconWrapper}>
              <StarIcon />
            </View>
            <Text style={styles.menuText}>常用预约</Text>
          </Pressable>
        </View>

        {/* 公告区域 */}
        <Pressable style={styles.noticeCard}>
          <View style={styles.noticeLeft}>
            <NoticeIcon />
            <Text style={styles.noticeText}>图书馆朗读室开放公告</Text>
          </View>
          <View style={styles.noticeRight}>
            <Text style={styles.noticeMore}>查看更多</Text>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M9 6l6 6-6 6" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </Pressable>
      </ScrollView>

      {/* 底部导航 */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <HomeIcon active />
          <Text style={[styles.navText, styles.navTextActive]}>首页</Text>
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

      {/* 我的中心弹窗 */}
      <Modal
        visible={showUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>我的中心</Text>
              <Pressable onPress={() => setShowUserModal(false)}>
                <CloseIcon />
              </Pressable>
            </View>

            {/* 账号信息 */}
            <View style={styles.accountCard}>
              <View style={styles.accountAvatar}>
                <UserAvatarIcon />
              </View>
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>当前绑定账号</Text>
                <Text style={styles.accountValue}>{boundUsername || '未知'}</Text>
              </View>
            </View>

            {/* 解绑按钮 */}
            <Pressable
              style={[styles.unbindButton, unbindLoading && styles.unbindButtonDisabled]}
              onPress={handleUnbind}
              disabled={unbindLoading}
            >
              {unbindLoading ? (
                <ActivityIndicator color="#dc2626" size="small" />
              ) : (
                <Text style={styles.unbindButtonText}>解绑账号</Text>
              )}
            </Pressable>

            <Text style={styles.unbindHint}>解绑后可绑定其他账号</Text>
          </View>
        </View>
      </Modal>

      {/* 预约规则弹窗 */}
      <Modal
        visible={showRulesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRulesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rulesModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>座位预约</Text>
              <Pressable onPress={() => setShowRulesModal(false)}>
                <CloseIcon />
              </Pressable>
            </View>
            <ScrollView style={styles.rulesScrollView} showsVerticalScrollIndicator={true}>
              <Text style={styles.rulesText}>{RULES_TEXT}</Text>
            </ScrollView>
            <Pressable style={styles.rulesConfirmButton} onPress={() => setShowRulesModal(false)}>
              <Text style={styles.rulesConfirmButtonText}>确 认</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SeatIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 28 28" fill="none">
      <Path d="M23.3734 12.3791H21.8051V6.45446C21.8051 5.74404 21.3091 5.16765 20.7059 5.16765H7.27487C6.67168 5.16765 6.17572 5.74404 6.17572 6.45446V12.3791H4.60742V6.18638C4.60742 4.83255 5.62615 3.7334 6.87274 3.7334H21.1081C22.3547 3.7334 23.3734 4.83255 23.3734 6.18638V12.3791Z" fill="#3E3A39"/>
      <Path d="M23.2036 24.7333H21.3803C20.053 24.7333 18.9939 23.6013 18.9939 22.5433V22.5228H9.0192V22.5433C9.0192 23.6013 7.91984 24.7333 6.60597 24.7333H4.78264C3.45536 24.7333 2.38281 23.8705 2.38281 22.8125V14.1434C2.38281 13.0855 3.3347 12.2227 4.64857 12.2227H6.33783C8.41589 12.2227 9.00579 13.0855 9.00579 14.1434V17.6357L18.9671 17.6254L18.9805 14.1434C18.9805 13.0855 19.8117 12.2329 21.5278 12.2329H23.4852C24.8124 12.2329 25.6169 13.0957 25.6169 14.1537V22.8228C25.6034 23.8705 24.5309 24.7333 23.2036 24.7333ZM7.62489 21.1588H20.3748L20.3748 22.1119C20.3748 22.6152 20.8574 23.2953 21.4741 23.2953H23.1098C23.7265 23.2953 24.2225 22.8844 24.2225 22.3811V14.5851C24.2225 14.0818 23.7265 13.6709 23.1098 13.6709H21.4741C20.8574 13.6709 20.3614 14.0818 20.3614 14.5851L20.3614 18.9986L7.62488 19.0089L7.61148 14.5851C7.61148 14.0818 7.11543 13.6709 6.49871 13.6709H4.86308C4.24636 13.6709 3.75031 14.0818 3.75031 14.5851V22.3811C3.75031 22.8844 4.24636 23.2953 4.86308 23.2953H6.49871C7.11543 23.2953 7.62488 22.6152 7.62488 22.1119L7.62489 21.1588Z" fill="#3E3A39"/>
      <Path d="M11 11.5L13.7222 14L18 9" stroke="#1A49C0" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function StarIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 28 28" fill="none">
      <Path d="M6.41559 4.51724C5.57817 4.51724 4.89648 5.19388 4.89648 6.03104V23.4862C4.89648 24.3241 5.57763 25 6.41559 25H21.5843C22.4217 25 23.1034 24.3234 23.1034 23.4862V6.03104C23.1034 5.19309 22.4222 4.51724 21.5843 4.51724H19.3103L20.0689 5.27586V4.1368C20.0689 3.51148 19.56 3 18.9323 3H9.06758C8.43743 3 7.93097 3.50896 7.93097 4.1368V5.27586L8.68959 4.51724H6.41559ZM9.44821 6.03448V5.27586V4.1368C9.44821 4.34525 9.27705 4.51724 9.06758 4.51724H18.9323C18.7203 4.51724 18.5517 4.3477 18.5517 4.1368V5.27586V6.03448H19.3103H21.5843C21.5869 6.03448 21.5861 23.4862 21.5861 23.4862C21.5861 23.4829 6.41559 23.4828 6.41559 23.4828C6.41294 23.4828 6.41373 6.03104 6.41373 6.03104C6.41373 6.03436 8.68959 6.03448 8.68959 6.03448H9.44821ZM18.5517 6.41492C18.5517 6.20648 18.7228 6.03448 18.9323 6.03448H9.06758C9.27953 6.03448 9.44821 6.20402 9.44821 6.41492V5.27586C9.44821 4.85689 9.10856 4.51724 8.68959 4.51724C8.27061 4.51724 7.93097 4.85689 7.93097 5.27586V6.41492C7.93097 7.04024 8.43985 7.55172 9.06758 7.55172H18.9323C19.5624 7.55172 20.0689 7.04276 20.0689 6.41492V5.27586C20.0689 4.85689 19.7292 4.51724 19.3103 4.51724C18.8913 4.51724 18.5517 4.85689 18.5517 5.27586V6.41492Z" fill="#3E3A39"/>
      <Path d="M18.5515 12.4826C18.9705 12.4826 19.3101 12.1429 19.3101 11.724C19.3101 11.305 18.9705 10.9653 18.5515 10.9653H9.44807C9.0291 10.9653 8.68945 11.305 8.68945 11.724C8.68945 12.1429 9.0291 12.4826 9.44807 12.4826H18.5515ZM9.44807 14.7584C9.0291 14.7584 8.68945 15.0981 8.68945 15.5171C8.68945 15.936 9.0291 16.2757 9.44807 16.2757H18.5515C18.9705 16.2757 19.3101 15.936 19.3101 15.5171C19.3101 15.0981 18.9705 14.7584 18.5515 14.7584H9.44807ZM9.44807 18.5515C9.0291 18.5515 8.68945 18.8912 8.68945 19.3102C8.68945 19.7291 9.0291 20.0688 9.44807 20.0688H15.517C15.936 20.0688 16.2757 19.7291 16.2757 19.3102C16.2757 18.8912 15.936 18.5515 15.517 18.5515H9.44807Z" fill="#1A49C0"/>
    </Svg>
  );
}

function NoticeIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M11 5L6 9H2v6h4l5 4V5z" fill="#2563eb" stroke="#2563eb" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.54 8.46a5 5 0 010 7.07" stroke="#2563eb" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HomeIcon({ active }: { active?: boolean }) {
  const color = active ? '#2563eb' : '#9ca3af';
  const fill = active ? '#2563eb' : 'none';
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" fill={fill} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 22V12h6v10" stroke={active ? '#fff' : color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReservationIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke="#9ca3af" strokeWidth={1.5} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function UserIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={7} r={4} stroke="#9ca3af" strokeWidth={1.5} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  bannerContainer: {
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 280,
  },
  ruleButton: {
    position: 'absolute',
    top: '50%',
    left: 0,
    transform: [{ translateY: -16 }],
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  ruleButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  menuCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 32,
    gap: 48,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  menuItem: {
    alignItems: 'center',
    gap: 10,
  },
  menuIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  menuText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '400',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  noticeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  noticeText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '400',
  },
  noticeRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeMore: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '400',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  accountValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  unbindButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  unbindButtonDisabled: {
    opacity: 0.6,
  },
  unbindButtonText: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '500',
  },
  unbindHint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },
  rulesModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
  },
  rulesScrollView: {
    maxHeight: 400,
    marginBottom: 16,
  },
  rulesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 24,
  },
  rulesConfirmButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rulesConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 4,
  },
});
