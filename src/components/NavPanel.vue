<script setup lang="ts" name="NavPanel">
import { useGloballAnimationStore } from '@/stores/globallAnimation'

import gsap from 'gsap'
import { DURATION, EASE } from '@animation'

import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import navbg from '@assets/svg/navbg.svg'

const { toggleEnum } = useGloballAnimationStore()
const { isOpen } = storeToRefs(useGloballAnimationStore())

const container = ref<Element | null>(null)
let app: Element | null = null

let currentIndex: number
let changeHref: () => void

const link = [
  { chName: '首 X 页', engName: 'HOME', path: '/', index: 0 },
  { chName: '图 X 片', engName: 'PHOTO', path: '/photo', index: 1 },
  { chName: '视 X 频', engName: 'VIDEO', path: '/video', index: 2 },
  { chName: '音 X 乐', engName: 'MUSIC', path: '/music', index: 3 },
  { chName: '技 X 能', engName: 'SKILL', path: '/skill', index: 4 },
]

let openEnum: GSAPTimeline | null = null

onMounted(() => {
  app = document.querySelector('#app')

  const house = document.querySelectorAll('.nav-house')
  const navBtn = document.querySelectorAll<HTMLElement>('.nav-btn')

  if (!app) return
  if (!house) return
  if (!navBtn) return

  gsap.set(house, {
    yPercent: 100,
  })

  changeHref = () => {
    const currentHref = window.location.href.substring(
      'http://'.length + window.location.host.length,
    )
    for (const item of link) {
      navBtn[item.index]?.classList.remove('active')
      if (item.path == currentHref) {
        currentIndex = item.index
      }
    }
    if ('/email' == currentHref) {
      currentIndex = -1
    }
    navBtn[currentIndex]?.classList.add('active')
  }

  openEnum = gsap.timeline()
  openEnum.to(container.value, {
    borderRadius: 0,
    yPercent: -100,
    ease: EASE.outSoft,
    duration: DURATION.scene,
  })
  openEnum.to(
    house,
    {
      stagger: {
        from: 'end',
        amount: DURATION.base,
      },
      yPercent: 0,
    },
    '0.3',
  )
  openEnum.paused(true)
})

watch(isOpen, () => {
  if (isOpen.value) {
    app?.setAttribute('style', '--front-color: #171717;')
    openEnum?.timeScale(1)
    openEnum?.play()
  } else {
    app?.setAttribute('style', '--front-color: #f7f7f7;')
    openEnum?.timeScale(1.25)
    openEnum?.reverse()
  }

  changeHref()
})
</script>

<template>
  <section
    class="fixed bottom-0 z-50 translate-y-1/1 overflow-hidden rounded-l-[120px] rounded-r-[120px]"
    ref="container"
  >
    <div class="relative h-screen w-screen pl-[25vw] pt-[8vh] nav-panel">
      <RouterLink
        :to="item.path"
        class="text-[6.2em] font-black text-(--black) leading-[13vh] flex items-center nav-btn"
        v-for="(item, index) in link"
        :key="index"
        @click="toggleEnum"
      >
        <span class="font-ThinFit chinese change-color-fast">
          {{ item.chName }}
        </span>
        <div class="english change-color-fast relative" :data-text="`${item.engName}`">
          {{ item.engName }}
        </div>
      </RouterLink>

      <div class="mt-15 text-(--black)">
        <div class="font-OutFit">GET IN TOUCH \\\</div>
        <div class="font-ThinFit text-[1.5rem]">
          <span class="text-(--green)">Email: </span>Cowboy@qq.com
        </div>
        <div class="font-ThinFit text-[1.5rem]">
          <span class="text-(--green)">WeChat: </span>Cowboy
        </div>
      </div>

      <img :src="navbg" alt="" class="w-[26vw] absolute bottom-1/5 right-[10vw] nav-house" />
      <img :src="navbg" alt="" class="w-[26vw] absolute bottom-0 right-[-10vw] nav-house" />
      <img :src="navbg" alt="" class="w-[26vw] absolute -bottom-10 right-[20vw] nav-house" />
      <img :src="navbg" alt="" class="w-[26vw] absolute -bottom-1/4 right-0 nav-house" />

      <div class="font-OutFit text-(--black)"></div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.nav-panel {
  background-color: var(--white);
  background-image:
    linear-gradient(0deg, transparent 3.5rem, #ddd 3.7rem),
    linear-gradient(90deg, transparent 3.5rem, #ddd 3.7rem);
  background-size: 3.7rem 3.7rem;

  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
}

.nav-btn {
  & .chinese {
    width: 20px;

    color: var(--black);
    font-size: 19px;
    font-weight: 400;
    line-height: 0px;
    writing-mode: vertical-lr;
    word-spacing: 8px;
  }

  &:hover .chinese {
    color: var(--green);
  }

  & .english {
    &::before {
      content: attr(data-text);

      position: absolute;
      left: 10px;

      letter-spacing: 0.2rem;
      font-size: 6rem;
      color: transparent;
      -webkit-text-stroke: 2px var(--black);
    }
  }

  &:hover .english {
    &::before {
      color: var(--green);
      -webkit-text-stroke: none;
    }
  }
}

.active {
  & .chinese {
    color: var(--green) !important;
  }

  & .english {
    &::before {
      color: var(--green) !important;
      -webkit-text-stroke: none !important;
    }
  }
}
</style>
