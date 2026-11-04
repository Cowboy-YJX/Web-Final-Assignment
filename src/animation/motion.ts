import gsap from 'gsap'

/**
 * 动效降级层。
 * 统一出路：用 motionScope() 包住整段动画声明，
 * 系统设置一旦变化，GSAP 会自动 revert 旧的一套、按新条件重跑，不用手动监听。
 */

/** 系统「减少动态效果」偏好 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
/** 与之互补的查询。真实浏览器里两者必有一个为 true */
const NO_PREFERENCE_QUERY = '(prefers-reduced-motion: no-preference)'

/**
 * 降级模式下的「瞬时」时长。
 * 用 0.001 而不是 0：动画仍然会被创建并跑完一帧，`onComplete` 照常触发，
 */
const INSTANT = 0.001

/** MediaQueryList 缓存。用 undefined 当「尚未探测」的哨兵，null 表示环境不支持 */
let mediaCache: MediaQueryList | null | undefined

function motionMediaQuery(): MediaQueryList | null {
  if (mediaCache !== undefined) return mediaCache

  const usable = typeof window !== 'undefined' && typeof window.matchMedia === 'function'

  mediaCache = usable ? window.matchMedia(REDUCED_MOTION_QUERY) : null
  return mediaCache
}

/**
 * 当前是否要求减少动态效果。
 *
 * 用于「必须在 JS 里当场判断、来不及建 scope」的场景（比如路由守卫里决定要不要播转场）。
 * 其余情况请用 motionScope()，不要拿这个返回值自己写 if —— 那样系统设置中途变化时不会重新计算。
 */
export function prefersReducedMotion(): boolean {
  return motionMediaQuery()?.matches ?? false
}

/**
 * 环境是否真的会评估 prefers-reduced-motion。
 *
 * jsdom、老 Safari 之类会返回「两个查询都 false」，此时若照常建 matchMedia，
 * 回调一次都不会触发，动画全部静默失效——测试里表现为组件不初始化。
 * 探测到这种情况就退回「始终按允许动效处理」，行为确定且可预测。
 */
function supportsReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false

  const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
  const noPreference = window.matchMedia(NO_PREFERENCE_QUERY).matches

  return reduced !== noPreference
}

/**
 * 交给动画声明的上下文。
 *
 * 不要在回调外面读 `reduced` 存起来复用：系统设置变化时 GSAP 会重新执行回调，
 * 每次都拿新的上下文。存到闭包外部就会一直用第一次的旧值。
 */
export interface MotionScopeContext {
  /** 当前是否处于降级模式 */
  reduced: boolean
  /** 时长：降级时压到瞬时，正常时原样返回 */
  duration: (seconds: number) => number
  /** 位移：降级时归零，正常时原样返回 */
  distance: (px: number) => number
  /** 仅在允许动效时执行。**不可用它包住「让元素从隐藏变可见」的动画**，降级时元素会卡住 */
  whenMotion: <T>(build: () => T) => T | undefined
  /** 仅在降级模式执行 */
  whenReduced: <T>(build: () => T) => T | undefined
}

/** motionScope() 的返回值：组件卸载时调 revert() 即可清干净 */
export interface MotionScope {
  /** 撤销该作用域内创建的全部动画、ScrollTrigger 与内联样式 */
  revert: () => void
}

const NOOP_SCOPE: MotionScope = { revert: () => {} }

function makeContext(reduced: boolean): MotionScopeContext {
  return {
    reduced,
    duration: (seconds) => (reduced ? INSTANT : seconds),
    distance: (px) => (reduced ? 0 : px),
    whenMotion: (build) => (reduced ? undefined : build()),
    whenReduced: (build) => (reduced ? build() : undefined),
  }
}

/**
 * 创建一条受 `prefers-reduced-motion` 管控的 GSAP 作用域。
 *
 * const scope = motionScope(({ duration, distance, reduced }) => {
 *   gsap.fromTo(el, { opacity: 0, y: distance(SHIFT.medium) },
 *     { opacity: 1, y: 0, duration: duration(DURATION.slow), ease: EASE.out })
 * })
 * onUnmounted(() => scope.revert())
 *
 * @param build 动画声明。可以在里面写 gsap.to / fromTo / timeline / ScrollTrigger.create
 */
export function motionScope(build: (context: MotionScopeContext) => void): MotionScope {
  // 环境不评估该媒体特性（jsdom / 老引擎）：直接按「允许动效」跑一次，
  // 不建立 matchMedia —— 否则回调永远不触发，动画会静默消失。
  if (!supportsReducedMotion()) {
    build(makeContext(false))
    return NOOP_SCOPE
  }

  const mm = gsap.matchMedia()

  mm.add(
    {
      // 两个条件是互补的，回调必然执行且 conditions 里恰好一个为 true
      allowMotion: NO_PREFERENCE_QUERY,
      reduceMotion: REDUCED_MOTION_QUERY,
    },
    (context) => {
      const conditions = context.conditions
      build(makeContext(conditions?.reduceMotion === true))
    },
  )

  return {
    // MatchMedia.revert() 会连带 revert 其名下所有 Context 的动画与 ScrollTrigger
    revert: () => mm.revert(),
  }
}

/**
 * 给「动画是在回调里临时决定要播」的场景用（比如 watch 里按数据变化重建动画，
 * 建不了长生命周期的 motionScope）：按当前偏好把时长与位移就地折叠。
 *
 * 能不用就不用——它在调用那一刻求值一次，系统设置中途变化时不会重算。
 */
export function reduceVars(vars: gsap.TweenVars): gsap.TweenVars {
  if (!prefersReducedMotion()) return vars

  const next: gsap.TweenVars = { ...vars, duration: INSTANT }

  // 位移 / 旋转 / 斜切归零：减少动态效果的用户真正反感的是「移动」，不是「淡入」
  for (const key of ['x', 'y', 'xPercent', 'yPercent', 'rotation', 'skewX', 'skewY'] as const) {
    if (key in next) next[key] = 0
  }

  // 缩放必须归 1 而不是 0 —— 归零会把元素直接缩没
  if ('scale' in next) next.scale = 1

  return next
}
