<script setup lang="ts" name="MyFavorite">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { DURATION, EASE } from '@animation'
gsap.registerPlugin(ScrollTrigger, SplitText)

import { imageLeftEnter } from '@utils/aniamtion/enterImage'

import Logo from '@icons/Logo.vue'

import { onMounted, ref } from 'vue'

import test from '@assets/photos/two.jpg'

const container = ref<Element | null>(null)
const outer = ref<Element | null>(null)
const one = ref<Element | null>(null)
const two = ref<Element | null>(null)
const three = ref<Element | null>(null)
const image = ref<Element | null>(null)
const topTitle = ref<Element | null>(null)
const bottomTitle = ref<Element | null>(null)
const textPath = ref<SVGPathElement | null>(null)

const textLength: { length: number; offset: number } = { length: 0, offset: 0 }
const tagItems = ['MUSIC', 'ANIMES', 'GAMES', 'COMICS', 'MOVIE']

onMounted(() => {
  const tags = document.querySelectorAll('.tags')
  const head = document.querySelector('.head')
  const tail = document.querySelector('.tail')

  if (!container.value) return
  if (!outer.value) return
  if (!one.value) return
  if (!two.value) return
  if (!three.value) return
  if (!image.value) return
  if (!topTitle.value) return
  if (!bottomTitle.value) return
  if (!textPath.value) return
  if (!tags) return
  if (!head) return
  if (!tail) return

  textLength.length = textPath.value.getTotalLength()

  const apply = (offset: number) => {
    const partner = offset >= 0 ? offset - textLength.length : offset + textLength.length
    head.setAttribute('startOffset', String(offset))
    tail.setAttribute('startOffset', String(partner))
  }

  gsap.to(textLength, {
    offset: textLength.length,
    duration: 18,
    ease: EASE.linear,
    repeat: -1,
    onUpdate: () => {
      apply(textLength.offset)
    },
  })

  const horizon = gsap.to(outer.value, {
    scrollTrigger: {
      trigger: container.value,
      start: 'top top',
      end: '+=2400',
      scrub: true,
      pin: true,
    },
    xPercent: -66.6,
    ease: EASE.linear,
  })

  const tagText = SplitText.create(tags, { type: 'words' })

  const tagIn = gsap.from(tags, {
    scale: 0,
    ease: EASE.spring,
    duration: DURATION.slow,
    stagger: {
      each: DURATION.instant,
    },
  })
  const tagTextIn = gsap.from(tagText.words, {
    yPercent: 15,
    opacity: 0,
    delay: DURATION.base,
    stagger: {
      each: DURATION.instant,
    },
  })
  tagTextIn.pause()
  tagIn.pause()
  gsap.to(one.value, {
    scrollTrigger: {
      trigger: one.value,
      start: 'top 5%',
    },
    onStart: () => {
      tagIn.play(0)
      tagTextIn.play(0)
    },
  })

  const imageTl = imageLeftEnter(image.value)

  gsap.to(two.value, {
    scrollTrigger: {
      trigger: two.value,
      containerAnimation: horizon,
      start: 'left center',
    },
    onStart: () => {
      imageTl.play(0)
    },
  })

  gsap.to(topTitle.value, {
    scrollTrigger: {
      trigger: two.value,
      scrub: true,
      start: 'left 70%',
      containerAnimation: horizon,
    },
    left: '10vw',
  })

  gsap.to(bottomTitle.value, {
    scrollTrigger: {
      trigger: two.value,
      scrub: true,
      start: 'left 75%',
      containerAnimation: horizon,
    },
    left: '10vw',
  })
})
</script>

<template>
  <section ref="container">
    <svg viewBox="0 0 1600 70" class="w-screen" fill="none">
      <rect x="0" y="0" width="1600" height="6" class="fill-(--green)" />
      <path
        d="M300 5 C345 5 335 70 400 70 L800 70 L800 5 M1300 5 C1255 5 1265 70 1200 70 L800 70 L800 5"
        class="fill-(--green)"
      ></path>
    </svg>

    <div class="h-[92.6vh] w-[300vw] flex justify-center items-center font-OutFit" ref="outer">
      <div class="w-screen h-full relative text-center" ref="one">
        <div class="absolute left-1/2 -translate-x-1/2 top-7/25">MY FAVORITE AND HOBBY</div>

        <div
          class="absolute left-1/2 top-3/5 -translate-1/2 w-[50vw] flex flex-wrap items-center justify-center gap-8"
        >
          <div
            v-for="(item, index) in tagItems"
            :key="index"
            :class="
              index % 4 == 0
                ? `bg-(--white) w-[15vw] h-[10vh] rounded-full text-(--black) text-[2rem] leading-[10vh] rotate-8 tags`
                : `bg-(--white) w-[15vw] h-[10vh] rounded-full text-(--black) text-[2rem] leading-[10vh] -rotate-8 tags`
            "
          >
            {{ item }}
          </div>
        </div>

        <div class="absolute w-10 h-10 left-1/2 -translate-x-1/2 bottom-5">
          <Logo :circle="false" />
        </div>
      </div>

      <div class="w-screen h-full relative" ref="two">
        <div class="absolute z-10 text-[8rem] left-[20vw] top-[20vh]" ref="topTitle">
          <span class="text-(--green)">PHOTOS</span>
        </div>
        <div class="absolute text-[8rem] left-[10vw] top-1/2 -translate-y-1/2">VIDEOS</div>
        <div class="absolute text-[8rem] left-0 bottom-[20vh]" ref="bottomTitle">
          <span class="text-(--green)">MUSIC</span>
        </div>

        <div class="absolute left-[43vw] w-19/50 top-1/2 -translate-y-1/2 overflow-hidden">
          <img :src="test" alt="" ref="image" />
        </div>
      </div>

      <div class="w-screen h-full relative text-center" ref="three">
        <div
          class="font-OutFit text-[6rem] absolute top-[12vh] left-1/2 -translate-x-1/2 leading-23"
        >
          <span class="text-(--green)">THANKS</span><br />
          FOR<br />
          YOUR <span class="thanks-visiting">VISITING</span>
        </div>

        <svg class="block w-full absolute left-0 bottom-[-10vh]" viewBox="0 0 1200 520" role="img">
          <path
            class="stroke-(--green)"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="50"
            id="loop-text"
            d="M 600 260 C 682.5 200 750 200 750 260 C 750 320 682.5 320 600 260 C 517.5 200 450 200 450 260 C 450 320 517.5 320 600 260 Z"
            ref="textPath"
          />

          <text class="fill-(--white)" font-stretch="true" dominant-baseline="central">
            <textPath
              href="#loop-text"
              style="letter-spacing: 3px"
              :text-length="textLength"
              :startOffset="0"
              class="head"
            >
              THANK YOU✦THANK YOU✦THANK YOU✦THANK YOU✦THANK YOU✦THANK YOU
            </textPath>
          </text>

          <text class="fill-(--white)" font-stretch="true" dominant-baseline="central">
            <textPath
              href="#loop-text"
              style="letter-spacing: 3px"
              :text-length="textLength.length"
              :startOffset="0"
              class="tail"
            >
              THANK YOU✦THANK YOU✦THANK YOU✦THANK YOU✦THANK YOU✦THANK
            </textPath>
          </text>
        </svg>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.tags {
  transition:
    background-color var(--motion-duration-slow) var(--motion-ease-in-out),
    color var(--motion-duration-slow) var(--motion-ease-in-out);

  &:hover {
    background-color: var(--green) !important;
    color: var(--white) !important;
  }
}

.thanks-visiting {
  color: transparent;
  -webkit-text-stroke: 4px var(--green);
}
</style>
