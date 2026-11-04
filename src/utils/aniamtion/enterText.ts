import gsap from 'gsap'

import { DURATION, EASE, reduceVars } from '@animation'

import { normalSplit, maskSplit } from '@utils/textSplit'
import type { split, SplitTarget } from '@utils/textSplit'

type SplitResult = ReturnType<typeof normalSplit>
type Targets = Element[]
/** 动画工厂：拿到最新拆出的元素产出动画，autoSplit 重拆后会再次调用 */
type AnimFactory = (targets: Targets) => gsap.core.Animation
/** 直接复用 textSplit 工厂的签名：onSplit 参数会自动带上，不必重复声明，也不用导入它的类型 */
type Splitter = typeof normalSplit

type AnimKind = 'enter' | 'leave'
type Direction = 'x' | 'y'
/** 调用方可传的输入：见 firstElement 的说明，集合只会取第一个元素 */
export type TextTarget = SplitTarget | HTMLCollection

interface AnimRecord {
  tl: gsap.core.Timeline
  kind: AnimKind
  factory: AnimFactory
}

interface Entry {
  split: SplitResult
  /** 每次调用登记一条；autoSplit 重拆后按各自工厂逐条重建 */
  anims: AnimRecord[]
}

const CLEAR_BASE = 'position,left,top,width,height,transform'
const CLEAR_WITH_OPACITY = `${CLEAR_BASE},opacity`

// 缓存已拆分元素的实例，避免同一元素重复拆分（SplitText 重复拆分会破坏已拆分的文本结构）
const cache = new WeakMap<Element, Entry>()

/**
 * 取出要操作的元素。
 *
 * 四个入口都只处理「第一个」元素 —— 返回的是一条 timeline，承载不了多个元素的结果，
 * 所以传集合时只取首个是刻意的。但必须真的能识别集合：早先只判断 `instanceof NodeList`，
 * 传数组或 HTMLCollection 时会被当成单个 Element 用，静默地什么都做不对。
 */
function firstElement(ele: TextTarget | null | undefined): Element | null {
  if (!ele) return null
  if (ele instanceof Element) return ele
  return ele[0] ?? null
}

/**
 * 等 webfont 就绪再拆字。
 */
export async function whenFontsReady(families: string[] = []): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return

  try {
    if (families.length) {
      await Promise.all(families.map((family) => document.fonts.load(`1em ${family}`)))
    }
    await document.fonts.ready
  } catch {
    console.log('当前浏览器或系统不支持网页字体，已自动降级')
    // TODO
  }
}

// 注意：这里都不带 overwrite。GSAP 的 overwrite: true 是「tween 一创建就立刻」
// 杀掉同目标的其他 tween，不等渲染 —— 同一元素上先入场后退场时，后者会把前者当场杀死。
function enterTween(
  targets: Targets,
  dir: Direction,
  stagger: number,
  delay: number,
  ease: string,
  clearProps: string,
): gsap.core.Tween {
  if (dir == 'y') {
    return gsap.fromTo(
      targets,
      reduceVars({ opacity: 0, y: 65 }),
      reduceVars({
        opacity: 1,
        y: 0,
        duration: DURATION.cinematic,
        ease,
        stagger,
        delay,
        onComplete: () => {
          gsap.set(targets, { clearProps })
        },
      }),
    )
  } else {
    return gsap.fromTo(
      targets,
      reduceVars({ xPercent: -100 }),
      reduceVars({
        opacity: 1,
        xPercent: 0,
        duration: DURATION.cinematic,
        ease,
        stagger,
        delay,
        onComplete: () => {
          gsap.set(targets, { clearProps })
        },
      }),
    )
  }
}

function leaveTween(
  targets: Targets,
  dir: Direction,
  stagger: number,
  delay: number,
  ease: string,
  clearProps: string,
): gsap.core.Tween {
  if (dir == 'y') {
    return gsap.to(
      targets,
      reduceVars({
        opacity: 0,
        y: -180,
        duration: DURATION.scene,
        ease,
        stagger,
        delay,
        onComplete: () => {
          gsap.set(targets, { clearProps })
        },
      }),
    )
  } else {
    return gsap.to(
      targets,
      reduceVars({
        xPercent: 100,
        duration: DURATION.scene,
        ease,
        stagger,
        delay,
        onComplete: () => {
          gsap.set(targets, { clearProps })
        },
      }),
    )
  }
}

/** 取得（或首次创建）某元素的拆分结果 */
function ensureSplit(el: Element, type: split, splitter: Splitter): Entry {
  const cached = cache.get(el)
  if (cached) return cached

  // splitter 内部的 onSplit 是同步触发的，那时 Entry 还没构造完，
  // 所以回调只闭包 anims 数组（它先于拆分就存在），不必绕一圈去引用 Entry。
  const anims: AnimRecord[] = []
  const split = splitter(el, type, (self) => {
    const targets = self[type]
    if (!targets.length) return

    for (const rec of anims) {
      const progress = rec.tl.progress() || 0
      rec.tl.clear().add(rec.factory(targets))
      rec.tl.progress(progress)
    }
  })

  const entry: Entry = { split, anims }
  cache.set(el, entry)
  return entry
}

function playAnimation(
  el: Element,
  type: split,
  kind: AnimKind,
  factory: AnimFactory,
  splitter: Splitter,
): gsap.core.Timeline | undefined {
  const entry = ensureSplit(el, type, splitter)
  const targets = entry.split[type]
  if (!targets.length) return undefined

  for (let i = entry.anims.length - 1; i >= 0; i--) {
    const rec = entry.anims[i]!
    if (rec.kind === kind) {
      rec.tl.kill()
      entry.anims.splice(i, 1)
    }
  }

  const tl = gsap.timeline()
  tl.add(factory(targets))
  entry.anims.push({ tl, kind, factory })
  return tl
}

/**
 * 统一的入口：解析元素 → 拆字 → 登记动画。
 *
 * 返回的 timeline **创建即播放**（不是 paused），调用方再写 `.play()` 是多余但无害的；
 * 元素不存在、或拆分结果为空时返回 undefined，调用方务必用 `?.` 接。
 */
function run(
  ele: TextTarget,
  type: split,
  kind: AnimKind,
  factory: AnimFactory,
  splitter: Splitter,
): gsap.core.Timeline | undefined {
  const el = firstElement(ele)
  if (!el) return undefined
  return playAnimation(el, type, kind, factory, splitter)
}

/** 文字入场：拆字 + 逐个淡入上移 */
export function textEnter(ele: TextTarget, type: split, dir: Direction, stagger = 0, delay = 0) {
  return run(
    ele,
    type,
    'enter',
    (targets) => enterTween(targets, dir, stagger, delay, EASE.out, CLEAR_BASE),
    normalSplit,
  )
}

export function textLeave(ele: TextTarget, type: split, dir: Direction, stagger = 0, delay = 0) {
  return run(
    ele,
    type,
    'leave',
    (targets) => leaveTween(targets, dir, stagger, delay, EASE.out, CLEAR_BASE),
    normalSplit,
  )
}

export function textEnterMask(
  ele: TextTarget,
  type: split,
  dir: Direction,
  stagger = 0,
  delay = 0,
) {
  return run(
    ele,
    type,
    'enter',
    (targets) => enterTween(targets, dir, stagger, delay, EASE.outStrong, CLEAR_WITH_OPACITY),
    maskSplit,
  )
}

export function textLeaveMask(
  ele: TextTarget,
  type: split,
  dir: Direction,
  stagger = 0,
  delay = 0,
) {
  return run(
    ele,
    type,
    'leave',
    (targets) => leaveTween(targets, dir, stagger, delay, EASE.in, CLEAR_BASE),
    maskSplit,
  )
}
