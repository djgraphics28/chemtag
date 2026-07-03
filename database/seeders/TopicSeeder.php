<?php

namespace Database\Seeders;

use App\Models\Topic;
use Illuminate\Database\Seeder;

class TopicSeeder extends Seeder
{
    public function run(): void
    {
        $topics = [
            'Alkanes Basics',
            'Simple Substituents',
            'Multiple Substituents',
            'Complex Chains',
            'Cycloalkanes',
            'Alkenes',
            'Alkynes',
            'Aromatic Compounds',
            'Alcohols',
            'Ethers',
            'Aldehydes',
            'Ketones',
            'Carboxylic Acids',
            'Esters',
            'Amines',
            'Amides',
        ];

        foreach ($topics as $index => $name) {
            Topic::firstOrCreate(
                ['name' => $name],
                ['order' => $index + 1, 'questions_per_game' => 10],
            );
        }
    }
}
