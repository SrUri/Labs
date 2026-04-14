<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with(['categories', 'rates'])->orderBy('id', 'asc')->get();
        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:products',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'photo' => 'nullable|string', // AHORA ES UN TEXTO (URL)
            'categories' => 'nullable|array',
            'rates' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $product = Product::create([
                'code' => $validated['code'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'photos' => $validated['photo'] ?? null, // Guardamos la URL
            ]);

            if (isset($validated['categories'])) $product->categories()->sync($validated['categories']);
            if (isset($validated['rates'])) {
                foreach ($validated['rates'] as $rate) $product->rates()->create($rate);
            }

            DB::commit();
            return response()->json($product->load(['categories', 'rates']), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function exportExcel()
    {
        $products = Product::with(['categories', 'rates'])->get();
        
        $html = '<meta charset="UTF-8"><table>';
        $html .= '<tr><th>Código</th><th>Nombre</th><th>Descripción</th><th>Categorías</th><th>Nº Tarifas</th></tr>';

        foreach($products as $p) {
            $cats = $p->categories->pluck('name')->implode(', ');
            $html .= "<tr>
                        <td>{$p->code}</td>
                        <td>{$p->name}</td>
                        <td>{$p->description}</td>
                        <td>{$cats}</td>
                        <td>{$p->rates->count()}</td>
                      </tr>";
        }
        $html .= '</table>';

        return response($html)
            ->header('Content-Type', 'application/vnd.ms-excel')
            ->header('Content-Disposition', 'attachment; filename="productos.xls"');
    }

    public function exportPdf($id)
    {
        $product = Product::with(['categories', 'rates'])->findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.product', compact('product'));
        
        return $pdf->download('producto-'.$product->code.'.pdf');
    }

    public function show(string $id)
    {
        $product = Product::with(['categories', 'rates'])->findOrFail($id);
        return response()->json($product);
    }

    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);
        
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:products,code,'.$id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'photo' => 'nullable|string', // AHORA ES UN TEXTO (URL)
            'categories' => 'nullable|array',
            'rates' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $product->update([
                'code' => $validated['code'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'photos' => $validated['photo'] ?? null, // Actualizamos la URL
            ]);

            if (isset($validated['categories'])) {
                $product->categories()->sync($validated['categories']);
            }

            if (isset($validated['rates'])) {
                $product->rates()->delete();
                foreach ($validated['rates'] as $rate) {
                    $product->rates()->create($rate);
                }
            }

            DB::commit();
            return response()->json($product->load(['categories', 'rates']));
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json(['message' => 'Producto eliminado']);
    }
}