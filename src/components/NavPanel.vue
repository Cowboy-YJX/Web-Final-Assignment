<script setup lang="ts" name="NavPanel">
import { useGloballAnimationStore } from '@/stores/globallAnimation'

import gsap from 'gsap'
import { DURATION, EASE } from '@animation'

import { storeToRefs } from 'pinia'
import { onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

const { toggleEnum } = useGloballAnimationStore()
const { isOpen } = storeToRefs(useGloballAnimationStore())

const container = ref<Element | null>(null)
let app: Element | null = null

const link = [
  { chName: '首 X 页', engName: 'HOME', path: '/' },
  { chName: '图 X 片', engName: 'PHOTO', path: '/photo' },
  { chName: '视 X 频', engName: 'VIDEO', path: '/video' },
  { chName: '音 X 乐', engName: 'MUSIC', path: '/music' },
  { chName: '技 X 能', engName: 'SKILL', path: '/skill' },
]

let openEnum: GSAPAnimation | null = null

onMounted(() => {
  app = document.querySelector('#app')

  if (!app) return

  openEnum = gsap.to(container.value, {
    borderRadius: 0,
    yPercent: -100,
    ease: EASE.outSoft,
    duration: DURATION.scene,
  })
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
})
</script>

<template>
  <section
    class="fixed bottom-0 z-50 translate-y-1/1 overflow-hidden rounded-l-[120px] rounded-r-[120px]"
    ref="container"
  >
    <div class="relative h-screen w-screen pl-[26vw] pt-[8vh] nav-panel">
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

      <div></div>
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
