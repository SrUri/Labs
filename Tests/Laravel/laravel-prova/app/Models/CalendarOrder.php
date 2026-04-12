<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalendarOrder extends Model
{
    use HasFactory;

    protected $fillable = ['order_date', 'product_id', 'units', 'total_cost'];

    // Relación N:1 con Producto (Una comanda pertenece a un producto)
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}