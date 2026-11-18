<script setup lang="ts" name="VideoHero">
import { DURATION, EASE } from '@animation'
import { TextPlugin } from 'gsap/TextPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import gsap from 'gsap'
gsap.registerPlugin(TextPlugin, ScrambleTextPlugin, ScrollToPlugin)

import { onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import { useGloballAnimationStore } from '@stores/globallAnimation'

import one from '@assets/photos/covers/video-01.webp'
import two from '@assets/photos/covers/video-02.webp'
import three from '@assets/photos/covers/video-03.webp'
import four from '@assets/photos/covers/video-04.webp'
import five from '@assets/photos/covers/video-05.webp'
import six from '@assets/photos/covers/video-06.webp'
import tv from '@assets/svg/tv.svg'

import ArrowRight from '@icons/ArrowRight.vue'

import { textEnter, textEnterMask } from '@/utils/aniamtion/enterText'

const { isScreen } = storeToRefs(useGloballAnimationStore())

const toTop = ref<HTMLElement | null>(null)
const television = ref<Element | null>(null)
const upArrow = ref<Element | null>(null)
const mask = ref<Element | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const videoContainer = ref<Element | null>(null)
const totalTitle = ref<Element | null>(null)
const subTitle = ref<Element | null>(null)

const videoItems = [
  {
    titleEN: 'Good Night PunPun',
    titleCN: '被挚爱诅咒的一生',
    imgSrc: one,
    videoSrc:
      '//player.bilibili.com/player.html?isOutside=true&aid=113996870981636&bvid=BV1w5KWeVEdJ&cid=28373156439&p=1',
    date: '2025.2',
  },
  {
    titleEN: 'The Legend Of Zelda',
    titleCN: '塞尔达传说:时之笛',
    imgSrc: two,
    videoSrc:
      '//player.bilibili.com/player.html?isOutside=true&aid=117568471829296&bvid=BV1ni4B6jEY3&cid=43376578192&p=1',
    date: '2026.11',
  },
  {
    titleEN: 'In Nolan We Trust',
    titleCN: '诺兰电影混剪',
    imgSrc: three,
    videoSrc:
      '//player.bilibili.com/player.html?isOutside=true&aid=380347744&bvid=BV1xZ4y1Q7bU&cid=475174968&p=1',
    date: '2023.8',
  },
  {
    titleEN: 'Tenet Trailer',
    titleCN: '信条宣传片',
    imgSrc: four,
    videoSrc:
      '//player.bilibili.com/player.html?isOutside=true&aid=884313991&bvid=BV1DK4y1Y7zb&cid=227440980&p=1',
    date: '2022.12',
  },
  {
    titleEN: 'The Climber',
    titleCN: '孤高之人',
    imgSrc: five,
    videoSrc:
      '//player.bilibili.com/player.html?isOutside=true&aid=1052854725&bvid=BV1rH4y1T7Uj&cid=1500240458&p=1',
    date: '2024.4',
  },
  {
    titleEN: 'Space Cowboy',
    titleCN: '星际牛仔',
    imgSrc: six,
    videoSrc:
      '//player.bilibili.com/player.html?isOutside=true&aid=116143415103801&bvid=BV1kcADzvEWr&cid=36371760024&p=1',
    date: '2020.4',
  },
]

const videoWords = [
  'Do not go gentle into that good night, Old age should burn and rave at close of day; Rage, rage against the dying of the light.',
  "When fortune smiles on something as violent and ugly as revenge, it seems proof like no other that not only does God exist, you're doing His will.",
  "I have to believe that when my eyes are closed, the world's still there.",
  "I hope you live a life you're proud of. If you find that you're not, I hope you have the strength to start all over again.",
]

let videoTitleTl: GSAPTimeline | null = null

onMounted(() => {
  const videoNum = document.querySelector('.video-num')
  const videoTitle = document.querySelectorAll('.video-title')
  const vidoeEnglish = document.querySelectorAll('.video-english')
  const titleMask = document.querySelectorAll('.title-mask')
  const videoItem = document.querySelectorAll<HTMLElement>('.video-item')
  const videoBg = document.querySelector('#video-mask')
  const faultOuter = document.querySelectorAll('.fault-outer')
  const faultText = document.querySelectorAll<HTMLElement>('.fault-text')

  if (!videoNum) return
  if (!titleMask) return
  if (!videoItem) return
  if (!videoTitle) return
  if (!vidoeEnglish) return
  if (!videoBg) return
  if (!faultOuter) return
  if (!faultText) return
  if (!toTop.value) return
  if (!television.value) return
  if (!upArrow.value) return
  if (!mask.value) return
  if (!video.value) return
  if (!videoContainer.value) return
  if (!totalTitle.value) return
  if (!subTitle.value) return

  function clickVideo(e: Event) {
    isScreen.value = true

    let parentElement: HTMLElement = e.target as HTMLElement
    while (!(parentElement as HTMLElement).hasAttribute('index')) {
      parentElement = parentElement.parentElement!
    }
    const index = Number.parseInt(parentElement.getAttribute('index')!)

    const videoTl = gsap.timeline()
    videoTl.set(videoContainer.value, { top: window.scrollY, display: 'block', opacity: 1 })
    videoTl.to([mask.value, video.value], {
      scaleX: 1,
      transformOrigin: 'left center',
      onComplete: () => {
        video.value!.src = videoItems[index]!.videoSrc
      },
    })
    video.value?.addEventListener('load', () => {
      gsap.to(mask.value, { scaleX: 0, transformOrigin: 'right center' })
    })
  }

  function closeVideo() {
    gsap.to(videoContainer.value, {
      display: 'none',
      opacity: 0,
      onComplete: () => {
        video.value!.src = ''
        isScreen.value = false
      },
    })
  }

  // 初始化视频标题
  videoTitle.forEach((ele) => {
    gsap.set(ele, {
      opacity: 0,
    })
  })
  // 初始化视频元素
  videoItem.forEach((ele) => {
    gsap.set(ele, {
      opacity: 0,
    })
  })

  // 视频元素动画
  videoItem.forEach((ele, index) => {
    const videoItemTl = gsap.timeline({
      scrollTrigger: {
        trigger: ele,
        start: 'top 75%',
      },
    })
    let timer: number | null = null

    videoItemTl.to(ele, {
      opacity: 1,
      onStart: () => {
        timer = setInterval(() => {
          const xRandom = (Math.random() - 0.5) * 8
          const yRandom = (Math.random() - 0.5) * 15
          faultText[index]!.style.transform = `translate(${xRandom}%, ${yRandom}%)`
        }, 30)
      },
    })

    videoItemTl.to(faultOuter[index]!, {
      keyframes: {
        opacity: [1, 0, 1, 0, 1, 0],
      },
      duration: DURATION.slow,
      onComplete: () => {
        clearInterval(timer!)
      },
    })
  })

  // 视频标题动画
  videoItem.forEach((ele, index) => {
    videoTitleTl = gsap.timeline({
      scrollTrigger: {
        trigger: ele,
        start: 'top center',
      },
      defaults: {
        duration: DURATION.base,
        ease: EASE.linear,
      },
    })

    videoTitleTl.to(
      vidoeEnglish[index]!,
      {
        scrambleText: {
          text: videoItems[index]!.titleEN,
          chars: 'lowerCase',
          oldClass: 'text-(--green)',
        },
        duration: DURATION.scene,
      },
      0,
    )

    videoTitleTl.from(
      titleMask[index]!,
      {
        xPercent: -100,
        onComplete: () => {
          gsap.set(videoTitle[index]!, { opacity: 1 })
          gsap.to(titleMask[index]!, { xPercent: 100, delay: DURATION.instant })
        },
      },
      DURATION.fast,
    )
  })

  const titleEnter = textEnterMask(totalTitle.value, 'chars', 'y', DURATION.instant)
  const subTitleTl = textEnter(subTitle.value!, 'words', 'y', DURATION.instant)

  const titleTl = gsap.timeline()

  titleTl?.add(titleEnter!, DURATION.scene)
  titleTl.to(
    videoNum,
    {
      textContent: '6',
      snap: 'textContent',
      duration: DURATION.slow,
      ease: EASE.linear,
    },
    '>-0.8',
  )
  titleTl.add(subTitleTl!, '0.5')

  gsap.to(television.value, {
    keyframes: {
      rotate: [5, -5],
      scale: [1, 1.03, 1],
    },
    duration: DURATION.cinematic,
    ease: EASE.breathe,
    repeat: -1,
    yoyo: true,
  })

  const springTl = gsap.timeline()
  springTl.to(upArrow.value, {
    yPercent: 10,
  })
  springTl.to(upArrow.value, {
    scale: 0,
    yPercent: -170,
  })
  springTl.pause()

  toTop.value.onclick = () => {
    springTl.play(0)
    gsap.to(window, {
      scrollTo: 0,
      duration: DURATION.base,
      delay: DURATION.slow,
      onComplete: () => {
        springTl.pause(0)
      },
    })
  }

  videoItem.forEach((ele) => {
    ele.onclick = clickVideo
  })
  videoBg.addEventListener('click', closeVideo)
})

onUnmounted(() => {})
</script>

<template>
  <section class="relative">
    <div class="w-screen h-[65vh] font-OutFit relative">
      <div class="w-full text-center absolute top-1/2 -translate-y-1/2">
        <div class="text-[18rem]" ref="totalTitle">
          VIDEOS<span class="video-num ml-[5vw]">0</span>
        </div>
        <div
          class="text-[1.5rem] w-full flex px-[12vw] justify-between items-center text-(--green)"
          ref="subTitle"
        >
          <span>MASHUP</span><span class="text-(--white)">✦</span> <span>MAD</span
          ><span class="text-(--white)">✦</span> <span>PROMOTIONAL VIDEO</span
          ><span class="text-(--white)">✦</span> <span>TUTORIALS</span
          ><span class="text-(--white)">✦</span><span>CREATIVE VIDEO</span>
        </div>
      </div>
    </div>

    <div class="video-outer mt-[10vh] px-[8vw]">
      <div
        v-for="(item, index) in videoItems"
        :key="index"
        :index="index"
        class="w-full h-[54.5vh] video-item"
      >
        <div class="w-full h-[40.5vh] overflow-hidden rounded-2xl cursor-pointer relative">
          <div
            class="absolute top-0 left-0 z-10 bg-(--white) w-full h-full flex justify-center items-center fault-outer"
          >
            <span
              class="font-OutFit text-(--black) text-3xl relative z-10 fault-text"
              data-text="NO SIGNAL"
            >
              NO SIGNAL
            </span>
          </div>
          <img
            :src="item.imgSrc"
            alt=""
            class="absolute top-0 left-0 object-cover w-full h-full video-cover"
          />
        </div>

        <div class="w-full h-[10vh] mt-[4vh]">
          <div class="w-max font-ThinFit text-[17px] mt-[1vh] relative overflow-hidden">
            <div class="video-title">{{ item.titleCN }} | {{ item.date }}</div>

            <div class="absolute w-full h-full bg-(--green) top-0 left-0 title-mask"></div>
          </div>

          <div>
            <div class="font-OutFit text-[3rem] video-english"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-screen px-[15vw] pb-[8vh] mt-[20vh] font-ThinFit text-center">
      <div class="w-full h-[30vw] flex flex-col justify-center items-center">
        <div class="w-[20vw] h-[20vw] cursor-pointer relative overflow-hidden" ref="toTop">
          <img :src="tv" alt="" ref="television" class="relative z-10" />
          <div class="absolute top-9/20 left-1/2 -translate-1/2 w-1/4 -rotate-90" ref="upArrow">
            <ArrowRight />
          </div>
        </div>

        <div class="font-OutFit text-(--green) text-[5rem]">BACK TO UP</div>
      </div>

      <div class="w-full flex gap-[3vw] justify-center items-start">
        <div class="flex-1" v-for="(item, index) in videoWords" :key="index">
          {{ item }}
        </div>
      </div>
    </div>

    <div
      class="absolute w-screen z-10 h-screen opacity-0"
      style="display: none"
      ref="videoContainer"
    >
      <div class="w-screen h-screen bg-(--black) opacity-85" id="video-mask"></div>
      <div
        class="absolute z-10 left-1/2 top-11/20 -translate-1/2 w-[80vw] h-[50vw] bg-(--green) scale-x-0"
        ref="mask"
      ></div>
      <iframe
        src=""
        scrolling="no"
        border="0"
        frameborder="no"
        framespacing="0"
        ref="video"
        class="w-[80vw] h-[50vw] absolute left-1/2 top-11/20 -translate-1/2"
      ></iframe>
    </div>
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

.fault-text {
  letter-spacing: 5px;

  &::before {
    content: attr(data-text);

    position: absolute;
    left: 0;
    transform: translate(-2%, 0);

    color: blue !important;
    mix-blend-mode: darken;
  }

  &::after {
    content: attr(data-text);

    position: absolute;
    left: 0;
    transform: translate(2%, 0);

    color: red !important;
    mix-blend-mode: darken;
  }
}
</style>
