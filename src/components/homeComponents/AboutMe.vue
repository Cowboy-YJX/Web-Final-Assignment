<script setup lang="ts" name="AboutMe">
import gsap from 'gsap'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin'
import { DURATION, EASE } from '@animation'
gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger, MorphSVGPlugin)

import {
  Scene,
  TorusKnotGeometry,
  Mesh,
  WebGLRenderer,
  PerspectiveCamera,
  Color,
  Timer,
  MeshMatcapMaterial,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import { onBeforeUnmount, onMounted, ref } from 'vue'

import venusBody from '@assets/svg/venus-body.svg'
import venusHand from '@assets/svg/venus-hand.svg'
import venusForearm from '@assets/svg/venus-forearm.svg'

const container = ref<Element | null>(null)
const horizon = ref<Element | null>(null)
const vertical = ref<Element | null>(null)
const pattern = ref<Element | null>(null)

let disposeScene: (() => void) | null = null

onMounted(() => {
  const canvas = document.querySelector<HTMLCanvasElement>('#about-two')
  const patternOuter = document.querySelector('.pattern-outer')

  if (!canvas) return
  if (!patternOuter) return
  if (!horizon.value) return
  if (!vertical.value) return
  if (!container.value) return
  if (!pattern.value) return

  const scene = new Scene()
  scene.background = new Color('#171717')

  const geometry = new TorusKnotGeometry(10, 2, 256, 16, 3, 5)
  const material = new MeshMatcapMaterial({ color: '#17f700' })
  const mesh = new Mesh(geometry, material)
  scene.add(mesh)

  const camera = new PerspectiveCamera(75, 1, 0.1, 100)
  camera.position.set(0, 0, 40)
  camera.lookAt(0, 0, 0)

  const renderer = new WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const control = new OrbitControls(camera, canvas)
  control.enableDamping = true
  control.update()

  function resize() {
    const width = window.innerWidth / 3
    const height = width

    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const clock = new Timer()
  clock.connect(document)

  function render() {
    const timeObject = clock.update()
    const delta = timeObject.getDelta()
    mesh.rotation.x += 1 * delta
    mesh.rotation.y += 0.5 * delta

    control.update()
    renderer.render(scene, camera)
  }

  resize()
  renderer.setAnimationLoop(render)
  window.addEventListener('resize', resize)

  const ctx = gsap.context(() => {
    gsap.from(horizon.value!, {
      scrollTrigger: {
        trigger: container.value,
        start: 'top 85%',
      },
      duration: DURATION.slow,
      ease: EASE.out,
      drawSVG: '0%',
    })

    gsap.from(vertical.value!, {
      scrollTrigger: {
        trigger: container.value,
        start: 'top 55%',
        end: 'bottom +=50',
        scrub: true,
        once: true,
      },
      drawSVG: 0,
      ease: EASE.linear,
    })
  }, container.value)

  const patternTransform = gsap.to(pattern.value, {
    morphSVG:
      'M374.4 80C410.6 80 440 109.4 440 145.7L440 150.9C440 162.1 437.3 173.2 432.2 183.1L429.9 187.3L409.8 220.8C408.7 222.7 408.6 224.2 408.7 225.3C408.9 226.6 409.6 228 410.8 229.2C412 230.4 413.4 231.1 414.7 231.3C415.8 231.5 417.3 231.4 419.2 230.2L452.7 210.1L456.9 207.8C466.9 202.7 477.9 200 489.1 200L494.3 200C530.5 200 559.9 229.4 559.9 265.7C559.9 283.1 553 299.8 540.7 312.1L539.4 313.4C535.7 317.1 535.7 323 539.4 326.7L540.7 328C553 340.3 559.9 357 559.9 374.4C559.9 410.6 530.5 440 494.3 440L489.1 440C476.3 440 463.6 436.5 452.6 429.9L419.1 409.8C417.2 408.7 415.7 408.6 414.6 408.7C413.3 408.9 411.9 409.6 410.7 410.8C409.5 412 408.8 413.4 408.6 414.7C408.4 415.8 408.5 417.3 409.7 419.2L429.8 452.7C436.4 463.7 439.9 476.3 439.9 489.2L439.9 494.4C439.9 530.6 410.5 560 374.3 560C356.9 560 340.2 553.1 327.9 540.8L326.6 539.5C322.9 535.8 317 535.8 313.3 539.5L312 540.8C299.7 553.1 283 560 265.6 560C229.4 560 200 530.6 199.9 494.4L199.9 489.2C199.9 476.4 203.4 463.7 210 452.7L230.1 419.2C231.2 417.3 231.3 415.8 231.2 414.7C231 413.4 230.3 412 229.1 410.8C227.9 409.6 226.5 408.9 225.2 408.7C224.7 408.6 224 408.6 223.3 408.7L220.8 409.7L187.3 429.8C176.3 436.4 163.7 439.9 150.8 439.9L145.6 439.9C109.4 440 80 410.6 80 374.4C80 357 86.9 340.3 99.2 328L100.5 326.7L101.7 325.2C103.8 322.1 103.8 318 101.7 314.9L100.5 313.4L99.2 312.1C86.9 299.8 80 283.1 80 265.7C80 229.4 109.4 200 145.7 200L150.9 200C163.7 200 176.4 203.5 187.4 210.1L220.9 230.2L223.4 231.2C224.1 231.3 224.8 231.3 225.3 231.3C226.6 231.1 228 230.4 229.2 229.2C230.4 228 231.1 226.6 231.3 225.3C231.4 224.8 231.4 224.1 231.2 223.4L230.2 220.9L210.1 187.4C203.5 176.4 200 163.8 200 150.9L200 145.7C200 109.5 229.4 80 265.7 80C283.1 80 299.8 86.9 312.1 99.2L313.4 100.5C317.1 104.1 323 104.2 326.7 100.5L328 99.2L332.8 94.8C344.5 85.3 359.1 80 374.4 80z',
    duration: DURATION.slow,
    ease: EASE.springSoft,
    rotate: 180,
    transformOrigin: 'center center',
  })
  patternTransform.pause()

  patternOuter.addEventListener('mouseenter', () => {
    patternTransform.play(0)
  })
  patternOuter.addEventListener('mouseleave', () => {
    patternTransform.reverse()
  })

  disposeScene = () => {
    window.removeEventListener('resize', resize)
    renderer.setAnimationLoop(null)
    control.dispose()
    ctx.revert()
    geometry.dispose()
    material.dispose()
    renderer.dispose()
  }
})

onBeforeUnmount(() => {
  disposeScene?.()
  disposeScene = null
})
</script>

<template>
  <section class="relative min-h-[200vh] pt-[6vh]" ref="container">
    <div class="font-OutFit text-[4rem] text-center" ref="ask">
      WHAT <span class="text-(--green)">SKILLS</span> DO I HAVE
    </div>
    <div
      class="font-OutFit text-[12rem] query-icon absolute right-[24vw] top-[1vh] -z-10 rotate-32"
    >
      ?
    </div>

    <svg class="w-screen absolute top-0 left-0" viewBox="0 0 1000 1150">
      <path
        d="M120 1 L886 1"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="stroke-(--white)"
        ref="horizon"
      ></path>
      <path
        d="M499 130 L499 1149"
        fill="none"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="stroke-(--white)"
        ref="vertical"
      ></path>
    </svg>

    <div class="absolute left-[12vw] top-[25vh] font-OutFit text-[1.5rem]">
      I'M A<br />
      <span class="text-(--green) text-[2rem]">GRAPHIC DESGINER</span><br />
      <span class="about-order">0 1</span><br />
      <div class="font-ThinOut text-center relative top-[10vh]">会做一些奇奇怪怪的动画</div>

      <svg viewBox="0 0 550 799.7" class="w-[18vw] overflow-visible relative top-[20vh]">
        <image width="550" height="799.7" :href="venusBody" />
        <g class="venus_forearm">
          <image width="550" height="799.7" :href="venusForearm" />
          <circle class="venus-circle" cx="214" cy="549.8" r="10.7" />
          <line class="venus-line" x1="234.8" y1="527.2" x2="362.5" y2="432.8" />
          <image class="venus-hand" width="550" height="799.7" :href="venusHand" />
        </g>
      </svg>
    </div>

    <div class="absolute right-[12vw] top-[75vh] font-OutFit text-[1.5rem]">
      I'M A<br />
      <span class="text-(--green) text-[2rem]">THREED EDITOR</span><br />
      <span class="about-order">0 2</span><br />
      <div class="text-center font-ThinFit relative top-[8vh]">会做奇形怪状的建模</div>

      <canvas id="about-two" class="block relative top-[15vh]"></canvas>
    </div>

    <div class="absolute left-[12vw] top-[125vh] font-OutFit text-[1.5rem]">
      I'M A<br />
      <span class="text-(--green) text-[2rem]">UX DESGINER</span><br />
      <span class="about-order">0 3</span><br />
      <div class="text-center font-ThinFit relative top-[8vh]">会做不拘一格的交互</div>

      <div class="pattern-outer relative top-[15vh]">
        <svg viewBox="0 0 640 640" class="w-[18vw]">
          <path
            ref="pattern"
            class="fill-(--green)"
            d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"
          />
        </svg>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.query-icon {
  color: transparent;
  -webkit-text-stroke: 4px var(--green);
}

.about-order {
  color: transparent;
  -webkit-text-stroke: 2px var(--white);
}

.venus-circle {
  fill: var(--green);
  animation: venus-circle 2s ease infinite;
}

@keyframes venus-circle {
  0% {
    fill: #17f700;
  }

  30% {
    fill: #b20426;
  }

  80% {
    fill: #b20426;
  }

  100% {
    fill: #17f700;
  }
}

.venus-line {
  fill: none;
  stroke: #17f700;
  stroke-width: 10;
  stroke-linecap: round;
  stroke-dasharray: 100 20;
  stroke-dashoffset: 0;
  animation: venus-line 2s ease infinite;
}

@keyframes venus-line {
  to {
    stroke-dashoffset: -240;
  }
}

.venus-forearm {
  transform-origin: 159.7px 575.7px;
  animation: venus_forearm 2s ease infinite;
}

@keyframes venus_forearm {
  0% {
    transform: rotate(-10deg);
  }

  30% {
    transform: rotate(40deg);
  }

  100% {
    transform: rotate(-10deg);
  }
}

.venus-hand {
  transform-origin: 395.7px 407.6px;
  animation: venus_hand 2s ease infinite;
}

@keyframes venus_hand {
  0% {
    transform: rotate(-30deg);
  }

  30% {
    transform: rotate(10deg);
  }

  100% {
    transform: rotate(-30deg);
  }
}
</style>
