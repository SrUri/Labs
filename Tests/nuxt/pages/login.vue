<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    
    <UCard class="w-full max-w-md shadow-xl">
      <template #header>
        <div class="text-center">
          <div class="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UIcon name="i-heroicons-lock-closed" class="w-8 h-8 text-primary-600" />
          </div>
          <h2 class="text-2xl font-bold text-gray-800">Accés al Sistema</h2>
          <p class="text-gray-500 text-sm mt-1">Introdueix les teves credencials per continuar</p>
        </div>
      </template>

      <UForm :schema="schema" :state="state" @submit="handleLogin" class="space-y-5">
        
        <UFormGroup label="Correu electrònic" name="email" required>
          <UInput 
            v-model="state.email" 
            type="email" 
            placeholder="admin@studiogenesis.es" 
            icon="i-heroicons-envelope" 
            size="lg"
          />
        </UFormGroup>

        <UFormGroup label="Contrasenya" name="password" required>
          <UInput 
            v-model="state.password" 
            type="password" 
            placeholder="••••••••" 
            icon="i-heroicons-key" 
            size="lg"
          />
        </UFormGroup>

        <UButton type="submit" color="primary" block size="lg" :loading="loading" class="mt-2">
          Entrar al Backoffice
        </UButton>
      </UForm>

      <div v-if="error" class="mt-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center border border-red-200 flex items-center justify-center gap-2">
        <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5" />
        {{ error }}
      </div>
    </UCard>

  </div>
</template>

<script setup>
// CAMBIO 4: Importamos Zod
import { z } from 'zod'

definePageMeta({ 
  layout: false,
  ssr: false 
})

const supabase = useSupabaseClient()

// CAMBIO 5: Agrupamos las variables en un objeto 'state' para que UForm lo entienda
const state = ref({
  email: '',
  password: ''
})

// CAMBIO 6: Reglas de validación Zod
const schema = z.object({
  email: z.string().email('Format de correu invàlid').min(1, 'El correu és obligatori'),
  password: z.string().min(6, 'La contrasenya ha de tenir almenys 6 caràcters') // Supabase exige mínimo 6 por defecto
})

const error = ref(null)
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  error.value = null
  
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: state.value.email,
    password: state.value.password,
  })
  
  if (authError) {
    error.value = "Dades d'accés incorrectes. Torna a intentar-ho."
    loading.value = false
  } else {
    navigateTo('/') 
  }
}
</script>