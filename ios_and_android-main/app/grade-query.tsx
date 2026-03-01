import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

// 学期数据
const semesters = [
  { id: "2024-1", name: "2024-2025学年第一学期" },
  { id: "2023-2", name: "2023-2024学年第二学期" },
  { id: "2023-1", name: "2023-2024学年第一学期" },
];

// 成绩数据
const mockGrades = [
  {
    id: "1",
    courseCode: "CS101",
    courseName: "计算机导论",
    credit: 3,
    score: 92,
    gpa: 4.0,
    type: "必修",
    status: "正常",
  },
  {
    id: "2",
    courseCode: "CS201",
    courseName: "数据结构",
    credit: 4,
    score: 88,
    gpa: 3.7,
    type: "必修",
    status: "正常",
  },
  {
    id: "3",
    courseCode: "MATH101",
    courseName: "高等数学",
    credit: 5,
    score: 85,
    gpa: 3.3,
    type: "必修",
    status: "正常",
  },
  {
    id: "4",
    courseCode: "ENG101",
    courseName: "大学英语",
    credit: 2,
    score: 90,
    gpa: 4.0,
    type: "必修",
    status: "正常",
  },
  {
    id: "5",
    courseCode: "PE101",
    courseName: "体育",
    credit: 1,
    score: 95,
    gpa: 4.0,
    type: "必修",
    status: "正常",
  },
  {
    id: "6",
    courseCode: "CS301",
    courseName: "算法设计",
    credit: 3,
    score: 87,
    gpa: 3.7,
    type: "选修",
    status: "正常",
  },
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

function MedalIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15a6 6 0 100-12 6 6 0 000 12z"
        stroke="#f59e0b"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 15v6M8 21h8"
        stroke="#f59e0b"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function GradeQueryScreen() {
  const insets = useSafeAreaInsets();
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]);
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);

  // 计算统计数据
  const totalCredits = mockGrades.reduce((sum, g) => sum + g.credit, 0);
  const weightedGpa =
    mockGrades.reduce((sum, g) => sum + g.gpa * g.credit, 0) / totalCredits;
  const avgScore =
    mockGrades.reduce((sum, g) => sum + g.score, 0) / mockGrades.length;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#22c55e";
    if (score >= 80) return "#3b82f6";
    if (score >= 70) return "#f59e0b";
    if (score >= 60) return "#f97316";
    return "#ef4444";
  };

  const getScoreLevel = (score: number) => {
    if (score >= 90) return "优秀";
    if (score >= 80) return "良好";
    if (score >= 70) return "中等";
    if (score >= 60) return "及格";
    return "不及格";
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top || 0 }]}>
      {/* 学期选择 */}
      <View style={styles.header}>
        <Pressable
          style={styles.semesterSelector}
          onPress={() => setShowSemesterPicker(true)}
        >
          <Text style={styles.semesterText}>{selectedSemester.name}</Text>
          <ChevronDownIcon />
        </Pressable>
      </View>

      {/* 统计卡片 */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgScore.toFixed(1)}</Text>
          <Text style={styles.statLabel}>平均分</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{weightedGpa.toFixed(2)}</Text>
          <Text style={styles.statLabel}>平均绩点</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCredits}</Text>
          <Text style={styles.statLabel}>总学分</Text>
        </View>
      </View>

      {/* 成绩列表 */}
      <ScrollView style={styles.gradeList} showsVerticalScrollIndicator={false}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>课程成绩</Text>
          <Text style={styles.listSubtitle}>共 {mockGrades.length} 门课程</Text>
        </View>

        {mockGrades.map((grade) => (
          <View key={grade.id} style={styles.gradeCard}>
            <View style={styles.gradeHeader}>
              <View style={styles.courseInfo}>
                <Text style={styles.courseCode}>{grade.courseCode}</Text>
                <Text style={styles.courseName}>{grade.courseName}</Text>
              </View>
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: getScoreColor(grade.score) + "20" },
                ]}
              >
                <Text
                  style={[
                    styles.scoreText,
                    { color: getScoreColor(grade.score) },
                  ]}
                >
                  {grade.score}
                </Text>
              </View>
            </View>

            <View style={styles.gradeDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>学分</Text>
                <Text style={styles.detailValue}>{grade.credit}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>绩点</Text>
                <Text style={styles.detailValue}>{grade.gpa.toFixed(1)}</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>等级</Text>
                <Text style={styles.detailValue}>
                  {getScoreLevel(grade.score)}
                </Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>类型</Text>
                <Text style={styles.detailValue}>{grade.type}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* 成绩说明 */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>成绩等级说明</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#22c55e" }]}
              />
              <Text style={styles.legendText}>优秀 (90-100)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#3b82f6" }]}
              />
              <Text style={styles.legendText}>良好 (80-89)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#f59e0b" }]}
              />
              <Text style={styles.legendText}>中等 (70-79)</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#f97316" }]}
              />
              <Text style={styles.legendText}>及格 (60-69)</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 学期选择弹窗 */}
      {showSemesterPicker && (
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setShowSemesterPicker(false)}
        >
          <View style={styles.pickerContent}>
            <Text style={styles.pickerTitle}>选择学期</Text>
            {semesters.map((semester) => (
              <Pressable
                key={semester.id}
                style={[
                  styles.pickerOption,
                  selectedSemester.id === semester.id &&
                    styles.pickerOptionActive,
                ]}
                onPress={() => {
                  setSelectedSemester(semester);
                  setShowSemesterPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    selectedSemester.id === semester.id &&
                      styles.pickerOptionTextActive,
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
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2563eb",
  },
  statLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },
  gradeList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  listSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
  },
  gradeCard: {
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
  gradeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 2,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  scoreBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "700",
  },
  gradeDetails: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  detailDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#e5e7eb",
  },
  legendContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 24,
  },
  legendTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: "#6b7280",
  },
  pickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  pickerOptionActive: {
    backgroundColor: "#eff6ff",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  pickerOptionTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 18,
    color: "#2563eb",
    fontWeight: "600",
  },
});
