<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalendarOrder extends Model
{
    use HasFactory;

    protected $fillable = ['order_date', 'product_id', 'units', 'total_cost'];

    // Relació N:1 amb producte (una comanda es d'un producte en específic)
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}