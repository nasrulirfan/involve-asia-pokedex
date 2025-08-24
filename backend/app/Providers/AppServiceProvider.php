<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\PokeApiClient::class, function ($app) {
            return new \App\Services\PokeApiClient();
        });

        $this->app->singleton(\App\Services\PokemonService::class, function ($app) {
            return new \App\Services\PokemonService(
                $app->make(\App\Services\PokeApiClient::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
