import gsap from 'gsap'

import { DURATION, EASE, prefersReducedMotion } from '@animation'

/**
 * 图片进场：斜向进入转竖直展开 + 缩小。
 */
export function imageLeftEnter(ele: Element) {
  // 降级：不设任何 clip-path，元素以完整矩形直接显示。
  if (prefersReducedMotion()) return gsap.timeline()

  gsap.set(ele, {
    clipPath: 'polygon(100% 0%, 100% 100%, 100% 100%, 100% 0%)',
  })

  const imageTl = gsap.timeline()

  imageTl.to(ele, {
    duration: DURATION.scene,
    clipPath: 'polygon(100% 0%, 100% 100%, 80% 100%, 40% 0%)',
    ease: EASE.in,
  })

  imageTl.to(ele, {
    clipPath: 'polygon(100% 0%, 100% 100%, 0% 100%, 0% 0%)',
    ease: EASE.outStrong,
  })

  imageTl.from(
    ele,
    {
      duration: DURATION.scene + 0.5,
      scale: 2,
      ease: EASE.outSoft,
    },
    0,
  )

  imageTl.pause()

  return imageTl
}
