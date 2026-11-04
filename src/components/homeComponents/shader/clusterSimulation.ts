/**
 * 首屏双球簇的物理模拟。
 *
 * 球心在球壳上按 Fibonacci 分布铺开，并随时间做呼吸半径；
 * 每帧用弹簧回归目标点、球间排斥和阻尼积分推进速度与位置。
 *
 * 跨帧的速度状态没法塞进片元着色器，所以物理留在 TS 里按 120Hz 固定步长跑，
 * 每帧只把 100 颗球的位置 / 半径 / 基色交给 GPU。
 *
 * 左簇蓝色、右簇绿色，两簇相位相差 π。
 */
import { CAMERA_Z, FOV_TAN } from './camera'

/** 位置上限定格：渲染层最多建这么多颗球，当前的实际数量是 120 */
export const MAX_SPHERES = 120

const PER_CLUSTER = 60
const TOTAL = PER_CLUSTER * 2

/** 固定步长：120Hz。球间排斥比较硬，步长再大就会抖 */
const FIXED_STEP = 1 / 120
const MAX_STEPS_PER_FRAME = 4

const SPRING_K = 26
const REPEL_K = 90
const DAMPING = 3.2

/** 黄金角，球壳上的 Fibonacci 分布靠它铺开 */
const GOLDEN_ANGLE = 2.3999632

/** 两个簇的基色（线性写入 shader，暗底上偏玻璃质感） */
const PALETTES: readonly (readonly [number, number, number])[] = [
  [0.24, 0.46, 0.98], // 蓝
  [0.11, 0.86, 0.53], // 绿
]

type ClusterIndex = 0 | 1
type Vec3 = [number, number, number]

interface Particle {
  cluster: ClusterIndex
  index: number
  /** 球壳上的单位方向 */
  dir: Vec3
  pos: Vec3
  vel: Vec3
  radius: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 渲染端每帧读取的数据源。
 *
 * positions：x, y, z, radius（vec4）
 * colors：r, g, b（vec3）
 */
export class ClusterSimulation {
  readonly sphereCount = TOTAL
  readonly positions = new Float32Array(MAX_SPHERES * 4)
  readonly colors = new Float32Array(MAX_SPHERES * 3)

  private readonly particles: Particle[] = []
  private readonly centers: [Vec3, Vec3] = [
    [0, 0, 0],
    [0, 0, 0],
  ]

  // 每步复用的力与目标缓存，避免在循环里分配对象
  private readonly forceX = new Float32Array(TOTAL)
  private readonly forceY = new Float32Array(TOTAL)
  private readonly forceZ = new Float32Array(TOTAL)
  private readonly targetX = new Float32Array(TOTAL)
  private readonly targetY = new Float32Array(TOTAL)
  private readonly targetZ = new Float32Array(TOTAL)

  private spread = 0.47
  private accumulator = 0
  private initialized = false

  constructor(aspect = 16 / 9) {
    for (let cluster = 0; cluster < 2; cluster++) {
      const palette = PALETTES[cluster]!
      for (let i = 0; i < PER_CLUSTER; i++) {
        // 球面上的 Fibonacci 分布
        const theta = Math.acos(1 - (2 * i) / PER_CLUSTER)
        const phi = i * GOLDEN_ANGLE
        const dir: Vec3 = [
          Math.sin(theta) * Math.cos(phi),
          Math.cos(theta),
          Math.sin(theta) * Math.sin(phi),
        ]

        const slot = cluster * PER_CLUSTER + i
        this.particles.push({
          cluster: cluster as ClusterIndex,
          index: i,
          dir,
          pos: [0, 0, 0],
          vel: [0, 0, 0],
          radius: 0.08,
        })
        this.colors.set(palette, slot * 3)
      }
    }

    this.setViewport(aspect)
    this.settle(180)
  }

  /**
   * 视口变化时重新排布两簇的位置与大小。
   * 已存在的球不会被瞬移，弹簧会自然把它们带到新位置。
   */
  setViewport(aspect: number): void {
    const safeAspect = Math.max(0.2, aspect)
    const width = 2 * CAMERA_Z * FOV_TAN * safeAspect
    const height = 2 * CAMERA_Z * FOV_TAN
    const minSide = Math.min(width, height)

    // 两簇各自偏在左上和右下
    const span = width * 0.4
    const leftY = height * 0.35
    const rightY = 0

    this.centers[0] = [-span, leftY, 0]
    this.centers[1] = [span, rightY, 0]
    this.spread = clamp(minSide * 0.19, 0.18, 0.5)

    // 首次布局直接把球放到目标点上，省掉一段从原点飞出来的过程
    if (!this.initialized) {
      for (let i = 0; i < this.particles.length; i++) {
        this.computeTarget(this.particles[i]!, 0, i)
        const particle = this.particles[i]!
        particle.pos = [this.targetX[i]!, this.targetY[i]!, this.targetZ[i]!]
      }
      this.initialized = true
    }
  }

  /** 推进模拟。time 是页面内的秒数，用来算呼吸和漂移 */
  update(dt: number, time: number): void {
    this.accumulator += clamp(dt, 0, 1 / 20)

    let steps = 0
    while (this.accumulator >= FIXED_STEP && steps < MAX_STEPS_PER_FRAME) {
      this.step(FIXED_STEP, time)
      this.accumulator -= FIXED_STEP
      steps++
    }
    // 掉帧太严重时丢弃积压，宁可慢放也不要补帧补到卡死
    if (steps === MAX_STEPS_PER_FRAME) this.accumulator = 0

    this.upload()
  }

  /** 直接把物理跑稳，用于首帧与「减少动态效果」模式 */
  settle(steps = 180, time = 0): void {
    for (let i = 0; i < steps; i++) this.step(FIXED_STEP, time)
    this.upload()
  }

  private computeTarget(particle: Particle, time: number, slot: number): void {
    const phase = particle.cluster === 0 ? 0 : Math.PI
    const center = this.centers[particle.cluster]

    // 球壳整体缓慢自转，让簇看起来是活的
    const spin = time * 0.18 + phase
    const cos = Math.cos(spin)
    const sin = Math.sin(spin)
    const dx = particle.dir[0] * cos - particle.dir[2] * sin
    const dz = particle.dir[0] * sin + particle.dir[2] * cos

    // 呼吸半径：R_BASE + 振幅 * sin(t * 1.8 + i * 0.45)
    const breath = this.spread * (0.68 + 0.1 * Math.sin(time * 1.8 + particle.index * 0.45 + phase))

    // 簇心自身的小幅漂移，两簇相位相反
    const driftX = Math.sin(time * 0.4 + phase) * 0.05
    const driftY = Math.cos(time * 0.33 + phase) * 0.04
    const driftZ = Math.sin(time * 0.27 + phase) * 0.06

    this.targetX[slot] = center[0] + dx * breath + driftX
    this.targetY[slot] = center[1] + particle.dir[1] * breath + driftY
    this.targetZ[slot] = center[2] + dz * breath + driftZ
  }

  private step(dt: number, time: number): void {
    const particles = this.particles
    const count = particles.length

    for (let i = 0; i < count; i++) {
      this.computeTarget(particles[i]!, time, i)
      this.forceX[i] = 0
      this.forceY[i] = 0
      this.forceZ[i] = 0
    }

    // 弹簧拉回各自的球壳目标点：F = -K * (p - target)
    for (let i = 0; i < count; i++) {
      const particle = particles[i]!
      this.forceX[i] = (this.targetX[i]! - particle.pos[0]) * SPRING_K
      this.forceY[i] = (this.targetY[i]! - particle.pos[1]) * SPRING_K
      this.forceZ[i] = (this.targetZ[i]! - particle.pos[2]) * SPRING_K
    }

    // 球间排斥：靠得比两者半径之和小就互相推开，避免球体穿插
    for (let i = 0; i < count; i++) {
      const a = particles[i]!
      for (let j = i + 1; j < count; j++) {
        const b = particles[j]!
        const dx = b.pos[0] - a.pos[0]
        const dy = b.pos[1] - a.pos[1]
        const dz = b.pos[2] - a.pos[2]
        const minDist = a.radius + b.radius
        const distSq = dx * dx + dy * dy + dz * dz
        if (distSq >= minDist * minDist || distSq < 1e-8) continue

        const dist = Math.sqrt(distSq)
        const push = ((minDist - dist) * REPEL_K) / dist
        this.forceX[i] = this.forceX[i]! - dx * push
        this.forceY[i] = this.forceY[i]! - dy * push
        this.forceZ[i] = this.forceZ[i]! - dz * push
        this.forceX[j] = this.forceX[j]! + dx * push
        this.forceY[j] = this.forceY[j]! + dy * push
        this.forceZ[j] = this.forceZ[j]! + dz * push
      }
    }

    const damp = Math.max(0, 1 - DAMPING * dt)
    for (let i = 0; i < count; i++) {
      const particle = particles[i]!
      const vx = (particle.vel[0] + this.forceX[i]! * dt) * damp
      const vy = (particle.vel[1] + this.forceY[i]! * dt) * damp
      const vz = (particle.vel[2] + this.forceZ[i]! * dt) * damp
      particle.vel = [vx, vy, vz]
      particle.pos = [
        particle.pos[0] + vx * dt,
        particle.pos[1] + vy * dt,
        particle.pos[2] + vz * dt,
      ]
    }
  }

  private upload(): void {
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]!
      const offset = i * 4
      this.positions[offset] = particle.pos[0]
      this.positions[offset + 1] = particle.pos[1]
      this.positions[offset + 2] = particle.pos[2]
      this.positions[offset + 3] = particle.radius
    }
  }
}
