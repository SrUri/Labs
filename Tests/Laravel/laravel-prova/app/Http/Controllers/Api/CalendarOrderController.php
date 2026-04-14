<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarOrder;
use Illuminate\Http\Request;

class CalendarOrderController extends Controller
{
    public function index()
    {
        // Traemos los pedidos ordenados por fecha e incluimos los datos del producto
        $orders = CalendarOrder::with('product')->orderBy('order_date', 'desc')->get();
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'order_date' => 'required|date',
            'product_id' => 'required|exists:products,id',
            'units' => 'required|integer|min:1',
            'total_cost' => 'required|numeric|min:0'
        ]);

        $order = CalendarOrder::create($validated);
        return response()->json($order->load('product'), 201);
    }

    public function update(Request $request, string $id)
    {
        // 1. Buscamos la comanda que queremos editar
        $order = CalendarOrder::findOrFail($id);

        // 2. Validamos que los datos que llegan de React sean correctos
        $validated = $request->validate([
            'order_date' => 'required|date',
            'product_id' => 'required|exists:products,id',
            'units' => 'required|integer|min:1',
            'total_cost' => 'required|numeric|min:0'
        ]);

        // 3. Actualizamos la comanda en la base de datos
        $order->update($validated);

        // 4. Devolvemos la comanda actualizada (incluyendo el nombre del producto para que React no falle)
        return response()->json($order->load('product'));
    }

    public function destroy(string $id)
    {
        $order = CalendarOrder::findOrFail($id);
        $order->delete();
        return response()->json(['message' => 'Pedido eliminado']);
    }
}