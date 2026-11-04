<script setup lang="ts" name="HomeEnd">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import qq from '@assets/svg/qq.svg'
import weixin from '@assets/svg/weixin.svg'
import weibo from '@assets/svg/weibo.svg'
import envelope from '@assets/svg/envelope.svg'

import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollToPlugin)

import Matter from 'matter-js'

import { DURATION, EASE, motionScope, prefersReducedMotion } from '@animation'
import type { MotionScope } from '@animation'

const container = ref<Element | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

/**
 * 是否处于「减少动态效果」模式。
 *
 * 这个组件里有两类运动，降级方式不同：
 *
 * 1. **Matter.js 的悬挂电话** —— 持续的重力摆动，靠缩短时长规避不了。
 *    降级时把物理模拟离线跑到静止，只渲染一帧，并且不挂拖拽约束
 *    （没有逐帧循环时拖动画面不会跟随，反而像卡死）。
 * 2. **GSAP 的 ScrollTrigger** —— 直接不创建，元素保持 CSS 默认状态。
 */
const reducedMotion = prefersReducedMotion()

let scope: MotionScope | null = null

// 位置与大小都以「文字」为基准，文字挪动或缩放时图标同步跟随：
//   dx / dy —— 图标中心相对文字中心的偏移，单位是字号的倍数
//   size    —— 图标宽度，同样是字号的倍数
const HOME_ICONS = [
  { src: qq, dx: 1.65, dy: -0.5, size: 0.5, rotate: -15 },
  { src: weixin, dx: -2.76, dy: 0.13, size: 0.6, rotate: 0 },
  { src: weibo, dx: 2.28, dy: 0.03, size: 0.57, rotate: 15 },
  { src: envelope, dx: -0.95, dy: -0.8, size: 0.4, rotate: 20 },
]
// 与 HOME_ICONS 一一对应的图片槽位，加载完成后填入
const iconImages: { img: HTMLImageElement | null }[] = HOME_ICONS.map(() => ({ img: null }))

// —— 物理状态 ——
let engine: Matter.Engine | null = null
let world: Matter.World | null = null
let mouse: Matter.Mouse | null = null
let mouseConstraint: Matter.MouseConstraint | null = null

// —— 渲染状态 ——
let ctx: CanvasRenderingContext2D | null = null
let rafId = 0
let lastTime = 0
let resizeObserver: ResizeObserver | null = null

// —— 场景对象 ——
let fixedPoint: Matter.Vector = { x: 0, y: 0 }
let phone: Matter.Body | null = null
let chainLinks: Matter.Body[] = []
let phoneAnchorLocal: Matter.Vector = { x: 0, y: 0 }
// SVG 轮廓缓存（惰性创建，避免非浏览器环境下 Path2D 不存在）
let phonePath: Path2D | null = null
// 电话质心在「设计坐标系」中的位置，渲染 SVG 轮廓时用它做补偿
let phoneCentroid: Matter.Vector = { x: 0, y: 0 }

// —— 拖拽拉伸状态（「拉长超过 50% 松手回顶部」手势） ——
let draggingPhone = false
let dragRefLength = 0

// —— 逻辑尺寸（CSS 像素，与 Matter 世界坐标一致） ——
let viewW = 0
let viewH = 0

// —— 配色
const C_TEXT = '#f7f7f7'
const C_PHONE = '#17f700'
const C_PHONE_DEEP = '#008000'
const C_WIRE = '#ddd'

const PHONE_PATH_SVG =
  'M23.07 -9.1 C8.12 -13.96 -8.09 -13.93 -23.07 -9.1 L-23.07 6.31 C-23.07 8.2 -24.15 9.91 -25.8 10.72 C-31.01 13.34 -35.95 16.88 -40.29 21.22 C-42.21 23.14 -45.36 23.14 -47.29 21.22 L-59.5 9 C-61.43 7.08 -61.43 3.92 -59.5 2 C-26.64 -30.87 26.64 -30.87 59.5 2 C61.43 3.92 61.43 7.08 59.5 9 L47.25 21.25 C45.33 23.18 42.18 23.18 40.25 21.25 C35.88 16.88 30.98 13.38 25.76 10.75 C24.15 9.91 23.07 8.27 23.07 6.31 L23.07 -9.1 Z'

// —— 电话轮廓微调（改这几个数即可，不用动上面的 path 字符串）——
// 轮廓相对物理体的偏移，单位 px；正值 = 右 / 下
const PHONE_OFFSET_X = 0
const PHONE_OFFSET_Y = 0
// 轮廓缩放，1 = 原大小；改大会盖过物理体，改小会缩在物理体里面
const PHONE_SCALE = 1

function buildScene(): void {
  if (!engine || !world) return

  const textY = viewH * 0.58
  const textX = viewW * 0.5
  const anchorY = textY
  // 电话挂在文字正中央下方
  const anchorX = textX

  // 固定点（不可见，电话线从此处垂下，不画螺丝挂点）
  fixedPoint = { x: anchorX, y: anchorY }

  // 电话线：一串轻质小圆 + 约束，作为弹簧线的物理骨架
  // 线长 = segments * gap
  const segments = 5
  const gap = 5
  const linkRadius = 5
  chainLinks = []
  const constraints: Matter.Constraint[] = []
  let prev: Matter.Body | null = null
  for (let i = 0; i < segments; i++) {
    const link = Matter.Bodies.circle(anchorX, anchorY + (i + 1) * gap, linkRadius, {
      label: 'wire',
      density: 0.0005,
      friction: 0.1,
      restitution: 0,
    })
    chainLinks.push(link)
    constraints.push(
      prev
        ? Matter.Constraint.create({
            bodyA: prev,
            bodyB: link,
            length: gap,
            stiffness: 0.7,
            damping: 0.08,
          })
        : Matter.Constraint.create({
            pointA: fixedPoint,
            bodyB: link,
            length: gap,
            stiffness: 0.7,
            damping: 0.08,
          }),
    )
    prev = link
  }

  // 电话听筒：按 src/components/icons/PhoneIcon.vue 的 SVG 轮廓还原
  // 两端各一个圆形（听筒 / 话筒），中间由四段矩形拼出向上拱起的弧形手柄
  const earpiece = Matter.Bodies.circle(-42, 5, 17, { label: 'earpiece', density: 0.002 })
  const mouthpiece = Matter.Bodies.circle(42, 5, 17, { label: 'mouthpiece', density: 0.002 })
  // 四段矩形沿抛物线弧排布，相邻段刻意搭接，避免出现缝隙
  const gripA = Matter.Bodies.rectangle(-27.5, -13, 21, 11, {
    label: 'handle',
    density: 0.002,
    angle: -0.471,
  })
  const gripB = Matter.Bodies.rectangle(-9.75, -19.12, 22.5, 11, {
    label: 'handle',
    density: 0.002,
    angle: -0.179,
  })
  const gripC = Matter.Bodies.rectangle(9.75, -19.12, 22.5, 11, {
    label: 'handle',
    density: 0.002,
    angle: 0.179,
  })
  const gripD = Matter.Bodies.rectangle(27.5, -13, 21, 11, {
    label: 'handle',
    density: 0.002,
    angle: 0.471,
  })
  phone = Matter.Body.create({
    label: 'phone',
    parts: [earpiece, mouthpiece, gripA, gripB, gripC, gripD],
    friction: 0.2,
    restitution: 0.2,
  })
  // Body.create 之后 phone.position 就是质心（设计坐标系下），渲染 SVG 轮廓要用它做补偿
  phoneCentroid = { x: phone.position.x, y: phone.position.y }
  const phoneY = anchorY + segments * gap + 34
  Matter.Body.setPosition(phone, { x: anchorX, y: phoneY })

  // 电话挂点：听筒顶部中心（局部坐标）
  phoneAnchorLocal = { x: 0, y: -22 }

  if (prev) {
    constraints.push(
      Matter.Constraint.create({
        bodyA: prev,
        bodyB: phone,
        pointB: phoneAnchorLocal,
        length: 12,
        stiffness: 0.9,
        damping: 0.08,
      }),
    )
  }

  Matter.Composite.add(world, [...chainLinks, phone, ...constraints])

  // 轻微初始摆动，更有「流星锤」悬垂感
  Matter.Body.setAngularVelocity(phone, 0.04)
}

function setupMouse(): void {
  if (!engine || !world || !canvasRef.value) return
  mouse = Matter.Mouse.create(canvasRef.value)
  // 修复 DPR 坐标错位：canvas 用了高清缩放，需同步 pixelRatio，
  // 否则鼠标坐标会被放大 dpr 倍，MouseConstraint 检测不到电话
  mouse.pixelRatio = window.devicePixelRatio || 1
  // 移除 Matter 的 wheel 监听（它会 preventDefault 阻碍页面滚动），滚轮交还给 ScrollSmoother
  const rawMouse = mouse as unknown as { mousewheel: EventListener }
  canvasRef.value.removeEventListener('wheel', rawMouse.mousewheel)
  mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, damping: 0.1 },
  })
  Matter.Composite.add(world, mouseConstraint)

  // 按下电话时，以「当时的实际线长」为基准（重力本就把软链拉长了，不能用理论值）
  Matter.Events.on(mouseConstraint, 'startdrag', (event) => {
    const dragged = (event as unknown as { body?: Matter.Body }).body
    if (!phone || (dragged !== phone && dragged?.parent !== phone)) return
    draggingPhone = true
    dragRefLength = wireLength()
  })

  // 松手瞬间检查此刻的线长：不取拖拽过程中的峰值，
  // 否则电话挂在软链上摆出的瞬时高点会让「轻轻一拉就触发」
  Matter.Events.on(mouseConstraint, 'enddrag', () => {
    const wasDragging = draggingPhone
    draggingPhone = false
    if (!wasDragging || dragRefLength <= 0) return
    if (wireLength() > dragRefLength * 2.5) {
      gsap.to(window, {
        scrollTo: 0,
        // 这是「滚回顶部」的环境级位移，比常规入场更慢，让用户看清发生了什么
        duration: DURATION.cinematic,
        ease: EASE.outSoft,
      })
    }
  })
}

// 将 body 局部坐标换算成世界坐标（考虑旋转）
function worldPoint(body: Matter.Body, local: Matter.Vector): Matter.Vector {
  const cos = Math.cos(body.angle)
  const sin = Math.sin(body.angle)
  return {
    x: body.position.x + (local.x * cos - local.y * sin),
    y: body.position.y + (local.x * sin + local.y * cos),
  }
}

// 当前「固定点 → 电话挂点」的实际线长
function wireLength(): number {
  if (!phone) return 0
  const end = worldPoint(phone, phoneAnchorLocal)
  return Math.hypot(end.x - fixedPoint.x, end.y - fixedPoint.y)
}

// Catmull-Rom 样条：用 4 个控制点插值出平滑曲线
function catmullRom(
  p0: Matter.Vector,
  p1: Matter.Vector,
  p2: Matter.Vector,
  p3: Matter.Vector,
  t: number,
): Matter.Vector {
  const t2 = t * t
  const t3 = t2 * t
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  }
}

// 将折线路径平滑成密集采样点
function smoothPath(pts: Matter.Vector[], samplesPerSeg: number): Matter.Vector[] {
  const n = pts.length
  if (n < 2) return pts.slice()
  const out: Matter.Vector[] = []
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[Math.min(n - 1, i + 2)]!
    for (let j = 0; j < samplesPerSeg; j++) {
      out.push(catmullRom(p0, p1, p2, p3, j / samplesPerSeg))
    }
  }
  out.push(pts[n - 1]!)
  return out
}

// 沿平滑路径叠加法线方向的正弦扰动，得到螺旋弹簧线圈
function buildCoil(samples: Matter.Vector[], amplitude: number, period: number): Matter.Vector[] {
  const out: Matter.Vector[] = []
  let dist = 0
  for (let i = 0; i < samples.length; i++) {
    const p = samples[i]!
    const prev = samples[Math.max(0, i - 1)]!
    const next = samples[Math.min(samples.length - 1, i + 1)]!
    let tx = next.x - prev.x
    let ty = next.y - prev.y
    const len = Math.hypot(tx, ty) || 1
    tx /= len
    ty /= len
    const nx = -ty
    const ny = tx
    if (i > 0) {
      const pp = samples[i - 1]!
      dist += Math.hypot(p.x - pp.x, p.y - pp.y)
    }
    const offset = amplitude * Math.sin((dist / period) * Math.PI * 2)
    out.push({ x: p.x + nx * offset, y: p.y + ny * offset })
  }
  return out
}

function drawWire(c: CanvasRenderingContext2D): void {
  if (!phone) return
  const end = worldPoint(phone, phoneAnchorLocal)

  // 路径：固定点 → 链节点 → 电话挂点
  const pts: Matter.Vector[] = [fixedPoint, ...chainLinks.map((l) => l.position), end]
  const samples = smoothPath(pts, 8)
  const coil = buildCoil(samples, 6, 14)

  const armed = draggingPhone && dragRefLength > 0 && wireLength() > dragRefLength * 2.5
  c.strokeStyle = C_WIRE
  c.lineWidth = armed ? 4 : 3
  c.lineJoin = 'round'
  c.lineCap = 'round'
  c.beginPath()
  coil.forEach((p, i) => {
    if (i === 0) c.moveTo(p.x, p.y)
    else c.lineTo(p.x, p.y)
  })
  c.stroke()
}

// 用 SVG 轮廓绘制电话：物理交给 Matter 复合体（碰撞 / 拖拽），
// 渲染直接用源图标的 path，形状与图标完全一致
function drawPhone(c: CanvasRenderingContext2D): void {
  if (!phone) return
  if (!phonePath) phonePath = new Path2D(PHONE_PATH_SVG)

  c.save()
  c.translate(phone.position.x, phone.position.y)
  c.rotate(phone.angle)
  // path 以「设计坐标系」为基准，而 phone.position 是质心位置，需偏移回设计原点
  c.translate(-phoneCentroid.x + PHONE_OFFSET_X, -phoneCentroid.y + PHONE_OFFSET_Y)
  c.scale(PHONE_SCALE, PHONE_SCALE)

  c.fillStyle = C_PHONE
  c.fill(phonePath)
  c.lineWidth = 2
  c.lineJoin = 'round'
  c.strokeStyle = C_PHONE_DEEP
  c.stroke(phonePath)

  c.restore()
}

// 加载社交图标图片（异步，加载完成后下一帧即可绘制）
function loadIcons(): void {
  HOME_ICONS.forEach((def, i) => {
    const img = new Image()
    img.onload = () => {
      const slot = iconImages[i]
      if (slot) slot.img = img
    }
    img.src = def.src
  })
}

// 文字与图标共用的锚点与字号——图标相对文字定位，两者必须取同一套值
function textMetrics(): { fontSize: number; cx: number; cy: number } {
  return {
    fontSize: Math.min(viewW * 0.15, 150),
    cx: viewW / 2,
    cy: viewH * 0.6,
  }
}

// 在 canvas 中绘制社交图标：位置与尺寸都以「文字」为基准
function drawIcons(c: CanvasRenderingContext2D): void {
  if (viewW <= 0 || viewH <= 0) return
  const { fontSize, cx: anchorX, cy: anchorY } = textMetrics()

  for (let i = 0; i < HOME_ICONS.length; i++) {
    const def = HOME_ICONS[i]
    const slot = iconImages[i]
    if (!def || !slot?.img) continue

    // 尺寸按字号缩放，高度按图片自身比例算（这些图标都是 640x640 正方形）
    const w = def.size * fontSize
    const h = w * (slot.img.height / slot.img.width)
    const cx = anchorX + def.dx * fontSize
    const cy = anchorY + def.dy * fontSize

    c.save()
    c.translate(cx, cy)
    c.rotate((def.rotate * Math.PI) / 180)
    c.drawImage(slot.img, -w / 2, -h / 2, w, h)
    c.restore()
  }
}

function render(): void {
  if (!ctx) return
  const c = ctx
  c.clearRect(0, 0, viewW, viewH)

  // 文字 CONTACT US（锚点与字号和图标共用，保证图标相对文字固定）
  const { fontSize, cx, cy } = textMetrics()
  c.font = `800 ${fontSize}px 'OutFit',serif`
  c.textAlign = 'center'
  c.fillStyle = C_TEXT
  c.fillText('CONTACT ME', cx, cy)

  if (phone) {
    drawWire(c)
    drawPhone(c)
  }

  // 社交图标画在最上层（对应原 SVG 的 z-10）
  drawIcons(c)
}

/**
 * 降级模式专用：把物理模拟离线跑到稳定，然后只渲染一帧。
 *
 * 180 步 × 16.7ms ≈ 3 秒的模拟。悬挂系统在重力下的摆幅主要集中在前两秒，
 * 跑够之后电话基本停在垂挂位置，剩下只是极缓慢的余摆，肉眼看不出来。
 */
function settlePhysics(): void {
  if (!engine) return
  for (let i = 0; i < 180; i++) Matter.Engine.update(engine, 1000 / 60)
  render()
}

function loop(time: number): void {
  if (!engine) return
  const delta = lastTime ? Math.min(time - lastTime, 50) : 16.666
  lastTime = time
  Matter.Engine.update(engine, delta)
  render()
  rafId = requestAnimationFrame(loop)
}

function resize(): void {
  const canvas = canvasRef.value
  const parent = canvas?.parentElement
  if (!canvas || !parent) return

  const width = parent.clientWidth
  const height = parent.clientHeight
  if (width === 0 || height === 0) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  viewW = width
  viewH = height
  ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  // 尺寸变化时重建场景（保留鼠标约束）
  if (world) {
    Matter.Composite.clear(world, false, true)
    buildScene()
    if (mouseConstraint) Matter.Composite.add(world, mouseConstraint)
  }

  // 降级模式下没有逐帧循环，重建场景后必须手动把物理跑稳再画一帧，
  // 否则重建时 Composite.clear 清空的画布会一直空白到下一次循环
  if (reducedMotion) settlePhysics()
}

function destroy(): void {
  cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  if (mouseConstraint) {
    Matter.Events.off(mouseConstraint, 'startdrag')
    Matter.Events.off(mouseConstraint, 'enddrag')
  }
  if (mouse && world) {
    if (mouseConstraint) Matter.Composite.remove(world, mouseConstraint)
  }
  if (world) Matter.Composite.clear(world, false, true)
  if (engine) Matter.Engine.clear(engine)
}

onMounted(() => {
  loadIcons()

  engine = Matter.Engine.create()
  world = engine.world
  resize()
  // 降级时不挂拖拽：没有逐帧循环，拖动后画面不会跟随，手感像卡死
  if (!reducedMotion) setupMouse()

  const parent = canvasRef.value?.parentElement
  if (parent && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => resize())
    resizeObserver.observe(parent)
  }

  // 降级时不起 rAF：resize() 里已经离线跑稳并画好一帧
  if (!reducedMotion) rafId = requestAnimationFrame(loop)

  scope = motionScope(({ whenMotion }) => {
    whenMotion(() => {
      gsap.from(canvasRef.value, {
        scrollTrigger: {
          trigger: container.value,
          start: 'top 80%',
          end: 'top top',
          scrub: true,
        },
        ease: EASE.outSoft,
        scale: 0,
        opacity: 0,
      })
    })
  })
})

onBeforeUnmount(() => {
  scope?.revert()
  scope = null
  destroy()
})
</script>

<template>
  <section class="h-[85vh] w-screen bg-(--white)" ref="container">
    <div class="w-full h-full bg-(--black) end-outer">
      <canvas
        ref="canvasRef"
        class="block w-screen h-1/2 cursor-grab touch-none active:cursor-grabbing"
      ></canvas>
    </div>
  </section>
</template>

<style scoped lang="scss">
.end-outer {
  border-radius: 0 0 20% 20%;
}
</style>
