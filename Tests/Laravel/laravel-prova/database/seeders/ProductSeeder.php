<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Producte poma golden
        $poma = Product::create([
            'code' => 'PROD-POMA',
            'name' => 'Poma Golden Eco 1kg',
            'description' => 'Poma Golden ecològica, dolça i cruixent.',
            'photos' => 'https://calcigarro.cat/318-home_default/poma-golden-eco.jpg',
        ]);
        $poma->categories()->attach(Category::where('code', 'CAT-01-A')->first()->id);

        // Producte tonyina
        $tonyina = Product::create([
            'code' => 'PROD-TONY',
            'name' => 'Llom de Tonyina',
            'description' => 'Llom de tonyina fresca de primera qualitat.',
            'photos' => 'https://calcigarro.cat/318-home_default/poma-golden-eco.jpg',
        ]);
        $tonyina->categories()->attach(Category::where('code', 'CAT-03')->first()->id);
    }
}