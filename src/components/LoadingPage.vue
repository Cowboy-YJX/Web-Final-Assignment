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
let loadingTl: GSAPTimeline | null = null
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
    delay: DURATION.slow,
    repeat: -1,
  })
  loadingRotate.pause()

  loadingTl = gsap.timeline({ repeat: -1 })
  loadingTl.to(loadingIcon.value, {
    morphSVG:
      'M224 208C224 128.5 288.5 64 368 64C376.8 64 384 71.2 384 80L384 232.2C399 226.9 415.2 224 432 224C511.5 224 576 288.5 576 368C576 376.8 568.8 384 560 384L407.8 384C413.1 399 416 415.2 416 432C416 511.5 351.5 576 272 576C263.2 576 256 568.8 256 560L256 407.8C241 413.1 224.8 416 208 416C128.5 416 64 351.5 64 272C64 263.2 71.2 256 80 256L232.2 256C226.9 241 224 224.8 224 208zM320 352C337.7 352 352 337.7 352 320C352 302.3 337.7 288 320 288C302.3 288 288 302.3 288 320C288 337.7 302.3 352 320 352z',
    duration: DURATION.slow,
    delay: 2,
  })
  loadingTl.to(loadingIcon.value, {
    morphSVG:
      'M128 320L156.5 92C158.5 76 172.1 64 188.3 64L356.9 64C371.9 64 384 76.1 384 91.1C384 94.3 383.4 97.6 382.3 100.6L336 224L475.3 224C495.5 224 512 240.4 512 260.7C512 268.1 509.8 275.3 505.6 281.4L313.4 562.4C307.5 571 297.8 576.1 287.5 576.1L284.6 576.1C268.9 576.1 256.1 563.3 256.1 547.6C256.1 545.3 256.4 543 257 540.7L304 352L160 352C142.3 352 128 337.7 128 320z',
    duration: DURATION.slow,
    delay: 2,
  })
  loadingTl.to(loadingIcon.value, {
    morphSVG:
      'M160 96C124.7 96 96 124.7 96 160L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 160C544 124.7 515.3 96 480 96L160 96zM224 160L224 224L288 224L288 160L352 160L352 224L416 224L416 160L480 160L480 224L416 224L416 288L480 288L480 352L416 352L416 416L480 416L480 480L416 480L416 416L352 416L352 480L288 480L288 416L224 416L224 480L160 480L160 416L224 416L224 352L160 352L160 288L224 288L224 224L160 224L160 160L224 160zM288 288L352 288L352 224L288 224L288 288zM288 352L288 288L224 288L224 352L288 352zM352 352L288 352L288 416L352 416L352 352zM352 352L416 352L416 288L352 288L352 352z',
    duration: DURATION.slow,
    delay: 2,
  })
  loadingTl.to(loadingIcon.value, {
    morphSVG:
      'M374.4 80C410.6 80 440 109.4 440 145.7L440 150.9C440 162.1 437.3 173.2 432.2 183.1L429.9 187.3L409.8 220.8C408.7 222.7 408.6 224.2 408.7 225.3C408.9 226.6 409.6 228 410.8 229.2C412 230.4 413.4 231.1 414.7 231.3C415.8 231.5 417.3 231.4 419.2 230.2L452.7 210.1L456.9 207.8C466.9 202.7 477.9 200 489.1 200L494.3 200C530.5 200 559.9 229.4 559.9 265.7C559.9 283.1 553 299.8 540.7 312.1L539.4 313.4C535.7 317.1 535.7 323 539.4 326.7L540.7 328C553 340.3 559.9 357 559.9 374.4C559.9 410.6 530.5 440 494.3 440L489.1 440C476.3 440 463.6 436.5 452.6 429.9L419.1 409.8C417.2 408.7 415.7 408.6 414.6 408.7C413.3 408.9 411.9 409.6 410.7 410.8C409.5 412 408.8 413.4 408.6 414.7C408.4 415.8 408.5 417.3 409.7 419.2L429.8 452.7C436.4 463.7 439.9 476.3 439.9 489.2L439.9 494.4C439.9 530.6 410.5 560 374.3 560C356.9 560 340.2 553.1 327.9 540.8L326.6 539.5C322.9 535.8 317 535.8 313.3 539.5L312 540.8C299.7 553.1 283 560 265.6 560C229.4 560 200 530.6 199.9 494.4L199.9 489.2C199.9 476.4 203.4 463.7 210 452.7L230.1 419.2C231.2 417.3 231.3 415.8 231.2 414.7C231 413.4 230.3 412 229.1 410.8C227.9 409.6 226.5 408.9 225.2 408.7C224.7 408.6 224 408.6 223.3 408.7L220.8 409.7L187.3 429.8C176.3 436.4 163.7 439.9 150.8 439.9L145.6 439.9C109.4 440 80 410.6 80 374.4C80 357 86.9 340.3 99.2 328L100.5 326.7L101.7 325.2C103.8 322.1 103.8 318 101.7 314.9L100.5 313.4L99.2 312.1C86.9 299.8 80 283.1 80 265.7C80 229.4 109.4 200 145.7 200L150.9 200C163.7 200 176.4 203.5 187.4 210.1L220.9 230.2L223.4 231.2C224.1 231.3 224.8 231.3 225.3 231.3C226.6 231.1 228 230.4 229.2 229.2C230.4 228 231.1 226.6 231.3 225.3C231.4 224.8 231.4 224.1 231.2 223.4L230.2 220.9L210.1 187.4C203.5 176.4 200 163.8 200 150.9L200 145.7C200 109.5 229.4 80 265.7 80C283.1 80 299.8 86.9 312.1 99.2L313.4 100.5C317.1 104.1 323 104.2 326.7 100.5L328 99.2L332.8 94.8C344.5 85.3 359.1 80 374.4 80z',
    duration: DURATION.slow,
    delay: 2,
  })
  loadingTl.pause()

  if (isLoading.value) {
    loadingRotate.play()
    loadingTl.play()
  }
})

watch(isLoading, (loading) => {
  if (!loading) {
    exitTl?.play()
    loadingRotate?.pause(0)
    loadingTl?.pause(0)
  }
})
watch(isTransition, (active) => {
  if (!active || !greenBlock.value || !blackBlock.value) return

  gsap.set([greenBlock.value, blackBlock.value], { xPercent: 100 })
  transitionTl?.invalidate().restart()
  loadingRotate?.play(0)
  loadingTl?.play(0)
})

onBeforeUnmount(() => {
  exitTl?.kill()
  transitionTl?.kill()
  exitTl = null
  transitionTl = null
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
      <div class="font-OutFit loading-label">LOADING</div>
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
