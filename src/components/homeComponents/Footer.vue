<script setup lang="ts">
defineOptions({ name: 'MineFooter' })

import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { textEnterMask } from '@utils/aniamtion/enterText'
import { iconShake } from '@utils/aniamtion/iconHover'
gsap.registerPlugin(ScrollTrigger)

import WeChat from '@assets/photos/QR/WeChat.jpg'
import QQ from '@assets/photos/QR/QQ.jpg'
import XiaoHongShu from '@assets/photos/QR/XiaoHongShu.jpg'

import Github from '@icons/Github.vue'
import Bilibili from '@icons/Bilibili.vue'
import Tiktok from '@icons/Tiktok.vue'

const footerLink = [
  { name: 'PHOTO', path: '/photo' },
  { name: 'VIDEO', path: '/video' },
  { name: 'MUSIC', path: '/music' },
  { name: 'SKILL', path: '/skill' },
]

onMounted(() => {
  const btns = document.querySelectorAll('.footer-btn')
  const icon = document.querySelectorAll('.icon-social')

  if (!icon) return
  if (!btns) return

  const iconAims: GSAPAnimation[] = []
  icon.forEach((ele) => {
    const shake = iconShake(ele)
    iconAims.push(shake)
  })

  icon.forEach((ele, index) => {
    ele.addEventListener('mouseenter', () => {
      iconAims[index]?.play(0)
    })
  })
})
</script>

<template>
  <footer class="w-screen h-[36vh] pt-20 bg-(--white) relative">
    <div class="w-screen flex justify-center items-center gap-[15vw]">
      <div class="w-[12vw] h-[8vw] rounded-2xl text-center text-(--black) font-OutFit">
        <img :src="WeChat" alt="" class="w-[7vw] relative left-[2.5vw]" />
        WeChat:<span class="font-ThinFit"> Cowboy</span>
      </div>
      <div class="w-[12vw] h-[8vw] rounded-2xl text-center text-(--black) font-OutFit relative">
        <img :src="QQ" alt="" class="w-[7vw] relative left-[2.5vw]" />
        QQ: <span class="font-ThinFit">Cowboy</span>
      </div>
      <div class="w-[12vw] h-[8vw] rounded-2xl text-center text-(--black) font-OutFit relative">
        <img :src="XiaoHongShu" alt="" class="w-[7vw] relative left-[2.5vw]" />
        XiaoHongShu: <span class="font-ThinFit">Cowboy</span>
      </div>
    </div>

    <div class="absolute bottom-5 px-[5vw] w-screen">
      <div class="flex gap-[1vw]">
        <RouterLink
          v-for="(item, index) in footerLink"
          :to="item.path"
          :key="index"
          class="text-(--black) font-OutFit text-[20px] footer-btn"
        >
          {{ item.name }}
        </RouterLink>

        <div class="flex-1 flex justify-end gap-[1vw]">
          <a class="w-9 icon-social" href="https://github.com/Cowboy-YJX/" target="_blank"
            ><Github
          /></a>
          <a class="w-9 icon-social" href="https://bilibili.com" target="_blank"><Bilibili /></a>
          <a class="w-9 icon-social" href="https://douyin.com" target="_blank"><Tiktok /></a>
        </div>
      </div>

      <div class="h-1 bg-(--black)"></div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer-btn {
  transition: color var(--motion-duration-base) var(--motion-ease-out-soft);

  &:hover {
    color: var(--green) !important;
  }
}
</style>
