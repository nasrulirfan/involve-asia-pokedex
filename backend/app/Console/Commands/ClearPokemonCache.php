<?php

namespace App\Console\Commands;

use App\Services\PokeApiClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ClearPokemonCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pokemon:clear-cache {--pattern= : Optional pattern to match cache keys}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear Pokemon cache data';

    private PokeApiClient $pokeApiClient;

    public function __construct(PokeApiClient $pokeApiClient)
    {
        parent::__construct();
        $this->pokeApiClient = $pokeApiClient;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $pattern = $this->option('pattern');

        $this->info('Clearing Pokemon cache...');

        try {
            $success = $this->pokeApiClient->clearCache($pattern);

            if ($success) {
                $message = $pattern 
                    ? "✅ Successfully cleared Pokemon cache matching pattern: {$pattern}"
                    : "✅ Successfully cleared all Pokemon cache data";
                
                $this->info($message);
                
                Log::info('Pokemon cache cleared via command', [
                    'pattern' => $pattern,
                    'success' => true
                ]);
                
                return 0;
            } else {
                $this->error('❌ Failed to clear Pokemon cache');
                return 1;
            }

        } catch (\Exception $e) {
            $this->error('❌ Error clearing Pokemon cache: ' . $e->getMessage());
            
            Log::error('Failed to clear Pokemon cache via command', [
                'pattern' => $pattern,
                'error' => $e->getMessage()
            ]);
            
            return 1;
        }
    }
}