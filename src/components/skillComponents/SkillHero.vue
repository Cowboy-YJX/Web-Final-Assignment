<script setup lang="ts" name="SkillHero">
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { DURATION, EASE } from '@animation'
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, DrawSVGPlugin)

import { onMounted, onUnmounted, ref, watch } from 'vue'

import {
  PointsMaterial,
  PerspectiveCamera,
  BufferGeometry,
  TorusGeometry,
  TorusKnotGeometry,
  ConeGeometry,
  MeshToonMaterial,
  WebGLRenderer,
  Scene,
  Group,
  Mesh,
  DirectionalLight,
  TextureLoader,
  Timer,
  BufferAttribute,
  NearestFilter,
  Points,
} from 'three'
import gradientTexture from '@assets/texture/gradient/3.jpg'

import chess from '@assets/svg/chess.svg'
import envelope from '@assets/svg/envelope.svg'
import fan from '@assets/svg/fan.svg'
import heart from '@assets/svg/heart.svg'
import lightning from '@assets/svg/lightning.svg'
import skull from '@assets/svg/skull.svg'
import square from '@assets/svg/square.svg'
import star from '@assets/svg/star.svg'

const container = ref<Element | null>(null)
const rightBrand = ref<Element | null>(null)
const flairArea = ref<HTMLElement | null>(null)
const path = ref<Element | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

const currentSkill = ref<number>(0)

let horizon: GSAPTween | null = null

const skills = [
  {
    name: 'C++',
    items: ['OpenGL', 'Vulkan', 'Im GUI', 'Enbedded'],
  },
  {
    name: 'JAVA',
    items: ['Java Web', 'SpringBoot', 'SpringMVC', 'Spring Security'],
  },
  {
    name: 'FRONTED',
    items: ['TypeScript', 'Vue', 'GSAP', 'THREE'],
  },
]

const flairIcons = [chess, envelope, fan, heart, lightning, skull, square, star]

let disposeFlair: (() => void) | null = null

function setupFlair(area: HTMLElement): () => void {
  const icons = Array.from(area.querySelectorAll<HTMLImageElement>('.skill-flair'))
  if (!icons.length) return () => {}

  let index = 0
  const nextIcon = gsap.utils.wrap(0, icons.length)
  const pointer = { x: 0, y: 0 }
  const last = { x: 0, y: 0 }
  const smooth = { x: 0, y: 0 }
  let hasPointer = false

  function onPointerMove(event: PointerEvent): void {
    const rect = area.getBoundingClientRect()
    pointer.x = event.clientX - rect.left
    pointer.y = event.clientY - rect.top

    // 第一次进入时先对齐，避免从左上角 0,0 喷一个出来
    if (!hasPointer) {
      smooth.x = last.x = pointer.x
      smooth.y = last.y = pointer.y
      hasPointer = true
    }
  }

  function spawn(): void {
    const icon = icons[nextIcon(index++)]
    if (!icon) return

    const fallY = area.clientHeight + 80

    gsap.killTweensOf(icon)
    gsap.set(icon, {
      opacity: 0,
      x: smooth.x,
      y: smooth.y,
      xPercent: -50,
      yPercent: -50,
      scale: 0,
      rotation: gsap.utils.random([-180, 180]),
    })

    gsap
      .timeline({ defaults: { ease: 'expo.out', duration: 1 } })
      .to(icon, { duration: 0.3, opacity: 1, scale: 1, ease: 'back.out', rotation: 0 }, 0)
      .to(icon, { x: pointer.x, y: pointer.y, xPercent: -50, yPercent: -50 }, 0)
      .to(icon, { rotation: gsap.utils.random([-600, 600, -300, 300]), ease: 'power3.in' }, 0.1)
      .to(icon, { opacity: 0, ease: 'power1.in', duration: 0.8 }, 0.4)
      .to(icon, { y: fallY, ease: 'power3.inOut' }, 0.4)
  }

  const mm = gsap.matchMedia()

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const tick = (): void => {
      if (!hasPointer) return

      const distance = Math.hypot(last.x - pointer.x, last.y - pointer.y)

      smooth.x = gsap.utils.interpolate(smooth.x, pointer.x, 0.1)
      smooth.y = gsap.utils.interpolate(smooth.y, pointer.y, 0.1)

      if (distance > 100) {
        // 快速甩动时别让图标拖在很后面，直接在鼠标位置生成
        if (distance > 400) {
          smooth.x = pointer.x
          smooth.y = pointer.y
        }

        spawn()
        last.x = pointer.x
        last.y = pointer.y
      }
    }

    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  })

  area.addEventListener('pointermove', onPointerMove)

  return () => {
    area.removeEventListener('pointermove', onPointerMove)
    mm.revert()
    for (const icon of icons) {
      gsap.killTweensOf(icon)
      gsap.set(icon, { opacity: 0 })
    }
  }
}

let timer: number | null = null

function next() {
  if (!timer) {
    timer = setTimeout(() => {
      timer = null
    }, 300)
  } else {
    return
  }

  if (currentSkill.value % 3 >= 2) {
    currentSkill.value = 0
  } else {
    currentSkill.value++
  }

  gsap.to(window, { scrollTo: 0 })
}

// 3D部分变量
let disposeScene: (() => void) | null = null
// 画布大小
const size = { width: window.innerWidth * 0.5, height: window.innerHeight }
// 间隔为一个屏幕的宽度
const objectGap = 4
// 粒子总数
const particleNum = 500
// 当前物体index
const currentObject = ref<number>(0)

onMounted(() => {
  if (!container.value) return
  if (!rightBrand.value) return
  if (!path.value) return
  if (!canvas.value) return

  horizon = gsap.to(rightBrand.value, {
    scrollTrigger: {
      trigger: container.value,
      start: 'top top',
      end: '+=2400',
      scrub: true,
      pin: true,
      onUpdate: (self) => {
        if (self.progress >= 0.99) {
          next()
        }
      },
    },
    ease: EASE.linear,
    xPercent: -68,
  })

  gsap.from(path.value, {
    scrollTrigger: {
      trigger: rightBrand.value,
      containerAnimation: horizon,
      start: 'left center',
      end: 'right right',
      scrub: true,
    },
    ease: EASE.linear,
    drawSVG: '0',
  })

  if (flairArea.value) {
    disposeFlair = setupFlair(flairArea.value)
  }

  // 3D部分
  function resize() {
    size.width = window.innerWidth * 0.5
    size.height = window.innerHeight

    canvas.value!.width = size.width
    canvas.value!.height = size.height

    camera!.aspect = size.width / size.height
    camera?.updateProjectionMatrix()

    renderer.setSize(size.width, size.height)
    const pixelRatio = Math.min(window.devicePixelRatio, 2)
    renderer?.setPixelRatio(pixelRatio)
  }

  function setParticles() {
    for (let i = 0; i < particleNum; i++) {
      const i1 = i * 3 + 0
      const i2 = i * 3 + 1
      const i3 = i * 3 + 2

      const xRandom = objectGap * 1.25 - (Math.random() - 0.5) * 15
      const yRandom = (Math.random() - 0.5) * 10
      const zRandom = (Math.random() - 0.5) * 10

      particles[i1] = xRandom
      particles[i2] = yRandom
      particles[i3] = zRandom
    }
  }

  // 视差
  let parallaxX = 0
  let parallaxY = 0
  function parallax(e: MouseEvent) {
    parallaxX = (e.clientX - size.width) / size.width - 0.5
    parallaxY = -(e.clientY / size.height - 0.5)
  }

  // 渲染函数
  function render() {
    // 帧间隔
    timer.update()
    const delta = timer.getDelta()

    // 物体旋转
    objects.forEach((object) => {
      object.rotation.x += delta * 0.1
      object.rotation.y += delta * 0.12
    })

    // 更新物体位置
    const y = (window.scrollY / size.height) * objectGap
    camera.position.x = y

    // 当前物体快速旋转一周
    currentObject.value = Math.round(window.scrollY / size.height)

    // 平滑视差
    objectGroup.position.x += (parallaxX - objectGroup.position.x) * 5 * delta
    objectGroup.position.y += (parallaxY - objectGroup.position.y) * 5 * delta

    renderer.render(scene, camera)
  }

  canvas.value!.width = size.width
  canvas.value!.height = size.height

  const textureLoader = new TextureLoader()
  const gradient = textureLoader.load(gradientTexture)
  gradient.magFilter = NearestFilter

  const timer = new Timer()

  const scene = new Scene()

  const particles = new Float32Array(particleNum * 3)
  setParticles()
  const particleGeometry = new BufferGeometry()
  const positionAttribute = new BufferAttribute(particles, 3)
  particleGeometry.setAttribute('position', positionAttribute)
  const particleMaterial = new PointsMaterial({
    color: 0xffffff,
    sizeAttenuation: true,
    size: 0.06,
  })
  const particleMesh = new Points(particleGeometry, particleMaterial)

  const toonMaterial = new MeshToonMaterial({ color: 0x17f700, gradientMap: gradient })

  const torus = new TorusGeometry(1, 0.4, 16, 60)
  const cone = new ConeGeometry(1, 2, 32)
  const torusKnot = new TorusKnotGeometry(0.8, 0.35, 100, 16)

  const objectOne = new Mesh(torus, toonMaterial)
  const objectTwo = new Mesh(torusKnot, toonMaterial)
  const objectThree = new Mesh(cone, toonMaterial)

  const objects = [objectOne, objectTwo, objectThree]
  objects.forEach((object, index) => {
    // 乘1.25保持居中
    object.position.x = objectGap * 1.25 * index
    object.position.y = index % 2 == 1 ? 1 : -1
  })

  const objectGroup = new Group()
  objectGroup.add(objectOne, objectTwo, objectThree, particleMesh)
  scene.add(objectGroup)

  const dirLight = new DirectionalLight(0xffffff, 5)
  dirLight.position.set(1, 1, 0)
  scene.add(dirLight)

  const camera = new PerspectiveCamera(35, size.width / size.height, 0.1, 100)
  camera.position.set(0, 0, 10)
  scene.add(camera)

  const renderer = new WebGLRenderer({
    canvas: canvas.value,
    alpha: true,
  })
  renderer.setSize(size.width, size.height)

  resize()
  renderer.setAnimationLoop(render)

  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', parallax)

  disposeScene = () => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', parallax)

    renderer.setAnimationLoop(null)
    torus.dispose()
    torusKnot.dispose()
    cone.dispose()
    particleGeometry.dispose()
    toonMaterial.dispose()
    particleMaterial.dispose()
    renderer.dispose()
  }

  watch(currentObject, () => {
    gsap.to(objects[currentObject.value]!.rotation, {
      x: '+=2',
      y: '+=4',
      duration: DURATION.scene,
      ease: EASE.inOut,
    })
  })
})

onUnmounted(() => {
  disposeFlair?.()
  disposeFlair = null

  horizon?.kill()

  disposeScene?.()
})
</script>

<template>
  <section class="relative w-screen">
    <!-- pin 的目标放在组件内部，别 pin 组件根节点：否则 pin-spacer 会留在 RouterView 外面 -->
    <div ref="container" class="relative w-screen h-screen">
      <div
        ref="flairArea"
        class="relative z-10 w-1/2 h-full overflow-hidden bg-(--green) skill-left"
      >
        <div
          class="text-(--black) font-OutFit text-[2rem] absolute z-10 left-1/2 top-7/20 -translate-1/2 w-full text-center"
        >
          WHAT SPECIFIC SKILLS DO I HAVE?
        </div>
        <div
          class="text-(--black) font-OutFit text-[8rem] absolute z-10 left-1/2 top-1/2 -translate-1/2"
        >
          {{ skills[currentSkill]!.name }}
        </div>
        <img
          v-for="(icon, index) in flairIcons"
          :key="index"
          :src="icon"
          class="skill-flair"
          alt=""
          aria-hidden="true"
        />
      </div>

      <div class="w-[150vw] absolute top-1/2 -translate-y-1/2 left-1/2" ref="rightBrand">
        <svg viewBox="0 0 2200 400">
          <path
            d="M100 200 Q350 50 600 200 Q850 350 1100 200 Q1350 50 1600 200 Q1850 350 2100 200"
            stroke-width="12"
            stroke-linejoin="round"
            stroke-linecap="round"
            class="stroke-(--white)"
            fill="none"
            ref="path"
          />
        </svg>

        <div
          class="absolute font-OutFit text-2xl"
          v-for="(item, index) in skills[currentSkill]?.items"
          :key="index"
          :skill-index="index"
        >
          {{ item }}
        </div>
      </div>

      <canvas ref="canvas" class="absolute -z-10 top-0 left-[50vw]"></canvas>
    </div>
  </section>
</template>

<style scoped lang="scss">
.skill-left {
  border-radius: 0 10% 10% 0;
}

.skill-flair {
  position: absolute;
  top: 0;
  left: 0;
  width: 48px;
  height: auto;
  opacity: 0;
  pointer-events: none;
  user-select: none;
  will-change: transform, opacity;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.18));
}

[skill-index='0'] {
  top: 0;
  left: 20vw;
}

[skill-index='1'] {
  bottom: 0;
  left: 55vw;
}

[skill-index='2'] {
  top: 0;
  left: 89vw;
}

[skill-index='3'] {
  bottom: 0;
  left: 123vw;
}
</style>
