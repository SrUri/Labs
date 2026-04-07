<template>
  <div class="login-container">
    <h1>Acces</h1>
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" required />
      <input v-model="password" type="password" placeholder="Contraseña" required />
      <button type="submit">Entrar</button>
    </form>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const error = ref(null)

const handleLogin = async () => {
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })
  
  if (authError) {
    error.value = "Datos de acceso incorrectos"
  } else {
    navigateTo('/') // Redirige al dashboard tras el éxito
  }
}
</script>