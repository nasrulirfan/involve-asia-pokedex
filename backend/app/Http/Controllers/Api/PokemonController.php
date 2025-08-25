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
                'limit' => 'integer|min:1|max:100',
                'search' => 'string|max:255'
            ]);

            // Set defaults for page and limit
            $page = $validated['page'] ?? 1;
            $limit = $validated['limit'] ?? 20;
            $search = $validated['search'] ?? null;

            Log::info('Pokemon API request', [
                'page' => $page,
                'limit' => $limit,
                'search' => $search,
                'ip' => $request->ip()
            ]);

            // Get Pokemon data from service
            $result = $this->pokemonService->getPokemonList($page, $limit, $search);

            // Create response with caching headers
            $response = $this->paginatedResponse(
                $result['data'],
                $result['pagination'],
                'Pokemon list retrieved successfully'
            );

            // Add HTTP caching headers for performance optimization
            $cacheTime = $search ? 300 : 1800; // 5 minutes for search, 30 minutes for regular lists
            $etag = md5(json_encode($result) . $page . $limit . ($search ?? ''));
            
            $response->header('Cache-Control', "public, max-age={$cacheTime}, s-maxage={$cacheTime}")
                     ->header('Vary', 'Accept-Encoding')
                     ->header('ETag', '"' . $etag . '"')
                     ->header('Last-Modified', gmdate('D, d M Y H:i:s') . ' GMT');

            // Add performance headers
            if (defined('LARAVEL_START')) {
                $response->header('X-Response-Time', number_format((microtime(true) - LARAVEL_START) * 1000, 2) . 'ms');
            }
            $response->header('X-Cache-Status', 'MISS'); // This would be set to HIT by a reverse proxy cache

            return $response;

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
                (str_contains($e->getMessage(), 'connection') && !str_contains($e->getMessage(), 'Database'))) {
                
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