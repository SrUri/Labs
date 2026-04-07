<template>
  <UContainer>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold">Manteniment de Categories</h2>
      <UButton icon="i-heroicons-plus" color="primary" @click="openCreateModal">
        Nova Categoria
      </UButton>
    </div>

    <UCard>
      <UTable :rows="categories" :loading="pending">
        <template #parent_id-data="{ row }">
          <UBadge v-if="row.parent_id" color="gray" variant="subtle">Subcategoria</UBadge>
          <UBadge v-else color="primary" variant="subtle">Pare</UBadge>
        </template>
        
        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton color="gray" variant="ghost" icon="i-heroicons-pencil-square" @click="openEditModal(row)" />
            <UButton color="red" variant="ghost" icon="i-heroicons-trash" @click="confirmDelete(row.id)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model="isModalOpen">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ isEditing ? 'Editar' : 'Nova' }} Categoría</h3>
        </template>

        <form @submit.prevent="saveCategory" class="space-y-4">
          <UFormGroup label="Codi de la categoria" required>
            <UInput v-model="form.code" placeholder="Ej: CAT-005" required />
          </UFormGroup>
          <UFormGroup label="Nom" required>
            <UInput v-model="form.name" placeholder="Nom de la categoria" required />
          </UFormGroup>
          <UFormGroup label="Descripció">
            <UTextarea v-model="form.description" />
          </UFormGroup>
          <UFormGroup label="Categoria Pare (Opcional)">
            <USelectMenu 
              v-model="form.parent_id" 
              :options="parentOptions" 
              value-attribute="id" 
              option-attribute="name"
              placeholder="Seleccionar..." 
            />
          </UFormGroup>
          <div class="flex justify-end gap-3 mt-6">
            <UButton color="gray" variant="ghost" @click="isModalOpen = false">Cancel·lar</UButton>
            <UButton type="submit" color="primary" :loading="saving">Guardar</UButton>
          </div>
        </form>
      </UCard>
    </UModal>

    <UModal v-model="isDeleteModalOpen">
      <UCard :ui="{ divide: 'divide-y divide-gray-100' }">
        <template #header>
          <h3 class="text-lg font-semibold text-red-600 flex items-center gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" />
            Confirmar eliminació
          </h3>
        </template>

        <div class="py-4">
          <p>Segur que vols borrar aquesta categoria? Aquesta acció no es pot desfer.</p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="isDeleteModalOpen = false">Cancel·lar</UButton>
            <UButton color="red" :loading="saving" @click="executeDelete">Eliminar definitivament</UButton>
          </div>
        </template>
      </UCard>
    </UModal>

  </UContainer>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const supabase = useSupabaseClient()

// ESTADO GENERAL
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false) // Nuevo
const isEditing = ref(false)
const saving = ref(false)
const idToDelete = ref(null) // Nuevo

// EL FORMULARIO
const form = ref({
  id: null,
  code: '',
  name: '',
  description: '',
  parent_id: null
})

// CARGAR DATOS
const { data: categories, pending, refresh } = await useAsyncData('categories', async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, code, name, description, parent_id')
    .order('id', { ascending: true })
    
  if (error) throw error
  return data.map(cat => ({ ...cat, actions: '' }))
})

const parentOptions = computed(() => {
  if (!categories.value) return []
  return categories.value.filter(c => c.id !== form.value.id)
})

const openCreateModal = () => {
  form.value = { id: null, code: '', name: '', description: '', parent_id: null }
  isEditing.value = false
  isModalOpen.value = true
}

const openEditModal = (row) => {
  form.value = { ...row }
  isEditing.value = true
  isModalOpen.value = true
}

// Lógica de borrado con Modal
const confirmDelete = (id) => {
  idToDelete.value = id
  isDeleteModalOpen.value = true
}

const executeDelete = async () => {
  saving.value = true
  try {
    const { error } = await supabase.from('categories').delete().eq('id', idToDelete.value)
    if (error) throw error
    await refresh()
    isDeleteModalOpen.value = false
  } catch (error) {
    console.error("Error al borrar:", error)
    alert("No s'ha pogut borrar. Assegura't de que no hi hagi subcategories o productes vinculats.")
  } finally {
    saving.value = false
    idToDelete.value = null
  }
}

const saveCategory = async () => {
  saving.value = true
  try {
    if (isEditing.value) {
      const { id, actions, ...updateData } = form.value
      await supabase.from('categories').update(updateData).eq('id', id)
    } else {
      const { id, actions, ...insertData } = form.value
      await supabase.from('categories').insert(insertData)
    }
    await refresh()
    isModalOpen.value = false
  } catch (error) {
    console.error("Error al guardar:", error)
    alert("Hi ha hagut un error al guardar")
  } finally {
    saving.value = false
  }
}
</script>