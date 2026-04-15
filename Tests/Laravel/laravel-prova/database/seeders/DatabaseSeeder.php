<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    // Seeder mestre, crida a la resta de seeders
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            ProductRateSeeder::class,
            CalendarOrderSeeder::class,
        ]);
    }
}