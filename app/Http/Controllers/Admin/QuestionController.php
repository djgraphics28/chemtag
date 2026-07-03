<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GameMode;
use App\Models\Question;
use App\Models\QuestionChoice;
use App\Models\Topic;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Writer\XLSX\Options as XlsxOptions;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class QuestionController extends Controller
{
    public function downloadTemplate(): BinaryFileResponse
    {
        $gameModes = GameMode::orderBy('id')->get(['code', 'title']);
        $topics = Topic::orderBy('order')->get(['name']);

        $path = tempnam(sys_get_temp_dir(), 'chemtag_template').'.xlsx';

        $options = new XlsxOptions;
        $options->setColumnWidth(26, 1);
        $options->setColumnWidth(64, 2);
        $options->setColumnWidth(14, 3);
        $options->setColumnWidth(14, 4);

        $writer = new XlsxWriter($options);
        $writer->openToFile($path);

        $title = (new Style)->withFontBold(true)->withFontSize(14);
        $heading = (new Style)->withFontBold(true)->withFontSize(11);
        $bold = (new Style)->withFontBold(true);

        // ── Sheet 1: Instructions ────────────────────────────────
        $writer->getCurrentSheet()->setName('Instructions');

        $addRows = function (array $rows, ?Style $style = null) use ($writer): void {
            foreach ($rows as $row) {
                $writer->addRow(
                    $style !== null ? Row::fromValuesWithStyle($row, $style) : Row::fromValues($row)
                );
            }
        };

        $addRows([['ChemTag — Questions Import Template']], $title);
        $addRows([[]]);
        $addRows([['HOW TO USE']], $heading);
        $addRows([
            ['1.', 'Fill in your questions on the "Questions" sheet (second tab at the bottom).'],
            ['2.', 'Do NOT rename the "Questions" sheet or modify its header row.'],
            ['3.', 'Each row is ONE question with 2 to 6 answer choices.'],
            ['4.', 'The two example rows on the Questions sheet show the expected format — replace them with your own data.'],
            ['5.', 'When done, save the file and upload it on the Admin → Questions page (Import button).'],
            ['6.', 'You may also upload a plain .csv file that follows the same column order.'],
        ]);
        $addRows([[]]);
        $addRows([['COLUMN REFERENCE']], $heading);
        $addRows([['Column', 'Description', 'Required', 'Default']], $bold);
        $addRows([
            ['game_mode_code', 'Code of the game mode — see GAME MODE CODES below. Copy exactly.', 'Yes', ''],
            ['topic_name', 'Name of the topic — see TOPIC NAMES below. Copy exactly, including capitalisation.', 'Yes', ''],
            ['prompt_text', 'The question text shown to the player.', 'Yes', ''],
            ['explanation', 'Optional hint shown to the player after answering.', 'No', '(blank)'],
            ['points', 'Score awarded for a correct answer (10–1000).', 'No', '100'],
            ['time_limit_seconds', 'Seconds allowed per question (5–120).', 'No', '20'],
            ['is_active', '1 = visible to players, 0 = hidden.', 'No', '1'],
            ['choice_1 … choice_6', 'Answer choices. Fill at least choice_1 and choice_2; leave unused columns blank.', '2 minimum', ''],
            ['correct_choice', 'The NUMBER (1–6) of the correct choice.', 'Yes', ''],
            ['feedback_1 … feedback_6', 'Message shown to the player for each choice after answering — explain why it is correct or incorrect. Leave blank for no message.', 'No', '(blank)'],
        ]);
        $addRows([[]]);
        $addRows([['GAME MODE CODES (use the code in the first column, exactly as shown)']], $heading);

        foreach ($gameModes as $gm) {
            $addRows([[$gm->code, $gm->title]]);
        }

        $addRows([[]]);
        $addRows([['TOPIC NAMES (copy exactly, including capitalisation)']], $heading);

        foreach ($topics as $lvl) {
            $addRows([[$lvl->name]]);
        }

        // ── Sheet 2: Questions (the import table) ────────────────
        $writer->addNewSheetAndMakeItCurrent()->setName('Questions');

        $writer->addRow(Row::fromValuesWithStyle([
            'game_mode_code',
            'topic_name',
            'prompt_text',
            'explanation',
            'points',
            'time_limit_seconds',
            'is_active',
            'choice_1',
            'choice_2',
            'choice_3',
            'choice_4',
            'choice_5',
            'choice_6',
            'correct_choice',
            'feedback_1',
            'feedback_2',
            'feedback_3',
            'feedback_4',
            'feedback_5',
            'feedback_6',
        ], $bold));

        // Two filled-in example rows
        $writer->addRow(Row::fromValues([
            'structure_to_name',
            'Alkanes Basics',
            'What is the IUPAC name of CH3-CH2-CH3?',
            'Propane has 3 carbon atoms in a straight chain.',
            100, 20, 1,
            'Methane', 'Ethane', 'Propane', 'Butane', '', '',
            3,
            'Incorrect. Methane has only 1 carbon; this chain has 3.',
            'Incorrect. Ethane has 2 carbons; count again — there are 3.',
            'Correct! Prop- means 3 carbons in a continuous chain.',
            'Incorrect. Butane has 4 carbons; this chain has only 3.',
            '', '',
        ]));
        $writer->addRow(Row::fromValues([
            'name_to_structure',
            'Simple Substituents',
            'Which structure represents 2-methylpropane?',
            '',
            100, 20, 1,
            'CH3-CH2-CH2-CH3', 'CH3-CH(CH3)-CH3', 'CH3-CH2-CH3', 'CH3-C(CH3)2-CH3', '', '',
            2,
            'Incorrect. This is butane — a straight chain with no branches.',
            'Correct! A 3-carbon chain with a methyl branch on carbon 2.',
            'Incorrect. This is propane with no substituents.',
            'Incorrect. This is 2,2-dimethylpropane (two methyl branches).',
            '', '',
        ]));

        $writer->close();

        return response()
            ->download($path, 'questions_import_template.xlsx')
            ->deleteFileAfterSend(true);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt,xlsx', 'max:4096'],
        ]);

        $file = $request->file('file');
        $rows = strtolower($file->getClientOriginalExtension()) === 'xlsx'
            ? $this->rowsFromXlsx($file->getRealPath())
            : $this->rowsFromCsv($file->getRealPath());

        $gameModes = GameMode::pluck('id', 'code');
        $topics = Topic::pluck('id', 'name');

        $imported = 0;
        $skipped = 0;
        $errors = [];
        $lineNumber = 0;
        $headerFound = false;

        DB::transaction(function () use ($rows, $gameModes, $topics, $request, &$imported, &$skipped, &$errors, &$lineNumber, &$headerFound): void {
            foreach ($rows as $row) {
                $lineNumber++;

                if (empty($row) || str_starts_with(trim((string) ($row[0] ?? '')), '#')) {
                    continue;
                }

                if (! $headerFound) {
                    if (trim((string) ($row[0] ?? '')) === 'game_mode_code') {
                        $headerFound = true;
                    }

                    continue;
                }

                if (count(array_filter($row, fn ($v) => trim((string) $v) !== '')) === 0) {
                    continue;
                }

                $row = array_pad($row, 20, '');

                [
                    $gameModeCode, $topicName, $promptText, $explanation,
                    $points, $timeLimitSeconds, $isActive,
                    $c1, $c2, $c3, $c4, $c5, $c6,
                    $correctChoice,
                    $f1, $f2, $f3, $f4, $f5, $f6,
                ] = $row;

                $gameModeCode = trim($gameModeCode);
                $topicName = trim($topicName);
                $promptText = trim($promptText);

                if (! isset($gameModes[$gameModeCode])) {
                    $errors[] = "Row {$lineNumber}: unknown game_mode_code \"{$gameModeCode}\".";
                    $skipped++;

                    continue;
                }

                if (! isset($topics[$topicName])) {
                    $errors[] = "Row {$lineNumber}: unknown topic_name \"{$topicName}\".";
                    $skipped++;

                    continue;
                }

                if ($promptText === '') {
                    $errors[] = "Row {$lineNumber}: prompt_text is required.";
                    $skipped++;

                    continue;
                }

                // Pair each choice with its feedback BEFORE filtering blanks
                // so feedback columns stay aligned with their choice.
                $choices = collect([
                    [$c1, $f1], [$c2, $f2], [$c3, $f3],
                    [$c4, $f4], [$c5, $f5], [$c6, $f6],
                ])
                    ->filter(fn (array $pair) => trim((string) $pair[0]) !== '')
                    ->values();

                if ($choices->count() < 2) {
                    $errors[] = "Row {$lineNumber}: at least 2 choices are required.";
                    $skipped++;

                    continue;
                }

                $correctIndex = (int) $correctChoice - 1;

                if ($correctIndex < 0 || $correctIndex >= $choices->count()) {
                    $errors[] = "Row {$lineNumber}: correct_choice \"{$correctChoice}\" is out of range (1-".$choices->count().').';
                    $skipped++;

                    continue;
                }

                $question = Question::create([
                    'game_mode_id' => $gameModes[$gameModeCode],
                    'topic_id' => $topics[$topicName],
                    'prompt_text' => $promptText,
                    'explanation' => $explanation !== '' ? $explanation : null,
                    'points' => max(10, min(1000, (int) ($points !== '' ? $points : 100))),
                    'time_limit_seconds' => max(5, min(120, (int) ($timeLimitSeconds !== '' ? $timeLimitSeconds : 20))),
                    'is_active' => $isActive !== '' ? (bool) (int) $isActive : true,
                    'created_by' => $request->user()->id,
                ]);

                foreach ($choices as $sortOrder => [$choiceText, $feedbackText]) {
                    $question->choices()->create([
                        'choice_text' => trim($choiceText),
                        'is_correct' => $sortOrder === $correctIndex,
                        'feedback_text' => trim((string) $feedbackText) !== '' ? trim((string) $feedbackText) : null,
                        'sort_order' => $sortOrder + 1,
                    ]);
                }

                $imported++;
            }
        });

        if ($skipped > 0) {
            $preview = implode(' · ', array_slice($errors, 0, 3));
            $more = count($errors) > 3 ? ' (and '.(count($errors) - 3).' more)' : '';

            return redirect()->route('admin.questions.index')
                ->with('error', "Imported {$imported} question(s), skipped {$skipped}. {$preview}{$more}");
        }

        return redirect()->route('admin.questions.index')
            ->with('success', "Successfully imported {$imported} question(s).");
    }

    /**
     * @return list<list<string>>
     */
    private function rowsFromCsv(string $path): array
    {
        $rows = [];
        $handle = fopen($path, 'r');

        try {
            while (($row = fgetcsv($handle)) !== false) {
                $rows[] = array_map(fn ($v) => (string) $v, $row);
            }
        } finally {
            fclose($handle);
        }

        return $rows;
    }

    /**
     * Reads the "Questions" sheet (falling back to the last sheet) of an xlsx workbook.
     *
     * @return list<list<string>>
     */
    private function rowsFromXlsx(string $path): array
    {
        $reader = new XlsxReader;
        $reader->open($path);

        $named = null;
        $last = [];

        try {
            foreach ($reader->getSheetIterator() as $sheet) {
                $sheetRows = [];

                foreach ($sheet->getRowIterator() as $row) {
                    $sheetRows[] = array_map(
                        fn ($cell) => is_scalar($cell) ? trim((string) $cell) : '',
                        $row->toArray(),
                    );
                }

                if (strcasecmp($sheet->getName(), 'Questions') === 0) {
                    $named = $sheetRows;
                    break;
                }

                $last = $sheetRows;
            }
        } finally {
            $reader->close();
        }

        return $named ?? $last;
    }

    public function index(Request $request): Response
    {
        $questions = Question::with('gameMode:id,code,title', 'topic:id,name', 'choices')
            ->when($request->search, fn ($q, $s) => $q->where('prompt_text', 'like', "%{$s}%"))
            ->when($request->game_mode_id, fn ($q, $id) => $q->where('game_mode_id', $id))
            ->when($request->topic_id, fn ($q, $id) => $q->where('topic_id', $id))
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Question $q) => [
                'id' => $q->id,
                'prompt_text' => $q->prompt_text,
                'prompt_image_path' => $q->prompt_image_path,
                'points' => $q->points,
                'is_active' => $q->is_active,
                'game_mode' => $q->gameMode?->only(['id', 'code', 'title']),
                'topic' => $q->topic?->only(['id', 'name']),
                'choices_count' => $q->choices->count(),
            ]);

        return Inertia::render('admin/questions/index', [
            'questions' => $questions,
            'game_modes' => GameMode::all(['id', 'code', 'title']),
            'topics' => Topic::orderBy('order')->get(['id', 'name', 'order']),
            'filters' => $request->only('search', 'game_mode_id', 'topic_id'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/questions/form', [
            'game_modes' => GameMode::where('is_active', true)->get(['id', 'code', 'title']),
            'topics' => Topic::orderBy('order')->get(['id', 'name', 'order', 'questions_per_game']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'game_mode_id' => ['required', 'exists:game_modes,id'],
            'topic_id' => ['required', 'exists:topics,id'],
            'prompt_text' => ['nullable', 'string', 'max:1000'],
            'prompt_image_path' => ['nullable', 'string', 'max:500'],
            'explanation' => ['nullable', 'string', 'max:2000'],
            'points' => ['integer', 'min:10', 'max:1000'],
            'time_limit_seconds' => ['integer', 'min:5', 'max:120'],
            'is_active' => ['boolean'],
            'choices' => ['required', 'array', 'min:2', 'max:6'],
            'choices.*.choice_text' => ['nullable', 'string', 'max:500'],
            'choices.*.choice_image_path' => ['nullable', 'string', 'max:500'],
            'choices.*.is_correct' => ['boolean'],
            'choices.*.feedback_text' => ['nullable', 'string', 'max:1000'],
            'choices.*.sort_order' => ['integer'],
        ]);

        DB::transaction(function () use ($data, $request): void {
            $question = Question::create([
                'game_mode_id' => $data['game_mode_id'],
                'topic_id' => $data['topic_id'],
                'prompt_text' => $data['prompt_text'],
                'prompt_image_path' => $data['prompt_image_path'],
                'explanation' => $data['explanation'],
                'points' => $data['points'] ?? 100,
                'time_limit_seconds' => $data['time_limit_seconds'] ?? 20,
                'is_active' => $data['is_active'] ?? true,
                'created_by' => $request->user()->id,
            ]);

            foreach ($data['choices'] as $choice) {
                $question->choices()->create($choice);
            }
        });

        return redirect()->route('admin.questions.index')->with('success', 'Question created.');
    }

    public function edit(Question $question): Response
    {
        $question->load('choices');

        return Inertia::render('admin/questions/form', [
            'question' => [
                'id' => $question->id,
                'game_mode_id' => $question->game_mode_id,
                'topic_id' => $question->topic_id,
                'prompt_text' => $question->prompt_text,
                'prompt_image_path' => $question->prompt_image_path,
                'explanation' => $question->explanation,
                'points' => $question->points,
                'time_limit_seconds' => $question->time_limit_seconds,
                'is_active' => $question->is_active,
                'choices' => $question->choices->map(fn (QuestionChoice $c) => [
                    'id' => $c->id,
                    'choice_text' => $c->choice_text,
                    'choice_image_path' => $c->choice_image_path,
                    'is_correct' => (bool) $c->is_correct,
                    'feedback_text' => $c->feedback_text,
                    'sort_order' => $c->sort_order,
                ]),
            ],
            'game_modes' => GameMode::where('is_active', true)->get(['id', 'code', 'title']),
            'topics' => Topic::orderBy('order')->get(['id', 'name', 'order', 'questions_per_game']),
        ]);
    }

    public function update(Request $request, Question $question): RedirectResponse
    {
        $data = $request->validate([
            'game_mode_id' => ['required', 'exists:game_modes,id'],
            'topic_id' => ['required', 'exists:topics,id'],
            'prompt_text' => ['nullable', 'string', 'max:1000'],
            'prompt_image_path' => ['nullable', 'string', 'max:500'],
            'explanation' => ['nullable', 'string', 'max:2000'],
            'points' => ['integer', 'min:10', 'max:1000'],
            'time_limit_seconds' => ['integer', 'min:5', 'max:120'],
            'is_active' => ['boolean'],
            'choices' => ['required', 'array', 'min:2', 'max:6'],
            'choices.*.id' => ['nullable', 'integer'],
            'choices.*.choice_text' => ['nullable', 'string', 'max:500'],
            'choices.*.choice_image_path' => ['nullable', 'string', 'max:500'],
            'choices.*.is_correct' => ['boolean'],
            'choices.*.feedback_text' => ['nullable', 'string', 'max:1000'],
            'choices.*.sort_order' => ['integer'],
        ]);

        DB::transaction(function () use ($data, $question): void {
            $question->update([
                'game_mode_id' => $data['game_mode_id'],
                'topic_id' => $data['topic_id'],
                'prompt_text' => $data['prompt_text'],
                'prompt_image_path' => $data['prompt_image_path'],
                'explanation' => $data['explanation'],
                'points' => $data['points'],
                'time_limit_seconds' => $data['time_limit_seconds'],
                'is_active' => $data['is_active'],
            ]);

            $incomingIds = collect($data['choices'])->pluck('id')->filter()->all();
            $question->choices()->whereNotIn('id', $incomingIds)->delete();

            foreach ($data['choices'] as $choiceData) {
                if (! empty($choiceData['id'])) {
                    QuestionChoice::find($choiceData['id'])?->update($choiceData);
                } else {
                    $question->choices()->create($choiceData);
                }
            }
        });

        return redirect()->route('admin.questions.index')->with('success', 'Question updated.');
    }

    public function destroy(Question $question): RedirectResponse
    {
        $question->delete();

        return redirect()->route('admin.questions.index')->with('success', 'Question deleted.');
    }
}
