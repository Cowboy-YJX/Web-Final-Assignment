<script setup lang="ts">
import { RouterView } from 'vue-router'

import LoadingPage from '@components/LoadingPage.vue'
import NavBar from '@components/NavBar.vue'
import NavPanel from '@components/NavPanel.vue'

import { useGloballAnimationStore } from '@stores/globallAnimation'
import { storeToRefs } from 'pinia'
import { nextTick, onMounted } from 'vue'

const { isLoading } = storeToRefs(useGloballAnimationStore())

/** 开屏最小停留时间 */
// const MIN_LOADING_MS = 900
/** 超时时间 */
const LOADING_TIMEOUT_MS = 10000

// function waitForWindowLoad(): Promise<void> {
//   if (document.readyState === 'complete') return Promise.resolve()

//   return new Promise((resolve) => {
//     window.addEventListener('load', () => resolve(), { once: true })
//   })
// }

onMounted(async () => {
  isLoading.value = true

  // 等 Vue 的 LoadingPage 先挂上并盖住画面，再撤掉原生开屏
  await nextTick()
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById('boot-loader')?.remove()
    })
  })

  // const startedAt = performance.now()

  // await Promise.race([
  //   Promise.all([waitForWindowLoad(), document.fonts?.ready ?? Promise.resolve()]),
  //   new Promise((resolve) => setTimeout(resolve, LOADING_TIMEOUT_MS)),
  // ])

  // const remaining = MIN_LOADING_MS - (performance.now() - startedAt)
  // if (remaining > 0) {
  //   await new Promise((resolve) => setTimeout(resolve, remaining))
  // }

  // isLoading.value = false
  setTimeout(() => {
    isLoading.value = false
  }, LOADING_TIMEOUT_MS)
})
</script>

<template>
  <LoadingPage />
  <NavBar />
  <NavPanel />
  <div id="smooth-wrapper">
    <div id="smooth-content">
      <main>
        <RouterView v-slot="{ Component, route }">
          <component :is="Component" :key="route.path"></component>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped></style>
