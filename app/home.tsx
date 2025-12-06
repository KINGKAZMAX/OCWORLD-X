import type { Href } from 'expo-router';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type ModuleCard = {
  title: string;
  description: string;
  route: string;
  Icon: () => ReactNode;
};

const modules: ModuleCard[] = [
  { title: '课表查询', description: '查看今日与本周课程安排', route: '/schedule', Icon: CalendarIcon },
  { title: '四六级报名及查询', description: '报名考试并查看成绩', route: '/cet', Icon: CertificateIcon },
  { title: '宿舍信息查询', description: '门禁、电费与维修状态', route: '/dormitory', Icon: DormIcon },
  { title: '学费查询', description: '在线查看并缴纳学费', route: '/tuition', Icon: TuitionIcon },
  { title: '校园卡充值', description: '食堂与门禁一卡通充值', route: '/campus-card', Icon: CardIcon },
  { title: '校园网', description: '网络账号状态与流量', route: '/campus-network', Icon: WifiIcon },
  { title: '校园跑', description: '运动打卡与排行榜', route: '/campus-run', Icon: RunIcon },
  { title: '商城系统', description: '二手好物与生活用品', route: '/products', Icon: BagIcon },
  { title: '教材答案', description: '教材解析与练习答案', route: '/textbook-answers', Icon: BookIcon },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    console.log('HomeScreen mounted, Platform:', Platform.OS);
    console.log('Safe area insets:', insets);
  }, [insets]);

  const handleModulePress = (route: string, title: string) => {
    try {
      console.log('Navigating to:', route, title);
      router.push(route as Href);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0 }]}>
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.heading}>智慧校园</Text>
            <Text style={styles.subheading}>一站式入口，快速处理学习与生活需求</Text>
          </View>

          <View style={styles.grid}>
            {modules.map((module) => (
              <Pressable
                key={module.route}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => handleModulePress(module.route, module.title)}
              >
                <View style={styles.iconBubble}>
                  <module.Icon />
                </View>
                <Text style={styles.cardTitle}>{module.title}</Text>
                <Text style={styles.cardDescription}>{module.description}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  wrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 180,
    gap: 18,
  },
  hero: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    gap: 8,
  },
  heading: {
    fontSize: 30,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subheading: {
    fontSize: 15,
    color: '#cbd5f5',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    minHeight: 140,
    shadowColor: '#0f172a',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
  },
});

function CalendarIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Rect x={5} y={7} width={22} height={20} rx={4} stroke="#4f46e5" strokeWidth={1.8} />
      <Path d="M9 5v6M23 5v6" stroke="#4f46e5" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M5 13h22" stroke="#4f46e5" strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={12} cy={19} r={1.7} fill="#4f46e5" />
      <Circle cx={20} cy={23} r={1.7} fill="#4f46e5" />
      <Circle cx={20} cy={19} r={1} fill="#4f46e5" />
    </Svg>
  );
}

function CertificateIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Circle cx={16} cy={13} r={8} stroke="#0ea5e9" strokeWidth={1.8} />
      <Path
        d="M11.5 13.5l2.5 2.5 4.5-4.5"
        stroke="#0ea5e9"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M13 21l-1 8 4-2.2 4 2.2-1-8"
        stroke="#0ea5e9"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DormIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Path
        d="M6 14l10-8 10 8v11a3 3 0 01-3 3H9a3 3 0 01-3-3V14z"
        stroke="#0d9488"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Rect x={13} y={18} width={6} height={8} rx={1} stroke="#0d9488" strokeWidth={1.8} />
      <Path d="M9 14v-4" stroke="#0d9488" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function TuitionIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Rect
        x={7}
        y={8}
        width={18}
        height={16}
        rx={4}
        stroke="#16a34a"
        strokeWidth={1.8}
        fill="none"
      />
      <Path
        d="M16 11.5v10M12.5 14.5h5a2.5 2.5 0 010 5h-3a2 2 0 100 4h5"
        stroke="#16a34a"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CardIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Rect
        x={5}
        y={9}
        width={22}
        height={14}
        rx={4}
        stroke="#2563eb"
        strokeWidth={1.8}
        fill="none"
      />
      <Rect x={8} y={13} width={10} height={2.2} rx={1} fill="#2563eb" />
      <Rect x={20} y={17} width={5} height={2.5} rx={1} fill="#93c5fd" />
    </Svg>
  );
}

function WifiIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Path
        d="M6 13c6.5-5.5 13.5-5.5 20 0"
        stroke="#0ea5e9"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M9.5 17c4.2-3.6 8.8-3.6 13 0"
        stroke="#0ea5e9"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M13 21c2.5-2 5-2 7.5 0"
        stroke="#0ea5e9"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={16} cy={24.5} r={2} fill="#0ea5e9" />
    </Svg>
  );
}

function RunIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Path
        d="M6 19.5l4.5 1.5h11.5l2-4.5"
        stroke="#f97316"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 21l1 4h12a3 3 0 002.8-2.1L27 21"
        stroke="#f97316"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 12l3.5-3 5 2.5 3.5 3.5"
        stroke="#f97316"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BagIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Rect
        x={7}
        y={11}
        width={18}
        height={15}
        rx={4}
        stroke="#9333ea"
        strokeWidth={1.8}
      />
      <Path
        d="M12 11a4 4 0 018 0"
        stroke="#9333ea"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={13} cy={17} r={1} fill="#9333ea" />
      <Circle cx={19} cy={17} r={1} fill="#9333ea" />
    </Svg>
  );
}

function BookIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 32 32" fill="none">
      <Path
        d="M8 9h10a4 4 0 014 4v11H12a4 4 0 00-4-4V9z"
        stroke="#475569"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M14 9h10a4 4 0 014 4v11H18"
        stroke="#475569"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M12 13h6M12 17h4" stroke="#475569" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}
