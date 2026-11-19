<script setup lang="ts" name="LoadingPage">
import gsap from 'gsap'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { DURATION, EASE } from '@animation'
gsap.registerPlugin(MorphSVGPlugin)

import { useGloballAnimationStore } from '@stores/globallAnimation'

import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

const { isLoading, isTransition } = storeToRefs(useGloballAnimationStore())

const greenBlock = ref<HTMLElement | null>(null)
const blackBlock = ref<HTMLElement | null>(null)
const loadingIcon = ref<Element | null>(null)

let exitTl: GSAPTimeline | null = null
let transitionTl: GSAPTimeline | null = null
let loadingRotate: GSAPTimeline | null = null

onMounted(() => {
  if (!greenBlock.value) return
  if (!blackBlock.value) return
  if (!loadingIcon.value) return

  exitTl = gsap.timeline()
  exitTl.to(blackBlock.value, {
    xPercent: -100,
    borderRadius: 120,
    duration: DURATION.slow,
    ease: EASE.outSoft,
  })
  exitTl.to(
    greenBlock.value,
    {
      xPercent: -100,
      borderRadius: 40,
      duration: DURATION.slow,
      ease: EASE.out,
      onComplete: () => {
        gsap.set([greenBlock.value, blackBlock.value], {
          xPercent: 100,
        })
      },
    },
    '-=0.3',
  )
  exitTl.pause()

  transitionTl = gsap.timeline({ paused: true })
  transitionTl.to(greenBlock.value, {
    xPercent: 0,
    borderRadius: 0,
    duration: DURATION.slow,
    ease: EASE.outSoft,
    onComplete: () => {
      // 绿幕第一次完全盖住屏幕；路由守卫在这里回顶，此时新页面还没挂载
      window.dispatchEvent(new Event('app:transition-green-covered'))
    },
  })
  transitionTl.to(
    blackBlock.value,
    {
      xPercent: 0,
      borderRadius: 0,
      duration: DURATION.slow,
      ease: EASE.out,
    },
    '-=0.3',
  )
  // 幕布完全盖住的时刻通知 router，路由在这之后才切换
  transitionTl.call(() => {
    window.dispatchEvent(new Event('app:transition-covered'))
  })
  transitionTl.to(
    blackBlock.value,
    {
      xPercent: -100,
      borderRadius: 40,
      duration: DURATION.slow,
      ease: EASE.outSoft,
    },
    '+=0.5',
  )
  transitionTl.to(
    greenBlock.value,
    {
      xPercent: -100,
      borderRadius: 40,
      duration: DURATION.slow,
      ease: EASE.out,
      onComplete: () => {
        gsap.set([greenBlock.value, blackBlock.value], {
          xPercent: 100,
        })
        isTransition.value = false
      },
    },
    '-=0.3',
  )

  loadingRotate = gsap.timeline()
  loadingRotate.to(loadingIcon.value, {
    rotate: 360,
    transformOrigin: 'center center',
    duration: 2,
    ease: EASE.breathe,
    repeat: -1,
  })
  loadingRotate.pause()

  if (isLoading.value) {
    loadingRotate.play()
  }
})

watch(isLoading, (loading) => {
  if (!loading) {
    exitTl?.play()
    loadingRotate?.pause(0)
  }
})
watch(isTransition, () => {
  if (isTransition.value) {
    loadingRotate?.play()
    gsap.set([greenBlock.value, blackBlock.value], { xPercent: 100 })
    transitionTl?.invalidate().restart()
  } else {
    loadingRotate?.pause(0)
  }
})

onBeforeUnmount(() => {
  exitTl?.kill()
  transitionTl?.kill()
  loadingRotate?.kill()
  exitTl = null
  transitionTl = null
  loadingRotate = null
})
</script>

<template>
  <div ref="greenBlock" class="fixed z-999 inset-0 bg-(--green) green-background"></div>

  <div ref="blackBlock" class="fixed z-999 inset-0 bg-(--black)">
    <div
      class="absolute left-1/2 top-1/2 -translate-1/2 flex flex-col justify-center items-center gap-5"
    >
      <svg viewBox="0 0 640 640">
        <path
          ref="loadingIcon"
          fill="#f7f7f7"
          d="M374.4 80C410.6 80 440 109.4 440 145.7L440 150.9C440 162.1 437.3 173.2 432.2 183.1L429.9 187.3L409.8 220.8C408.7 222.7 408.6 224.2 408.7 225.3C408.9 226.6 409.6 228 410.8 229.2C412 230.4 413.4 231.1 414.7 231.3C415.8 231.5 417.3 231.4 419.2 230.2L452.7 210.1L456.9 207.8C466.9 202.7 477.9 200 489.1 200L494.3 200C530.5 200 559.9 229.4 559.9 265.7C559.9 283.1 553 299.8 540.7 312.1L539.4 313.4C535.7 317.1 535.7 323 539.4 326.7L540.7 328C553 340.3 559.9 357 559.9 374.4C559.9 410.6 530.5 440 494.3 440L489.1 440C476.3 440 463.6 436.5 452.6 429.9L419.1 409.8C417.2 408.7 415.7 408.6 414.6 408.7C413.3 408.9 411.9 409.6 410.7 410.8C409.5 412 408.8 413.4 408.6 414.7C408.4 415.8 408.5 417.3 409.7 419.2L429.8 452.7C436.4 463.7 439.9 476.3 439.9 489.2L439.9 494.4C439.9 530.6 410.5 560 374.3 560C356.9 560 340.2 553.1 327.9 540.8L326.6 539.5C322.9 535.8 317 535.8 313.3 539.5L312 540.8C299.7 553.1 283 560 265.6 560C229.4 560 200 530.6 199.9 494.4L199.9 489.2C199.9 476.4 203.4 463.7 210 452.7L230.1 419.2C231.2 417.3 231.3 415.8 231.2 414.7C231 413.4 230.3 412 229.1 410.8C227.9 409.6 226.5 408.9 225.2 408.7C224.7 408.6 224 408.6 223.3 408.7L220.8 409.7L187.3 429.8C176.3 436.4 163.7 439.9 150.8 439.9L145.6 439.9C109.4 440 80 410.6 80 374.4C80 357 86.9 340.3 99.2 328L100.5 326.7L101.7 325.2C103.8 322.1 103.8 318 101.7 314.9L100.5 313.4L99.2 312.1C86.9 299.8 80 283.1 80 265.7C80 229.4 109.4 200 145.7 200L150.9 200C163.7 200 176.4 203.5 187.4 210.1L220.9 230.2L223.4 231.2C224.1 231.3 224.8 231.3 225.3 231.3C226.6 231.1 228 230.4 229.2 229.2C230.4 228 231.1 226.6 231.3 225.3C231.4 224.8 231.4 224.1 231.2 223.4L230.2 220.9L210.1 187.4C203.5 176.4 200 163.8 200 150.9L200 145.7C200 109.5 229.4 80 265.7 80C283.1 80 299.8 86.9 312.1 99.2L313.4 100.5C317.1 104.1 323 104.2 326.7 100.5L328 99.2L332.8 94.8C344.5 85.3 359.1 80 374.4 80z"
        />
      </svg>
      <div class="font-OutFit loading-label text-(--green)">LOADING</div>
    </div>
  </div>
</template>

<style scoped>
.loading-label {
  animation: loading-pulse 4s var(--motion-ease-linear) infinite;
}

@keyframes loading-pulse {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-label {
    animation: none;
  }
}

.green-background {
  background-image: url(../assets/svg/hex-grid.svg);
  background-size: 150px;
  background-repeat: repeat;
}
</style>
