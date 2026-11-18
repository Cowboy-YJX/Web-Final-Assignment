import './style/main.css'

import gsap from 'gsap'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

import { createApp, nextTick, watch } from 'vue'

import { createPinia } from 'pinia'
import { storeToRefs } from 'pinia'
import { useGloballAnimationStore } from './stores/globallAnimation.ts'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const { isTransition, isScreen, isLoading } = storeToRefs(useGloballAnimationStore(pinia))

let smooth: ScrollSmoother | null = null
let contentEl: HTMLElement | null = null
let lastContentHeight = 0
let refreshFrame = 0

function scrollToTop(): void {
  const atTop = window.scrollY <= 0 && (!smooth || smooth.scrollTop() <= 0)
  if (atTop) return

  window.scrollTo(0, 0)
  smooth?.scrollTo(0, false)
}

function refreshSmoother(withScrollTop = false): void {
  if (withScrollTop) scrollToTop()
  if (!smooth) return

  smooth.refresh()
  ScrollTrigger.refresh()
  lastContentHeight = contentEl?.offsetHeight ?? 0
}

function waitForTransitionEvent(name: string, timeout: number): Promise<void> {
  return new Promise<void>((resolve) => {
    let timer = 0
    const finish = () => {
      window.clearTimeout(timer)
      window.removeEventListener(name, finish)
      resolve()
    }

    window.addEventListener(name, finish, { once: true })
    timer = window.setTimeout(finish, timeout)
  })
}

router.beforeEach(async (_to, from) => {
  if (!from.name) return true
  if (isTransition.value || isLoading.value) return true

  // 绿幕第一次盖住屏幕时先回顶（新页面还没挂载），
  // 但等黑幕也完全盖住后才放行路由，保留原来的转场节奏。
  const greenCovered = waitForTransitionEvent('app:transition-green-covered', 1500)
  const fullyCovered = waitForTransitionEvent('app:transition-covered', 2500)

  isTransition.value = true
  await greenCovered
  scrollToTop()
  await fullyCovered

  return true
})

router.afterEach(async () => {
  await nextTick()
  // 这里只重新量高度，不再重复 scrollTo；回到顶部已经在上面的 guard 里做过
  requestAnimationFrame(() => refreshSmoother())
})

app.mount('#app')

router.isReady().then(() => {
  contentEl = document.querySelector<HTMLElement>('#smooth-content')

  smooth = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.2,
    effects: true,
    smoothTouch: true,
  })

  smooth.paused(isScreen.value || isTransition.value || isLoading.value)
  refreshSmoother(true)

  // 新页面里的图片/字体晚一点加载完时，内容高度还会变化；再刷新一次
  if (contentEl && typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => {
      if (!smooth || !contentEl) return

      const height = contentEl.offsetHeight
      if (height === lastContentHeight) return

      cancelAnimationFrame(refreshFrame)
      refreshFrame = requestAnimationFrame(() => refreshSmoother())
    })
    observer.observe(contentEl)
  }
})

watch(
  [isScreen, isTransition, isLoading],
  () => smooth?.paused(isScreen.value || isTransition.value || isLoading.value),
  {
    immediate: true,
  },
)

// 幕布退出后再兜底一次：确保新页面已经挂载完成，并把滚动位置锁在顶部
watch([isTransition, isLoading], ([transition, loading]) => {
  if (transition || loading) return
  requestAnimationFrame(() => refreshSmoother())
})
