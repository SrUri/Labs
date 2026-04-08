<template>
  <UContainer>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold">Manteniment de Productes</h2>
      
      <div class="flex gap-3">
        <UButton icon="i-heroicons-document-arrow-down" color="gray" variant="solid" @click="exportXLS">
          Exportar XLS
        </UButton>
        <UButton icon="i-heroicons-plus" color="primary" @click="openCreateModal">
          Nou Producte
        </UButton>
      </div>
    </div>

    <UCard>
      <UTable :rows="products" :loading="pending">
        <template #photos-data="{ row }">
          <div class="flex gap-1">
            <img v-if="row.photos?.length" :src="row.photos[0]" class="w-10 h-10 object-cover rounded border" />
            <span v-else class="text-gray-400 text-xs italic">Sense foto</span>
          </div>
        </template>

        <template #categories-data="{ row }">
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="cat in row.categories" :key="cat.id" size="xs" variant="soft">
              {{ cat.name }}
            </UBadge>
          </div>
        </template>

        <template #rates-data="{ row }">
          <span class="text-sm text-gray-600">
            {{ row.rates?.length || 0 }} tarifa/es
          </span>
        </template>

        <template #actions-data="{ row }">
          <div class="flex gap-2">
            <UButton color="blue" variant="ghost" icon="i-heroicons-document-text" title="Descarregar PDF" @click="exportPDF(row)" />
            <UButton color="gray" variant="ghost" icon="i-heroicons-pencil-square" title="Editar" @click="openEditModal(row)" />
            <UButton color="red" variant="ghost" icon="i-heroicons-trash" title="Esborrar" @click="confirmDelete(row.id)" />
          </div>
        </template>
      </UTable>
    </UCard>

    <UModal v-model="isModalOpen" :ui="{ width: 'sm:max-w-2xl' }">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ isEditing ? 'Editar' : 'Nou' }} Producte</h3>
        </template>
        
        <UForm :schema="schema" :state="form" @submit="saveProduct" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Codi" name="code" required>
              <UInput v-model="form.code" placeholder="Ex: PROD-001" />
            </UFormGroup>
            <UFormGroup label="Nom" name="name" required>
              <UInput v-model="form.name" placeholder="Nom del producte" />
            </UFormGroup>
          </div>
          
          <UFormGroup label="Descripció" name="description">
            <UTextarea v-model="form.description" />
          </UFormGroup>
          
          <UFormGroup label="Categories (Selecció múltiple)" name="category_ids" required>
            <USelectMenu v-model="form.category_ids" :options="allCategories" multiple value-attribute="id" option-attribute="name" placeholder="Selecciona una o diverses..." />
          </UFormGroup>
          
          <UFormGroup label="URL de la Foto (Exemple)" name="photos">
            <UInput v-model="tempPhoto" placeholder="https://..." icon="i-heroicons-link" />
          </UFormGroup>
          
          <UDivider class="my-4" />
          
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <h4 class="font-medium text-gray-700">Tarifes per Data</h4>
              <UButton size="xs" color="gray" icon="i-heroicons-plus" @click="addRate">Afegir Tarifa</UButton>
            </div>
            
            <div v-if="form.rates.length === 0" class="text-sm text-gray-500 italic">Aquest producte encara no té tarifes.</div>
            
            <div v-for="(rate, index) in form.rates" :key="index" class="flex gap-2 items-start bg-gray-50 p-2 rounded border border-gray-100">
              <UFormGroup label="Preu (€)" :name="`rates.${index}.price`" required class="w-1/4">
                <UInput v-model="rate.price" type="number" step="0.01" />
              </UFormGroup>
              <UFormGroup label="Des de" :name="`rates.${index}.date_from`" required class="w-1/3">
                <UInput v-model="rate.date_from" type="date" />
              </UFormGroup>
              <UFormGroup label="Fins a" :name="`rates.${index}.date_to`" required class="w-1/3">
                <UInput v-model="rate.date_to" type="date" />
              </UFormGroup>
              <UButton color="red" variant="ghost" icon="i-heroicons-trash" @click="removeRate(index)" class="mt-6" />
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <UButton color="gray" variant="ghost" @click="isModalOpen = false">Cancel·lar</UButton>
            <UButton type="submit" color="primary" :loading="saving">Guardar Producte</UButton>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <UModal v-model="isDeleteModalOpen">
      <UCard>
        <template #header><h3 class="text-red-600 font-bold">Eliminar Producte</h3></template>
        <p class="py-4 text-gray-600 text-center">Segur que vols borrar aquest producte? Es perdran les seves tarifes i registres.</p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="isDeleteModalOpen = false">No, cancel·lar</UButton>
            <UButton color="red" :loading="saving" @click="executeDelete">Sí, borrar</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </UContainer>
</template>

<script setup>
import { z } from 'zod'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

definePageMeta({ middleware: 'auth', layout: 'default' })
const supabase = useSupabaseClient()

const isModalOpen = ref(false)
const isEditing = ref(false)
const isDeleteModalOpen = ref(false)
const saving = ref(false)
const idToDelete = ref(null)
const tempPhoto = ref('')

const form = ref({ id: null, code: '', name: '', description: '', photos: [], category_ids: [], rates: [] })

// === REGLAS DE VALIDACIÓN ZOD ===
const schema = z.object({
  code: z.string().min(3, 'Mínim 3 caràcters').max(20, 'Màxim 20 caràcters'),
  name: z.string().min(2, 'Nom obligatori').max(100, 'Nom massa llarg'),
  description: z.string().max(500, 'Descripció massa llarga').optional().nullable(),
  category_ids: z.array(z.number()).min(1, 'Selecciona almenys una categoria'),
  // Validación de las tarifas
  rates: z.array(z.object({
    price: z.coerce.number({ invalid_type_error: 'Preu invàlid' }).positive('Ha de ser major que 0'),
    date_from: z.string().min(1, 'Data inicial obligatòria'),
    date_to: z.string().min(1, 'Data final obligatòria')
  })).optional()
})

const { data: products, pending, refresh } = await useAsyncData('products', async () => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, code, name, description, photos,
      categories:product_categories(category:categories(id, name)),
      rates:product_rates(id, price, date_from, date_to)
    `)
    .order('id', { ascending: true })

  if (error) throw error
  
  return data.map(p => ({
    ...p,
    categories: p.categories.map(c => c.category),
    actions: '' 
  }))
})

const { data: allCategories } = await useAsyncData('allCategories', async () => {
  const { data } = await supabase.from('categories').select('id, name')
  return data
})

const exportXLS = () => {
  const dataForExcel = products.value.map(p => ({
    'Codi': p.code,
    'Nom': p.name,
    'Descripció': p.description || '',
    'Categories': p.categories.map(c => c.name).join(', '),
    'Tarifes Actives': p.rates?.length || 0
  }))
  const worksheet = XLSX.utils.json_to_sheet(dataForExcel)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productes")
  XLSX.writeFile(workbook, "Llistat_Productes.xlsx")
}

const exportPDF = (product) => {
  const doc = new jsPDF()
  doc.setFontSize(22)
  doc.text("Fitxa de Producte", 20, 20)
  doc.setFontSize(12)
  doc.text(`Nom: ${product.name}`, 20, 35)
  doc.text(`Codi: ${product.code}`, 20, 45)
  const splitDesc = doc.splitTextToSize(`Descripció: ${product.description || 'Sense descripció'}`, 170)
  doc.text(splitDesc, 20, 55)
  const catNames = product.categories.map(c => c.name).join(', ') || 'Cap categoria assignada'
  doc.text(`Categories: ${catNames}`, 20, 75)
  doc.setFontSize(14)
  doc.text("Tarifes aplicades:", 20, 95)
  doc.setFontSize(12)
  let yPosition = 105
  if (product.rates && product.rates.length > 0) {
    product.rates.forEach(rate => {
      doc.text(`- ${rate.price} EUR (Des de: ${rate.date_from} Fins a: ${rate.date_to})`, 25, yPosition)
      yPosition += 10
    })
  } else {
    doc.text("- No hi ha tarifes configurades per a aquest producte.", 25, yPosition)
  }
  doc.save(`Producte_${product.code}.pdf`)
}

const addRate = () => form.value.rates.push({ price: undefined, date_from: '', date_to: '' })
const removeRate = (index) => form.value.rates.splice(index, 1)

const openCreateModal = () => {
  form.value = { id: null, code: '', name: '', description: '', photos: [], category_ids: [], rates: [] }
  tempPhoto.value = ''
  isEditing.value = false
  isModalOpen.value = true
}

const openEditModal = (row) => {
  form.value = { 
    ...row, 
    category_ids: row.categories.map(c => c.id),
    rates: row.rates ? [...row.rates] : [] 
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
      await supabase.from('product_categories').delete().eq('product_id', productId)
      await supabase.from('product_rates').delete().eq('product_id', productId)
    } else {
      const { data } = await supabase.from('products').insert(productPayload).select().single()
      productId = data.id
    }
    if (form.value.category_ids.length > 0) {
      const relations = form.value.category_ids.map(catId => ({ product_id: productId, category_id: catId }))
      await supabase.from('product_categories').insert(relations)
    }
    if (form.value.rates.length > 0) {
      const ratesPayload = form.value.rates.map(rate => ({
        product_id: productId, price: rate.price, date_from: rate.date_from, date_to: rate.date_to
      }))
      await supabase.from('product_rates').insert(ratesPayload)
    }
    await refresh()
    isModalOpen.value = false
  } catch (e) {
    console.error(e)
    alert("Error al guardar el producte")
  } finally {
    saving.value = false
  }
}

const confirmDelete = (id) => { idToDelete.value = id; isDeleteModalOpen.value = true }

const executeDelete = async () => {
  saving.value = true
  try {
    await supabase.from('product_categories').delete().eq('product_id', idToDelete.value)
    await supabase.from('product_rates').delete().eq('product_id', idToDelete.value)
    await supabase.from('calendar_orders').delete().eq('product_id', idToDelete.value)
    await supabase.from('products').delete().eq('id', idToDelete.value)
    await refresh()
    isDeleteModalOpen.value = false
  } catch (e) {
    console.error("Error al borrar:", e)
    alert("No s'ha pogut esborrar el producte.")
  } finally {
    saving.value = false
    idToDelete.value = null
  }
}
</script>