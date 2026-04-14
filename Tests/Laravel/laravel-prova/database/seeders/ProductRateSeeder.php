<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductRateSeeder extends Seeder
{
    public function run(): void
    {
        // Busquem productes creats
        $poma = Product::where('code', 'PROD-POMA')->first();
        $tonyina = Product::where('code', 'PROD-TONY')->first();

        // Tarifes poma
        if ($poma) {
            $poma->rates()->create([
                'price' => 2.50,
                'date_from' => '2026-04-01',
                'date_to' => '2026-05-31',
            ]);
        }

        // Tarifes tonyina
        if ($tonyina) {
            $tonyina->rates()->create([
                'price' => 18.90,
                'date_from' => '2026-04-01',
                'date_to' => '2026-05-31',
            ]);
            $tonyina->rates()->create([
                'price' => 24.50, 
                'date_from' => '2026-06-01',
                'date_to' => '2026-08-31',
            ]);
        }
    }
}