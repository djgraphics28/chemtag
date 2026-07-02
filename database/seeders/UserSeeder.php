<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['username' => 'admin'],
            ['name' => 'ChemTag Admin', 'password' => Hash::make('Admin@123')]
        );
        $admin->syncRoles('admin');

        $teacher = User::firstOrCreate(
            ['username' => 'teacher1'],
            ['name' => 'Demo Teacher', 'password' => Hash::make('Teacher@123')]
        );
        $teacher->syncRoles('teacher');

        foreach ([1, 2] as $i) {
            $student = User::firstOrCreate(
                ['username' => "student{$i}"],
                ['name' => "Demo Student {$i}", 'password' => Hash::make('Student@123'), 'xp_total' => 0]
            );
            $student->syncRoles('student');
        }
    }
}
