<template>
  <UContainer class="max-w-6xl">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-semibold">Calendari de Compres</h2>
      <UButton icon="i-heroicons-plus" color="primary" @click="openCreateModal">
        Nova Cita de Compra
      </UButton>
    </div>

    <UCard>
      <div class="flex justify-between items-center mb-4">
        <UButton icon="i-heroicons-chevron-left" color="gray" variant="ghost" @click="prevMonth" />
        <h3 class="text-xl font-bold text-gray-800 capitalize">{{ currentMonthName }} {{ currentYear }}</h3>
        <UButton icon="i-heroicons-chevron-right" color="gray" variant="ghost" @click="nextMonth" />
      </div>

      <div class="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        <div v-for="day in ['Dll', 'Dmt', 'Dmc', 'Dij', 'Div', 'Dss', 'Dmg']" :key="day" class="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-600">
          {{ day }}
        </div>

        <div 
          v-for="(day, index) in calendarDays" 
          :key="index" 
          class="bg-white min-h-[120px] p-2 transition-colors hover:bg-gray-50"
          :class="{ 'opacity-50 bg-gray-50': day.empty, 'border-t border-gray-100': true }"
        >
          <div v-if="!day.empty" class="h-full flex flex-col">
            <span class="text-sm font-medium text-gray-500 mb-1" :class="{'text-primary-600 font-bold': isToday(day.date)}">
              {{ day.dayNumber }}
            </span>
            
            <div class="flex-1 space-y-1 overflow-y-auto">
              <div 
                v-for="order in getOrdersForDay(day.date)" 
                :key="order.id"
                @click="openEditModal(order)"
                class="text-xs p-1.5 rounded bg-primary-50 text-primary-700 border border-primary-100 cursor-pointer hover:bg-primary-100 truncate"
                :title="`${order.product?.name} x${order.units} - ${order.total_cost}€`"
              >
                <strong>x{{ order.units }}</strong> {{ order.product?.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <UModal v-model="isModalOpen">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ isEditing ? 'Detalls de la Cita' : 'Nova Cita de Compra' }}</h3>
        </template>

        <UForm :schema="schema" :state="form" @submit="saveOrder" class="space-y-4">
          
          <UFormGroup label="Data de la compra" name="order_date" required>
            <UInput v-model="form.order_date" type="date" />
          </UFormGroup>

          <UFormGroup label="Producte a comprar" name="product_id" required>
            <USelectMenu 
              v-model="form.product_id" 
              :options="products" 
              value-attribute="id" 
              option-attribute="name"
              placeholder="Selecciona un producte..."
            />
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Unitats" name="units" required>
              <UInput v-model="form.units" type="number" min="1" />
            </UFormGroup>

            <UFormGroup label="Cost Total (€)">
              <div class="flex items-center gap-2 h-[32px]">
                <span v-if="calculatingCost" class="text-gray-400 italic text-sm">Calculant tarifa...</span>
                <span v-else-if="noRateFound" class="text-red-500 font-bold text-sm">No hi ha tarifa per aquesta data</span>
                <span v-else class="text-xl font-bold text-green-600">{{ form.total_cost }} €</span>
              </div>
            </UFormGroup>
          </div>

          <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
            <div>
              <UButton v-if="isEditing" color="red" variant="ghost" icon="i-heroicons-trash" @click="confirmDelete(form.id)">
                Esborrar Cita
              </UButton>
            </div>
            <div class="flex gap-3">
              <UButton color="gray" variant="ghost" @click="isModalOpen = false">Cancel·lar</UButton>
              <UButton type="submit" color="primary" :disabled="noRateFound">Guardar Cita</UButton>
            </div>
          </div>
        </UForm>
      </UCard>
    </UModal>

    <UModal v-model="isDeleteModalOpen">
      <UCard>
        <template #header><h3 class="text-red-600 font-bold">Esborrar Cita</h3></template>
        <p class="py-4 text-gray-600 text-center">Segur que vols esborrar aquesta cita de compra? Aquesta acció no es pot desfer.</p>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="gray" variant="ghost" @click="isDeleteModalOpen = false">No, cancel·lar</UButton>
            <UButton color="red" @click="executeDelete">Sí, esborrar</UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </UContainer>
</template>

<script setup>
// Importem zod per validació de fluxos de dades
import { z } from 'zod'

definePageMeta({ middleware: 'auth', layout: 'default' })
const supabase = useSupabaseClient()

// Estats calendari:
const currentDate = ref(new Date())
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonthName = computed(() => {
  return currentDate.value.toLocaleString('ca-ES', { month: 'long' })
})

// Estats formulari calendari:
const isModalOpen = ref(false)
const isEditing = ref(false)
const isDeleteModalOpen = ref(false)
const orderIdToDelete = ref(null)
const calculatingCost = ref(false)
const noRateFound = ref(false)

const form = ref({
  id: null,
  order_date: '',
  product_id: null,
  units: 1,
  total_cost: 0
})

// Normes de validació zod
const schema = z.object({
  order_date: z.string().min(1, 'La data és obligatòria'),
  product_id: z.number({ invalid_type_error: 'Selecciona un producte', required_error: 'Selecciona un producte' }).positive('Selecciona un producte'),
  units: z.coerce.number().int('Ha de ser un número sencer').min(1, 'Has de comprar almenys 1 unitat')
})

// Carreguem dades
const { data: products } = await useAsyncData('productsForCalendar', async () => {
  const { data } = await supabase.from('products').select('id, name, rates:product_rates(price, date_from, date_to)')
  return data
})

// Carreguem comandes
const { data: orders, refresh } = await useAsyncData('calendarOrders', async () => {
  const { data } = await supabase.from('calendar_orders').select('*, product:products(name)')
  return data || []
})

// Graella del calendari
const prevMonth = () => { currentDate.value = new Date(currentYear.value, currentDate.value.getMonth() - 1, 1) }
const nextMonth = () => { currentDate.value = new Date(currentYear.value, currentDate.value.getMonth() + 1, 1) }

// Comprovem si correspon a avui per pintar
const isToday = (dateStr) => {
  const today = new Date()
  return dateStr === today.toISOString().split('T')[0]
}

// Tornem comandes segons dia
const getOrdersForDay = (dateStr) => {
  return orders.value?.filter(o => o.order_date === dateStr) || []
}

// Dies del calendari
const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentDate.value.getMonth()
  const days = []
  
  // Mirem en quin dia cau el dia 1 del mes
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  let emptyDays = firstDayOfMonth - 1
  if (emptyDays === -1) emptyDays = 6 
  
  // Inserim caselles buides
  for (let i = 0; i < emptyDays; i++) {
    days.push({ empty: true })
  }
  
  // Inserim els dies reals del mes
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    days.push({ empty: false, date: dateStr, dayNumber: i })
  }
  
  return days
})

// Càlcul de les tarifes, amb watch observem l'usuari cada cop que toca producte o cantitat
watch([() => form.value.product_id, () => form.value.order_date, () => form.value.units], () => {
  calculatingCost.value = true
  noRateFound.value = false
  
  setTimeout(() => { 
    if (form.value.product_id && form.value.order_date && form.value.units > 0) {
      const selectedProduct = products.value?.find(p => p.id === form.value.product_id)
      if (selectedProduct && selectedProduct.rates) {
        // Busquem tarifa del producte
        const orderDateObj = new Date(form.value.order_date)
        const applicableRate = selectedProduct.rates.find(rate => {
          const from = new Date(rate.date_from)
          const to = new Date(rate.date_to)
          return orderDateObj >= from && orderDateObj <= to
        })

        if (applicableRate) {
          // Si trobem tarifa, calculem
          form.value.total_cost = (applicableRate.price * form.value.units).toFixed(2)
        } else {
          form.value.total_cost = 0
          noRateFound.value = true
        }
      }
    }
    calculatingCost.value = false
  }, 300)
}, { deep: true }) // Per observar canvis del producte

// Netejem/creem formulari
const openCreateModal = () => {
  form.value = { id: null, order_date: new Date().toISOString().split('T')[0], product_id: null, units: 1, total_cost: 0 }
  isEditing.value = false
  isModalOpen.value = true
}

// Editem formulari calendari
const openEditModal = (order) => {
  form.value = { ...order }
  isEditing.value = true
  isModalOpen.value = true
}

// Guardem formulari calendari
const saveOrder = async () => {
  if (noRateFound.value) return 

  const payload = {
    order_date: form.value.order_date,
    product_id: form.value.product_id,
    units: form.value.units,
    total_cost: form.value.total_cost
  }

  if (isEditing.value) {
    await supabase.from('calendar_orders').update(payload).eq('id', form.value.id)
  } else {
    await supabase.from('calendar_orders').insert(payload)
  }
  
  await refresh()
  isModalOpen.value = false
}

// Confirmem delete
const confirmDelete = (id) => {
  orderIdToDelete.value = id
  isDeleteModalOpen.value = true
}

// Executem delete
const executeDelete = async () => {
  await supabase.from('calendar_orders').delete().eq('id', orderIdToDelete.value)
  await refresh()
  isDeleteModalOpen.value = false
  isModalOpen.value = false
  orderIdToDelete.value = null
}
</script>