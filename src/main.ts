import './style/main.css'

import gsap from 'gsap'
import { ScrollSmoother } from 'gsap/ScrollSmoother'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger, ScrollSmoother)

import { createApp, watch } from 'vue'

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

router.beforeEach(async (_to, from) => {
  if (!from.name) return true
  if (isTransition.value || isLoading.value) return true

  const covered = new Promise<void>((resolve) => {
    let timer = 0
    const finish = () => {
      window.clearTimeout(timer)
      window.removeEventListener('app:transition-covered', finish)
      resolve()
    }

    window.addEventListener('app:transition-covered', finish, { once: true })
    timer = window.setTimeout(finish, 2500)
  })

  isTransition.value = true
  await covered
  return true
})

app.mount('#app')

let smooth: ScrollSmoother | null = null

router.isReady().then(() => {
  smooth = ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.2,
    effects: true,
    smoothTouch: true,
  })

  smooth.paused(isScreen.value || isTransition.value || isLoading.value)
})

watch(
  [isScreen, isTransition, isLoading],
  () => smooth?.paused(isScreen.value || isTransition.value || isLoading.value),
  {
    immediate: true,
  },
)
