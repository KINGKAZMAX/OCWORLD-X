import type { Href } from 'expo-router';
import { router, usePathname } from 'expo-router';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

type BottomIconProps = { color: string };

type TabItem = {
  label: string;
  route: string;
  Icon: (props: BottomIconProps) => ReactElement;
  matchPrefixes: string[];
};

const homeMatches = [
  '/home',
  '/schedule',
  '/cet',
  '/dormitory',
  '/tuition',
  '/campus-card',
  '/campus-network',
  '/campus-run',
  '/products',
  '/textbook-answers',
];

// 我的课表模块包含的页面
const scheduleMatches = [
  '/filter',
  '/student-list',
  '/student-schedule',
];

const tabs: TabItem[] = [
  { label: '首页', route: '/home', Icon: HomeIcon, matchPrefixes: homeMatches },
  { label: '发布', route: '/listing', Icon: PlusIcon, matchPrefixes: ['/listing'] },
  { label: '我的课表', route: '/filter', Icon: FilterIcon, matchPrefixes: scheduleMatches },
  { label: '消息', route: '/inbox', Icon: InboxIcon, matchPrefixes: ['/inbox'] },
  { label: '我的', route: '/profile', Icon: ProfileIcon, matchPrefixes: ['/profile', '/account-security', '/settings'] },
];

export function BottomTabs() {
  const pathname = usePathname();
  const { bottom } = useSafeAreaInsets();

  const activeTab =
    tabs.find((tab) => tab.matchPrefixes.some((prefix) => pathname?.startsWith(prefix))) ?? tabs[0];

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { paddingBottom: bottom }]}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = tab === activeTab;

          return (
            <Pressable
              key={tab.label}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
              onPress={() => {
                if (!isActive) {
                  router.replace(tab.route as Href);
                }
              }}
            >
              <tab.Icon color={isActive ? '#1684ff' : '#999'} />
              <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
  },
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingBottom: 2,
  },
  item: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  itemPressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 11,
  },
  labelActive: {
    color: '#1684ff',
    fontWeight: '500',
  },
  labelInactive: {
    color: '#999',
    fontWeight: '400',
  },
});

function HomeIcon({ color }: BottomIconProps) {
  return (
    <Svg width={26} height={26} viewBox="0 0 32 32" fill="none">
      <Path
        d="M6 15.5l10-8 10 8V24a3 3 0 01-3 3H9a3 3 0 01-3-3v-8.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M13 27v-6h6v6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function FilterIcon({ color }: BottomIconProps) {
  return (
    <Svg width={26} height={26} viewBox="0 0 32 32" fill="none">
      <Path d="M8 9h16M8 23h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 16h12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx={10} cy={9} r={2} stroke={color} strokeWidth={1.5} fill="#fff" />
      <Circle cx={20} cy={16} r={2} stroke={color} strokeWidth={1.5} fill="#fff" />
      <Circle cx={16} cy={23} r={2} stroke={color} strokeWidth={1.5} fill="#fff" />
    </Svg>
  );
}

function PlusIcon({ color }: BottomIconProps) {
  return (
    <Svg width={26} height={26} viewBox="0 0 32 32" fill="none">
      <Circle cx={16} cy={16} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M16 11v10M11 16h10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function InboxIcon({ color }: BottomIconProps) {
  return (
    <Svg width={26} height={26} viewBox="0 0 32 32" fill="none">
      <Path
        d="M7 10.5a3 3 0 013-3h12a3 3 0 013 3v8.5l-5 6H10a3 3 0 01-3-3v-11.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M10 14l6 4 6-4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ProfileIcon({ color }: BottomIconProps) {
  return (
    <Svg width={26} height={26} viewBox="0 0 32 32" fill="none">
      <Circle cx={16} cy={12} r={5} stroke={color} strokeWidth={1.8} />
      <Path
        d="M8 25c1.2-3.3 4.2-5 8-5s6.8 1.7 8 5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}
