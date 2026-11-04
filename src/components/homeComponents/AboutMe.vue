<script setup lang="ts" name="AboutMe">
import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger)

import { DURATION, EASE } from '@animation'

import { imageLeftEnter } from '@utils/aniamtion/enterImage'

import { onMounted, ref } from 'vue'

const container = ref<Element | null>(null)
const horizon = ref<Element | null>(null)
const vertical = ref<Element | null>(null)

onMounted(() => {
  if (!horizon.value) return
  if (!vertical.value) return
  if (!container.value) return

  gsap.from(horizon.value, {
    scrollTrigger: {
      trigger: container.value,
      start: 'top 85%',
    },
    duration: DURATION.slow,
    ease: EASE.out,
    drawSVG: '0%',
  })

  gsap.from(vertical.value, {
    scrollTrigger: {
      trigger: container.value,
      start: 'top 55%',
      end: 'bottom +=50',
      scrub: true,
      once: true,
    },
    drawSVG: 0,
    ease: EASE.linear,
  })
})
</script>

<template>
  <section class="relative min-h-[185vh] pt-[6vh]" ref="container">
    <div class="font-OutFit text-[4rem] text-center" ref="ask">
      WHAT <span class="text-(--green)">SKILLS</span> DO I HAVE
    </div>
    <div
      class="font-OutFit text-[12rem] query-icon absolute right-[24vw] top-[1vh] -z-10 rotate-32"
    >
      ?
    </div>

    <svg class="w-screen absolute top-0 left-0" viewBox="0 0 1000 1080">
      <path
        d="M120 1 L886 1"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="stroke-(--white)"
        ref="horizon"
      ></path>
      <path
        d="M499 130 L499 1079"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="stroke-(--white)"
        ref="vertical"
      ></path>
    </svg>

    <div class="absolute left-[12vw] top-[25vh]">
      <div class="text-(--white) font-OutFit text-[1.5rem]">
        I'M A<br />
        <span class="text-(--green) text-[2rem]">GRAPHIC DESGINER</span><br />
        <span class="about-order">0 1</span>
      </div>

      <div></div>
    </div>

    <div class="absolute right-[12vw] top-[75vh] font-OutFit text-[1.5rem]">
      I'M A<br />
      <span class="text-(--green) text-[2rem]">THREED EDITOR</span><br />
      <span class="about-order">0 2</span>

      <div></div>
    </div>

    <div class="absolute left-[12vw] top-[125vh] font-OutFit text-[1.5rem]">
      I'M A<br />
      <span class="text-(--green) text-[2rem]">UX DESGINER</span><br />
      <span class="about-order">0 3</span>
    </div>
  </section>
</template>

<style scoped lang="scss">
.query-icon {
  color: transparent;
  -webkit-text-stroke: 4px var(--green);
}

.about-order {
  color: transparent;
  -webkit-text-stroke: 2px var(--white);
}
</style>
