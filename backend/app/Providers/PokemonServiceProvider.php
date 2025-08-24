<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class PokemonServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register Pokemon-related services here
        // This will be used in future tasks for dependency injection
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}