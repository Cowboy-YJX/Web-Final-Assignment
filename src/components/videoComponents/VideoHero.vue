<script setup lang="ts" name="VideoHero">
import { DURATION, EASE } from '@animation'
import gsap from 'gsap'
import { TextPlugin } from 'gsap/TextPlugin'
gsap.registerPlugin(TextPlugin)

import { onMounted } from 'vue'

import one from '@assets/photos/covers/video-01.webp'
import two from '@assets/photos/covers/video-02.webp'
import three from '@assets/photos/covers/video-03.webp'
import four from '@assets/photos/covers/video-04.webp'
import five from '@assets/photos/covers/video-05.webp'
import six from '@assets/photos/covers/video-06.webp'

const videoItems = [
  {
    titleEN: 'Good Night Bubu',
    titleCN: '被挚爱诅咒的一生',
    src: one,
    date: '2025.2',
  },
  {
    titleEN: 'The Legend Of Zelda',
    titleCN: '塞尔达传说:时之笛',
    src: two,
    date: '2026.11',
  },
  {
    titleEN: 'In Nolan We Trust',
    titleCN: '诺兰电影混剪',
    src: three,
    date: '2023.8',
  },
  {
    titleEN: 'Tenet Trailer',
    titleCN: '信条宣传片',
    src: four,
    date: '2022.12',
  },
  {
    titleEN: 'The Climber',
    titleCN: '孤高之人',
    src: five,
    date: '2024.4',
  },
  {
    titleEN: 'Space Cowboy',
    titleCN: '星际牛仔',
    src: six,
    date: '2020.4',
  },
]

onMounted(() => {
  const videoNum = document.querySelector('.video-num')
  const titleMask = document.querySelectorAll('.title-mask')
  const videoItem = document.querySelectorAll('.video-item')

  if (!videoNum) return
  if (!titleMask) return
  if (!videoItem) return

  videoItem.forEach((ele, index) => {
    gsap.fromTo(
      titleMask[index]!,
      {
        xPercent: -100,
      },
      {
        scrollTrigger: {
          trigger: ele,
          start: 'top center',
        },
        xPercent: 100,
      },
    )
  })

  gsap.to(videoNum, {
    textContent: '6',
    snap: 'textContent',
    delay: DURATION.scene,
    duration: DURATION.slow,
    ease: EASE.linear,
  })
})
</script>

<template>
  <section>
    <div class="w-screen h-[65vh] font-OutFit relative">
      <div class="w-full text-center absolute top-1/2 -translate-y-1/2">
        <div class="text-[18rem]">VIDEOS<span class="video-num ml-[5vw]">0</span></div>
        <div
          class="text-[1.5rem] w-full flex px-[12vw] justify-between items-center text-(--green)"
        >
          <span>MASHUP</span><span class="text-(--white)">✦</span> <span>MAD</span
          ><span class="text-(--white)">✦</span> <span>PROMOTIONAL VIDEO</span
          ><span class="text-(--white)">✦</span> <span>TUTORIALS</span
          ><span class="text-(--white)">✦</span><span>CREATIVE VIDEO</span>
        </div>
      </div>
    </div>

    <div class="video-outer mt-[10vh] px-[8vw]">
      <div v-for="(item, index) in videoItems" :key="index" class="w-full h-[54.5vh] video-item">
        <div class="w-full h-[40.5vh] overflow-hidden rounded-2xl">
          <img :src="item.src" alt="" class="object-cover w-full h-full mb-[5vh] video-cover" />
        </div>

        <div class="w-full h-[10vh] mt-[4vh]">
          <div class="video-title font-ThinFit text-[17px] mt-[1vh] relative overflow-hidden">
            {{ item.titleCN }} | {{ item.date }}

            <div class="absolute w-full h-full bg-(--green) top-0 left-0 title-mask"></div>
          </div>

          <div>
            <div class="font-OutFit text-[3rem]">{{ item.titleEN }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-screen h-[65vh]"></div>
  </section>
</template>

<style scoped lang="scss">
.video-num {
  letter-spacing: 1vw;

  color: transparent !important;
  -webkit-text-stroke: 4px var(--green) !important;
}

.video-outer {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20vh 6vw;
  justify-items: center;
}

.video-title {
  letter-spacing: 3px;
  word-spacing: 18px;
}

.video-item {
  & .video-cover {
    filter: grayscale(100%);
    transition:
      filter var(--motion-duration-base) var(--motion-ease-linear),
      scale var(--motion-duration-base) var(--motion-ease-out-soft);
  }

  &:hover .video-cover {
    filter: grayscale(0%);
    scale: 0.9;
  }
}
</style>
