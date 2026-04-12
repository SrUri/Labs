<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    // Los campos que permitimos guardar masivamente
    protected $fillable = ['code', 'name', 'description', 'parent_id'];

    // LA RELACIÓN QUE FALTA: Una categoría pertenece a un padre
    public function parent()
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    // Una categoría puede tener muchas subcategorías (hijas)
    public function children()
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    // Relación con Productos
    public function products()
    {
        return $this->belongsToMany(Product::class);
    }
}