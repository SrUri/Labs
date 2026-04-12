<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\AuthController;

// Ruta Pública (Cualquiera puede intentar hacer login)
Route::post('/login', [AuthController::class, 'login']);

// Rutas Protegidas (Requieren el Token del Guard Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // Tus CRUDs ahora están blindados
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('products', ProductController::class);
    Route::apiResource('orders', CalendarOrderController::class);
});