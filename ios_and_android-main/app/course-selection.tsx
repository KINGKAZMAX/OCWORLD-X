import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

// 模拟课程数据
const mockCourses = [
  {
    id: "1",
    code: "CS101",
    name: "计算机导论",
    teacher: "张教授",
    credit: 3,
    time: "周一 08:00-09:35",
    location: "教学楼 A-101",
    capacity: 120,
    enrolled: 98,
    category: "必修",
  },
  {
    id: "2",
    code: "CS201",
    name: "数据结构",
    teacher: "李教授",
    credit: 4,
    time: "周二 10:00-11:35",
    location: "理科楼 B-202",
    capacity: 80,
    enrolled: 76,
    category: "必修",
  },
  {
    id: "3",
    code: "CS301",
    name: "算法设计",
    teacher: "王教授",
    credit: 3,
    time: "周三 14:00-15:35",
    location: "信息楼 3F-05",
    capacity: 60,
    enrolled: 45,
    category: "选修",
  },
  {
    id: "4",
    code: "MATH101",
    name: "高等数学",
    teacher: "刘教授",
    credit: 5,
    time: "周四 08:00-09:35",
    location: "教学楼 C-301",
    capacity: 150,
    enrolled: 142,
    category: "必修",
  },
];

// 已选课程
const mockSelectedCourses = [
  {
    id: "5",
    code: "ENG101",
    name: "大学英语",
    teacher: "陈老师",
    credit: 2,
    time: "周五 10:00-11:35",
    location: "外语楼 2F-08",
    category: "必修",
  },
];

function SearchIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        stroke="#9ca3af"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClockIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="#6b7280"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LocationIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        stroke="#6b7280"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        stroke="#6b7280"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function UserIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        stroke="#6b7280"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function CourseSelectionScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"available" | "selected">(
    "available",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState(mockSelectedCourses);

  const handleSelectCourse = (course: (typeof mockCourses)[0]) => {
    Alert.alert("确认选课", `确定要选择《${course.name}》吗？`, [
      { text: "取消", style: "cancel" },
      {
        text: "确定",
        onPress: () => {
          const newCourse = {
            id: course.id,
            code: course.code,
            name: course.name,
            teacher: course.teacher,
            credit: course.credit,
            time: course.time,
            location: course.location,
            category: "选修" as const,
          };
          setSelectedCourses([...selectedCourses, newCourse]);
          Alert.alert("成功", "选课成功！");
        },
      },
    ]);
  };

  const handleDropCourse = (courseId: string) => {
    Alert.alert("确认退课", "确定要退选这门课程吗？", [
      { text: "取消", style: "cancel" },
      {
        text: "确定",
        style: "destructive",
        onPress: () => {
          setSelectedCourses(selectedCourses.filter((c) => c.id !== courseId));
          Alert.alert("成功", "退课成功！");
        },
      },
    ]);
  };

  const filteredCourses = mockCourses.filter(
    (course) =>
      course.name.includes(searchQuery) ||
      course.code.includes(searchQuery) ||
      course.teacher.includes(searchQuery),
  );

  const totalCredits = selectedCourses.reduce((sum, c) => sum + c.credit, 0);

  type CourseType = (typeof mockCourses)[0] | (typeof selectedCourses)[0];

  const isFullCourse = (
    course: CourseType,
  ): course is (typeof mockCourses)[0] => {
    return "capacity" in course && "enrolled" in course;
  };

  const renderCourseCard = (
    course: CourseType,
    isSelected: boolean = false,
  ) => (
    <View key={course.id} style={styles.courseCard}>
      <View style={styles.courseHeader}>
        <View style={styles.courseTitleRow}>
          <Text style={styles.courseCode}>{course.code}</Text>
          <View
            style={[
              styles.categoryBadge,
              course.category === "必修"
                ? styles.categoryRequired
                : styles.categoryElective,
            ]}
          >
            <Text style={styles.categoryText}>{course.category}</Text>
          </View>
        </View>
        <Text style={styles.courseName}>{course.name}</Text>
      </View>

      <View style={styles.courseInfo}>
        <View style={styles.infoRow}>
          <UserIcon />
          <Text style={styles.infoText}>{course.teacher}</Text>
        </View>
        <View style={styles.infoRow}>
          <ClockIcon />
          <Text style={styles.infoText}>{course.time}</Text>
        </View>
        <View style={styles.infoRow}>
          <LocationIcon />
          <Text style={styles.infoText}>{course.location}</Text>
        </View>
      </View>

      <View style={styles.courseFooter}>
        <Text style={styles.creditText}>{course.credit} 学分</Text>
        {!isSelected ? (
          <View style={styles.capacityRow}>
            {isFullCourse(course) && (
              <>
                <Text style={styles.capacityText}>
                  已选 {course.enrolled}/{course.capacity}
                </Text>
                <Pressable
                  style={[
                    styles.selectButton,
                    course.enrolled >= course.capacity &&
                      styles.selectButtonDisabled,
                  ]}
                  onPress={() => handleSelectCourse(course)}
                  disabled={course.enrolled >= course.capacity}
                >
                  <Text style={styles.selectButtonText}>
                    {course.enrolled >= course.capacity ? "已满" : "选课"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <Pressable
            style={styles.dropButton}
            onPress={() => handleDropCourse(course.id)}
          >
            <Text style={styles.dropButtonText}>退课</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top || 0 }]}>
      {/* 搜索栏 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索课程名称、代码或教师"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tab 切换 */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === "available" && styles.tabActive]}
          onPress={() => setActiveTab("available")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "available" && styles.tabTextActive,
            ]}
          >
            可选课程
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "selected" && styles.tabActive]}
          onPress={() => setActiveTab("selected")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "selected" && styles.tabTextActive,
            ]}
          >
            已选课程 ({selectedCourses.length})
          </Text>
        </Pressable>
      </View>

      {/* 学分统计 */}
      {activeTab === "selected" && (
        <View style={styles.creditSummary}>
          <Text style={styles.creditSummaryText}>
            已选学分：<Text style={styles.creditHighlight}>{totalCredits}</Text>{" "}
            / 25
          </Text>
        </View>
      )}

      {/* 课程列表 */}
      <ScrollView
        style={styles.courseList}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "available"
          ? filteredCourses.map((course) => renderCourseCard(course))
          : selectedCourses.map((course) => renderCourseCard(course, true))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#374151",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#2563eb",
  },
  tabText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#2563eb",
  },
  creditSummary: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#dbeafe",
  },
  creditSummaryText: {
    fontSize: 15,
    color: "#374151",
  },
  creditHighlight: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 18,
  },
  courseList: {
    flex: 1,
    padding: 16,
  },
  courseCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  courseHeader: {
    marginBottom: 12,
  },
  courseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  courseCode: {
    fontSize: 13,
    color: "#9ca3af",
    marginRight: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryRequired: {
    backgroundColor: "#fee2e2",
  },
  categoryElective: {
    backgroundColor: "#dbeafe",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  courseName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1f2937",
  },
  courseInfo: {
    gap: 8,
    marginBottom: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
  },
  courseFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  creditText: {
    fontSize: 15,
    color: "#2563eb",
    fontWeight: "600",
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  capacityText: {
    fontSize: 13,
    color: "#9ca3af",
  },
  selectButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  dropButton: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  dropButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },
});
