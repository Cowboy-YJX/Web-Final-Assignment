<script setup lang="ts">
/**
 * 首屏的 WebGL 背景画布。
 *
 * 只负责生命周期与调度：创建渲染器 / 物理模拟、跟随尺寸、可见性暂停、
 * 减少动效降级、WebGL 上下文丢失恢复。真正的画面在 shader/heroThreeRenderer.ts。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'

import gsap from 'gsap'
import { DURATION, EASE, REDUCED_MOTION_QUERY, motionScope, prefersReducedMotion } from '@animation'
import type { MotionScope } from '@animation'

import { ClusterSimulation } from './shader/clusterSimulation'
import { HeroThreeRenderer } from './shader/heroThreeRenderer'

const canvasRef = ref<HTMLCanvasElement | null>(null)

let renderer: HeroThreeRenderer | null = null
let simulation: ClusterSimulation | null = null
let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null
let motionQuery: MediaQueryList | null = null
let scope: MotionScope | null = null

let frameId = 0
let lastTime = 0
/** 页面内累计秒数：物理与 shader 的时间轴都从它取，暂停后不会跳变 */
let elapsed = 0
let reduced = prefersReducedMotion()
let visible = true
let contextLost = false
let disposed = false

function currentAspect(): number {
  const canvas = canvasRef.value
  const parent = canvas?.parentElement
  const width = parent?.clientWidth || window.innerWidth || 1
  const height = parent?.clientHeight || window.innerHeight || 1
  return width / height
}

function renderStill(): void {
  if (!renderer || !simulation) return
  // 冻结时也把物理跑稳，保证静止画面里球不会彼此穿插
  simulation.settle(90, elapsed)
  renderer.render(0, simulation)
}

function start(): void {
  if (frameId || !renderer || !simulation) return
  lastTime = 0
  frameId = requestAnimationFrame(loop)
}

function stop(): void {
  if (frameId) cancelAnimationFrame(frameId)
  frameId = 0
  lastTime = 0
}

function loop(now: number): void {
  frameId = requestAnimationFrame(loop)
  if (!renderer || !simulation) return

  // 第一次进来没有上一帧时间；页签切回来时限制最大步长，避免物理一次跳很远
  const dt = lastTime ? Math.min((now - lastTime) / 1000, 1 / 20) : 1 / 60
  lastTime = now
  elapsed += dt

  simulation.update(dt, elapsed)
  renderer.render(dt, simulation)
}

/** 只有「允许动效 + 在视口内 + 页签可见」同时成立才跑 rAF */
function syncLoop(): void {
  if (disposed) return

  const shouldRun = !reduced && visible && !contextLost && document.visibilityState !== 'hidden'
  if (shouldRun) start()
  else stop()

  if (reduced && visible) renderStill()
}

function resize(): void {
  const canvas = canvasRef.value
  if (!canvas || !renderer || !simulation) return

  const width = canvas.clientWidth
  const height = canvas.clientHeight
  if (width <= 0 || height <= 0) return

  renderer.resize(width, height, window.devicePixelRatio || 1)
  simulation.setViewport(width / height)

  if (reduced) renderStill()
}

function onMotionChange(event: MediaQueryListEvent): void {
  reduced = event.matches
  renderer?.setInteractive(!reduced)
  syncLoop()
}

function onVisibilityChange(): void {
  syncLoop()
}

function onContextLost(event: Event): void {
  // 不阻止默认行为的话浏览器不会尝试恢复上下文；恢复由 three 内部接管
  event.preventDefault()
  contextLost = true
  stop()
}

function onContextRestored(): void {
  contextLost = false
  syncLoop()
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  try {
    renderer = new HeroThreeRenderer(canvas)
  } catch (error) {
    // 拿不到 WebGL2 或 shader 编译失败时保留 CSS 渐变兜底，不阻塞首屏
    console.warn('[HeroShaderCanvas] WebGL 背景初始化失败，回退到 CSS 渐变：', error)
    return
  }

  simulation = new ClusterSimulation(currentAspect())

  const parent = canvas.parentElement
  if (parent && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => resize())
    resizeObserver.observe(parent)
  }

  if (typeof IntersectionObserver !== 'undefined') {
    // 滚出首屏后停掉帧循环，别在看不见的地方烧 GPU
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting)
        syncLoop()
      },
      { rootMargin: '120px' },
    )
    intersectionObserver.observe(canvas)
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  canvas.addEventListener('webglcontextlost', onContextLost)
  canvas.addEventListener('webglcontextrestored', onContextRestored)

  if (typeof window.matchMedia === 'function') {
    motionQuery = window.matchMedia(REDUCED_MOTION_QUERY)
    reduced = motionQuery.matches
    motionQuery.addEventListener('change', onMotionChange)
  }
  renderer.setInteractive(!reduced)

  resize()

  // 入场淡入：减少动效时直接显示
  scope = motionScope(({ whenMotion }) => {
    whenMotion(() => {
      gsap.fromTo(
        canvas,
        { opacity: 0 },
        {
          opacity: 1,
          duration: DURATION.cinematic,
          ease: EASE.outSoft,
          clearProps: 'opacity',
        },
      )
    })
  })

  syncLoop()
})

onBeforeUnmount(() => {
  disposed = true
  stop()

  scope?.revert()
  scope = null

  resizeObserver?.disconnect()
  resizeObserver = null
  intersectionObserver?.disconnect()
  intersectionObserver = null

  document.removeEventListener('visibilitychange', onVisibilityChange)
  motionQuery?.removeEventListener('change', onMotionChange)
  motionQuery = null

  const canvas = canvasRef.value
  canvas?.removeEventListener('webglcontextlost', onContextLost)
  canvas?.removeEventListener('webglcontextrestored', onContextRestored)

  renderer?.dispose()
  renderer = null
  simulation = null
})
</script>

<template>
  <canvas
    ref="canvasRef"
    aria-hidden="true"
    class="pointer-events-none absolute top-0 inset-0 block h-full w-full"
  ></canvas>
</template>
