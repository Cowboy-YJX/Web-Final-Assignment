import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@views/HomeView.vue'
import EmailView from '@views/EmailView.vue'
import PhotoView from '@views/PhotoView.vue'
import VideoView from '@views/VideoView.vue'
import SkillView from '@views/SkillView.vue'
import MusicView from '@/views/MusicView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/video',
      name: 'video',
      component: VideoView,
    },
    {
      path: '/email',
      name: 'email',
      component: EmailView,
    },
    {
      path: '/photo',
      name: 'photo',
      component: PhotoView,
    },
    {
      path: '/skill',
      name: 'skill',
      component: SkillView,
    },
    {
      path: '/music',
      name: 'music',
      component: MusicView,
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
