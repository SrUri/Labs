<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    // Listar productos con sus categorías y tarifas asociadas
    public function index()
    {
        $products = Product::with(['categories', 'rates'])->orderBy('id', 'asc')->get();
        return response()->json($products);
    }

    // Crear un nuevo producto
    public function store(Request $request)
    {
        // Validación de datos
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:products',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'photos' => 'nullable|array',
            'categories' => 'nullable|array', // IDs de las categorías seleccionadas
            'categories.*' => 'exists:categories,id',
            'rates' => 'nullable|array', // Array de objetos de tarifas
        ]);

        // Usamos una transacción para asegurar que todo se guarda o no se guarda nada
        DB::beginTransaction();
        try {
            // Creamos el producto base
            $product = Product::create([
                'code' => $validated['code'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'photos' => $validated['photos'] ?? null,
            ]);

            // Sincronizamos las categorías en la tabla intermedia
            if (!empty($validated['categories'])) {
                $product->categories()->sync($validated['categories']);
            }

            // Creamos las tarifas asociadas
            if (!empty($validated['rates'])) {
                foreach ($validated['rates'] as $rate) {
                    $product->rates()->create([
                        'price' => $rate['price'],
                        'date_from' => $rate['date_from'],
                        'date_to' => $rate['date_to'],
                    ]);
                }
            }

            DB::commit(); // Confirmamos los cambios
            
            // Devolvemos el producto recién creado con sus relaciones
            $product->load(['categories', 'rates']);
            return response()->json($product, 201);

        } catch (\Exception $e) {
            DB::rollBack(); // Si hay error, deshacemos todo
            return response()->json(['error' => 'Error al guardar el producto', 'details' => $e->getMessage()], 500);
        }
    }

    // Mostrar un producto específico (Útil para generar el PDF luego)
    public function show(string $id)
    {
        $product = Product::with(['categories', 'rates'])->findOrFail($id);
        return response()->json($product);
    }

    // Actualizar un producto
    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:products,code,'.$id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'photos' => 'nullable|array',
            'categories' => 'nullable|array',
            'categories.*' => 'exists:categories,id',
            'rates' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $product->update([
                'code' => $validated['code'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'photos' => $validated['photos'] ?? null,
            ]);

            // Sincronizar categorías (borra las viejas que no estén en el array y añade las nuevas)
            if (isset($validated['categories'])) {
                $product->categories()->sync($validated['categories']);
            }

            // Actualizar tarifas (la forma más fácil: borrar las viejas y recrear las nuevas)
            if (isset($validated['rates'])) {
                $product->rates()->delete();
                foreach ($validated['rates'] as $rate) {
                    $product->rates()->create([
                        'price' => $rate['price'],
                        'date_from' => $rate['date_from'],
                        'date_to' => $rate['date_to'],
                    ]);
                }
            }

            DB::commit();
            $product->load(['categories', 'rates']);
            return response()->json($product);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar el producto'], 500);
        }
    }

    // Eliminar un producto
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete(); // Gracias al cascadeOnDelete en migraciones, se borran tarifas y relaciones
        return response()->json(['message' => 'Producto eliminado']);
    }
}