<script setup lang="ts" name="SkillHero">
import test from '@assets/photos/records/月光.jpg'
</script>

<template>
  <section class="relative w-screen h-screen py-[12vh]">
    <div class="h-[76vh] w-screen relative">
      <div class="h-full w-[38vh] bg-(--green) absolute left-0 overflow-hidden">
        <img :src="test" alt="" class="h-full object-cover cpp" />
      </div>
      <div class="h-full w-[20vh] bg-(--green) absolute left-[48vh] overflow-hidden">
        <img :src="test" alt="" class="h-full object-cover cpp" />
      </div>
      <div class="h-full w-[10vh] bg-(--green) absolute left-[73vh] overflow-hidden">
        <img :src="test" alt="" class="h-full object-cover cpp" />
      </div>
      <div class="h-full w-[5vh] bg-(--green) absolute left-[85.5vh] overflow-hidden">
        <img :src="test" alt="" class="h-full object-cover cpp" />
      </div>
      <div class="h-full w-[3vh] bg-(--green) absolute left-[92vh] overflow-hidden">
        <img :src="test" alt="" class="h-full object-cover cpp" />
      </div>
    </div>

    <div></div>
  </section>
</template>

<style scoped>
.cpp {
  transform-origin: center center;
  scale: 1.1;
  mix-blend-mode: darken;
}
</style>
