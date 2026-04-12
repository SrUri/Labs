<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductRate extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'price', 'date_from', 'date_to'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}