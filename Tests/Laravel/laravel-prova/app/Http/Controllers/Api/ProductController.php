<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    // Obtenir tots els productes
    public function index()
    {
        $products = Product::with(['categories', 'rates'])->orderBy('id', 'asc')->get();
        return response()->json($products);
    }

    // Guardar producte
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:products',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'photo' => 'nullable|string',
            'categories' => 'nullable|array',
            'rates' => 'nullable|array',
        ]);

        // Transacció + validació de tarifes
        return $this->saveProductLogic($validated);
    }

    // Actualitzar producte existent
    public function update(Request $request, string $id)
    {
        $product = Product::findOrFail($id);
        
        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:products,code,'.$id,
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'photo' => 'nullable|string',
            'categories' => 'nullable|array',
            'rates' => 'nullable|array',
        ]);

        // Transacció + validació de tarifes
        return $this->saveProductLogic($validated, $product);
    }

    // Generació fitxer Excel
    public function exportExcel()
    {
        $products = Product::with(['categories', 'rates'])->get();
        
        $html = '<meta charset="UTF-8"><table>';
        $html .= '<tr><th>Codi</th><th>Nom</th><th>Descripció</th><th>Categories</th><th>Nº Tarifes</th></tr>';

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
            ->header('Content-Disposition', 'attachment; filename="productes.xls"');
    }

    // Exportació PDF
    public function exportPdf($id)
    {
        $product = Product::with(['categories', 'rates'])->findOrFail($id);
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.product', compact('product'));
        
        return $pdf->download('producte-'.$product->code.'.pdf');
    }

    // Retornar producte concret
    public function show(string $id)
    {
        $product = Product::with(['categories', 'rates'])->findOrFail($id);
        return response()->json($product);
    }

    // Esborrar un producte
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json(['message' => 'Producte eliminat correctament']);
    }

    // Guardem i actualitzem productes
    private function saveProductLogic(array $validated, ?Product $product = null)
    {
        // Validació tarifes
        if (!empty($validated['rates']) && $rateError = $this->validateRatesOverlap($validated['rates'])) {
            return response()->json(['error' => $rateError], 422);
        }

        // Transacció per completar del tot o no completar
        return $this->handleTransaction(function () use ($validated, $product) {
            
            $productData = [
                'code' => $validated['code'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'photos' => $validated['photo'] ?? null,
            ];

            if ($product) {
                $product->update($productData);
                $status = 200;
            } else {
                $product = Product::create($productData);
                $status = 201;
            }

            // Sincronitzem categories
            if (isset($validated['categories'])) {
                $product->categories()->sync($validated['categories']);
            }

            // Guardem les noves tarifes
            if (isset($validated['rates'])) {
                // Esborrem les tarifes velles
                $product->rates()->delete(); 
                foreach ($validated['rates'] as $rate) {
                    $product->rates()->create($rate);
                }
            }

            return response()->json($product->load(['categories', 'rates']), $status);
        });
    }

    // Transacció de tarifes a la BD
    private function handleTransaction(\Closure $callback)
    {
        DB::beginTransaction();
        try {
            $response = $callback(); 
            DB::commit();
            return $response;
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error intern: ' . $e->getMessage()], 500);
        }
    }

    // Funció per validar dates de les tarifes
    private function validateRatesOverlap(array $rates): ?string
    {
        for ($i = 0; $i < count($rates); $i++) {
            if ($rates[$i]['date_from'] > $rates[$i]['date_to']) {
                return 'La data d\'inici no pot ser posterior a la data de fi.';
            }
            for ($j = $i + 1; $j < count($rates); $j++) {
                if ($rates[$i]['date_from'] <= $rates[$j]['date_to'] && $rates[$j]['date_from'] <= $rates[$i]['date_to']) {
                    return 'Hi ha tarifes amb dies repetits o superposats. Els rangs han de ser únics.';
                }
            }
        }
        return null;
    }
}