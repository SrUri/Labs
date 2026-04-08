<template>
  <UContainer class="max-w-6xl">
    <div class="mb-8">
      <h2 class="text-3xl font-bold text-gray-800">Dashboard</h2>
      <p class="text-gray-500 mt-1">Benvingut al panell d'admin.</p>
    </div>

    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-32 w-full" />
      <div class="grid grid-cols-3 gap-4">
        <USkeleton class="h-64 w-full" />
        <USkeleton class="h-64 w-full" />
        <USkeleton class="h-64 w-full" />
      </div>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <UCard 
          @click="$router.push('/categories')" 
          class="cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-blue-300"
        >
          <div class="flex items-center gap-4">
            <div class="p-4 bg-blue-100 text-blue-600 rounded-xl">
              <UIcon name="i-heroicons-folder" class="w-8 h-8" />
            </div>
            <div>
              <p class="text-gray-500 text-sm font-medium">Total Categories</p>
              <h3 class="text-3xl font-bold text-gray-800">{{ stats.categoriesCount }}</h3>
            </div>
          </div>
        </UCard>

        <UCard 
          @click="$router.push('/products')"
          class="cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-green-300"
        >
          <div class="flex items-center gap-4">
            <div class="p-4 bg-green-100 text-green-600 rounded-xl">
              <UIcon name="i-heroicons-shopping-bag" class="w-8 h-8" />
            </div>
            <div>
              <p class="text-gray-500 text-sm font-medium">Total Productes</p>
              <h3 class="text-3xl font-bold text-gray-800">{{ stats.productsCount }}</h3>
            </div>
          </div>
        </UCard>

        <UCard 
          @click="$router.push('/calendar')"
          class="cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-purple-300"
        >
          <div class="flex items-center gap-4">
            <div class="p-4 bg-purple-100 text-purple-600 rounded-xl">
              <UIcon name="i-heroicons-calendar" class="w-8 h-8" />
            </div>
            <div>
              <p class="text-gray-500 text-sm font-medium">Cites Registrades</p>
              <h3 class="text-3xl font-bold text-gray-800">{{ stats.ordersCount }}</h3>
            </div>
          </div>
        </UCard>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                <UIcon name="i-heroicons-folder-open" class="text-blue-500" />
                Últimes Categories
              </h3>
              <UButton to="/categories" color="gray" variant="ghost" size="xs">Veure totes</UButton>
            </div>
          </template>
          
          <div class="space-y-3">
            <div v-if="stats.recentCategories.length === 0" class="text-sm text-gray-500 italic">No hi ha categories.</div>
            <div v-for="category in stats.recentCategories" :key="category.id" class="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
              <div>
                <p class="font-medium text-gray-800">{{ category.name }}</p>
                <p class="text-xs text-gray-500">{{ category.code }}</p>
              </div>
              <UBadge color="gray" variant="soft">ID: {{ category.id }}</UBadge>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                <UIcon name="i-heroicons-sparkles" class="text-yellow-500" />
                Últims Productes
              </h3>
              <UButton to="/products" color="gray" variant="ghost" size="xs">Veure tots</UButton>
            </div>
          </template>
          
          <div class="space-y-3">
            <div v-if="stats.recentProducts.length === 0" class="text-sm text-gray-500 italic">No hi ha productes.</div>
            <div v-for="product in stats.recentProducts" :key="product.id" class="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
              <div>
                <p class="font-medium text-gray-800">{{ product.name }}</p>
                <p class="text-xs text-gray-500">{{ product.code }}</p>
              </div>
              <UBadge color="gray" variant="soft">ID: {{ product.id }}</UBadge>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-semibold text-gray-800 flex items-center gap-2">
                <UIcon name="i-heroicons-clock" class="text-purple-500" />
                Pròximes Compres
              </h3>
              <UButton to="/calendar" color="gray" variant="ghost" size="xs">Anar al calendari</UButton>
            </div>
          </template>

          <div class="space-y-3">
            <div v-if="stats.upcomingOrders.length === 0" class="text-sm text-gray-500 italic">No hi ha cites pròximes.</div>
            <div v-for="order in stats.upcomingOrders" :key="order.id" class="flex justify-between items-center p-3 bg-purple-50/50 rounded-lg border border-purple-100">
              <div>
                <p class="font-medium text-purple-900">{{ order.product?.name }}</p>
                <p class="text-xs text-purple-600 font-semibold">{{ order.order_date }}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-gray-800">{{ order.total_cost }} €</p>
                <p class="text-xs text-gray-500">{{ order.units }} unitats</p>
              </div>
            </div>
          </div>
        </UCard>

      </div>
    </div>
  </UContainer>
</template>

<script setup>
definePageMeta({ middleware: 'auth', layout: 'default' })
const supabase = useSupabaseClient()

const { data: stats, pending } = await useAsyncData('dashboardStats', async () => {
  const today = new Date().toISOString().split('T')[0]

  // Promise.all per fer les 6 consultes al mateix temps en comptes de await
  const [cats, prods, orders, recentCats, recentProds, upcomingOrders] = await Promise.all([
    // Mostrem nombre categories
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    // Mostrem nombre productes
    supabase.from('products').select('*', { count: 'exact', head: true }),
    // Mostrem nombre cites
    supabase.from('calendar_orders').select('*', { count: 'exact', head: true }),
    // 5 últimes categories -> Va a la variable recentCats
    supabase.from('categories').select('id, name, code').order('id', { ascending: false }).limit(5),
    // 5 últims productes -> Va a la variable recentProds
    supabase.from('products').select('id, name, code').order('id', { ascending: false }).limit(5),
    // 5 ordres més properes -> Va a la variable upcomingOrders
    supabase.from('calendar_orders').select('id, order_date, units, total_cost, product:products(name)').gte('order_date', today).order('order_date', { ascending: true }).limit(5)
  ])
  
  // Passem valors
  return {
    categoriesCount: cats.count || 0,
    productsCount: prods.count || 0,
    ordersCount: orders.count || 0,
    recentProducts: recentProds.data || [],
    upcomingOrders: upcomingOrders.data || [],
    recentCategories: recentCats.data || []
  }
})
</script>