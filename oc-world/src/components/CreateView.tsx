import { useState } from "react";
import { IconArrowUp, IconCheck, IconRefresh, IconSparkle } from "./OcWorldIcons";
import { OcAvatarLarge } from "./OcAvatar";
import { ViewHeader } from "./ViewHeader";

const personalityTags = [
  { id: "傲娇", label: "傲娇" },
  { id: "温柔", label: "温柔" },
  { id: "毒舌", label: "毒舌" },
  { id: "元气", label: "元气" },
  { id: "慵懒", label: "慵懒" },
  { id: "知性", label: "知性" },
  { id: "腹黑", label: "腹黑" },
  { id: "天然呆", label: "天然呆" },
];

const appearanceTags = [
  { id: "水母", label: "水母" },
  { id: "猫系", label: "猫系" },
  { id: "犬系", label: "犬系" },
  { id: "精灵", label: "精灵" },
  { id: "幽灵", label: "幽灵" },
  { id: "机械", label: "机械" },
  { id: "植物", label: "植物" },
  { id: "龙族", label: "龙族" },
];

const toneTags = [
  { id: "日语二次元", label: "日语二次元" },
  { id: "东北话", label: "东北话" },
  { id: "文言文", label: "文言文" },
  { id: "英语", label: "英语" },
  { id: "程序员", label: "程序员" },
  { id: "诗人", label: "诗人" },
];

type Step = "name" | "customize" | "preview";

export function CreateView({
  onSave,
  onCancel,
}: {
  onSave: (data: { name: string; personality: string; catchphrase: string; relationshipSetup: string; avatarPath?: string }) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [selectedPersonality, setSelectedPersonality] = useState<Set<string>>(new Set());
  const [selectedAppearance, setSelectedAppearance] = useState<Set<string>>(new Set());
  const [selectedTone, setSelectedTone] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>("");
  const [savedAvatarPath, setSavedAvatarPath] = useState<string>("");

  const toggleTag = (set: Set<string>, tag: string) => {
    const next = new Set(set);
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    return next;
  };

  const generatePersonality = (): string => {
    const parts: string[] = [];
    if (selectedPersonality.size > 0) parts.push([...selectedPersonality].join("、"));
    if (selectedTone) parts.push(`说话风格像${selectedTone}`);
    if (prompt.trim()) parts.push(prompt.trim());
    return parts.join("，") || "友善、安静、偶尔关心人";
  };

  const generateCatchphrase = (): string => {
    if (selectedTone === "日语二次元") return "哼，才不是因为在意你呢。";
    if (selectedTone === "东北话") return "哎呀妈呀，你可别整那出了。";
    if (selectedTone === "文言文") return "且听我一言。";
    if (selectedTone === "程序员") return "这个需求我评估一下。";
    if (selectedTone === "诗人") return "风带来你的消息。";
    return "嗯，我在。";
  };

  const buildImagePrompt = (): string => {
    const parts: string[] = [
      `A cute anime-style avatar portrait of an original character named "${name}"`,
    ];
    if (selectedAppearance.size > 0) {
      parts.push(`race/appearance: ${[...selectedAppearance].join(", ")}`);
    }
    if (selectedPersonality.size > 0) {
      parts.push(`personality: ${[...selectedPersonality].join(", ")}`);
    }
    if (selectedTone) {
      parts.push(`vibe: ${selectedTone}`);
    }
    if (prompt.trim()) {
      parts.push(prompt.trim());
    }
    parts.push("simple clean background, bust-up portrait, soft colors, high quality");
    return parts.join(". ");
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError("");
    try {
      if (!window.ocWorld) {
        throw new Error("IPC not available");
      }
      const result = await window.ocWorld.imageGen.generate({ prompt: buildImagePrompt() });
      setAvatarDataUrl(`data:${result.mimeType};base64,${result.imageBase64}`);
      if (result.savedPath) {
        setSavedAvatarPath(result.savedPath);
      }
      setStep("preview");
    } catch (error) {
      setGenError(error instanceof Error ? error.message : "生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  if (step === "name") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <ViewHeader title="创建你的 OC" right={
          <button type="button" onClick={onCancel} style={{ background: "transparent", border: "none", color: "var(--ink-muted)", fontSize: 13, cursor: "pointer" }}>跳过</button>
        } />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 56px", gap: 32 }}>
          <OcAvatarLarge size={120} name={name || undefined} />
          <div style={{ textAlign: "center" }}>
            <div className="serif" style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink)" }}>
              给 TA 起个名字
            </div>
            <div style={{ marginTop: 8, fontSize: 13, color: "var(--ink-muted)" }}>
              这会是你在 OCWORLD 里的伙伴
            </div>
          </div>
          <div style={{ width: "100%", maxWidth: 400 }}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入名字..."
              autoFocus
              style={{
                width: "100%", padding: "14px 18px", fontSize: 18,
                border: "0.5px solid var(--line)", borderRadius: 12,
                background: "var(--bg-card)", color: "var(--ink)",
                outline: "none", textAlign: "center",
              }}
            />
          </div>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => setStep("customize")}
            style={{
              padding: "12px 40px", borderRadius: 10, border: "none",
              background: name.trim() ? "oklch(0.78 0.10 220)" : "oklch(0.92 0.01 240)",
              color: name.trim() ? "#fff" : "var(--ink-faint)",
              fontSize: 14, fontWeight: 600, cursor: name.trim() ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            下一步
            <IconArrowUp size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (step === "customize") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
        <ViewHeader title={`塑造 ${name} 的性格`} right={
          <button type="button" onClick={onCancel} style={{ background: "transparent", border: "none", color: "var(--ink-muted)", fontSize: 13, cursor: "pointer" }}>跳过</button>
        } />
        <div style={{ flex: 1, maxWidth: 640, width: "100%", margin: "0 auto", padding: "32px 56px 60px", overflowY: "auto" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
            <OcAvatarLarge size={80} name={name} />
            <div className="serif" style={{ marginTop: 14, fontSize: 24, fontWeight: 500 }}>{name}</div>
          </div>

          <TagSection
            title="性格特质"
            subtitle="选择 1-3 个标签定义 TA 的性格"
            tags={personalityTags}
            selected={selectedPersonality}
            onToggle={(tag) => setSelectedPersonality((prev) => toggleTag(prev, tag))}
            max={3}
          />

          <TagSection
            title="种族 / 外观"
            subtitle="TA 是什么生物？"
            tags={appearanceTags}
            selected={selectedAppearance}
            onToggle={(tag) => setSelectedAppearance((prev) => toggleTag(prev, tag))}
            max={2}
          />

          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>说话风格</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 12 }}>TA 怎么跟你说话？</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {toneTags.map((tag) => (
                <TagButton
                  key={tag.id}
                  label={tag.label}
                  active={selectedTone === tag.id}
                  onClick={() => setSelectedTone((prev) => prev === tag.id ? "" : tag.id)}
                />
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>补充描述</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 12 }}>用你自己的话描述 TA</div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`比如："${name} 是一个会在我熬夜时提醒我睡觉的角色..."`}
              rows={3}
              style={{
                width: "100%", padding: "12px 14px", fontSize: 13,
                border: "0.5px solid var(--line)", borderRadius: 10,
                background: "var(--bg-card)", color: "var(--ink)",
                outline: "none", resize: "none", lineHeight: 1.55,
              }}
            />
          </div>

          {genError && (
            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "oklch(0.95 0.04 25)", color: "oklch(0.40 0.10 25)", fontSize: 12 }}>{genError}</div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            style={{
              width: "100%", padding: "14px", borderRadius: 10, border: "none",
              background: "oklch(0.78 0.10 220)", color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {isGenerating ? (
              <>
                <IconRefresh size={16} style={{ animation: "spin 1s linear infinite" }} />
                正在生成 {name} 的形象...
              </>
            ) : (
              <>
                <IconSparkle size={16} />
                生成 {name} 的形象
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // step === "preview"
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto" }}>
      <ViewHeader title="确认你的 OC" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 56px", gap: 24 }}>
        {avatarDataUrl ? (
          <div style={{ width: 160, height: 160, borderRadius: "50%", overflow: "hidden", boxShadow: "0 8px 40px rgba(15,30,55,.12)" }}>
            <img src={avatarDataUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        ) : (
          <OcAvatarLarge size={160} name={name} />
        )}
        <div className="serif" style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em" }}>{name}</div>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.6 }}>
            {generatePersonality()}
          </div>
          <div style={{ marginTop: 12, padding: "10px 16px", borderRadius: 10, background: "oklch(0.96 0.04 175)", color: "oklch(0.32 0.07 175)", fontSize: 13, fontStyle: "italic" }}>
            「{generateCatchphrase()}」
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setStep("customize")}
            style={{
              padding: "12px 28px", borderRadius: 10,
              border: "0.5px solid var(--line)", background: "var(--bg-card)",
              color: "var(--ink)", fontSize: 14, fontWeight: 500, cursor: "pointer",
            }}
          >
            重新调整
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({
                name,
                personality: generatePersonality(),
                catchphrase: generateCatchphrase(),
                relationshipSetup: `${name} 是你在 OCWORLD 的 OC 伙伴`,
                avatarPath: savedAvatarPath || undefined,
              });
            }}
            style={{
              padding: "12px 28px", borderRadius: 10, border: "none",
              background: "oklch(0.78 0.10 220)", color: "#fff",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <IconCheck size={16} />
            就是 TA 了
          </button>
        </div>
      </div>
    </div>
  );
}

function TagSection({
  title,
  subtitle,
  tags,
  selected,
  onToggle,
  max,
}: {
  title: string;
  subtitle: string;
  tags: Array<{ id: string; label: string }>;
  selected: Set<string>;
  onToggle: (tag: string) => void;
  max: number;
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 12 }}>{subtitle}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tags.map((tag) => {
          const active = selected.has(tag.id);
          const disabled = !active && selected.size >= max;
          return (
            <TagButton
              key={tag.id}
              label={tag.label}
              active={active}
              disabled={disabled}
              onClick={() => !disabled && onToggle(tag.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function TagButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "6px 14px", borderRadius: 8,
        border: active ? "none" : "0.5px solid var(--line)",
        background: active ? "oklch(0.78 0.10 220)" : disabled ? "var(--bg-soft)" : "var(--bg-card)",
        color: active ? "#fff" : disabled ? "var(--ink-faint)" : "var(--ink-muted)",
        fontSize: 12.5, fontWeight: active ? 600 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all .15s",
      }}
    >
      {active && <span style={{ marginRight: 4 }}>✓</span>}
      {label}
    </button>
  );
}
