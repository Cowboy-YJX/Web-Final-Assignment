<script setup lang="ts" name="heroComponent">
import { defineAsyncComponent, onMounted, ref } from 'vue'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { DURATION, EASE, motionScope } from '@animation'
gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin)

const HeroShaderCanvas = defineAsyncComponent(() => import('./HeroShaderCanvas.vue'))

const secContainer = ref<Element | null>(null)
const ask = ref<Element | null>(null)

onMounted(() => {
  const aboutMe = document.querySelector('.about-me')
  const scrollHint = document.querySelectorAll('.scroll-icon')

  if (!secContainer.value) return
  if (!ask.value) return
  if (!aboutMe) return
  if (!scrollHint) return

  gsap.to(secContainer.value, {
    scrollTrigger: {
      trigger: secContainer.value,
      start: 'top center',
    },
    duration: DURATION.base,
    onComplete: () => {
      aboutMe.classList.add('fllow')
    },
  })

  gsap.from(scrollHint, {
    opacity: 0,
    stagger: DURATION.slow,
    duration: DURATION.slow,
    ease: EASE.breathe,
    repeat: -1,
  })

  motionScope(() => {
    gsap.from(ask.value, {
      drawSVG: '0',
      duration: DURATION.scene,
      delay: DURATION.slow,
      ease: EASE.outSoft,
      scrollTrigger: {
        trigger: secContainer.value,
        start: 'top center',
      },
    })
  })
})
</script>

<template>
  <section class="relative h-[165vh] w-screen overflow-hidden">
    <HeroShaderCanvas />

    <div
      class="hero-title w-screen h-screen relative px-[5vw] pt-[17vh] text-[10em] font-OutFit font-black leading-40 text-center z-10 pointer-events-none"
    >
      BE COOL!<br />
      <span class="text-(--green)">CREATIVE!</span><br />
      <span class="border-text">AND</span> COWBOY!

      <svg viewBox="0 0 120 150" class="absolute bottom-[7vh] left-1/2 -translate-1/2 w-10">
        <path
          d="M10 10 L60 40 L110 10"
          class="stroke-(--white) stroke-10 scroll-icon"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        ></path>
        <path
          d="M10 50 L60 80 L110 50"
          class="stroke-(--green) stroke-10 scroll-icon"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        ></path>
        <path
          d="M10 90 L60 120 L110 90"
          class="stroke-(--white) stroke-10 scroll-icon"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
        ></path>
      </svg>

      <div
        class="absolute left-1/2 -translate-1/2 font-ThinFit font-medium bottom-0 text-[1rem] text-(--green) leading-7"
      >
        - SCROLL CAREFULLY, IT'S SMOOTH -<br />
        <span class="font-light scroll-hint">
          小 <span class="text-(--white)">✦</span> 心 <span class="text-(--white)">✦</span> 地
          <span class="text-(--white)">✦</span> 滑</span
        >
      </div>
    </div>

    <div class="w-screen h-[65vh] relative font-OutFit text-center pt-[19vh]" ref="secContainer">
      <div class="text-(--green) text-[8em] about-me relative">ABOUT ME</div>
      <div class="font-ThinFit text-left absolute left-[30vw] myselfIntro">
        Hello, this is Cowboy, a Computer Science student<br />
        Let's do some intersting things :)
      </div>

      <svg viewBox="0 0 1250 410" class="absolute w-70 left-[55vw] top-[36vh] rotate-8">
        <path
          d="M65.7,212.4c0,0-31.4,169.6,20.9,163.3s51.3-141.3,59.7-141.3c8.3,0-18.3,163.6,25.4,141.5
	c43.8-22.1,77.2-200.1,41.5-183.4s-19.4,135,26.9,96.9c46.4-38.2,143.1-218.6,92.9-264.7c-71.1-60.8-51.9,366.7-51.9,366.7
	s45.5-217,79.2-178.3S328.1,385.7,395.1,371c67-14.7,121.2-55.5,108.3-104.6c-13-39.8-63.6-57-89.8-11.1s0.7,139.6,33.3,121.2
	c48.1-27.2,191.4-182.4,241.6-144.7c50.2,37.7-39.8,169.6-64.9,129.8c-25.1-39.8,29.3-146.6,75.3-121.4
	c46.1,25.2-9.6,128,35.6,136.1c26,6.8,41.3-161.2,41.3-161.2s2.1,146.6,8.4,146.6s31.4-209.4,54.4-154.9
	c23,54.4,14.6,142.4,23,144.4c8.4,2,27.2-159.2,77.4-146.6c39.8,10.5-7.5,187.9,57.5,171.1c65-16.8,116.5-177.5,116.5-177.5
	s-48.4,197,41.6,178.2c30.5-8.3,38.9-39.8,38.9-39.8"
          class="stroke-(--white) stroke-28"
          stroke-linecap="round"
          stroke-linejoin="round"
          fill="none"
          ref="ask"
        ></path>
      </svg>
    </div>
  </section>
</template>

<style scoped lang="scss">
/*
 * 矮视口里球簇更容易飘到标题底下，给白色大字留一圈暗光保证可读；
 * 高视口不加深色描边，保持干净的黑底大字。
 */
@media (max-height: 950px) {
  .hero-title {
    text-shadow:
      0 0 28px rgba(4, 8, 12, 0.8),
      0 0 70px rgba(4, 8, 12, 0.45);
  }
}

.border-text {
  color: transparent;
  text-shadow:
    -1px -1px 0 var(--green),
    1px -1px 0 var(--green),
    -1px 1px 0 var(--green),
    1px 1px 0 var(--green);
}

@supports (-webkit-text-stroke: 5px var(--green)) {
  .border-text {
    -webkit-text-stroke: 5px var(--green);
    text-shadow: none;
  }

  .about-me {
    &::before {
      content: 'ABOUT ME';

      position: absolute;
      top: 0%;
      left: 50%;
      transform: translate(-50%, 0);
      transition:
        transform var(--motion-duration-slow) var(--motion-ease-out-soft),
        opacity var(--motion-duration-slow) var(--motion-ease-out-soft);

      color: transparent;
      -webkit-text-stroke: 2px var(--green);
      opacity: 0;

      clip-path: polygon(0 71%, 100% 71%, 100% 100%, 0 100%);
    }

    &::after {
      content: 'ABOUT ME';

      position: absolute;
      top: 0%;
      left: 50%;
      transform: translate(-50%, 0);
      transition:
        transform var(--motion-duration-slow) var(--motion-ease-linear),
        opacity var(--motion-duration-slow) var(--motion-ease-linear);

      color: transparent;
      -webkit-text-stroke: 2px var(--green);
      opacity: 0;

      clip-path: polygon(0 73%, 100% 73%, 100% 100%, 0 100%);
    }
  }

  .fllow {
    &::before {
      opacity: 1;
      top: 6%;
      transform: translate(-50%, 0) scale(0.98);
    }

    &::after {
      opacity: 1;
      top: 11%;
      transform: translate(-50%, 0) scale(0.95);
    }
  }

  .myselfIntro,
  .scroll-hint {
    word-spacing: 3px;
  }
}
</style>
