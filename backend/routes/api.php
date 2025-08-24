<?php

use App\Http\Controllers\Api\PokemonController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'service' => 'Pokedex API'
    ]);
});

// Pokemon API routes
Route::prefix('pokemons')->group(function () {
    Route::get('/', [PokemonController::class, 'index']);
});

// User routes (for future authentication if needed)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});