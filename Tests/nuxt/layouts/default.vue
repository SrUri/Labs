<template>
  <div class="flex h-screen bg-gray-50">
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div class="p-6 border-b border-gray-200">
        <h1 class="text-xl font-bold text-gray-800">Admin Panel</h1>
      </div>
      
      <nav class="flex-1 p-4 space-y-2">
        <UButton block color="gray" variant="ghost" to="/" icon="i-heroicons-home">Dashboard</UButton>
        <UButton block color="gray" variant="ghost" to="/categories" icon="i-heroicons-folder">Categories</UButton>
        <UButton block color="gray" variant="ghost" to="/products" icon="i-heroicons-shopping-bag">Productes</UButton>
        <UButton block color="gray" variant="ghost" to="/calendar" icon="i-heroicons-calendar">Calendari</UButton>
      </nav>

      <div class="p-4 border-t border-gray-200">
        <UButton block color="red" variant="soft" icon="i-heroicons-arrow-left-on-rectangle" @click="handleLogout">
          Tancar Sessió
        </UButton>
      </div>
    </aside>

    <main class="flex-1 p-8 overflow-y-auto">
      <slot /> </main>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()

const handleLogout = async () => {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>