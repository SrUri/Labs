<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CalendarOrder;
use Illuminate\Http\Request;

class CalendarOrderController extends Controller
{
    public function index()
    {
        // Agafem comandes per ordre de data
        $orders = CalendarOrder::with('product')->orderBy('order_date', 'desc')->get();
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        // Validem dades
        $validated = $request->validate([
            'order_date' => 'required|date',
            'product_id' => 'required|exists:products,id',
            'units' => 'required|integer|min:1',
            'total_cost' => 'required|numeric|min:0'
        ]);

        // Creem comanda
        $order = CalendarOrder::create($validated);
        return response()->json($order->load('product'), 201);
    }

    public function update(Request $request, string $id)
    {
        // Busquem comanda a editar
        $order = CalendarOrder::findOrFail($id);

        // Validem dades
        $validated = $request->validate([
            'order_date' => 'required|date',
            'product_id' => 'required|exists:products,id',
            'units' => 'required|integer|min:1',
            'total_cost' => 'required|numeric|min:0'
        ]);

        // Actualitzem valor a la BD
        $order->update($validated);
        return response()->json($order->load('product'));
    }

    public function destroy(string $id)
    {
        // Busquem i borrem de la BDD
        $order = CalendarOrder::findOrFail($id);
        $order->delete();
        return response()->json(['message' => 'Comanda eliminada']);
    }
}