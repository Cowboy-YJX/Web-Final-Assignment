import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGloballAnimationStore = defineStore('globallAnimation', () => {
  const isTransition = ref<boolean>(false)
  const isScreen = ref<boolean>(false)
  const isOpen = ref<boolean>(false)
  const isLoading = ref<boolean>(true)

  function toggleEnum() {
    isOpen.value = !isOpen.value
    isScreen.value = !isScreen.value
  }

  return {
    isTransition,
    isScreen,
    isOpen,
    isLoading,
    toggleEnum,
  }
})
