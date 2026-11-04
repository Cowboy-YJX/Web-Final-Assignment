import { DURATION, EASE } from '@animation'
import gsap from 'gsap'

export function iconSpin(ele: Element, angle?: number) {
  const spin = gsap.to(ele, {
    rotate: angle ?? 360,
    transformOrigin: 'center center',
    duration: DURATION.slow,
    ease: EASE.outSoft,
    clear: 'rotate',
  })
  spin.pause(0)
  return spin
}

export function iconShake(ele: Element) {
  const shake = gsap.to(ele, {
    keyframes: {
      rotate: ['0', '-15', '0', '15', '0'],
    },
    duration: DURATION.base,
    ease: EASE.linear,
  })
  shake.pause(0)
  return shake
}
