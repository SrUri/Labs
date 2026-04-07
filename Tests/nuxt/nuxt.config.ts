export default defineNuxtConfig({
  compatibilityDate: '2026-04-07',
  modules: [
    '@nuxtjs/supabase',
    '@nuxt/ui'
  ],
  supabase: {
    redirect: false
  }
})