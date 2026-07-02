<?php

namespace Database\Seeders;

use App\Models\GameMode;
use Illuminate\Database\Seeder;

class GameModeSeeder extends Seeder
{
    public function run(): void
    {
        $modes = [
            [
                'code' => 'structure_to_name',
                'title' => 'Name It Right',
                'description' => 'Look at a chemical structure and choose the correct IUPAC name.',
                'icon' => 'flask-conical',
                'is_active' => true,
            ],
            [
                'code' => 'name_to_structure',
                'title' => 'Structure Match',
                'description' => 'Read an IUPAC name and pick the matching chemical structure.',
                'icon' => 'atom',
                'is_active' => true,
            ],
            [
                'code' => 'pattern_clue',
                'title' => 'Clue Hunter',
                'description' => 'Four structures share a common feature — identify the substituent or parent chain.',
                'icon' => 'search',
                'is_active' => true,
            ],
        ];

        foreach ($modes as $mode) {
            GameMode::firstOrCreate(['code' => $mode['code']], $mode);
        }
    }
}
