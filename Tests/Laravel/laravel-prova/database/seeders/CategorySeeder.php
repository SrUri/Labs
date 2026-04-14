<?php
namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $fruta = Category::create(['code' => 'CAT-01', 'name' => 'FRUTAS', 'description' => 'Categoría principal de frutas']);
        Category::create(['code' => 'CAT-01-A', 'name' => 'MANZANA', 'parent_id' => $fruta->id, 'description' => 'Subcategoría de manzanas']);
        
        $carne = Category::create(['code' => 'CAT-02', 'name' => 'CARNES', 'description' => 'Categoría principal de carnes']);
        Category::create(['code' => 'CAT-02-A', 'name' => 'ROJA', 'parent_id' => $carne->id, 'description' => 'Subcategoría de carnes rojas']);

        Category::create(['code' => 'CAT-03', 'name' => 'PEIX', 'description' => 'Peix fresc de la llotja']);
    }
}