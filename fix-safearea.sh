#!/bin/bash

# 批量修复 SafeAreaView 问题的脚本

FILES=(
  "app/dormitory.tsx"
  "app/tuition.tsx"
  "app/campus-network.tsx"
  "app/campus-run.tsx"
  "app/textbook-answers.tsx"
  "app/cet.tsx"
)

for file in "${FILES[@]}"; do
  echo "正在处理: $file"
  
  # 替换 SafeAreaView import
  perl -i -pe 's/from '\''react-native-safe-area-context'\'';/from '\''react-native-safe-area-context'\'';\nimport { useSafeAreaInsets } from '\''react-native-safe-area-context'\'';/' "$file"
  perl -i -pe 's/import \{ SafeAreaView \}/import \{ useSafeAreaInsets \}/' "$file"
  
  # 添加 insets 变量（在函数开始处）
  perl -i -pe 's/(export default function \w+\(\) \{)/\1\n  const insets = useSafeAreaInsets();/' "$file"
  
  # 替换 SafeAreaView 标签
  perl -i -pe 's/<SafeAreaView edges=\[\x27top\x27, \x27left\x27, \x27right\x27\] style=\{styles\.safeArea\}>/<View style=\[\{styles\.safeArea, \{ paddingTop: insets\.top \|\| 0 \}\}\]>/' "$file"
  perl -i -pe 's/<\/SafeAreaView>/<\/View>/' "$file"
  
  echo "✓ 完成: $file"
done

echo "所有文件已处理完成！"

