<?php

namespace Database\Seeders;

use App\Models\GameMode;
use App\Models\Question;
use App\Models\Topic;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Fills every topic with demonstration questions for all three game modes so
 * the whole app (solo play, battles, imports) is showable out of the box.
 */
class DemoQuestionSeeder extends Seeder
{
    /** Compound pool per topic: [name, formula, clue] */
    private const COMPOUNDS = [
        'Alkanes Basics' => [
            ['Methane', 'CH4', 'The simplest alkane, main component of natural gas'],
            ['Ethane', 'CH3-CH3', 'A two-carbon alkane'],
            ['Propane', 'CH3-CH2-CH3', 'A three-carbon alkane used in gas grills'],
            ['Butane', 'CH3-(CH2)2-CH3', 'A four-carbon alkane found in lighters'],
            ['Pentane', 'CH3-(CH2)3-CH3', 'A five-carbon straight-chain alkane'],
            ['Hexane', 'CH3-(CH2)4-CH3', 'A six-carbon alkane used as a solvent'],
            ['Heptane', 'CH3-(CH2)5-CH3', 'A seven-carbon alkane, zero point on the octane scale'],
            ['Octane', 'CH3-(CH2)6-CH3', 'An eight-carbon alkane associated with fuel ratings'],
            ['Nonane', 'CH3-(CH2)7-CH3', 'A nine-carbon straight-chain alkane'],
            ['Decane', 'CH3-(CH2)8-CH3', 'A ten-carbon straight-chain alkane'],
        ],
        'Simple Substituents' => [
            ['2-Methylpropane', 'CH3-CH(CH3)-CH3', 'The simplest branched alkane, also called isobutane'],
            ['2-Methylbutane', 'CH3-CH(CH3)-CH2-CH3', 'A five-carbon alkane with one methyl branch'],
            ['2-Methylpentane', 'CH3-CH(CH3)-(CH2)2-CH3', 'A hexane isomer with a methyl group on carbon 2'],
            ['3-Methylpentane', 'CH3-CH2-CH(CH3)-CH2-CH3', 'A hexane isomer with a methyl group on carbon 3'],
            ['2-Methylhexane', 'CH3-CH(CH3)-(CH2)3-CH3', 'A heptane isomer with a methyl group on carbon 2'],
            ['3-Methylhexane', 'CH3-CH2-CH(CH3)-(CH2)2-CH3', 'A heptane isomer with a methyl group on carbon 3'],
            ['2-Methylheptane', 'CH3-CH(CH3)-(CH2)4-CH3', 'An octane isomer with a methyl branch on carbon 2'],
            ['3-Ethylpentane', 'CH3-CH2-CH(C2H5)-CH2-CH3', 'A heptane isomer with an ethyl branch in the middle'],
        ],
        'Multiple Substituents' => [
            ['2,2-Dimethylpropane', 'CH3-C(CH3)2-CH3', 'Neopentane — two methyls on the same carbon'],
            ['2,3-Dimethylbutane', 'CH3-CH(CH3)-CH(CH3)-CH3', 'Two methyl groups on adjacent carbons'],
            ['2,2-Dimethylbutane', 'CH3-C(CH3)2-CH2-CH3', 'Two methyl groups on carbon 2 of butane'],
            ['2,4-Dimethylpentane', 'CH3-CH(CH3)-CH2-CH(CH3)-CH3', 'Methyl groups on carbons 2 and 4'],
            ['2,3-Dimethylpentane', 'CH3-CH(CH3)-CH(CH3)-CH2-CH3', 'Methyl groups on carbons 2 and 3 of pentane'],
            ['2,2,3-Trimethylbutane', 'CH3-C(CH3)2-CH(CH3)-CH3', 'Three methyl branches on a butane chain'],
            ['3,3-Dimethylpentane', 'CH3-CH2-C(CH3)2-CH2-CH3', 'Two methyls on the central carbon of pentane'],
            ['2,2,4-Trimethylpentane', 'CH3-C(CH3)2-CH2-CH(CH3)-CH3', 'Isooctane — the 100 point on the octane scale'],
        ],
        'Complex Chains' => [
            ['4-Ethyl-2-methylhexane', 'CH3-CH(CH3)-CH2-CH(C2H5)-CH2-CH3', 'Ethyl and methyl branches on a hexane chain'],
            ['3-Ethyl-2-methylpentane', 'CH3-CH(CH3)-CH(C2H5)-CH2-CH3', 'Ethyl on C3, methyl on C2 of pentane'],
            ['4-Ethylheptane', 'CH3-(CH2)2-CH(C2H5)-(CH2)2-CH3', 'An ethyl branch in the middle of heptane'],
            ['2,3,4-Trimethylpentane', 'CH3-CH(CH3)-CH(CH3)-CH(CH3)-CH3', 'Three consecutive methyl branches'],
            ['3-Ethyl-3-methylpentane', 'CH3-CH2-C(CH3)(C2H5)-CH2-CH3', 'Ethyl and methyl on the same central carbon'],
            ['5-Ethyl-2-methylheptane', 'CH3-CH(CH3)-(CH2)2-CH(C2H5)-CH2-CH3', 'Number from the end giving the lowest locants'],
            ['4-Propylheptane', 'CH3-(CH2)2-CH(C3H7)-(CH2)2-CH3', 'A propyl branch centred on heptane'],
            ['2,5-Dimethylhexane', 'CH3-CH(CH3)-(CH2)2-CH(CH3)-CH3', 'Symmetric dimethyl hexane'],
        ],
        'Cycloalkanes' => [
            ['Cyclopropane', 'C3H6 (ring)', 'The smallest, most strained ring'],
            ['Cyclobutane', 'C4H8 (ring)', 'A four-membered carbon ring'],
            ['Cyclopentane', 'C5H10 (ring)', 'A five-membered ring with little strain'],
            ['Cyclohexane', 'C6H12 (ring)', 'The classic chair-conformation ring'],
            ['Methylcyclopentane', 'C5H9-CH3', 'A cyclopentane ring with one methyl group'],
            ['Methylcyclohexane', 'C6H11-CH3', 'A cyclohexane ring with one methyl group'],
            ['1,2-Dimethylcyclohexane', 'C6H10(CH3)2', 'Two methyls on adjacent ring carbons'],
            ['Cycloheptane', 'C7H14 (ring)', 'A seven-membered carbon ring'],
        ],
        'Alkenes' => [
            ['Ethene', 'CH2=CH2', 'The simplest alkene, ripens fruit'],
            ['Propene', 'CH2=CH-CH3', 'A three-carbon alkene, monomer of polypropylene'],
            ['But-1-ene', 'CH2=CH-CH2-CH3', 'A terminal four-carbon alkene'],
            ['But-2-ene', 'CH3-CH=CH-CH3', 'A four-carbon alkene with an internal double bond'],
            ['Pent-1-ene', 'CH2=CH-(CH2)2-CH3', 'A terminal five-carbon alkene'],
            ['Pent-2-ene', 'CH3-CH=CH-CH2-CH3', 'A five-carbon alkene, double bond at position 2'],
            ['2-Methylpropene', 'CH2=C(CH3)-CH3', 'Isobutylene — a branched alkene'],
            ['Hex-1-ene', 'CH2=CH-(CH2)3-CH3', 'A terminal six-carbon alkene'],
        ],
        'Alkynes' => [
            ['Ethyne', 'HC≡CH', 'Acetylene — used in welding torches'],
            ['Propyne', 'HC≡C-CH3', 'A three-carbon alkyne'],
            ['But-1-yne', 'HC≡C-CH2-CH3', 'A terminal four-carbon alkyne'],
            ['But-2-yne', 'CH3-C≡C-CH3', 'A four-carbon alkyne with an internal triple bond'],
            ['Pent-1-yne', 'HC≡C-(CH2)2-CH3', 'A terminal five-carbon alkyne'],
            ['Pent-2-yne', 'CH3-C≡C-CH2-CH3', 'A five-carbon alkyne, triple bond at position 2'],
            ['Hex-1-yne', 'HC≡C-(CH2)3-CH3', 'A terminal six-carbon alkyne'],
            ['Hex-3-yne', 'CH3-CH2-C≡C-CH2-CH3', 'A symmetric internal alkyne'],
        ],
        'Aromatic Compounds' => [
            ['Benzene', 'C6H6', 'The parent aromatic ring'],
            ['Methylbenzene', 'C6H5-CH3', 'Toluene — benzene with one methyl group'],
            ['Ethylbenzene', 'C6H5-C2H5', 'Benzene with an ethyl group'],
            ['1,2-Dimethylbenzene', 'C6H4(CH3)2 (ortho)', 'ortho-Xylene'],
            ['1,3-Dimethylbenzene', 'C6H4(CH3)2 (meta)', 'meta-Xylene'],
            ['1,4-Dimethylbenzene', 'C6H4(CH3)2 (para)', 'para-Xylene'],
            ['Phenol', 'C6H5-OH', 'Benzene with a hydroxyl group'],
            ['Aniline', 'C6H5-NH2', 'Benzene with an amino group'],
        ],
        'Alcohols' => [
            ['Methanol', 'CH3-OH', 'Wood alcohol — the simplest alcohol'],
            ['Ethanol', 'CH3-CH2-OH', 'The alcohol in beverages'],
            ['Propan-1-ol', 'CH3-CH2-CH2-OH', 'A three-carbon primary alcohol'],
            ['Propan-2-ol', 'CH3-CH(OH)-CH3', 'Isopropyl alcohol — rubbing alcohol'],
            ['Butan-1-ol', 'CH3-(CH2)3-OH', 'A four-carbon primary alcohol'],
            ['Butan-2-ol', 'CH3-CH(OH)-CH2-CH3', 'A four-carbon secondary alcohol'],
            ['2-Methylpropan-2-ol', '(CH3)3C-OH', 'tert-Butanol — a tertiary alcohol'],
            ['Pentan-1-ol', 'CH3-(CH2)4-OH', 'A five-carbon primary alcohol'],
        ],
        'Ethers' => [
            ['Methoxymethane', 'CH3-O-CH3', 'Dimethyl ether — the simplest ether'],
            ['Methoxyethane', 'CH3-O-CH2-CH3', 'Ethyl methyl ether'],
            ['Ethoxyethane', 'CH3-CH2-O-CH2-CH3', 'Diethyl ether — the classic anaesthetic'],
            ['1-Methoxypropane', 'CH3-O-(CH2)2-CH3', 'Methyl propyl ether'],
            ['2-Methoxypropane', 'CH3-O-CH(CH3)2', 'Isopropyl methyl ether'],
            ['1-Ethoxypropane', 'C2H5-O-(CH2)2-CH3', 'Ethyl propyl ether'],
            ['Methoxybenzene', 'C6H5-O-CH3', 'Anisole — an aromatic ether'],
            ['Oxolane', 'C4H8O (ring)', 'THF — a cyclic ether solvent'],
        ],
        'Aldehydes' => [
            ['Methanal', 'HCHO', 'Formaldehyde — a preservative'],
            ['Ethanal', 'CH3-CHO', 'Acetaldehyde — produced in alcohol metabolism'],
            ['Propanal', 'CH3-CH2-CHO', 'A three-carbon aldehyde'],
            ['Butanal', 'CH3-(CH2)2-CHO', 'A four-carbon aldehyde'],
            ['Pentanal', 'CH3-(CH2)3-CHO', 'A five-carbon aldehyde'],
            ['2-Methylpropanal', '(CH3)2CH-CHO', 'A branched four-carbon aldehyde'],
            ['Benzaldehyde', 'C6H5-CHO', 'Smells of almonds'],
            ['Hexanal', 'CH3-(CH2)4-CHO', 'Smells of freshly cut grass'],
        ],
        'Ketones' => [
            ['Propanone', 'CH3-CO-CH3', 'Acetone — nail polish remover'],
            ['Butanone', 'CH3-CO-CH2-CH3', 'MEK — a common solvent'],
            ['Pentan-2-one', 'CH3-CO-(CH2)2-CH3', 'A five-carbon ketone, carbonyl at C2'],
            ['Pentan-3-one', 'CH3-CH2-CO-CH2-CH3', 'A symmetric five-carbon ketone'],
            ['Hexan-2-one', 'CH3-CO-(CH2)3-CH3', 'A six-carbon ketone, carbonyl at C2'],
            ['Hexan-3-one', 'CH3-CH2-CO-(CH2)2-CH3', 'A six-carbon ketone, carbonyl at C3'],
            ['3-Methylbutan-2-one', 'CH3-CO-CH(CH3)2', 'A branched five-carbon ketone'],
            ['Acetophenone', 'C6H5-CO-CH3', 'An aromatic ketone'],
        ],
        'Carboxylic Acids' => [
            ['Methanoic acid', 'HCOOH', 'Formic acid — found in ant stings'],
            ['Ethanoic acid', 'CH3-COOH', 'Acetic acid — the acid in vinegar'],
            ['Propanoic acid', 'CH3-CH2-COOH', 'A three-carbon carboxylic acid'],
            ['Butanoic acid', 'CH3-(CH2)2-COOH', 'Smells of rancid butter'],
            ['Pentanoic acid', 'CH3-(CH2)3-COOH', 'Valeric acid — five carbons'],
            ['2-Methylpropanoic acid', '(CH3)2CH-COOH', 'A branched four-carbon acid'],
            ['Benzoic acid', 'C6H5-COOH', 'An aromatic carboxylic acid preservative'],
            ['Hexanoic acid', 'CH3-(CH2)4-COOH', 'Caproic acid — smells of goats'],
        ],
        'Esters' => [
            ['Methyl methanoate', 'HCOO-CH3', 'The simplest ester'],
            ['Methyl ethanoate', 'CH3-COO-CH3', 'Methyl acetate — a mild solvent'],
            ['Ethyl ethanoate', 'CH3-COO-C2H5', 'Ethyl acetate — nail polish smell'],
            ['Propyl ethanoate', 'CH3-COO-C3H7', 'Smells of pears'],
            ['Ethyl butanoate', 'C3H7-COO-C2H5', 'Smells of pineapple'],
            ['Methyl butanoate', 'C3H7-COO-CH3', 'Smells of apples'],
            ['Pentyl ethanoate', 'CH3-COO-C5H11', 'Smells of bananas'],
            ['Methyl benzoate', 'C6H5-COO-CH3', 'An aromatic ester'],
        ],
        'Amines' => [
            ['Methylamine', 'CH3-NH2', 'The simplest primary amine'],
            ['Ethylamine', 'CH3-CH2-NH2', 'A two-carbon primary amine'],
            ['Propylamine', 'CH3-(CH2)2-NH2', 'A three-carbon primary amine'],
            ['Dimethylamine', '(CH3)2NH', 'A secondary amine with two methyls'],
            ['Trimethylamine', '(CH3)3N', 'A tertiary amine, smells of fish'],
            ['Diethylamine', '(C2H5)2NH', 'A secondary amine with two ethyls'],
            ['Butylamine', 'CH3-(CH2)3-NH2', 'A four-carbon primary amine'],
            ['Phenylamine', 'C6H5-NH2', 'Aniline — an aromatic amine'],
        ],
        'Amides' => [
            ['Methanamide', 'HCONH2', 'Formamide — the simplest amide'],
            ['Ethanamide', 'CH3-CONH2', 'Acetamide — a two-carbon amide'],
            ['Propanamide', 'CH3-CH2-CONH2', 'A three-carbon amide'],
            ['Butanamide', 'CH3-(CH2)2-CONH2', 'A four-carbon amide'],
            ['N-Methylethanamide', 'CH3-CONH-CH3', 'An N-substituted amide'],
            ['N,N-Dimethylmethanamide', 'HCON(CH3)2', 'DMF — a polar aprotic solvent'],
            ['Benzamide', 'C6H5-CONH2', 'An aromatic amide'],
            ['Pentanamide', 'CH3-(CH2)3-CONH2', 'A five-carbon amide'],
        ],
    ];

    public function run(): void
    {
        $admin = User::where('username', 'admin')->first() ?? User::first();
        $modes = GameMode::pluck('id', 'code');

        foreach (self::COMPOUNDS as $topicName => $compounds) {
            $topic = Topic::where('name', $topicName)->first();

            if (! $topic) {
                continue;
            }

            $names = array_column($compounds, 0);

            foreach ($compounds as $index => [$name, $formula, $clue]) {
                $distractors = $this->distractors($names, $name);

                // Mode 1: structure/formula → name
                if (isset($modes['structure_to_name'])) {
                    $this->createQuestion(
                        $modes['structure_to_name'], $topic->id, $admin->id,
                        "What is the IUPAC name of {$formula}?",
                        "{$formula} is {$name}. {$clue}.",
                        $name, $distractors,
                    );
                }

                // Mode 2: name → structure/formula
                if (isset($modes['name_to_structure'])) {
                    $formulas = array_column($compounds, 1);
                    $formulaDistractors = $this->distractors($formulas, $formula);
                    $this->createQuestion(
                        $modes['name_to_structure'], $topic->id, $admin->id,
                        "Which structure represents {$name}?",
                        "{$name} is {$formula}. {$clue}.",
                        $formula, $formulaDistractors,
                    );
                }

                // Mode 3: clue → name
                if (isset($modes['pattern_clue'])) {
                    $this->createQuestion(
                        $modes['pattern_clue'], $topic->id, $admin->id,
                        "{$clue}. Which compound is it?",
                        "The answer is {$name} ({$formula}).",
                        $name, $distractors,
                    );
                }
            }
        }
    }

    /**
     * @param  list<string>  $pool
     * @return list<string>
     */
    private function distractors(array $pool, string $correct): array
    {
        $others = array_values(array_filter($pool, fn (string $n) => $n !== $correct));
        shuffle($others);

        return array_slice($others, 0, 3);
    }

    /**
     * @param  list<string>  $distractors
     */
    private function createQuestion(
        int $gameModeId,
        int $topicId,
        int $createdBy,
        string $prompt,
        string $explanation,
        string $correct,
        array $distractors,
    ): void {
        $exists = Question::where('game_mode_id', $gameModeId)
            ->where('topic_id', $topicId)
            ->where('prompt_text', $prompt)
            ->exists();

        if ($exists) {
            return;
        }

        $question = Question::create([
            'game_mode_id' => $gameModeId,
            'topic_id' => $topicId,
            'prompt_text' => $prompt,
            'explanation' => $explanation,
            'points' => 100,
            'time_limit_seconds' => 20,
            'is_active' => true,
            'created_by' => $createdBy,
        ]);

        $choices = [...array_map(fn (string $d) => [$d, false], $distractors), [$correct, true]];
        shuffle($choices);

        foreach ($choices as $sortOrder => [$text, $isCorrect]) {
            $question->choices()->create([
                'choice_text' => $text,
                'is_correct' => $isCorrect,
                'feedback_text' => $isCorrect
                    ? "Correct! {$explanation}"
                    : "Incorrect. {$text} is not the right answer here — {$explanation}",
                'sort_order' => $sortOrder + 1,
            ]);
        }
    }
}
