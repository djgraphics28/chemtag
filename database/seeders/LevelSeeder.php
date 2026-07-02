<?php

namespace Database\Seeders;

use App\Models\Level;
use Illuminate\Database\Seeder;

class LevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['name' => 'Alkanes Basics', 'order' => 1, 'difficulty' => 'easy', 'unlock_score_threshold' => 0],
            ['name' => 'Simple Substituents', 'order' => 2, 'difficulty' => 'easy', 'unlock_score_threshold' => 500],
            ['name' => 'Multiple Substituents', 'order' => 3, 'difficulty' => 'medium', 'unlock_score_threshold' => 1200],
            ['name' => 'Complex Chains', 'order' => 4, 'difficulty' => 'hard', 'unlock_score_threshold' => 2500],
        ];

        foreach ($levels as $level) {
            Level::firstOrCreate(['name' => $level['name']], $level);
        }
    }
}
