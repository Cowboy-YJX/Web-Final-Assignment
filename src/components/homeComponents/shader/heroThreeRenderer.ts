/**
 * 首屏的 three.js 渲染器。
 *
 * 两个球簇共 100 颗半透明小球，用加法混合叠成一团软糖：
 * - 每颗球的中心偏奶油色，边缘是该簇的饱和蓝 / 绿；
 * - 每颗球的颜色按「离簇心的 2D 距离」再调一次，内圈偏淡、外圈偏饱和；
 * - 球体边缘 alpha 归零，叠在一起时没有硬轮廓。
 *
 * 物理仍由 clusterSimulation 在 CPU 上算，这里只消费位置 / 半径。
 * 鼠标视差仍是相机平移 + 簇内轻微漂移。
 */
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'

import sphereFrag from './sphere.frag.glsl?raw'
import sphereVert from './sphere.vert.glsl?raw'
import { CAMERA_Z, FOV_DEG } from './camera'
import type { ClusterSimulation } from './clusterSimulation'

/** 与旧实现一致的像素预算，避免视网膜屏把片元开销翻四倍 */
const MAX_PIXELS = 2_600_000
/** 相机看向原点，保持球簇沉在标题下方 */
const LOOK_TARGET = new Vector3(0, 0, 0)
/** 指针跟随速度（1/s），越大越紧跟，越小越飘 */
const POINTER_FOLLOW = 6
/** 球心颜色：奶油薄荷，接近参考图中间那团发白的地方 */
const CORE_COLOR = new Vector3(0.74, 0.98, 0.86)
/** 单颗球的不透明度。接近实心，靠软边和低饱和核心保持软糖感 */
const BALL_OPACITY = 0.88

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
  return t * t * (3 - 2 * t)
}

/** 确定性伪随机，让色块不要排得太整齐 */
function hash01(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453
  return s - Math.floor(s)
}

function createGlowTexture(): CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建光晕贴图的 2D 上下文')

  const center = size / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.22, 'rgba(255, 255, 255, 0.55)')
  gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.14)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

export class HeroThreeRenderer {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera: PerspectiveCamera
  private readonly geometry = new SphereGeometry(1, 64, 32)
  private readonly glowTexture = createGlowTexture()

  private readonly meshes: Mesh<SphereGeometry, ShaderMaterial>[] = []
  private readonly materials: ShaderMaterial[] = []
  /** 每颗球自己的两个 uniform，避免每帧去 uniforms 里查 */
  private readonly ballColors: { core: Vector3; edge: Vector3 }[] = []
  private readonly clusterGlows: Sprite[] = []

  private readonly clusterBaseColors: [Vector3, Vector3] = [new Vector3(), new Vector3()]
  private readonly clusterCenters: [Vector3, Vector3] = [new Vector3(), new Vector3()]
  private readonly clusterRadii: [number, number] = [1, 1]

  private readonly pointer = new Vector2()
  private readonly target = new Vector2()
  private interactive = true
  private perCluster = 0

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = SRGBColorSpace

    this.camera = new PerspectiveCamera(FOV_DEG, 1, 0.1, 50)
    this.camera.position.set(0, 0, CAMERA_Z)
    this.camera.lookAt(LOOK_TARGET)

    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('blur', this.resetPointer)
    document.addEventListener('mouseleave', this.resetPointer)
  }

  resize(cssWidth: number, cssHeight: number, devicePixelRatio: number): void {
    const width = Math.max(1, Math.round(cssWidth))
    const height = Math.max(1, Math.round(cssHeight))

    const budgetDpr = Math.sqrt(MAX_PIXELS / Math.max(1, width * height))
    const dpr = Math.max(1, Math.min(devicePixelRatio, 2, budgetDpr))

    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(width, height, false)

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  /** 减少动态效果时关掉鼠标视差，并立刻把指针归零 */
  setInteractive(enabled: boolean): void {
    this.interactive = enabled
    if (!enabled) {
      this.target.set(0, 0)
      this.pointer.set(0, 0)
    }
  }

  render(dt: number, simulation: ClusterSimulation): void {
    this.ensureSpheres(simulation)
    this.updatePointer(dt)
    this.applyCamera()

    for (let i = 0; i < this.meshes.length; i++) {
      const mesh = this.meshes[i]
      if (!mesh) continue

      const offset = i * 4
      const x = simulation.positions[offset] ?? 0
      const y = simulation.positions[offset + 1] ?? 0
      const z = simulation.positions[offset + 2] ?? 0
      const radius = simulation.positions[offset + 3] ?? 0.1

      const driftX = this.pointer.x * 0.01
      const driftY = this.pointer.y * 0.01

      mesh.position.set(x + driftX, y + driftY, z + 0.16)
      mesh.scale.setScalar(radius)
    }

    this.updateClusterColors()
    this.renderer.render(this.scene, this.camera)
  }

  dispose(): void {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('blur', this.resetPointer)
    document.removeEventListener('mouseleave', this.resetPointer)

    this.geometry.dispose()
    this.glowTexture.dispose()
    for (const material of this.materials) material.dispose()
    for (const sprite of this.clusterGlows) sprite.material.dispose()

    this.scene.clear()
    this.renderer.dispose()
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.interactive || event.pointerType === 'touch') return

    const width = Math.max(1, window.innerWidth)
    const height = Math.max(1, window.innerHeight)

    this.target.set(
      Math.max(-1, Math.min(1, (event.clientX / width) * 2 - 1)),
      Math.max(-1, Math.min(1, -((event.clientY / height) * 2 - 1))),
    )
  }

  private readonly resetPointer = (): void => {
    this.target.set(0, 0)
  }

  private updatePointer(dt: number): void {
    if (!this.interactive) {
      this.pointer.set(0, 0)
      return
    }

    const follow = 1 - Math.exp(-POINTER_FOLLOW * Math.min(Math.max(dt, 0), 0.1))
    this.pointer.x += (this.target.x - this.pointer.x) * follow
    this.pointer.y += (this.target.y - this.pointer.y) * follow
  }

  private applyCamera(): void {
    this.camera.position.set(-this.pointer.x * 0.28, -this.pointer.y * 0.16, CAMERA_Z)
  }

  private ensureSpheres(simulation: ClusterSimulation): void {
    if (this.meshes.length > 0) return

    const count = simulation.sphereCount
    this.perCluster = Math.floor(count / 2)

    // 每簇取第一颗球的颜色作为簇的基色；另一个簇的基色作为撞色点缀
    for (let cluster = 0; cluster < 2; cluster++) {
      const offset = cluster * this.perCluster * 3
      this.clusterBaseColors[cluster]!.set(
        simulation.colors[offset] ?? 0.3,
        simulation.colors[offset + 1] ?? 0.6,
        simulation.colors[offset + 2] ?? 1,
      )
    }

    for (let i = 0; i < count; i++) {
      const core = new Vector3()
      const edge = new Vector3()
      const material = new ShaderMaterial({
        uniforms: {
          uCoreColor: { value: core },
          uEdgeColor: { value: edge },
          uOpacity: { value: BALL_OPACITY },
        },
        vertexShader: sphereVert,
        fragmentShader: sphereFrag,
        transparent: true,
        // 正常透明混合：内圈奶油色叠在外圈蓝绿上，中心自然发白
        depthTest: false,
        depthWrite: false,
      })

      const mesh = new Mesh(this.geometry, material)
      mesh.renderOrder = 1
      this.scene.add(mesh)
      this.meshes.push(mesh)
      this.materials.push(material)
      this.ballColors.push({ core, edge })
    }

    // 每簇一团很淡的底光，给整个球簇一点体积
    for (let cluster = 0; cluster < 2; cluster++) {
      const base = this.clusterBaseColors[cluster]!
      const material = new SpriteMaterial({
        map: this.glowTexture,
        color: new Color()
          .setRGB(base.x, base.y, base.z, SRGBColorSpace)
          .lerp(new Color().setRGB(CORE_COLOR.x, CORE_COLOR.y, CORE_COLOR.z, SRGBColorSpace), 0.48),
        transparent: true,
        opacity: 0.5,
        blending: AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      })
      const ambient = new Sprite(material)
      ambient.renderOrder = 0
      ambient.scale.setScalar(2.5)
      this.scene.add(ambient)
      this.clusterGlows.push(ambient)
    }
  }

  /**
   * 计算每簇的 2D 中心 / 最大半径，再逐球更新颜色。
   * 内圈球偏奶油，外圈球偏该簇的饱和色，并随机掺一点另一簇的颜色。
   */
  private updateClusterColors(): void {
    const perCluster = this.perCluster
    if (perCluster <= 0) return

    for (let cluster = 0; cluster < 2; cluster++) {
      const center = this.clusterCenters[cluster]!
      let x = 0
      let y = 0
      let z = 0

      for (let i = cluster * perCluster; i < (cluster + 1) * perCluster; i++) {
        const mesh = this.meshes[i]
        if (!mesh) continue
        x += mesh.position.x
        y += mesh.position.y
        z += mesh.position.z
      }

      center.set(x / perCluster, y / perCluster, z / perCluster)

      let maxRadius = 1e-4
      for (let i = cluster * perCluster; i < (cluster + 1) * perCluster; i++) {
        const mesh = this.meshes[i]
        if (!mesh) continue
        maxRadius = Math.max(
          maxRadius,
          Math.hypot(mesh.position.x - center.x, mesh.position.y - center.y),
        )
      }
      this.clusterRadii[cluster] = maxRadius

      const ambient = this.clusterGlows[cluster]
      if (ambient) ambient.position.set(center.x, center.y, center.z - 0.5)
    }

    for (let i = 0; i < this.meshes.length; i++) {
      const mesh = this.meshes[i]
      const colors = this.ballColors[i]
      if (!mesh || !colors) continue

      const cluster = i < perCluster ? 0 : 1
      const center = this.clusterCenters[cluster]!
      const maxRadius = this.clusterRadii[cluster]!
      const distance = Math.hypot(mesh.position.x - center.x, mesh.position.y - center.y)
      const t = smoothstep(0.15, 0.95, distance / maxRadius)

      const base = this.clusterBaseColors[cluster]!
      const accent = this.clusterBaseColors[cluster === 0 ? 1 : 0]!
      const fleck = 0.26 * smoothstep(0.25, 0.9, t) * hash01(i * 7.13 + cluster * 3.7)

      // 内圈球接近奶油薄荷，外圈球保持该簇的饱和蓝 / 绿
      colors.edge.copy(base).lerp(CORE_COLOR, 0.75 * (1 - t))
      colors.edge.lerp(accent, fleck)
      // 单颗球内部只比自身边缘亮一点，不要每颗都变成白球
      colors.core.copy(colors.edge).lerp(CORE_COLOR, 0.18)
      // 极轻微的明暗差异，避免每颗球一模一样
      colors.edge.multiplyScalar(0.9 + 0.2 * hash01(i * 13.7))
    }
  }
}
