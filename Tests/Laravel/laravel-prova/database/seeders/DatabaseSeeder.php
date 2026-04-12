<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Creem usuari
        User::create([
            'name' => 'Oriol Poblet',
            'email' => 'uriropo@gmail.com',
            'password' => Hash::make('oriol1234'),
        ]);

        // Creem categories base
        $fruta = Category::create(['code' => 'CAT-01', 'name' => 'FRUTAS']);
        Category::create(['code' => 'CAT-01-A', 'name' => 'MANZANA', 'parent_id' => $fruta->id]);
        
        $carne = Category::create(['code' => 'CAT-02', 'name' => 'CARNES']);
        Category::create(['code' => 'CAT-02-A', 'name' => 'ROJA', 'parent_id' => $carne->id]);
    }
}