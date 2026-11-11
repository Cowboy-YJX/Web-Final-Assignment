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

import ArrowRight from '@icons/ArrowRight.vue'

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
  img_data: imgAttrib[]
  if_movable: boolean
} = {
  // 图片的总数
  img_total: 20,
  // 图片排列的总列数
  row_max: 5,
  // 图片排列的总行数
  line_max: 4,
  // 源图片的实际宽高的一半
  img_width: Math.floor(585 / 2),
  img_height: Math.floor(780 / 2),
  // 图片间的上下左右间距
  img_margin: 180,
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

let inStage: () => void
let outStage: () => void

let xTo: (val: number) => void
let yTo: (val: number) => void

function moveMouse(e: Event) {
  const x = (e as MouseEvent).clientX
  const y = (e as MouseEvent).clientY

  xTo(x)
  yTo(y)
}

onMounted(() => {
  const canvas = document.querySelector<HTMLCanvasElement>('#photo-canvas')
  const currentImg = document.querySelector('#currentImg')

  if (!canvas) return
  if (!currentImg) return
  if (!leftOuter.value) return
  if (!topOuter.value) return
  if (!rightOuter.value) return
  if (!bottomOuter.value) return
  if (!mask.value) return
  if (!mouse.value) return

  const content = canvas.getContext('2d')

  if (!content) return

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
        const col_index = i % photobox.row_max
        const line_index = Math.floor(i / photobox.row_max)
        // 通过行列序号算出xy坐标
        const x: number = col_index * (photobox.img_width + photobox.img_margin)
        const y: number = line_index * (photobox.img_height + photobox.img_margin)
        // 将其添加到img_data中
        photobox.img_data.push({ img, x, y })
        // 创建完成之后就绘制一次，确保在进入页面的时候，图片会全部显示
        content!.drawImage(img, x, y, photobox.img_width, photobox.img_height)
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
    // 当鼠标弹起时，图片无法被移动，并且调用check_img函数，获取当前鼠标所指向的图片
    window.onmouseup = (e) => {
      photobox.if_movable = false
      check_img(e.x, e.y)
    }
    // 当鼠标离开选区时，图片无法被移动，
    window.onmouseleave = () => {
      photobox.if_movable = false
    }
    // 当鼠标移动时，调用move_imgs函数，移动所有图片
    window.onmousemove = (e) => {
      // if_movable为flase则不可以移动图片，即鼠标未按下时
      if (!photobox.if_movable) return 0
      move_imgs(e.movementX, e.movementY)
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
      content!.drawImage(img.img, img.x, img.y, photobox.img_width, photobox.img_height)
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
    if (img) console.log(img, img.img)
  }

  // 初始化
  init()

  gsap.set(canvas, {
    scale: 1.1,
  })

  gsap.set(mouse.value, {
    scale: 0,
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

  const mouseIn = gsap.to(mouse.value, {
    scale: 1,
  })
  mouseIn.pause()

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
    mouseIn.play(0)
    canvasScale.play(0)
  }

  outStage = () => {
    left.reverse()
    top.reverse()
    right.reverse()
    bottom.reverse()
    mouseIn.reverse()
    canvasScale.reverse()
  }

  canvas.addEventListener('mousedown', inStage)
  window.addEventListener('mouseup', outStage)
  window.addEventListener('mousemove', moveMouse)
})

onUnmounted(() => {
  window.removeEventListener('mousedown', inStage)
  window.removeEventListener('mmouseup', outStage)
  window.removeEventListener('mousemove', moveMouse)
  window.onmouseup = null
  window.onmousemove = null
  window.onmouseleave = null
})
</script>

<template>
  <section class="w-screen h-screen relative">
    <canvas id="photo-canvas"></canvas>

    <div class="absolute top-0 left-0 z-50 w-screen h-screen pointer-events-none" ref="mask">
      <img src="" alt="" id="currentImg" />
      <div class=""></div>
    </div>

    <div
      class="bg-(--green) w-25 h-25 rounded-full absolute left-0 top-0 -translate-1/2 z-10 flex flex-col justify-between pointer-events-none"
      ref="mouse"
    >
      <div class="w-1/2 h-1/2 rotate-225 self-start translate-2">
        <ArrowRight color="#171717" />
      </div>
      <div class="w-1/2 h-1/2 rotate-45 self-end -translate-2"><ArrowRight color="#171717" /></div>
    </div>

    <div
      class="absolute w-16 h-screen -left-16 top-0 z-1 bg-(--green) font-OutFit text-(--black) text-[3rem] leading-16 vertical-text"
      ref="leftOuter"
    >
      <div class="left-brand text-nowrap w-full h-full">
        DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ←
      </div>
    </div>
    <div
      class="absolute w-screen h-16 -top-16 left-0 z-1 bg-(--green) font-OutFit text-(--black) text-[3rem] leading-16"
      ref="topOuter"
    >
      <div class="top-brand text-nowrap w-full h-full">
        DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ← DRAG ←
        DRAG ←
      </div>
    </div>
    <div
      class="absolute w-16 h-screen -right-16 top-0 bg-(--green) font-OutFit text-(--black) text-[3rem] leading-16 vertical-text"
      ref="rightOuter"
    >
      <div class="right-brand text-nowrap w-full h-full">
        DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG → DRAG →
      </div>
    </div>
    <div
      class="absolute w-screen h-16 -bottom-16 left-0 bg-(--green) font-OutFit text-(--black) text-[3rem] leading-16"
      ref="bottomOuter"
    >
      <div class="bottom-brand text-nowrap w-full h-full">
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
}

.bottom-brand {
  animation: goRight var(--motion-duration-cinematic) infinite reverse var(--motion-ease-linear) !important;
}

@keyframes goRight {
  from {
    transform: translateX(0%);
  }

  to {
    transform: translateX(-75%);
  }
}

.left-brand {
  animation: goBottom var(--motion-duration-cinematic) infinite var(--motion-ease-linear) !important;
}

.right-brand {
  animation: goBottom var(--motion-duration-cinematic) infinite reverse var(--motion-ease-linear) !important;
}

@keyframes goBottom {
  from {
    transform: translateY(0%);
  }

  to {
    transform: translateY(-85%);
  }
}
</style>
