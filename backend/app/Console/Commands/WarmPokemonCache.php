<?php

namespace App\Console\Commands;

use App\Services\PokemonService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class WarmPokemonCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pokemon:warm-cache {--pages=5 : Number of pages to warm} {--limit=20 : Items per page}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Warm the Pokemon cache by pre-loading popular Pokemon data';

    private PokemonService $pokemonService;

    public function __construct(PokemonService $pokemonService)
    {
        parent::__construct();
        $this->pokemonService = $pokemonService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $pages = (int) $this->option('pages');
        $limit = (int) $this->option('limit');

        $this->info("Warming Pokemon cache for {$pages} pages with {$limit} items per page...");

        $progressBar = $this->output->createProgressBar($pages);
        $progressBar->start();

        $successCount = 0;
        $errorCount = 0;

        for ($page = 1; $page <= $pages; $page++) {
            try {
                $result = $this->pokemonService->getPokemonList($page, $limit);
                $successCount += count($result['data']);
                
                Log::info("Warmed cache for page {$page}", [
                    'pokemon_count' => count($result['data']),
                    'page' => $page,
                    'limit' => $limit
                ]);
                
            } catch (\Exception $e) {
                $errorCount++;
                $this->error("Failed to warm cache for page {$page}: " . $e->getMessage());
                
                Log::error("Cache warming failed for page {$page}", [
                    'error' => $e->getMessage(),
                    'page' => $page,
                    'limit' => $limit
                ]);
            }

            $progressBar->advance();
            
            // Small delay to avoid overwhelming the API
            usleep(100000); // 100ms
        }

        $progressBar->finish();
        $this->newLine();

        if ($errorCount === 0) {
            $this->info("✅ Successfully warmed cache for {$successCount} Pokemon!");
        } else {
            $this->warn("⚠️  Completed with {$errorCount} errors. Successfully cached {$successCount} Pokemon.");
        }

        return $errorCount === 0 ? 0 : 1;
    }
}