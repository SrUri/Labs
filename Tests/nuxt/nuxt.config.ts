export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],
  supabase: {
    redirect: false // Lo ponemos en false para que no nos bloquee mientras desarrollamos el login
  }
})