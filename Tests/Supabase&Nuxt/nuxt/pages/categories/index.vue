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
          <div class="flex items-center gap-2">
            <UBadge v-if="row.parent_id" color="gray" variant="subtle">
              Filla de: {{ getCategoryName(row.parent_id) }}
            </UBadge>
            <UBadge v-else color="primary" variant="subtle">Categoria Pare</UBadge>
          </div>
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

        <UForm :schema="schema" :state="form" @submit="saveCategory" class="space-y-4">
          
          <UFormGroup label="Codi de la categoria" name="code" required>
            <UInput v-model="form.code" placeholder="Ej: CAT-005" />
          </UFormGroup>
          
          <UFormGroup label="Nom" name="name" required>
            <UInput v-model="form.name" placeholder="Nom de la categoria" />
          </UFormGroup>
          
          <UFormGroup label="Descripció" name="description">
            <UTextarea v-model="form.description" />
          </UFormGroup>
          
          <UFormGroup label="Categoria Pare (Opcional)" name="parent_id">
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
        </UForm>
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
// Importem zod per validació de fluxos de dades
import { z } from 'zod'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

const supabase = useSupabaseClient()

// Estats formulari categories:
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const idToDelete = ref(null)

// Formulari:
const form = ref({
  id: null,
  code: '',
  name: '',
  description: '',
  parent_id: null
})

// Normes de validació zod
const schema = z.object({
  code: z.string().min(3, 'El codi ha de tenir almenys 3 caràcters').max(20, 'El codi és massa llarg'),
  name: z.string().min(2, 'El nom és obligatori').max(50, 'El nom és massa llarg'),
  description: z.string().max(300, 'La descripció no pot superar els 300 caràcters').optional().nullable(),
  parent_id: z.number().optional().nullable()
})

// Carreguem dades
const { data: categories, pending, refresh } = await useAsyncData('categories', async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, code, name, description, parent_id')
    .order('id', { ascending: true })
    
  if (error) throw error
  // columna actions amb botons
  return data.map(cat => ({ ...cat, actions: '' }))
})

// Categoria pare
const parentOptions = computed(() => {
  if (!categories.value) return []
  // Evitem bucles de categories assignant-se com a pares
  return categories.value.filter(c => c.id !== form.value.id)
})

// Busca nom categoria pare
const getCategoryName = (id) => {
  if (!categories.value) return ''
  const parent = categories.value.find(c => c.id === id)
  return parent ? parent.name : ''
}

// Netejar/crear formulari
const openCreateModal = () => {
  form.value = { id: null, code: '', name: '', description: '', parent_id: null }
  isEditing.value = false
  isModalOpen.value = true
}

// Editar formulari
const openEditModal = (row) => {
  form.value = { ...row }
  isEditing.value = true
  isModalOpen.value = true
}

// Confirmació de borrar
const confirmDelete = (id) => {
  idToDelete.value = id
  isDeleteModalOpen.value = true // obrim finestra
}

// Executar delete
const executeDelete = async () => {
  saving.value = true
  try {
    const { error } = await supabase.from('categories').delete().eq('id', idToDelete.value)
    if (error) throw error
    await refresh() // REFRESQUEM
    isDeleteModalOpen.value = false
  } catch (error) {
    console.error("Error al borrar:", error)
    alert("No s'ha pogut borrar. Assegura't de que no hi hagi subcategories o productes vinculats.")
  } finally {
    saving.value = false
    idToDelete.value = null
  }
}

// Si tot es correcte (limitacions zod), guardem la categoria
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