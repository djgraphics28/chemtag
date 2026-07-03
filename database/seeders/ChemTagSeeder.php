<?php

namespace Database\Seeders;

use App\Models\GameMode;
use App\Models\Question;
use App\Models\QuestionChoice;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Seeder;

class ChemTagSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('username', 'admin')->first();
        $topic = Topic::where('order', 1)->first();

        $this->seedStructureToName($admin->id, $topic->id);
        $this->seedNameToStructure($admin->id, $topic->id);
        $this->seedPatternClue($admin->id, $topic->id);
    }

    /** Round 1: show structure image → pick IUPAC name */
    private function seedStructureToName(int $createdBy, int $topicId): void
    {
        $mode = GameMode::where('code', 'structure_to_name')->first();

        $questions = [
            [
                'prompt_image_path' => 'structures/methane.png',
                'explanation' => 'Methane has one carbon atom and belongs to the alkane family (CnH2n+2).',
                'choices' => [
                    ['text' => 'Methane', 'correct' => true],
                    ['text' => 'Ethane', 'correct' => false],
                    ['text' => 'Propane', 'correct' => false],
                    ['text' => 'Butane', 'correct' => false],
                ],
            ],
            [
                'prompt_image_path' => 'structures/ethane.png',
                'explanation' => 'Ethane has two carbons; the prefix "eth-" indicates 2 carbon atoms.',
                'choices' => [
                    ['text' => 'Ethane', 'correct' => true],
                    ['text' => 'Methane', 'correct' => false],
                    ['text' => 'Propane', 'correct' => false],
                    ['text' => 'Pentane', 'correct' => false],
                ],
            ],
            [
                'prompt_image_path' => 'structures/propane.png',
                'explanation' => 'Propane has three carbons; "prop-" means 3.',
                'choices' => [
                    ['text' => 'Propane', 'correct' => true],
                    ['text' => 'Butane', 'correct' => false],
                    ['text' => 'Ethane', 'correct' => false],
                    ['text' => 'Hexane', 'correct' => false],
                ],
            ],
            [
                'prompt_image_path' => 'structures/butane.png',
                'explanation' => 'Butane has four carbons; "but-" means 4.',
                'choices' => [
                    ['text' => 'Butane', 'correct' => true],
                    ['text' => 'Propane', 'correct' => false],
                    ['text' => 'Pentane', 'correct' => false],
                    ['text' => 'Octane', 'correct' => false],
                ],
            ],
            [
                'prompt_image_path' => 'structures/pentane.png',
                'explanation' => 'Pentane has five carbons; "pent-" means 5.',
                'choices' => [
                    ['text' => 'Pentane', 'correct' => true],
                    ['text' => 'Butane', 'correct' => false],
                    ['text' => 'Hexane', 'correct' => false],
                    ['text' => 'Heptane', 'correct' => false],
                ],
            ],
            [
                'prompt_image_path' => 'structures/hexane.png',
                'explanation' => 'Hexane has six carbons; "hex-" means 6.',
                'choices' => [
                    ['text' => 'Hexane', 'correct' => true],
                    ['text' => 'Pentane', 'correct' => false],
                    ['text' => 'Heptane', 'correct' => false],
                    ['text' => 'Nonane', 'correct' => false],
                ],
            ],
            [
                'prompt_image_path' => 'structures/heptane.png',
                'explanation' => 'Heptane has seven carbons; "hept-" means 7.',
                'choices' => [
                    ['text' => 'Heptane', 'correct' => true],
                    ['text' => 'Hexane', 'correct' => false],
                    ['text' => 'Octane', 'correct' => false],
                    ['text' => 'Decane', 'correct' => false],
                ],
            ],
            [
                'prompt_image_path' => 'structures/octane.png',
                'explanation' => 'Octane has eight carbons; "oct-" means 8.',
                'choices' => [
                    ['text' => 'Octane', 'correct' => true],
                    ['text' => 'Heptane', 'correct' => false],
                    ['text' => 'Nonane', 'correct' => false],
                    ['text' => 'Hexane', 'correct' => false],
                ],
            ],
            [
                'prompt_image_path' => 'structures/nonane.png',
                'explanation' => 'Nonane has nine carbons; "non-" means 9.',
                'choices' => [
                    ['text' => 'Nonane', 'correct' => true],
                    ['text' => 'Octane', 'correct' => false],
                    ['text' => 'Decane', 'correct' => false],
                    ['text' => 'Pentane', 'correct' => false],
                ],
            ],
            [
                'prompt_image_path' => 'structures/decane.png',
                'explanation' => 'Decane has ten carbons; "dec-" means 10.',
                'choices' => [
                    ['text' => 'Decane', 'correct' => true],
                    ['text' => 'Nonane', 'correct' => false],
                    ['text' => 'Heptane', 'correct' => false],
                    ['text' => 'Butane', 'correct' => false],
                ],
            ],
        ];

        $this->insertQuestions($mode->id, $topicId, $createdBy, $questions, 'image');
    }

    /** Round 2: show IUPAC name → pick correct structure image */
    private function seedNameToStructure(int $createdBy, int $topicId): void
    {
        $mode = GameMode::where('code', 'name_to_structure')->first();

        $questions = [
            [
                'prompt_text' => '2-methylpropane',
                'explanation' => 'Isobutane: a 3-carbon chain with a methyl group on C2.',
                'choices' => [
                    ['image' => 'structures/2-methylpropane.png', 'correct' => true],
                    ['image' => 'structures/butane.png', 'correct' => false],
                    ['image' => 'structures/propane.png', 'correct' => false],
                    ['image' => 'structures/pentane.png', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => '2-methylbutane',
                'explanation' => 'Isopentane: a 4-carbon chain with methyl on C2.',
                'choices' => [
                    ['image' => 'structures/2-methylbutane.png', 'correct' => true],
                    ['image' => 'structures/pentane.png', 'correct' => false],
                    ['image' => 'structures/butane.png', 'correct' => false],
                    ['image' => 'structures/2-methylpropane.png', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => '2,3-dimethylbutane',
                'explanation' => 'Two methyl substituents on C2 and C3 of a butane chain.',
                'choices' => [
                    ['image' => 'structures/2-3-dimethylbutane.png', 'correct' => true],
                    ['image' => 'structures/hexane.png', 'correct' => false],
                    ['image' => 'structures/2-methylpentane.png', 'correct' => false],
                    ['image' => 'structures/pentane.png', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => '3-methylpentane',
                'explanation' => 'Methyl group on C3 of a five-carbon chain.',
                'choices' => [
                    ['image' => 'structures/3-methylpentane.png', 'correct' => true],
                    ['image' => 'structures/2-methylpentane.png', 'correct' => false],
                    ['image' => 'structures/hexane.png', 'correct' => false],
                    ['image' => 'structures/heptane.png', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => '2,2-dimethylpropane',
                'explanation' => 'Neopentane: two methyl groups on C2 of propane (quaternary carbon).',
                'choices' => [
                    ['image' => 'structures/2-2-dimethylpropane.png', 'correct' => true],
                    ['image' => 'structures/pentane.png', 'correct' => false],
                    ['image' => 'structures/2-methylbutane.png', 'correct' => false],
                    ['image' => 'structures/butane.png', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => '2-methylpentane',
                'explanation' => 'Methyl substituent on C2 of a five-carbon parent chain.',
                'choices' => [
                    ['image' => 'structures/2-methylpentane.png', 'correct' => true],
                    ['image' => 'structures/3-methylpentane.png', 'correct' => false],
                    ['image' => 'structures/hexane.png', 'correct' => false],
                    ['image' => 'structures/2-methylbutane.png', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => '3-ethylhexane',
                'explanation' => 'An ethyl group on C3 of a six-carbon chain.',
                'choices' => [
                    ['image' => 'structures/3-ethylhexane.png', 'correct' => true],
                    ['image' => 'structures/octane.png', 'correct' => false],
                    ['image' => 'structures/heptane.png', 'correct' => false],
                    ['image' => 'structures/3-methylhexane.png', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => '4-ethylheptane',
                'explanation' => 'Ethyl group at C4 of heptane — IUPAC numbering gives the lowest locant.',
                'choices' => [
                    ['image' => 'structures/4-ethylheptane.png', 'correct' => true],
                    ['image' => 'structures/nonane.png', 'correct' => false],
                    ['image' => 'structures/3-ethylhexane.png', 'correct' => false],
                    ['image' => 'structures/octane.png', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => '3-ethyl-4-methylheptane',
                'explanation' => 'Parent chain = heptane; ethyl on C3, methyl on C4.',
                'choices' => [
                    ['image' => 'structures/3-ethyl-4-methylheptane.png', 'correct' => true],
                    ['image' => 'structures/4-ethylheptane.png', 'correct' => false],
                    ['image' => 'structures/3-methylheptane.png', 'correct' => false],
                    ['image' => 'structures/nonane.png', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => '2,4-dimethylhexane',
                'explanation' => 'Two methyl groups at C2 and C4 of hexane; IUPAC requires lowest locant set.',
                'choices' => [
                    ['image' => 'structures/2-4-dimethylhexane.png', 'correct' => true],
                    ['image' => 'structures/2-methylheptane.png', 'correct' => false],
                    ['image' => 'structures/octane.png', 'correct' => false],
                    ['image' => 'structures/3-methylheptane.png', 'correct' => false],
                ],
            ],
        ];

        $this->insertQuestions($mode->id, $topicId, $createdBy, $questions, 'text');
    }

    /** Round 3: 4 images share a common feature → identify it */
    private function seedPatternClue(int $createdBy, int $topicId): void
    {
        $mode = GameMode::where('code', 'pattern_clue')->first();

        $questions = [
            [
                'prompt_text' => 'All four structures shown share a common substituent. What is it?',
                'prompt_image_path' => 'patterns/methyl-group-set.png',
                'explanation' => 'A methyl group (–CH₃) attached to a longer carbon chain.',
                'choices' => [
                    ['text' => 'Methyl (–CH₃)', 'correct' => true],
                    ['text' => 'Ethyl (–C₂H₅)', 'correct' => false],
                    ['text' => 'Propyl (–C₃H₇)', 'correct' => false],
                    ['text' => 'Butyl (–C₄H₉)', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => 'What parent chain do all four molecules share?',
                'prompt_image_path' => 'patterns/hexane-parent-set.png',
                'explanation' => 'Choose the longest continuous carbon chain (6 carbons = hexane).',
                'choices' => [
                    ['text' => 'Hexane', 'correct' => true],
                    ['text' => 'Heptane', 'correct' => false],
                    ['text' => 'Pentane', 'correct' => false],
                    ['text' => 'Octane', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => 'All four compounds contain which substituent?',
                'prompt_image_path' => 'patterns/ethyl-group-set.png',
                'explanation' => 'An ethyl group is –CH₂CH₃ (two carbons) attached to the main chain.',
                'choices' => [
                    ['text' => 'Ethyl (–C₂H₅)', 'correct' => true],
                    ['text' => 'Methyl (–CH₃)', 'correct' => false],
                    ['text' => 'Isopropyl (–CH(CH₃)₂)', 'correct' => false],
                    ['text' => 'Propyl (–C₃H₇)', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => 'What distinguishes all four structures from straight-chain alkanes?',
                'prompt_image_path' => 'patterns/branched-set.png',
                'explanation' => 'Branched alkanes have at least one carbon bonded to more than two other carbons.',
                'choices' => [
                    ['text' => 'They are branched alkanes', 'correct' => true],
                    ['text' => 'They are cycloalkanes', 'correct' => false],
                    ['text' => 'They contain double bonds', 'correct' => false],
                    ['text' => 'They are straight-chain alkanes', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => 'All four compounds share which parent chain?',
                'prompt_image_path' => 'patterns/pentane-parent-set.png',
                'explanation' => 'Pentane is the 5-carbon straight-chain alkane.',
                'choices' => [
                    ['text' => 'Pentane', 'correct' => true],
                    ['text' => 'Hexane', 'correct' => false],
                    ['text' => 'Butane', 'correct' => false],
                    ['text' => 'Heptane', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => 'What common structural feature do all four show?',
                'prompt_image_path' => 'patterns/quaternary-carbon-set.png',
                'explanation' => 'A quaternary carbon is bonded to four different carbon atoms.',
                'choices' => [
                    ['text' => 'Quaternary carbon', 'correct' => true],
                    ['text' => 'Tertiary carbon', 'correct' => false],
                    ['text' => 'Secondary carbon', 'correct' => false],
                    ['text' => 'Double bond', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => 'Which substituent is present in all four structures?',
                'prompt_image_path' => 'patterns/isopropyl-set.png',
                'explanation' => 'An isopropyl group is –CH(CH₃)₂; it branches immediately at the point of attachment.',
                'choices' => [
                    ['text' => 'Isopropyl', 'correct' => true],
                    ['text' => 'Propyl', 'correct' => false],
                    ['text' => 'Ethyl', 'correct' => false],
                    ['text' => 'Butyl', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => 'All four compounds contain two identical substituents. What are they?',
                'prompt_image_path' => 'patterns/dimethyl-set.png',
                'explanation' => 'The prefix "di-" in IUPAC nomenclature means two identical substituents.',
                'choices' => [
                    ['text' => 'Two methyl groups', 'correct' => true],
                    ['text' => 'Two ethyl groups', 'correct' => false],
                    ['text' => 'One methyl, one ethyl', 'correct' => false],
                    ['text' => 'Two propyl groups', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => 'What is the common parent chain for all four molecules?',
                'prompt_image_path' => 'patterns/heptane-parent-set.png',
                'explanation' => 'Count the longest continuous carbon chain; 7 carbons = heptane.',
                'choices' => [
                    ['text' => 'Heptane', 'correct' => true],
                    ['text' => 'Hexane', 'correct' => false],
                    ['text' => 'Octane', 'correct' => false],
                    ['text' => 'Nonane', 'correct' => false],
                ],
            ],
            [
                'prompt_text' => 'Each molecule shown contains a substituent starting at C3. What is it?',
                'prompt_image_path' => 'patterns/propyl-at-c3-set.png',
                'explanation' => 'A propyl substituent (–C₃H₇) at position 3 on the parent chain.',
                'choices' => [
                    ['text' => 'Propyl at C3', 'correct' => true],
                    ['text' => 'Ethyl at C3', 'correct' => false],
                    ['text' => 'Methyl at C3', 'correct' => false],
                    ['text' => 'Butyl at C3', 'correct' => false],
                ],
            ],
        ];

        $this->insertQuestions($mode->id, $topicId, $createdBy, $questions, 'mixed');
    }

    /**
     * @param  array<int, array{prompt_text?: string, prompt_image_path?: string, explanation: string, choices: array<int, array{text?: string, image?: string, correct: bool}>}>  $questions
     */
    private function insertQuestions(
        int $modeId,
        int $topicId,
        int $createdBy,
        array $questions,
        string $choiceType
    ): void {
        foreach ($questions as $qData) {
            $question = Question::create([
                'game_mode_id' => $modeId,
                'topic_id' => $topicId,
                'prompt_text' => $qData['prompt_text'] ?? null,
                'prompt_image_path' => $qData['prompt_image_path'] ?? null,
                'explanation' => $qData['explanation'],
                'points' => 100,
                'time_limit_seconds' => 20,
                'is_active' => true,
                'created_by' => $createdBy,
            ]);

            foreach ($qData['choices'] as $order => $choice) {
                QuestionChoice::create([
                    'question_id' => $question->id,
                    'choice_text' => $choice['text'] ?? null,
                    'choice_image_path' => $choice['image'] ?? null,
                    'is_correct' => $choice['correct'],
                    'sort_order' => $order,
                ]);
            }
        }
    }
}
