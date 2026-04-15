<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'description', 'parent_id'];

    // Una categoria pot tenir un pare
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    // Una categoria pare pot tenir subcategories
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    // Relació N:M amb Productes
    public function products()
    {
        return $this->belongsToMany(Product::class);
    }
}