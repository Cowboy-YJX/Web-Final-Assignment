<script setup lang="ts" name="NavBar">
import { useGloballAnimationStore } from '@stores/globallAnimation'

import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'

import Logo from '@icons/Logo.vue'
import ArrowRight from '@icons/ArrowRight.vue'
import XMark from '@icons/XMark.vue'

const { toggleEnum } = useGloballAnimationStore()
const { isOpen } = storeToRefs(useGloballAnimationStore())
const enumBtn = ref<Element | null>(null)

let app: Element | null = null
let navContact: HTMLElement | null = null

onMounted(() => {
  navContact = document.querySelector('#nav-contact')
  app = document.querySelector('#app')
  if (!enumBtn.value) return
  if (!app) return
  if (!navContact) return

  enumBtn.value.addEventListener('click', () => {
    toggleEnum()
  })
})

watch(isOpen, () => {
  if (isOpen.value) {
    app?.setAttribute('style', '--front-color: #171717;')
    navContact!.style.backgroundColor = 'var(--black)'
  } else {
    app?.setAttribute('style', '--front-color: #f7f7f7;')
    navContact!.style.backgroundColor = 'transparent'
  }
})
</script>

<template>
  <nav class="w-screen px-[6vw] flex justify-between items-center fixed top-10 z-99">
    <div>
      <button class="w-11 h-11 cursor-pointer">
        <Logo :circle="true" />
      </button>
    </div>

    <div class="flex gap-[2vw] items-center">
      <div class="w-8 h-8 bg-(--green) rounded-full" ref="enumBtn">
        <XMark />
      </div>

      <RouterLink
        :to="`/email`"
        class="w-45 h-13 rounded-full font-OutFit text-[1.3em] flex justify-center items-center gap-2 relative overflow-hidden z-10"
        id="nav-contact"
      >
        CONTACT
        <div class="w-8 arrow-icon"><ArrowRight /></div>
      </RouterLink>
    </div>
  </nav>
</template>

<style scoped lang="scss">
#nav-contact {
  border-color: var(--front-color) !important;
  border-width: 2px !important;
  border-style: solid !important;
  background: transparent;

  transition:
    background-color var(--motion-duration-slow) var(--motion-duration-base),
    border-color var(--motion-duration-slow) var(--motion-duration-base),
    color var(--motion-duration-slow);

  &:hover {
    color: var(--black) !important;
  }

  &::before {
    content: '';

    width: 100%;
    height: 100%;
    border-radius: calc(infinity * 1px);

    transform: scaleX(0);
    transition: transform var(--motion-duration-base) var(--motion-duration-instant);
    transform-origin: left center;

    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;

    background-color: var(--white);
  }

  &:hover::before {
    transform: scaleX(1);
  }

  &::after {
    content: '';

    width: 100%;
    height: 100%;
    border-radius: calc(infinity * 1px);

    transform: scaleX(0);
    transition: all var(--motion-duration-slow) var(--motion-duration-fast);
    transform-origin: left center;

    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;

    background-color: var(--green);
    opacity: 0;
  }

  &:hover::after {
    transform: scaleX(1);
    opacity: 1;
  }

  .arrow-icon {
    transition:
      transform var(--motion-duration-base),
      width var(--motion-duration-instant) var(--motion-duration-base);
  }

  &:hover .arrow-icon {
    width: 0 !important;
    transform: translateX(200%);
  }
}
</style>
