<script setup lang="ts" name="PhotoHero">
import gsap from 'gsap'
import { DURATION } from '@animation'

import { onMounted, onUnmounted, ref } from 'vue'

import imgOne from '@assets/photos/one.jpg'
import imgTwo from '@assets/photos/two.jpg'
import imgThree from '@assets/photos/three.jpg'
import imgFour from '@assets/photos/four.jpg'
import imgFive from '@assets/photos/five.jpg'
import imgSix from '@assets/photos/six.jpg'
import imgSeven from '@assets/photos/seven.jpg'
import imgEight from '@assets/photos/eight.jpg'
import imgNine from '@assets/photos/nine.jpg'
import imgTen from '@assets/photos/ten.jpg'
import imgEleven from '@assets/photos/eleven.jpg'
import imgTwelve from '@assets/photos/twelve.jpg'

type imgAttrib = {
  img: HTMLImageElement
  x: number
  y: number
}

const imgs: string[] = [
  imgOne,
  imgTwo,
  imgThree,
  imgFour,
  imgFive,
  imgSix,
  imgSeven,
  imgEight,
  imgNine,
  imgTen,
  imgEleven,
  imgTwelve,
  imgOne,
  imgTwo,
  imgThree,
  imgFour,
  imgFive,
  imgSix,
  imgSeven,
  imgEight,
  imgNine,
  imgTen,
  imgEleven,
  imgTwelve,
]

const photobox: {
  img_total: number
  row_max: number
  line_max: number
  img_width: number
  img_height: number
  img_margin: number
  total_width: number
  total_height: number
  img_radius: number
  img_data: imgAttrib[]
  if_movable: boolean
} = {
  // 图片的总数
  img_total: 24,
  // 图片排列的总列数
  row_max: 6,
  // 图片排列的总行数
  line_max: 4,
  // 源图片的实际宽高的一半
  img_width: Math.floor(585 / 2),
  img_height: Math.floor(780 / 2),
  // 图片圆角大小
  img_radius: 16,
  // 图片间的上下左右间距
  img_margin: 150,
  // 所有图片纵横排列之后的总宽高，用作图片超出范围的界限判定
  total_width: 0,
  total_height: 0,
  // 图片数据，用以储存每张图片的源以及xy坐标位置
  img_data: [],
  // 当前画布是否可以移动
  if_movable: false,
}

const leftOuter = ref<Element | null>(null)
const topOuter = ref<Element | null>(null)
const rightOuter = ref<Element | null>(null)
const bottomOuter = ref<Element | null>(null)
const mask = ref<Element | null>(null)
const mouse = ref<Element | null>(null)
const container = ref<Element | null>(null)
const icon = ref<Element | null>(null)

const displayImg = ref<boolean>(false)

let inStage: () => void
let outStage: () => void

let xTo: (val: number) => void
let yTo: (val: number) => void
let mouseRotate: (e: Event) => void

function moveMouse(e: Event) {
  const x = (e as MouseEvent).clientX
  const y = (e as MouseEvent).clientY

  xTo(x)
  yTo(y)
}

onMounted(() => {
  const canvas = document.querySelector<HTMLCanvasElement>('#photo-canvas')
  const currentImg = document.querySelector<HTMLImageElement>('#currentImg')

  if (!canvas) return
  if (!currentImg) return
  if (!leftOuter.value) return
  if (!topOuter.value) return
  if (!rightOuter.value) return
  if (!bottomOuter.value) return
  if (!mask.value) return
  if (!mouse.value) return
  if (!container.value) return
  if (!icon.value) return

  const content = canvas.getContext('2d')

  if (!content) return

  let mouseX = window.innerWidth / 2
  let mouseY = window.innerHeight / 2
  let oldDegree = 0

  // 初始化
  function init() {
    // 总宽度等于横向排列的所有图片的宽度和间隔相加，最后一张图片没有右间隔，故需要减去一个间隔，总高度同理
    photobox.total_width =
      photobox.row_max * (photobox.img_width + photobox.img_margin) - photobox.img_margin
    photobox.total_height =
      photobox.line_max * (photobox.img_height + photobox.img_margin) - photobox.img_margin
    resize()
    creat_events()
    creat_img_data()
  }

  const changIcon = gsap.to(icon.value, {
    morphSVG: {
      shape: 'M156 160 L484 480 M156 480 L484 160',
    },
    strokeWidth: 65,
  })
  changIcon.pause(0)

  function clickImg() {
    photobox.if_movable = false
    displayImg.value = true

    gsap.to(mask.value, { display: 'block', opacity: 0.85, duration: DURATION.instant })
    gsap.to(currentImg, { display: 'block', opacity: 1, duration: DURATION.base })

    changIcon.play(0)

    window.removeEventListener('mousemove', mouseRotate)
  }

  function closeImg() {
    displayImg.value = false

    gsap.to(mask.value, { display: 'none', opacity: 0, duration: DURATION.instant })
    gsap.to(currentImg, { display: 'none', opacity: 0, duration: DURATION.base })

    changIcon.reverse()

    window.addEventListener('mousemove', mouseRotate)
  }

  function resize() {
    // 修改canvas宽高以填充满页面
    canvas!.width = window.innerWidth
    canvas!.height = window.innerHeight
    // 修改canvas宽高之后，画布内容会被清除，故需要调用一次move_imgs函数，重新生成所有图片
    if (photobox.img_data) move_imgs(0, 0)
  }

  // 创建图片数据即img_data
  function creat_img_data() {
    photobox.img_data = []
    for (let i = 0; i < photobox.img_total; i++) {
      const img = new Image()
      img.src = imgs[i]!
      // 当图片加载完成之后，创建对应图片数据并添加到img_data中
      img.onload = () => {
        // 计算该序号图片处于第几行第几列
        const line_index = Math.floor(i / photobox.row_max)
        const col_index = i % photobox.row_max
        // 通过行列序号算出xy坐标
        const x: number = col_index * (photobox.img_width + photobox.img_margin)
        const y: number =
          col_index % 2 == 0
            ? line_index * (photobox.img_height + photobox.img_margin)
            : line_index * (photobox.img_height + photobox.img_margin) - photobox.img_height
        // 裁切圆角
        content?.save()
        content?.beginPath()
        content?.moveTo(x + photobox.img_radius, y)
        content?.arcTo(
          x + photobox.img_width,
          y,
          x + photobox.img_width,
          y + photobox.img_height,
          photobox.img_radius,
        )
        content?.arcTo(
          x + photobox.img_width,
          y + photobox.img_height,
          x,
          y + photobox.img_height,
          photobox.img_radius,
        )
        content?.arcTo(x, y + photobox.img_height, x, y, photobox.img_radius)
        content?.arcTo(x, y, x + photobox.img_width, y, photobox.img_radius)
        content?.closePath()
        content?.clip()
        // 将其添加到img_data中
        photobox.img_data.push({ img, x, y })
        // 创建完成之后就绘制一次，确保在进入页面的时候，图片会全部显示
        content!.drawImage(img, x, y, photobox.img_width, photobox.img_height)
        content?.restore()
      }
    }
  }

  // 绑定所有监听事件
  function creat_events() {
    window.addEventListener('resize', resize)
    // 当鼠标按下时，才可以移动所有图片
    canvas!.addEventListener('mousedown', () => {
      photobox.if_movable = true
    })
    // 调用check_img函数，获取当前鼠标所指向的图片
    canvas!.addEventListener('mouseup', (e) => {
      check_img(e.x, e.y)
    })
    // 当鼠标弹起时，图片无法被移动
    window.onmouseup = () => {
      photobox.if_movable = false
    }
    // 当鼠标离开选区时，图片无法被移动，
    window.onmouseleave = () => {
      photobox.if_movable = false
    }
    // 当鼠标移动时，调用move_imgs函数，移动所有图片
    window.onmousemove = (e) => {
      // if_movable为flase则不可以移动图片，即鼠标未按下时
      if (!photobox.if_movable) return 0
      move_imgs(e.movementX * 2, e.movementY * 2)
    }
  }

  // 移动所有图片
  function move_imgs(x: number, y: number) {
    // 清除content，重新进行绘制
    content!.clearRect(0, 0, canvas!.width, canvas!.height)
    // 遍历所有图片，对每一张图片进行移动，并进行判断
    photobox.img_data.forEach((img) => {
      img.x += x
      // 当图片超出总宽度范围时，将图片移动到最右侧，
      // 注意这里减去一个图片宽度是为了让图片提前位移，防止最左侧的图片出现空白行
      if (img.x > photobox.total_width - photobox.img_width)
        img.x -= photobox.total_width + photobox.img_margin
      // 当图片小于一个负的图片宽度，即向左超出总宽度范围时，将图片移动到最右侧
      if (img.x < -photobox.img_width) img.x += photobox.total_width + photobox.img_margin
      // 竖向同上
      img.y += y
      if (img.y > photobox.total_height - photobox.img_height)
        img.y -= photobox.total_height + photobox.img_margin
      if (img.y < -photobox.img_height) img.y += photobox.total_height + photobox.img_margin
      // 绘制图片，更新画布
      content?.save()
      content?.beginPath()
      content?.moveTo(img.x + photobox.img_radius, img.y)
      content?.arcTo(
        img.x + photobox.img_width,
        img.y,
        img.x + photobox.img_width,
        img.y + photobox.img_height,
        photobox.img_radius,
      )
      content?.arcTo(
        img.x + photobox.img_width,
        img.y + photobox.img_height,
        img.x,
        img.y + photobox.img_height,
        photobox.img_radius,
      )
      content?.arcTo(img.x, img.y + photobox.img_height, img.x, img.y, photobox.img_radius)
      content?.arcTo(img.x, img.y, img.x + photobox.img_width, img.y, photobox.img_radius)
      content?.closePath()
      content?.clip()
      content!.drawImage(img.img, img.x, img.y, photobox.img_width, photobox.img_height)
      content?.restore()
    })
  }

  // 获取当前鼠标点击位置下的对应图片数据
  function check_img(x: number, y: number) {
    // 遍历所有图片，找出鼠标xy坐标处于图片内部的那张图片
    const img = photobox.img_data.find(
      (img) =>
        x >= img.x &&
        x < img.x + photobox.img_width &&
        y >= img.y &&
        y < img.y + photobox.img_height,
    )
    // 如果存在，则输出
    if (img && !displayImg.value) {
      currentImg!.src = img.img.src

      clickImg()
    }
  }

  // 初始化
  init()

  gsap.set(canvas, {
    scale: 1.1,
  })

  xTo = gsap.quickTo(mouse.value, 'x', { duration: DURATION.fast })
  yTo = gsap.quickTo(mouse.value, 'y', { duration: DURATION.fast })

  const left = gsap.to(leftOuter.value, {
    left: 0,
  })
  const top = gsap.to(topOuter.value, {
    top: 0,
  })
  const right = gsap.to(rightOuter.value, {
    right: 0,
  })
  const bottom = gsap.to(bottomOuter.value, {
    bottom: 0,
  })

  mouseRotate = (e: Event) => {
    const currentX = (e as MouseEvent).clientX
    const currentY = (e as MouseEvent).clientY

    const deltaX = currentX - mouseX
    const deltaY = currentY - mouseY == 0 ? 0.01 : currentY - mouseY

    const newDegree = Math.abs(Math.atan2(deltaX, deltaY) * (180 / Math.PI))
    const deltaDegree = Math.abs(newDegree - oldDegree)

    if (deltaDegree >= 5 || deltaDegree <= 45)
      gsap.to(mouse.value, { rotate: newDegree, duration: DURATION.instant })

    oldDegree = newDegree
    mouseX = currentX
    mouseY = currentY
  }

  const mouseOut = gsap.to(mouse.value, {
    scale: 0,
    duration: DURATION.slow,
  })
  mouseOut.pause()

  const canvasScale = gsap.to(canvas, {
    scale: 1,
  })
  canvasScale.pause()

  left.pause()
  top.pause()
  right.pause()
  bottom.pause()

  inStage = () => {
    left.play(0)
    top.play(0)
    right.play(0)
    bottom.play(0)
    canvasScale.play(0)
  }

  outStage = () => {
    left.reverse()
    top.reverse()
    right.reverse()
    bottom.reverse()
    canvasScale.reverse()
    gsap.to(mouse.value, { rotate: 0, duration: DURATION.instant })
  }

  mask.value.addEventListener('click', () => {
    closeImg()
  })

  canvas.addEventListener('mousedown', inStage)
  container.value.addEventListener('mouseenter', () => {
    mouseOut.reverse()
  })
  container.value.addEventListener('mouseleave', () => {
    mouseOut.play(0)
  })

  window.addEventListener('mouseup', outStage)
  window.addEventListener('mousemove', moveMouse)
  window.addEventListener('mousemove', mouseRotate)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', inStage)
  window.removeEventListener('mmouseup', outStage)
  window.removeEventListener('mousemove', moveMouse)
  window.removeEventListener('mousemove', mouseRotate)
  window.onmouseup = null
  window.onmousemove = null
  window.onmouseleave = null
})
</script>

<template>
  <section class="w-screen h-screen relative" ref="container">
    <canvas id="photo-canvas"></canvas>

    <div
      class="absolute top-0 left-0 z-10 w-screen h-screen bg-(--black) opacity-0"
      style="display: none"
      ref="mask"
    ></div>
    <img
      src=""
      id="currentImg"
      class="h-4/5 absolute left-1/2 top-1/2 -translate-1/2 z-20 opacity-0"
      style="display: none"
    />

    <div
      class="bg-(--green) w-28 h-28 rounded-full absolute top-0 left-0 -translate-1/2 z-30 pointer-events-none"
      ref="mouse"
    >
      <div class="flex justify-center items-center p-3">
        <svg viewBox="0 0 640 640" width="100%" height="100%" class="origin-center scale-80">
          <path
            d="M408 64L552 64C565.3 64 576 74.7 576 88L576 232C576 241.7 570.2 250.5 561.2 254.2C552.2 257.9 541.9 255.9 535 249L496 210L409 297C399.6 306.4 384.4 306.4 375.1 297L343.1 265C333.7 255.6 333.7 240.4 343.1 231.1L430.1 144.1L391.1 105.1C384.2 98.2 382.2 87.9 385.9 78.9C389.6 69.9 398.3 64 408 64zM232 576L88 576C74.7 576 64 565.3 64 552L64 408C64 398.3 69.8 389.5 78.8 385.8C87.8 382.1 98.1 384.2 105 391L144 430L231 343C240.4 333.6 255.6 333.6 264.9 343L296.9 375C306.3 384.4 306.3 399.6 296.9 408.9L209.9 495.9L248.9 534.9C255.8 541.8 257.8 552.1 254.1 561.1C250.4 570.1 241.7 576 232 576z"
            ref="icon"
            class="stroke-(--black) fill-(--black)"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
    </div>

    <div
      class="absolute w-[4vw] left-[-4.5vw] top-0 z-1 bg-(--green) font-OutFit text-(--black) vertical-text"
      ref="leftOuter"
    >
      <div class="left-brand text-nowrap w-full text-[3vw] leading-[4vw]">
        DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ←
      </div>
    </div>
    <div
      class="absolute h-[4vw] top-[-4.5vw] left-0 z-1 bg-(--green) font-OutFit text-(--black)"
      ref="topOuter"
    >
      <div class="top-brand text-nowrap h-full text-[3vw] leading-[4vw]">
        DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ←
        DRAG ←
      </div>
    </div>
    <div
      class="absolute w-[4vw] right-[-4.5vw] top-0 bg-(--green) font-OutFit text-(--black) vertical-text"
      ref="rightOuter"
    >
      <div class="right-brand text-nowrap w-full text-[3vw] leading-[4vw]">
        DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG →
      </div>
    </div>
    <div
      class="absolute h-[4vw] bottom-[-4.5vw] left-0 bg-(--green) font-OutFit text-(--black)"
      ref="bottomOuter"
    >
      <div class="bottom-brand text-nowrap h-full text-[3vw] leading-[4vw]">
        DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG →
        DRAG →
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.vertical-text {
  writing-mode: vertical-lr;
}

.top-brand {
  animation: goRight var(--motion-duration-cinematic) infinite var(--motion-ease-linear) !important;
  word-spacing: 2vw;
}

.bottom-brand {
  animation: goRight var(--motion-duration-cinematic) infinite reverse var(--motion-ease-linear) !important;
  word-spacing: 2vw;
}

@keyframes goRight {
  from {
    transform: translateX(0);
  }

  to {
    transform: translateX(-50.2vw);
  }
}

.left-brand {
  animation: goBottom var(--motion-duration-cinematic) infinite var(--motion-ease-linear) !important;
  word-spacing: 2vw;
}

.right-brand {
  animation: goBottom var(--motion-duration-cinematic) infinite reverse var(--motion-ease-linear) !important;
  word-spacing: 2vw;
}

@keyframes goBottom {
  from {
    transform: translateY(0%);
  }

  to {
    transform: translateY(-50.2vw);
  }
}
</style>
