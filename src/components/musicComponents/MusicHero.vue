<script setup lang="ts" name="MusicHero">
import { Material, Mesh, Camera, TextureLoader, LoadingManager, Scene, WebGLRenderer } from 'three'
import GUI from 'lil-gui'

import { onMounted, ref } from 'vue'

const cnavas = ref<Element | null>(null)
const canvasSize = { width: 800, height: 800 }

onMounted(() => {
  const scene = new Scene()
})
</script>

<template>
  <section class="w-screen h-screen">
    <canvas ref="canvas"></canvas>
  </section>
</template>

<style scoped></style>
