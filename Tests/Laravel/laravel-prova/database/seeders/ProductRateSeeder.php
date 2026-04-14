<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductRateSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Buscamos los productos que ya se crearon en el ProductSeeder
        $poma = Product::where('code', 'PROD-POMA')->first();
        $tonyina = Product::where('code', 'PROD-TONY')->first();

        // 2. Creamos las tarifas asociadas a la Poma
        if ($poma) {
            $poma->rates()->create([
                'price' => 2.50,
                'date_from' => '2026-04-01',
                'date_to' => '2026-05-31',
            ]);
        }

        // 3. Creamos las tarifas asociadas a la Tonyina
        if ($tonyina) {
            $tonyina->rates()->create([
                'price' => 18.90,
                'date_from' => '2026-04-01',
                'date_to' => '2026-05-31',
            ]);
        }
    }
}