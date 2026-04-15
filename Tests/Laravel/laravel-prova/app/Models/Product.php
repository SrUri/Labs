<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'description', 'photos'];

    // Relació N:M amb Categories
    public function categories()
    {
        return $this->belongsToMany(Category::class);
    }

    // Relació 1:N amb tarifes (un producte pot tenir varies tarifes)
    public function rates()
    {
        return $this->hasMany(ProductRate::class);
    }

    // Relació 1:N amb producte (una comanda es d'un producte)
    public function orders()
    {
        return $this->hasMany(CalendarOrder::class);
    }
}