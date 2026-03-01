import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

// 学期数据
const semesters = [
  { id: "2024-1", name: "2024-2025学年第一学期" },
  { id: "2023-2", name: "2023-2024学年第二学期" },
  { id: "2023-1", name: "2023-2024学年第一学期" },
];

// 检测是否是假期
const isVacation = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  // 暑假：7-8月，寒假：1-2月
  return (month >= 7 && month <= 8) || (month >= 1 && month <= 2);
};

// 获取假期信息
const getVacationInfo = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  if (month >= 7 && month <= 8)
    return { type: "暑假", message: "暑假期间，课表暂停更新" };
  if (month >= 1 && month <= 2)
    return { type: "寒假", message: "寒假期间，课表暂停更新" };
  return null;
};

const todaysCourses = [
  { time: "08:00 - 09:35", name: "高等数学", location: "教学楼 A-302" },
  { time: "10:00 - 11:35", name: "大学物理", location: "理科楼 C-201" },
  { time: "14:00 - 15:35", name: "数据结构", location: "信息楼 5F-06" },
];

function ChevronDownIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke="#666"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);
  const vacationInfo = getVacationInfo();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top || 0 }]}>
      {/* 学期选择器 */}
      <View style={styles.header}>
        <Pressable
          style={styles.semesterSelector}
          onPress={() => setShowSemesterPicker(true)}
        >
          <Text style={styles.semesterText}>{selectedSemester.name}</Text>
          <ChevronDownIcon />
        </Pressable>
      </View>

      {/* 假期提示 */}
      {vacationInfo && (
        <View style={styles.vacationBanner}>
          <Text style={styles.vacationIcon}>🏖️</Text>
          <View style={styles.vacationContent}>
            <Text style={styles.vacationTitle}>{vacationInfo.type}模式</Text>
            <Text style={styles.vacationMessage}>{vacationInfo.message}</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>今日课表</Text>
        {todaysCourses.map((course) => (
          <View key={course.time} style={styles.card}>
            <Text style={styles.time}>{course.time}</Text>
            <Text style={styles.name}>{course.name}</Text>
            <Text style={styles.location}>{course.location}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 学期选择弹窗 */}
      <Modal
        visible={showSemesterPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSemesterPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择学期</Text>
              <Pressable onPress={() => setShowSemesterPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            {semesters.map((semester) => (
              <Pressable
                key={semester.id}
                style={[
                  styles.semesterOption,
                  selectedSemester.id === semester.id &&
                    styles.semesterOptionActive,
                ]}
                onPress={() => {
                  setSelectedSemester(semester);
                  setShowSemesterPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.semesterOptionText,
                    selectedSemester.id === semester.id &&
                      styles.semesterOptionTextActive,
                  ]}
                >
                  {semester.name}
                </Text>
                {selectedSemester.id === semester.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 0,
  },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  semesterSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  semesterText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  vacationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  vacationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  vacationContent: {
    flex: 1,
  },
  vacationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#92400e",
  },
  vacationMessage: {
    fontSize: 13,
    color: "#a16207",
    marginTop: 2,
  },
  content: {
    padding: 20,
    gap: 12,
    paddingBottom: 200,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    gap: 6,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  time: {
    fontSize: 13,
    color: "#22c55e",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0f172a",
  },
  location: {
    fontSize: 14,
    color: "#475569",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  modalClose: {
    fontSize: 20,
    color: "#9ca3af",
    padding: 4,
  },
  semesterOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  semesterOptionActive: {
    backgroundColor: "#eff6ff",
  },
  semesterOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  semesterOptionTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 18,
    color: "#2563eb",
    fontWeight: "600",
  },
});
