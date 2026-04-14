<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CalendarOrderController;

// Ruta Pública (Cualquiera puede intentar hacer login)
Route::post('/login', [AuthController::class, 'login']);

// Rutas Protegidas (Requieren el Token del Guard Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/dashboard-stats', function () {
        return response()->json([
            'categories' => \App\Models\Category::count(),
            'products' => \App\Models\Product::count(),
            'orders' => \App\Models\CalendarOrder::count(),
            'recent_orders' => \App\Models\CalendarOrder::with('product')
                                ->orderBy('created_at', 'desc')
                                ->take(5)
                                ->get()
        ]);
    });

    Route::get('/products/export/excel', [ProductController::class, 'exportExcel']);
    Route::get('/products/{id}/export/pdf', [ProductController::class, 'exportPdf']);
    
    // Tus CRUDs ahora están blindados
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('orders', CalendarOrderController::class);

});