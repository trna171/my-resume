import { useMemo } from "react";

// ============================================================
// 背景浮动表情配置
// ------------------------------------------------------------
// 想调整表情？只需编辑下方 USE_EMOJIS 数组：
//   - 保留想要的表情，删除不合适的（用 // 注释掉即可）
//   - 需要更多可选项可参考 EMOJI_POOL 表情池
// 组件会按 USE_EMOJIS 的顺序循环取用表情。
// ============================================================

// 完整表情池（按类别整理，可按需挑选）
const EMOJI_POOL = {
  // 实验 / 科研
  lab: ["🧪", "🔬", "🧬", "🧫", "🥼", "🧤", "🧪"],
  // 数据 / 分析
  data: ["📊", "📈", "📉", "🧮", "💻", "🖥️", "⌨️"],
  // 学习 / 记录
  study: ["📚", "📝", "📖", "✏️", "🗂️", "📁", "📎"],
  // 生活 / 兴趣
  life: ["✈️", "📷", "🎧", "🎨", "☕", "🌱", "🎯", "🏃", "🧘", "🍵"],
  // 其他
  other: ["💡", "🔭", "⭐", "✨", "🌈", "🎈", "🎉", "💪", "🤔", "😊"]
};

// 当前启用的表情（编辑这里即可选择要显示的表情）
const USE_EMOJIS = [
  // --- 实验 / 科研 ---
  "🧪", // 试管
  "🔬", // 显微镜
  "🧬", // DNA
  // --- 数据 / 分析 ---
  "📊", // 图表
  // --- 学习 / 记录 ---
  "📚", // 书本
  "📝", // 笔记
  // --- 生活 / 兴趣 ---
  "✈️", // 旅行
  "📷", // 摄影
  "☕", // 咖啡
  // --- 其他 ---
  "✨", // 闪光
  "😊", // 微笑
  "🎉", // 庆祝
  "⭐", // 星星
  "🌈" // 彩虹
];

function FloatingEmojis({ count = 14, emojis = USE_EMOJIS }) {
  // 生成随机位置/大小/延迟/时长的表情（仅挂载时生成一次）
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: emojis[i % emojis.length],
        left: Math.random() * 96,          // 2% ~ 98%
        top: Math.random() * 90,           // 5% ~ 95%
        size: 34,                          // 统一大小 34px
        delay: 0,                          // 无延迟，同步开始浮动
        duration: 5 + Math.random() * 5,   // 5 ~ 10s 周期
        drift: 40 + Math.random() * 60,    // 浮动幅度 40 ~ 100px（大幅浮动）
        opacity: 0.12 + Math.random() * 0.2 // 12% ~ 32%
      })),
    [count, emojis]
  );

  return (
    <div className="floating-emoji-bg" aria-hidden="true">
      {items.map((item) => (
        <span
          key={item.id}
          className="floating-emoji"
          style={{
            left: `${item.left}%`,
            top: `${item.top}%`,
            fontSize: `${item.size}px`,
            animationDelay: `${item.delay}s`,
            animationDuration: `${item.duration}s`,
            opacity: item.opacity,
            "--drift": `${item.drift}px`
          }}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}

export default FloatingEmojis;
export { EMOJI_POOL, USE_EMOJIS };
