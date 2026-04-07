<template>
  <UContainer>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold">Manteniment de Productes</h2>
      <UButton icon="i-heroicons-plus" color="primary" @click="openCreateModal">
        Nuevo Producto
      </UButton>
    </div>

    <UCard>
      <UTable :rows="products" :loading="pending">
        <template #photos-data="{ row }">
          <div class="flex gap-1">
            <img v-if="row.photos?.length" :src="row.photos[0]" class="w-10 h-10 object-cover rounded border" />
            <span v-else class="text-gray-400 text-xs italic">Sin foto</span>
          </div>
        </template>

        <template #categories-data="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="cat in row.categories" :key="cat.id" size="xs" variant="soft">
              {{ cat.name }}
            </UBadge>
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
          <h3 class="text-lg font-semibold">{{ isEditing ? 'Editar' : 'Nou' }} Producto</h3>
        </template>

        <form @submit.prevent="saveProduct" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Codi" required>
              <UInput v-model="form.code" required />
            </UFormGroup>
            <UFormGroup label="Nom" required>
              <UInput v-model="form.name" required />
            </UFormGroup>
          </div>

          <UFormGroup label="Descripció">
            <UTextarea v-model="form.description" />
          </UFormGroup>

          <UFormGroup label="Categories (Selecció múltiple)" required>
            <USelectMenu 
              v-model="form.category_ids" 
              :options="allCategories" 
              multiple
              value-attribute="id" 
              option-attribute="name"
              placeholder="Selecciona una o diverses..."
            />
          </UFormGroup>

          <UFormGroup label="URL de la Foto (Exemple)">
            <UInput v-model="tempPhoto" placeholder="https://..." icon="i-heroicons-link" />
          </UFormGroup>

          <div class="flex justify-end gap-3 mt-6">
            <UButton color="gray" variant="ghost" @click="isModalOpen = false">Cancel·lar</UButton>
            <UButton type="submit" color="primary" :loading="saving">Guardar Producte</UButton>
          </div>
        </form>
      </UCard>
    </UModal>

    <UModal v-model="isDeleteModalOpen">
      <UCard>
        <template #header><h3 class="text-red-600 font-bold">Eliminar Producte</h3></template>
        <p class="py-4 text-gray-600 text-center">Segur que vols borrar aquest producto? Es perdrán les seves tarifes i registres.</p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="isDeleteModalOpen = false">No, cancel·lar</UButton>
            <UButton color="red" @click="executeDelete">Si, borrar</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </UContainer>
</template>

<script setup>
definePageMeta({ middleware: 'auth', layout: 'default' })
const supabase = useSupabaseClient()

const isModalOpen = ref(false)
const isEditing = ref(false)
const isDeleteModalOpen = ref(false)
const saving = ref(false)
const idToDelete = ref(null)
const tempPhoto = ref('')

const form = ref({ id: null, code: '', name: '', description: '', photos: [], category_ids: [] })

// 1. CARGAR PRODUCTOS CON SUS CATEGORÍAS (Usando el esquema N:M que creamos)
const { data: products, pending, refresh } = await useAsyncData('products', async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, code, name, description, photos,
      categories:product_categories(category:categories(id, name))
    `)
    .order('id', { ascending: true })

  if (error) throw error
  
  // Limpiamos el formato de las categorías para la tabla
  return data.map(p => ({
    ...p,
    categories: p.categories.map(c => c.category)
  }))
})

// 2. CARGAR TODAS LAS CATEGORÍAS PARA EL DESPLEGABLE
const { data: allCategories } = await useAsyncData('allCategories', async () => {
  const { data } = await supabase.from('categories').select('id, name')
  return data
})

const openCreateModal = () => {
  form.value = { id: null, code: '', name: '', description: '', photos: [], category_ids: [] }
  tempPhoto.value = ''
  isEditing.value = false
  isModalOpen.value = true
}

const openEditModal = (row) => {
  form.value = { 
    ...row, 
    category_ids: row.categories.map(c => c.id) 
  }
  tempPhoto.value = row.photos?.[0] || ''
  isEditing.value = true
  isModalOpen.value = true
}

const saveProduct = async () => {
  saving.value = true
  try {
    const productPayload = {
      code: form.value.code,
      name: form.value.name,
      description: form.value.description,
      photos: tempPhoto.value ? [tempPhoto.value] : []
    }

    let productId = form.value.id

    if (isEditing.value) {
      await supabase.from('products').update(productPayload).eq('id', productId)
      // Limpiamos categorías antiguas para re-insertar
      await supabase.from('product_categories').delete().eq('product_id', productId)
    } else {
      const { data } = await supabase.from('products').insert(productPayload).select().single()
      productId = data.id
    }

    // Insertar nuevas relaciones N:M
    const relations = form.value.category_ids.map(catId => ({
      product_id: productId,
      category_id: catId
    }))
    
    if (relations.length > 0) {
      await supabase.from('product_categories').insert(relations)
    }

    await refresh()
    isModalOpen.value = false
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const confirmDelete = (id) => { idToDelete.value = id; isDeleteModalOpen.value = true }
const executeDelete = async () => {
  await supabase.from('products').delete().eq('id', idToDelete.value)
  await refresh()
  isDeleteModalOpen.value = false
}
</script>