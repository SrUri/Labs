<?php
namespace Database\Seeders;

use App\Models\CalendarOrder;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CalendarOrderSeeder extends Seeder
{
    // Creem comandes
    public function run(): void
    {
        $poma = Product::where('code', 'PROD-POMA')->first();
        $tonyina = Product::where('code', 'PROD-TONY')->first();

        CalendarOrder::create([
            'order_date' => '2026-04-29',
            'product_id' => $poma->id,
            'units' => 2,
            'total_cost' => 5.00,
        ]);

        CalendarOrder::create([
            'order_date' => '2026-04-30',
            'product_id' => $tonyina->id,
            'units' => 1,
            'total_cost' => 18.90,
        ]);
    }
}