<script setup lang="ts" name="MyFavorite">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

import { onMounted, ref } from 'vue'

const container = ref<Element | null>(null)
const outer = ref<Element | null>(null)
const one = ref<Element | null>(null)
const two = ref<Element | null>(null)
const three = ref<Element | null>(null)

onMounted(() => {
  if (!container.value) return
  if (!outer.value) return
  if (!one.value) return
  if (!two.value) return
  if (!three.value) return

  const horizon = gsap.to(outer.value, {
    scrollTrigger: {
      trigger: container.value,
      start: 'top top',
      end: '+=1800',
      scrub: true,
      pin: true,
    },
    xPercent: -66.6,
  })

  gsap.to(one.value, {
    scrollTrigger: {
      trigger: container.value,
      containerAnimation: horizon,
    },
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

    <div class="h-[93vh] w-[300vw] flex justify-center items-center font-OutFit" ref="outer">
      <div class="w-screen h-full relative" ref="one">
        <div>MY FAVORITE AND HOBBY</div>
        <div></div>
        <div></div>
        <div></div>
      </div>

      <div class="w-screen h-full relative" ref="two">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>

      <div class="w-screen h-full relative" ref="three"></div>
    </div>
  </section>
</template>

<style scoped></style>
