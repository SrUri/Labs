<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    // Mostrar totes les categories
    public function index()
    {
        $categories = Category::with('parent')->orderBy('id', 'asc')->get();
        return response()->json($categories);
    }

    // Guardar una nova categoria
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:categories',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id'
        ]);

        $category = Category::create($validated);
        return response()->json($category, 201);
    }

    // Actualizar categoria existent
    public function update(Request $request, string $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:categories,code,'.$id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id'
        ]);

        $category->update($validated);
        return response()->json($category->load('parent'));
    }

    // Borrar una categoria
    public function destroy(string $id)
    {
        $category = Category::findOrFail($id);
        $category->delete();
        
        return response()->json(['message' => 'Categoría eliminada correctamente']);
    }
}