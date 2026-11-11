<script setup lang="ts" name="MusicHero">
import {
  AmbientLight,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  Fog,
  FrontSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Raycaster,
  RingGeometry,
  Scene,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  WebGLRenderer,
} from 'three'
import type { Object3D } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

import gsap from 'gsap'
import { EASE } from '@animation'

import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import one from '@assets/photos/records/Groupies.jpg'
import two from '@assets/photos/records/BLU-SWING-10th-Anniversary-Best.jpg'
import three from '@assets/photos/records/Illuminus.jpg'
import four from '@assets/photos/records/月光.jpg'
import five from '@assets/photos/records/Luv(sic).jpg'
import six from '@assets/photos/records/MIRROR.jpg'
import seven from '@assets/photos/records/Natural-Relax-presented-by-Folklove.jpg'
import eight from '@assets/photos/records/Nostalgic.jpg'
import nine from '@assets/photos/records/Persona-3-Reload-(Original-Soundtrack).jpg'
import ten from '@assets/photos/records/Sunflower-in-the-Sunlight.jpg'

const canvas = ref<HTMLCanvasElement | null>(null)

const recordsInfo = [
  {
    title: 'Groupies 吉他手',
    type: '流行乐',
    author: '陈绮贞',
    score: '9.3 / 10.0',
    cover: one,
  },
  {
    title: '10th-Anniversary-Best',
    type: '爵士乐',
    author: 'BLU_SWING',
    score: '9.0 / 10.0',
    cover: two,
  },
  {
    title: 'Illuminus',
    type: '爵士乐',
    author: 'Kenichiro Nishihara',
    score: '8.4 / 10.0',
    cover: three,
  },
  {
    title: '月光',
    type: '爵士乐',
    author: '蛋堡',
    score: '8.6 / 10.0',
    cover: four,
  },
  {
    title: 'Luv(sic)',
    type: '嘻哈乐',
    author: 'Nujabes',
    score: '9.7 / 10.0',
    cover: five,
  },
  {
    title: 'MIRROR',
    type: '嘻哈乐',
    author: 'DJ Okawari',
    score: '9.0 / 10.0',
    cover: six,
  },
  {
    title: 'Natural-Relax',
    type: '爵士乐',
    author: 'Kenichiro Nishihara',
    score: '9.0 / 10.0',
    cover: seven,
  },
  {
    title: 'Nostalgic',
    type: '爵士乐',
    author: 'Robert de Boron',
    score: '7.8 / 10.0',
    cover: eight,
  },
  {
    title: 'Persona-3-Reload-(Original-Soundtrack)',
    type: '爵士乐',
    author: 'ATLUS / SEGA',
    score: '9.2 / 10.0',
    cover: nine,
  },
  {
    title: 'Sunflower-in-the-Sunlight',
    type: '嘻哈乐',
    author: 'Nieve',
    score: '7.9 / 10.0',
    cover: ten,
  },
]

const recordTotal = recordsInfo.length
const currentId = ref<number>(0)
const currentRecord = computed(() => recordsInfo[currentId.value] ?? recordsInfo[0])
const currentIndex = computed(() => String(currentId.value + 1).padStart(2, '0'))
const recordTotalLabel = computed(() => String(recordTotal).padStart(2, '0'))

const outerRadius = 11
const holeRadius = 1.15
const discThickness = 0.22
const maxVisibleOffset = 3
const wheelCooldown = 500

interface RecordItem {
  group: Group
  spin: Group
  frontMaterial: MeshBasicMaterial
  texture: Texture
}

let disposeScene: (() => void) | null = null

onMounted(() => {
  if (!canvas.value) return
  const canvasEl = canvas.value

  const scene = new Scene()
  scene.background = new Color(0x171717)
  const fog = new Fog(0x171717, 44, 83)
  scene.fog = fog

  const camera = new PerspectiveCamera(50, 1, 0.1, 200)
  camera.position.set(0, 0, 38)
  camera.lookAt(0, 0, 0)

  const renderer = new WebGLRenderer({ canvas: canvasEl, antialias: true })
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 1.0
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // 环境贴图：背面 iridescence 和正面 clearcoat 都需要它才有反光
  const pmrem = new PMREMGenerator(renderer)
  const roomEnv = new RoomEnvironment()
  const environment = pmrem.fromScene(roomEnv, 0.04)
  scene.environment = environment.texture
  roomEnv.dispose()
  pmrem.dispose()

  const keyLight = new DirectionalLight(0xffffff, 2.0)
  keyLight.position.set(6, 8, 10)
  scene.add(keyLight)

  const rimLight = new DirectionalLight(0x89b6ff, 0.7)
  rimLight.position.set(-8, -4, -6)
  scene.add(rimLight)

  const ambient = new AmbientLight(0xffffff, 0.1)
  scene.add(ambient)

  // 所有唱片共享的几何体和材质
  const discGeometry = new CircleGeometry(outerRadius, 96)
  const edgeGeometry = new CylinderGeometry(outerRadius, outerRadius, discThickness, 96, 1, true)
  const holeGeometry = new CircleGeometry(holeRadius, 64)
  const hubGeometry = new RingGeometry(holeRadius, holeRadius + 0.55, 64, 1)

  const backMaterial = new MeshPhysicalMaterial({
    color: 0xd4dce7,
    metalness: 1,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    iridescence: 1,
    iridescenceIOR: 1.7,
    iridescenceThicknessRange: [100, 450],
    envMapIntensity: 1.3,
    fog: true,
  })

  const edgeMaterial = new MeshPhysicalMaterial({
    color: 0x9aa4b2,
    metalness: 1,
    roughness: 0.26,
    envMapIntensity: 1.1,
    side: DoubleSide,
    fog: true,
  })

  const hubMaterial = new MeshPhysicalMaterial({
    color: 0xdbe2ea,
    metalness: 1,
    roughness: 0.18,
    iridescence: 1,
    iridescenceIOR: 1.9,
    iridescenceThicknessRange: [50, 300],
    envMapIntensity: 1.2,
    side: DoubleSide,
    fog: true,
  })

  const holeMaterial = new MeshBasicMaterial({
    color: 0x050505,
    side: DoubleSide,
    fog: true,
  })

  const textureLoader = new TextureLoader()
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
  const records: RecordItem[] = []

  for (const info of recordsInfo) {
    const texture = textureLoader.load(info.cover)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = maxAnisotropy

    const frontMaterial = new MeshBasicMaterial({
      map: texture,
      toneMapped: false,
      side: FrontSide,
      fog: true,
    })

    const front = new Mesh(discGeometry, frontMaterial)
    front.position.z = discThickness / 2 + 0.002

    const back = new Mesh(discGeometry, backMaterial)
    back.position.z = -discThickness / 2 - 0.002
    back.rotation.y = Math.PI

    const edge = new Mesh(edgeGeometry, edgeMaterial)
    edge.rotation.x = Math.PI / 2

    const frontHole = new Mesh(holeGeometry, holeMaterial)
    frontHole.position.z = discThickness / 2 + 0.012

    const backHole = new Mesh(holeGeometry, holeMaterial)
    backHole.position.z = -discThickness / 2 - 0.012

    const frontHub = new Mesh(hubGeometry, hubMaterial)
    frontHub.position.z = discThickness / 2 + 0.014

    const backHub = new Mesh(hubGeometry, hubMaterial)
    backHub.position.z = -discThickness / 2 - 0.014
    backHub.rotation.y = Math.PI

    const spin = new Group()
    spin.add(front, back, edge, frontHole, backHole, frontHub, backHub)

    const group = new Group()
    group.add(spin)
    scene.add(group)

    records.push({ group, spin, frontMaterial, texture })
  }

  function goTo(index: number): void {
    const next = (index + recordTotal) % recordTotal
    if (next === currentId.value) return

    currentId.value = next
    applyLayout(true)
  }

  function applyLayout(animate: boolean): void {
    const spread = camera.aspect < 0.9 ? 0.62 : 1

    records.forEach((record, index) => {
      let offset = index - currentId.value
      if (offset > recordTotal / 2) offset -= recordTotal
      if (offset < -recordTotal / 2) offset += recordTotal

      const distance = Math.abs(offset)
      const visible = distance <= maxVisibleOffset
      record.group.visible = visible
      if (!visible) return

      const sign = Math.sign(offset)
      const shade = distance === 0 ? 1 : 0.45
      const target = {
        x: sign * (12.25 + (distance - 1) * 6.5) * spread,
        y: -distance * 1.5,
        z: -distance * 6,
        scale: 1 - distance * 0.17,
        rotationY: -sign * (0.18 + (distance - 1) * 0.12),
      }

      if (!animate) {
        record.frontMaterial.color.setScalar(shade)
        record.group.position.set(target.x, target.y, target.z)
        record.group.scale.setScalar(target.scale)
        record.group.rotation.y = target.rotationY
        record.spin.rotation.set(0, 0, 0)
        return
      }

      gsap.to(record.group.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 0.85,
        ease: EASE.outSoft,
        overwrite: 'auto',
      })
      gsap.to(record.group.scale, {
        x: target.scale,
        y: target.scale,
        z: target.scale,
        duration: 0.85,
        ease: EASE.outSoft,
        overwrite: 'auto',
      })
      gsap.to(record.group.rotation, {
        y: target.rotationY,
        duration: 0.85,
        ease: EASE.outSoft,
        overwrite: 'auto',
      })
      // 主唱片保持本色，两侧唱片压暗，视觉焦点留在中间
      gsap.to(record.frontMaterial.color, {
        r: shade,
        g: shade,
        b: shade,
        duration: 0.6,
        ease: EASE.outSoft,
        overwrite: 'auto',
      })
      // 切换唱片时把上一张被拖到背面/侧面的角度转回正面
      gsap.to(record.spin.rotation, {
        x: 0,
        y: 0,
        duration: 0.7,
        ease: EASE.outSoft,
        overwrite: 'auto',
      })
    })
  }

  function resize(): void {
    const parent = canvasEl.parentElement
    const width = parent?.clientWidth || window.innerWidth
    const height = parent?.clientHeight || window.innerHeight

    renderer.setSize(width, height, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    camera.aspect = width / height
    camera.position.z = camera.aspect < 0.9 ? 52 : 38
    camera.updateProjectionMatrix()

    fog.near = camera.position.z + 6
    fog.far = camera.position.z + 45

    applyLayout(false)
  }

  function render(): void {
    renderer.render(scene, camera)
  }

  let dragging = false
  let pointerMoved = 0
  let lastX = 0
  let lastY = 0

  const raycaster = new Raycaster()
  const pointer = new Vector2()

  function selectRecordAt(event: PointerEvent): void {
    const rect = canvasEl.getBoundingClientRect()
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
    raycaster.setFromCamera(pointer, camera)

    const groups: Object3D[] = []
    const indices: number[] = []
    records.forEach((record, index) => {
      if (!record.group.visible) return
      groups.push(record.group)
      indices.push(index)
    })

    const hits = raycaster.intersectObjects(groups, true)
    const hit = hits[0]
    if (!hit) return

    let target: Object3D | null = hit.object
    while (target && !groups.includes(target)) target = target.parent
    if (!target) return

    const groupIndex = groups.indexOf(target)
    const index = indices[groupIndex] ?? -1
    if (index >= 0 && index !== currentId.value) goTo(index)
  }

  function onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return

    dragging = true
    pointerMoved = 0
    lastX = event.clientX
    lastY = event.clientY
    canvasEl.setPointerCapture(event.pointerId)
    canvasEl.classList.add('cursor-grabbing')
    event.preventDefault()
  }

  function onPointerMove(event: PointerEvent): void {
    if (!dragging) return

    const dx = event.clientX - lastX
    const dy = event.clientY - lastY
    lastX = event.clientX
    lastY = event.clientY
    pointerMoved += Math.abs(dx) + Math.abs(dy)

    const record = records[currentId.value]
    if (!record) return

    record.spin.rotation.y += dx * 0.009
    record.spin.rotation.x = Math.max(-0.45, Math.min(0.45, record.spin.rotation.x + dy * 0.006))
  }

  function onPointerUp(event: PointerEvent): void {
    if (!dragging) return

    dragging = false
    if (canvasEl.hasPointerCapture(event.pointerId)) {
      canvasEl.releasePointerCapture(event.pointerId)
    }
    canvasEl.classList.remove('cursor-grabbing')

    if (pointerMoved < 6) selectRecordAt(event)
  }

  function onPointerCancel(event: PointerEvent): void {
    if (!dragging) return

    dragging = false
    if (canvasEl.hasPointerCapture(event.pointerId)) {
      canvasEl.releasePointerCapture(event.pointerId)
    }
    canvasEl.classList.remove('cursor-grabbing')
  }

  let wheelLocked = false
  let wheelTimer = 0

  function onWheel(event: WheelEvent): void {
    if (event.ctrlKey) return

    event.preventDefault()
    if (wheelLocked) return

    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX
    if (Math.abs(delta) < 4) return

    wheelLocked = true
    wheelTimer = window.setTimeout(() => {
      wheelLocked = false
    }, wheelCooldown)

    goTo(currentId.value + (delta > 0 ? 1 : -1))
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      goTo(currentId.value + 1)
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      goTo(currentId.value - 1)
    }
  }

  resize()
  renderer.setAnimationLoop(render)

  window.addEventListener('resize', resize)
  window.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('keydown', onKeyDown)
  canvasEl.addEventListener('pointerdown', onPointerDown)
  canvasEl.addEventListener('pointermove', onPointerMove)
  canvasEl.addEventListener('pointerup', onPointerUp)
  canvasEl.addEventListener('pointercancel', onPointerCancel)

  disposeScene = () => {
    window.removeEventListener('resize', resize)
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('keydown', onKeyDown)
    canvasEl.removeEventListener('pointerdown', onPointerDown)
    canvasEl.removeEventListener('pointermove', onPointerMove)
    canvasEl.removeEventListener('pointerup', onPointerUp)
    canvasEl.removeEventListener('pointercancel', onPointerCancel)
    window.clearTimeout(wheelTimer)

    renderer.setAnimationLoop(null)

    for (const record of records) {
      gsap.killTweensOf(record.group.position)
      gsap.killTweensOf(record.group.scale)
      gsap.killTweensOf(record.group.rotation)
      gsap.killTweensOf(record.spin.rotation)
      gsap.killTweensOf(record.frontMaterial.color)
      record.texture.dispose()
      record.frontMaterial.dispose()
    }

    discGeometry.dispose()
    edgeGeometry.dispose()
    holeGeometry.dispose()
    hubGeometry.dispose()
    backMaterial.dispose()
    edgeMaterial.dispose()
    hubMaterial.dispose()
    holeMaterial.dispose()

    scene.environment = null
    environment.dispose()
    scene.clear()
    renderer.dispose()
  }
})

onBeforeUnmount(() => {
  disposeScene?.()
  disposeScene = null
})
</script>

<template>
  <section class="relative h-screen w-screen overflow-hidden bg-(--black)">
    <canvas
      ref="canvas"
      class="block h-full w-full touch-none cursor-grab"
      aria-label="3D 唱片展示，滚轮或方向键切换，拖拽旋转"
    ></canvas>
    <div
      class="pointer-events-none absolute right-[6vw] top-[13vh] font-OutFit text-[0.68rem] tracking-[0.34em] text-(--green)"
    >
      {{ currentIndex }} / {{ recordTotalLabel }}
    </div>

    <div class="pointer-events-none absolute bottom-[3.6vh] left-[6vw] max-w-[54vw]">
      <div class="font-OutFit text-[0.62rem] tracking-[0.32em] text-(--green)">TITLE</div>
      <h1
        class="mt-2 font-OutFit text-[1.15rem] leading-[1.08] text-(--white) md:text-[2.1rem]"
        aria-live="polite"
      >
        {{ currentRecord?.title }}
      </h1>
      <div class="mt-2 font-ThinFit text-[0.78rem] text-white/55">
        {{ currentRecord?.author }} · {{ currentRecord?.type }}
      </div>
    </div>

    <div class="pointer-events-none absolute bottom-[3.6vh] right-[6vw] text-right">
      <div class="font-OutFit text-[0.62rem] tracking-[0.32em] text-(--green)">SCORE</div>
      <div class="mt-2 font-OutFit text-[1.15rem] text-(--white) md:text-[2.1rem]">
        {{ currentRecord?.score }}
      </div>
    </div>

    <div
      class="pointer-events-none absolute bottom-[1.6vh] left-1/2 hidden -translate-x-1/2 whitespace-nowrap font-OutFit text-[0.55rem] tracking-[0.26em] text-white/30 md:block"
    >
      SCROLL / ARROW KEYS TO SWITCH · DRAG TO SPIN
    </div>
  </section>
</template>

<style scoped></style>
