<?php
namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $fruta = Category::create(['code' => 'CAT-01', 'name' => 'FRUITES', 'description' => 'Categoria principal de fruites']);
        Category::create(['code' => 'CAT-01-A', 'name' => 'POMES', 'parent_id' => $fruta->id, 'description' => 'Subcategoria de pomes']);
        
        $carne = Category::create(['code' => 'CAT-02', 'name' => 'CARNS', 'description' => 'Categoria principal de carns']);
        Category::create(['code' => 'CAT-02-A', 'name' => 'VERMELLA', 'parent_id' => $carne->id, 'description' => 'Subcategoria de carns']);

        Category::create(['code' => 'CAT-03', 'name' => 'PEIX', 'description' => 'Peix fresc, categoria pare']);
    }
}