<script setup lang="ts" name="TransitionSection">
import gsap from 'gsap'
import { Physics2DPlugin } from 'gsap/Physics2DPlugin'
import { DURATION, EASE } from '@/animation'
gsap.registerPlugin(Physics2DPlugin)

import { onMounted, onUnmounted, ref } from 'vue'

import house from '@assets/svg/house.svg'
import one from '@assets/svg/chess.svg'
import two from '@assets/svg/clover.svg'
import three from '@assets/svg/fan.svg'
import four from '@assets/svg/heart.svg'
import five from '@assets/svg/lightbulb.svg'
import six from '@assets/svg/lightning.svg'
import seven from '@assets/svg/skull.svg'
import eight from '@assets/svg/square.svg'
import nine from '@assets/svg/star.svg'
import ten from '@assets/svg/vuejs.svg'

const iconsSrc = [one, two, three, four, five, six, seven, eight, nine, ten]

const container = ref<Element | null>(null)
const eyeContainer = ref<Element | null>(null)
const fire = ref<Element | null>(null)

let xTo: ((val: number) => void) | null = null
let yTo: ((val: number) => void) | null = null
let xToHeave: ((val: number) => void) | null = null
let yToHeave: ((val: number) => void) | null = null

function moveEye(e: Event) {
  if (!eyeContainer.value) return
  const rect = eyeContainer.value.getBoundingClientRect()
  const x = ((e as MouseEvent).clientX - rect.left) / rect.width - 0.5
  const y = ((e as MouseEvent).clientY - rect.top) / rect.height - 0.5

  xTo?.(x * 80)
  yTo?.(y * 85)
  xToHeave?.(x * 110)
  yToHeave?.(y * 120)
}

function leaveEye() {
  if (!eyeContainer.value) return

  xTo?.(0)
  yTo?.(0)
  xToHeave?.(0)
  yToHeave?.(0)
}

onMounted(() => {
  const eye = document.querySelectorAll('.eye-center')
  const icons = document.querySelectorAll('.icon')

  if (!container.value) return
  if (!eyeContainer.value) return
  if (!fire.value) return
  if (!icons) return
  if (!eye) return

  xTo = gsap.quickTo(eye[0]!, 'x', { duration: DURATION.base })
  yTo = gsap.quickTo(eye[0]!, 'y', { duration: DURATION.base })
  xToHeave = gsap.quickTo(eye[1]!, 'x', { duration: DURATION.base })
  yToHeave = gsap.quickTo(eye[1]!, 'y', { duration: DURATION.base })

  eyeContainer.value.addEventListener('mousemove', moveEye)
  eyeContainer.value.addEventListener('mouseleave', leaveEye)

  const ROTATE_ANGLE = 20
  const REPEAT = 3
  gsap.set(fire.value, { rotate: -ROTATE_ANGLE })

  const fireTl = gsap.timeline()
  fireTl.to(
    fire.value,
    {
      keyframes: {
        rotate: [-ROTATE_ANGLE, -3 * ROTATE_ANGLE],
      },
      repeat: REPEAT,
      yoyo: true,
      transformOrigin: 'center center',
      duration: DURATION.scene,
      ease: EASE.linear,
    },
    0,
  )
  fireTl.to(
    icons,
    {
      opacity: 1,
      stagger: {
        amount: REPEAT * DURATION.scene,
      },
    },
    0,
  )
  fireTl.to(
    icons,
    {
      physics2D: {
        velocity: 'random(800, 1200)',
        angle: 'random(200, 250)',
        gravity: 400,
        acceleration: 45,
        accelerationAngle: 45,
      },
      duration: REPEAT * DURATION.scene,
      stagger: {
        amount: REPEAT * DURATION.scene,
      },
    },
    DURATION.base,
  )
  fireTl.pause()

  container.value.addEventListener('click', () => {
    fireTl.play(0)
  })
})

onUnmounted(() => {
  eyeContainer.value?.removeEventListener('mousemove', moveEye)
  eyeContainer.value?.removeEventListener('mouseleave', leaveEye)
})
</script>

<template>
  <section class="bg-(--green) relative" ref="container">
    <div class="bg-(--black) relative overflow-hidden" style="border-radius: 0 0 20% 20%">
      <div
        class="w-screen h-[95vh] font-OutFit flex flex-col items-center justify-center relative z-10"
      >
        <div class="text-[4rem]">FULL OF CREATIVITY</div>
        <div class="text-[8rem]">ABLE TO <span class="text-(--green)">IMANGINE</span></div>
        <div class="text-[6rem]"><span class="stroke-text">READY </span>TO CREATE</div>
      </div>

      <img :src="house" alt="" class="absolute top-[10vh] left-[8vw] w-55 -rotate-25" />

      <div class="icon-fire w-25 absolute bottom-[8vh] right-[5vw] z-10" ref="fire">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" class="w-full h-full">
          <defs>
            <linearGradient id="pink-purple">
              <stop offset="20%" stop-color="#f5bef3"></stop>
              <stop offset="100%" stop-color="#17f700"></stop>
            </linearGradient>

            <path
              fill="url(#pink-purple)"
              id="triangle"
              d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z"
            />
          </defs>

          <use href="#triangle" class="rotate-90 origin-center scale-70"></use>
          <use href="#triangle" class="-rotate-90 origin-center scale-70 translate-y-3/10"></use>
        </svg>
      </div>

      <img
        v-for="(item, index) in iconsSrc"
        :key="index"
        class="icon absolute bottom-[8.8vh] right-[6vw] opacity-0"
        width="55"
        height="55"
        :src="item"
        alt=""
      />
      <img
        v-for="(item, index) in iconsSrc"
        :key="index"
        class="icon absolute bottom-[8.8vh] right-[6vw] opacity-0"
        width="55"
        height="55"
        :src="item"
        alt=""
      />
    </div>

    <div class="w-screen h-[95vh] bg-(--green) relative">
      <div
        class="font-OutFit text-(--black) text-[10rem] leading-58 text-nowrap"
        v-for="n in 4"
        :key="n"
        :index="n"
      >
        VISUAL <span class="stroke-black">FIRST</span> VISUAL
        <span class="stroke-black">FIRST</span> VISUAL
        <span class="stroke-black">FIRST</span>
      </div>

      <div
        class="absolute left-1/2 top-1/2 -translate-1/2 w-[70vh] h-[70vh] rounded-4xl bg-(--black)"
      >
        <div class="w-full h-full relative" ref="eyeContainer">
          <div
            class="absolute left-1/2 top-1/2 -translate-1/2 w-[40vh] h-[40vh] rounded-full bg-(--white)"
          ></div>
          <div
            class="absolute left-[24vh] top-[24vh] w-[22vh] h-[22vh] rounded-full bg-blue-500 eye-center"
          ></div>
          <div
            class="absolute left-1/2 top-1/2 -translate-1/2 w-[10vh] h-[10vh] rounded-full bg-amber-950 eye-center inner-eye"
          ></div>

          <div class="absolute font-ThinFit text-(--green) text-[2rem] left-[2vh] top-[2vh]">
            视
          </div>
          <div class="absolute font-ThinFit text-(--green) text-[2rem] right-[2vh] top-[2vh]">
            觉
          </div>
          <div class="absolute font-ThinFit text-(--green) text-[2rem] right-[2vh] bottom-[2vh]">
            优
          </div>
          <div class="absolute font-ThinFit text-(--green) text-[2rem] left-[2vh] bottom-[2vh]">
            先
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.stroke-text {
  color: transparent;
  -webkit-text-stroke: 4px var(--green);
}

.stroke-black {
  color: transparent;
  -webkit-text-stroke: 4px var(--black);
}

.inner-eye {
  box-shadow: 0 0 2px 5px #461951;
}

[index='1'],
[index='3'] {
  animation: houseLamp 2s infinite var(--motion-ease-linear) !important;
}

[index='2'],
[index='4'] {
  animation: houseLamp 2s infinite reverse var(--motion-ease-linear) !important;
}

@keyframes houseLamp {
  from {
    transform: translateX(-67%);
  }
  to {
    transform: translateX(0%);
  }
}
</style>
