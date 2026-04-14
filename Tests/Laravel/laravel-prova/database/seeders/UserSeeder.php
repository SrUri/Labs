<?php
namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Uri',
            'email' => 'uriropo@gmail.com',
            'password' => Hash::make('oriol1234'),
        ]);
    }
}