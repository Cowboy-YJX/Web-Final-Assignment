/**
 * 全站动效令牌（JS 侧）。
 *
 * 设计原则：
 * 1. **按叙事重量命名，不按毫秒数命名。**
 * 2. **只允许在这些档位里取值。**
 * 3. **CSS 侧有一份镜像。**（src/style/motion.css）
 */

/**
 * 时长档位。
 */
export const DURATION = {
  /** 状态回执：按钮按下、开关翻转。用户需要「立刻」看到反应，超过 150ms 就觉得钝 */
  instant: 0.12,
  /** 微交互：悬浮、聚焦、图标微弹 */
  fast: 0.24,
  /** 常规入场：元素级淡入、卡片浮现。全站用得最多的一档 */
  base: 0.4,
  /** 段落级：一块内容整体就位、面板展开 */
  slow: 0.6,
  /** 场景级：整屏叙事推进、大图展开 */
  scene: 0.9,
  /** 电影级：只留给首屏 Hero 和开场。整站用超过三处就会显得拖沓 */
  cinematic: 1.5,
} as const

export type DurationToken = keyof typeof DURATION

/**
 * 缓动档位。
 */
export const EASE = {
  /** 进度条、阻尼跟随、跑马灯：不要任何缓动倾向 */
  linear: 'none',
  /** 默认入场：起手快、收尾柔，最像「东西自然地停下」 */
  out: 'power2.out',
  /** 强入场：比 out 更果断，用于需要「砸」下来的元素 */
  outStrong: 'power3.out',
  /** 弱入场：大面积、高对比的元素（大图、整屏）用它，太强会让人晕 */
  outSoft: 'power1.out',
  /** 离场：加速消失。和 out 配合形成「进慢出快」的呼吸感 */
  in: 'power2.in',
  /** 双向：展开 / 收起、从 A 位移到 B */
  inOut: 'power2.inOut',
  /** 呼吸：循环往复的漂浮、脉动。正弦比 power 曲线更适合循环，首尾没有折角 */
  breathe: 'sine.inOut',
  /** 刚体回落：带一点过冲，用在「有重量」的部件上 */
  spring: 'back.out(1.7)',
  /** 轻微回弹：小图标、小标签、按钮松开 */
  springSoft: 'back.out(1.2)',
  /** 强回弹：只用于卡通感的元素（比如鲸鲸），别挂在正经内容上 */
  springHard: 'back.out(2.6)',
} as const

export type EaseToken = keyof typeof EASE

/** 同组元素依次入场的间隔（秒） */
export const STAGGER = {
  /** 字符级：标题逐字浮现 */
  char: 0.03,
  /** 词级 */
  word: 0.06,
  /** 卡片级：网格里一张张浮起 */
  card: 0.08,
  /** 段落级 */
  block: 0.12,
  /** 大块：整屏元素依次登场。再大就会显得是在等加载 */
  scene: 0.18,
} as const

export type StaggerToken = keyof typeof STAGGER

/**
 * 位移距离（px）。
 *
 * 降级模式下会被统一归零（见 motion.ts 的 distance()）
 */
export const SHIFT = {
  /** 微：图标、标签的内部位移 */
  micro: 8,
  /** 小：卡片浮起、提示气泡 */
  small: 24,
  /** 中：文字段落整体上移 */
  medium: 48,
  /** 大：图片、整块内容入场 */
  large: 120,
} as const

export type ShiftToken = keyof typeof SHIFT

/**
 * 把一个档位名或裸数字统一成秒数。
 *
 * 组件里既有人传 `'slow'`，也有人手上只有算出来的 0.63 —— 让两边都能进同一套体系。
 */
export function durationOf(value: DurationToken | number): number {
  return typeof value === 'number' ? value : DURATION[value]
}

/** 同上，缓动版 */
export function easeOf(value: EaseToken | string): string {
  return value in EASE ? EASE[value as EaseToken] : value
}
