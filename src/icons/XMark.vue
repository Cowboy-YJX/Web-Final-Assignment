<script setup lang="ts" name="XMark">
import gsap from 'gsap'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
gsap.registerPlugin(MorphSVGPlugin)

import { onMounted, ref, watch } from 'vue'

import { useGloballAnimationStore } from '@/stores/globallAnimation'
import { storeToRefs } from 'pinia'

const { isOpen } = storeToRefs(useGloballAnimationStore())

const icon = ref<SVGElement | null>(null)
const container = ref<Element | null>(null)
const isClick = ref<boolean>(false)

let click: GSAPAnimation | null = null
let hover: GSAPAnimation | null = null

onMounted(() => {
  if (!icon.value) return
  if (!container.value) return

  hover = gsap.to(icon.value, {
    morphSVG: {
      shape: 'M128 240 L 512 240 M128 400 L512 400',
    },
  })
  hover.pause()

  click = gsap.to(icon.value, {
    morphSVG: {
      shape: 'M156 160 L484 480 M156 480 L484 160',
    },
  })
  click.pause()

  const clickHover = gsap.to(icon.value, {
    morphSVG: {
      shape: 'M156 160 L484 480 M156 480 L256 383 M384 257 L484 160',
    },
  })
  clickHover.pause()

  container.value.addEventListener('mouseenter', () => {
    if (isClick.value) {
      clickHover.reverse()
    } else {
      hover?.play()
    }
  })
  container.value.addEventListener('mouseleave', () => {
    if (isClick.value) {
      clickHover.play()
    } else {
      hover?.reverse()
    }
  })
})

watch(isOpen, () => {
  if (isOpen.value) {
    click?.play()
    isClick.value = !isClick.value
  } else {
    click?.reverse()
    setTimeout(() => {
      hover?.reverse()
    }, 500)
    isClick.value = !isClick.value
  }
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    width="100%"
    height="100%"
    ref="container"
  >
    <path
      d="M128 240 L380 240 M485 240 L500 240 M128 400 L512 400"
      stroke="#171717"
      stroke-width="65"
      stroke-linecap="round"
      ref="icon"
    />
  </svg>
</template>

<style scoped></style>
