<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'description', 'photos'];

    // Relación N:M con Categorías
    public function categories()
    {
        return $this->belongsToMany(Category::class);
    }

    // Relación 1:N con Tarifas
    public function rates()
    {
        return $this->hasMany(ProductRate::class);
    }

    // Relación 1:N con Pedidos (Comandas)
    public function orders()
    {
        return $this->hasMany(CalendarOrder::class);
    }
}