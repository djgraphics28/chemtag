<?php

use App\Models\GameMode;
use App\Models\Level;
use App\Models\Question;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;

beforeEach(function (): void {
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');

    $this->gameMode = GameMode::firstOrCreate(
        ['code' => 'structure_to_name'],
        ['title' => 'Name It Right', 'description' => '', 'icon' => null, 'is_active' => true]
    );
    $this->level = Level::firstOrCreate(
        ['name' => 'Alkanes Basics'],
        ['order' => 1, 'difficulty' => 'easy', 'unlock_score_threshold' => 0]
    );
});

it('downloads the XLSX template with Instructions and Questions sheets', function (): void {
    $response = actingAs($this->admin)
        ->get('/admin/questions/template')
        ->assertOk()
        ->assertDownload('questions_import_template.xlsx');

    $path = tempnam(sys_get_temp_dir(), 'template_test').'.xlsx';
    file_put_contents($path, $response->getFile()->getContent());

    $reader = new XlsxReader;
    $reader->open($path);

    $sheetNames = [];
    foreach ($reader->getSheetIterator() as $sheet) {
        $sheetNames[] = $sheet->getName();
    }
    $reader->close();
    unlink($path);

    expect($sheetNames)->toBe(['Instructions', 'Questions']);
});

it('imports valid questions from the XLSX template format', function (): void {
    $path = tempnam(sys_get_temp_dir(), 'import_test').'.xlsx';

    $writer = new XlsxWriter;
    $writer->openToFile($path);
    $writer->getCurrentSheet()->setName('Instructions');
    $writer->addRow(Row::fromValues(['These instructions should be ignored on import.']));
    $writer->addNewSheetAndMakeItCurrent()->setName('Questions');
    $writer->addRow(Row::fromValues([
        'game_mode_code', 'level_name', 'prompt_text', 'explanation', 'points', 'time_limit_seconds',
        'is_active', 'choice_1', 'choice_2', 'choice_3', 'choice_4', 'choice_5', 'choice_6', 'correct_choice',
    ]));
    $writer->addRow(Row::fromValues([
        'structure_to_name', 'Alkanes Basics', 'What is C2H6?', 'Ethane has 2 carbons.',
        150, 25, 1, 'Methane', 'Ethane', '', '', '', '', 2,
    ]));
    $writer->close();

    $file = new UploadedFile($path, 'import.xlsx', null, null, true);

    actingAs($this->admin)
        ->post('/admin/questions/import', ['file' => $file])
        ->assertRedirect('/admin/questions')
        ->assertSessionHas('success');

    $question = Question::where('prompt_text', 'What is C2H6?')->first();
    expect($question)->not->toBeNull();
    expect($question->points)->toBe(150);
    expect($question->choices()->count())->toBe(2);
    expect($question->choices()->where('is_correct', true)->value('choice_text'))->toBe('Ethane');

    unlink($path);
});

it('imports valid questions from CSV', function (): void {
    $csv = implode("\n", [
        '# comment row skipped',
        'game_mode_code,level_name,prompt_text,explanation,points,time_limit_seconds,is_active,choice_1,choice_2,choice_3,choice_4,choice_5,choice_6,correct_choice',
        'structure_to_name,Alkanes Basics,What is CH4?,Methane,100,20,1,Methane,Ethane,Propane,,,,1',
    ]);

    $file = UploadedFile::fake()->createWithContent('import.csv', $csv);

    actingAs($this->admin)
        ->post('/admin/questions/import', ['file' => $file])
        ->assertRedirect('/admin/questions');

    $question = Question::where('prompt_text', 'What is CH4?')->first();
    expect($question)->not->toBeNull();
    expect($question->choices()->count())->toBe(3);
    expect($question->choices()->where('is_correct', true)->value('choice_text'))->toBe('Methane');
});

it('skips rows with unknown game_mode_code and reports error', function (): void {
    $csv = implode("\n", [
        'game_mode_code,level_name,prompt_text,explanation,points,time_limit_seconds,is_active,choice_1,choice_2,choice_3,choice_4,choice_5,choice_6,correct_choice',
        'bad_code,Alkanes Basics,Some question,,100,20,1,A,B,,,,,1',
    ]);

    $file = UploadedFile::fake()->createWithContent('import.csv', $csv);

    actingAs($this->admin)
        ->post('/admin/questions/import', ['file' => $file])
        ->assertRedirect('/admin/questions')
        ->assertSessionHas('error');

    expect(Question::count())->toBe(0);
});

it('skips rows with unknown level_name', function (): void {
    $csv = implode("\n", [
        'game_mode_code,level_name,prompt_text,explanation,points,time_limit_seconds,is_active,choice_1,choice_2,choice_3,choice_4,choice_5,choice_6,correct_choice',
        'structure_to_name,No Such Level,Some question,,100,20,1,A,B,,,,,1',
    ]);

    $file = UploadedFile::fake()->createWithContent('import.csv', $csv);

    actingAs($this->admin)
        ->post('/admin/questions/import', ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Question::count())->toBe(0);
});

it('skips rows where correct_choice is out of range', function (): void {
    $csv = implode("\n", [
        'game_mode_code,level_name,prompt_text,explanation,points,time_limit_seconds,is_active,choice_1,choice_2,choice_3,choice_4,choice_5,choice_6,correct_choice',
        'structure_to_name,Alkanes Basics,Which one?,,100,20,1,A,B,,,,,5',
    ]);

    $file = UploadedFile::fake()->createWithContent('import.csv', $csv);

    actingAs($this->admin)
        ->post('/admin/questions/import', ['file' => $file])
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Question::count())->toBe(0);
});

it('requires a file upload', function (): void {
    actingAs($this->admin)
        ->post('/admin/questions/import', [])
        ->assertSessionHasErrors('file');
});
