<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CalendarOrderController;

// Única ruta oberta al món
Route::post('/login', [AuthController::class, 'login']);

// Rutes protegides (requerim el token de Laravel Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    // Destrucció de la sessió
    Route::post('/logout', [AuthController::class, 'logout']);

    // Ruta especial per a les estadístiques del dashboard
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

    // Rutes específiques per a la descàrrega d'arxius
    Route::get('/products/export/excel', [ProductController::class, 'exportExcel']);
    Route::get('/products/{id}/export/pdf', [ProductController::class, 'exportPdf']);
    
    // Rutes de les CRUD
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('orders', CalendarOrderController::class);

});