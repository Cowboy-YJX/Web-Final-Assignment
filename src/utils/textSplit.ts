import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'
gsap.registerPlugin(SplitText)

export type split = 'chars' | 'words' | 'lines'

/** 可拆分的输入：单个元素、数组、NodeList、HTMLCollection */
export type SplitTarget = Element | NodeListOf<Element> | Array<Element>

/**
 * autoSplit 重拆后的回调，拿到的是新的 SplitText 实例。
 * 单开 autoSplit 是不够的：重拆会换掉全部拆分元素，必须靠这个回调基于新元素重建动画。
 */
export type OnSplit = (self: SplitText) => void

export function normalSplit(ele: SplitTarget, split: split, onSplit?: OnSplit) {
  return SplitText.create(ele, {
    type: split,
    autoSplit: true,
    reduceWhiteSpace: false,
    onSplit,
  })
}

/**
 * 带自定义类名的拆分。
 * plusPlus 为 true 时类名带上 `++` 后缀，由 GSAP 生成自增编号（cls-1、cls-2 …）。
 */
export function classSplit(
  ele: SplitTarget,
  split: split,
  className: string,
  plusPlus = false,
  onSplit?: OnSplit,
) {
  const cls = plusPlus ? `${className}++` : className

  switch (split) {
    case 'chars':
      return SplitText.create(ele, {
        type: split,
        charsClass: cls,
        autoSplit: true,
        reduceWhiteSpace: false,
        onSplit,
      })
    case 'words':
      return SplitText.create(ele, {
        type: split,
        wordsClass: cls,
        autoSplit: true,
        reduceWhiteSpace: false,
        onSplit,
      })
    default:
      return SplitText.create(ele, {
        type: split,
        linesClass: cls,
        autoSplit: true,
        reduceWhiteSpace: false,
        onSplit,
      })
  }
}

/**
 * 遮罩式拆分：拆分元素外面再套一层 overflow:hidden 的容器，
 */
export function maskSplit(ele: SplitTarget, split: split, onSplit?: OnSplit) {
  return SplitText.create(ele, {
    type: split,
    mask: split,
    autoSplit: true,
    reduceWhiteSpace: false,
    onSplit,
  })
}
