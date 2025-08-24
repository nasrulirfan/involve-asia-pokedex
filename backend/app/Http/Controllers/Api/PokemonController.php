<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Services\PokemonService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PokemonController extends Controller
{
    use ApiResponse;

    private PokemonService $pokemonService;

    public function __construct(PokemonService $pokemonService)
    {
        $this->pokemonService = $pokemonService;
    }

    /**
     * Display a listing of Pokemon.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Validate request parameters
            $validated = $request->validate([
                'page' => 'integer|min:1',
                'limit' => 'integer|min:1|max:100'
            ]);

            // Set defaults for page and limit
            $page = $validated['page'] ?? 1;
            $limit = $validated['limit'] ?? 20;

            Log::info('Pokemon API request', [
                'page' => $page,
                'limit' => $limit,
                'ip' => $request->ip()
            ]);

            // Get Pokemon data from service
            $result = $this->pokemonService->getPokemonList($page, $limit);

            return $this->paginatedResponse(
                $result['data'],
                $result['pagination'],
                'Pokemon list retrieved successfully'
            );

        } catch (ValidationException $e) {
            Log::warning('Pokemon API validation error', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);

            return $this->errorResponse(
                'Invalid request parameters',
                400,
                $e->errors()
            );

        } catch (\Exception $e) {
            Log::error('Pokemon API error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            // Check if it's an external API issue
            if (str_contains($e->getMessage(), 'PokeAPI') || 
                str_contains($e->getMessage(), 'HTTP') ||
                str_contains($e->getMessage(), 'timeout') ||
                str_contains($e->getMessage(), 'connection')) {
                
                return $this->errorResponse(
                    'External service temporarily unavailable. Please try again later.',
                    503
                );
            }

            // Generic internal server error
            return $this->errorResponse(
                'An internal error occurred. Please try again later.',
                500
            );
        }
    }
}