<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class PokemonService
{
    private PokeApiClient $pokeApiClient;

    public function __construct(PokeApiClient $pokeApiClient)
    {
        $this->pokeApiClient = $pokeApiClient;
    }

    /**
     * Get paginated Pokemon list with detailed information
     *
     * @param int $page Page number (1-based)
     * @param int $limit Number of Pokemon per page
     * @param string|null $search Search query to filter Pokemon by name
     * @return array
     * @throws \Exception
     */
    public function getPokemonList(int $page = 1, int $limit = 20, ?string $search = null): array
    {
        Log::info('Fetching Pokemon list', [
            'page' => $page,
            'limit' => $limit,
            'search' => $search
        ]);

        try {
            if ($search && !empty(trim($search))) {
                // Handle search functionality
                return $this->searchPokemon($search, $page, $limit);
            }

            // Regular pagination without search
            return $this->getPaginatedPokemonList($page, $limit);

        } catch (\Exception $e) {
            Log::error('Failed to get Pokemon list', [
                'page' => $page,
                'limit' => $limit,
                'search' => $search,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get paginated Pokemon list without search
     *
     * @param int $page
     * @param int $limit
     * @return array
     * @throws \Exception
     */
    private function getPaginatedPokemonList(int $page, int $limit): array
    {
        // Calculate offset for PokeAPI (0-based)
        $offset = ($page - 1) * $limit;

        // Get Pokemon list from PokeAPI
        $pokemonListResponse = $this->pokeApiClient->getPokemonList($limit, $offset);
        
        if (!isset($pokemonListResponse['results']) || !isset($pokemonListResponse['count'])) {
            throw new \Exception('Invalid Pokemon list response format');
        }

        $pokemonList = $pokemonListResponse['results'];
        $totalCount = $pokemonListResponse['count'];
        
        // Calculate pagination metadata
        $totalPages = (int) ceil($totalCount / $limit);
        $hasNext = $page < $totalPages;

        // Fetch detailed information for each Pokemon
        $detailedPokemon = [];
        foreach ($pokemonList as $pokemon) {
            try {
                $pokemonDetails = $this->fetchPokemonDetails($pokemon['url']);
                $detailedPokemon[] = $this->formatPokemonData($pokemonDetails);
            } catch (\Exception $e) {
                Log::warning('Failed to fetch Pokemon details', [
                    'pokemon_name' => $pokemon['name'] ?? 'unknown',
                    'url' => $pokemon['url'] ?? 'unknown',
                    'error' => $e->getMessage()
                ]);
                // Continue with other Pokemon instead of failing completely
                continue;
            }
        }

        return [
            'data' => $detailedPokemon,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalPages,
                'total_count' => $totalCount,
                'has_next' => $hasNext
            ]
        ];
    }

    /**
     * Search Pokemon by name
     *
     * @param string $search
     * @param int $page
     * @param int $limit
     * @return array
     * @throws \Exception
     */
    private function searchPokemon(string $search, int $page, int $limit): array
    {
        $searchTerm = strtolower(trim($search));
        
        Log::info('Searching Pokemon', [
            'search_term' => $searchTerm,
            'page' => $page,
            'limit' => $limit
        ]);

        // For search, we need to get a larger dataset to search through
        // We'll fetch multiple pages and filter them
        $searchLimit = min(1000, 200); // Reasonable limit for search
        $allPokemonResponse = $this->pokeApiClient->getPokemonList($searchLimit, 0);
        
        if (!isset($allPokemonResponse['results'])) {
            throw new \Exception('Invalid Pokemon search response format');
        }

        // Filter Pokemon by name
        $matchingPokemon = [];
        foreach ($allPokemonResponse['results'] as $pokemon) {
            if (str_contains(strtolower($pokemon['name']), $searchTerm)) {
                $matchingPokemon[] = $pokemon;
            }
        }

        // Calculate pagination for search results
        $totalMatches = count($matchingPokemon);
        $totalPages = (int) ceil($totalMatches / $limit);
        $hasNext = $page < $totalPages;
        
        // Get the Pokemon for the current page
        $offset = ($page - 1) * $limit;
        $pageResults = array_slice($matchingPokemon, $offset, $limit);

        // Fetch detailed information for matching Pokemon
        $detailedPokemon = [];
        foreach ($pageResults as $pokemon) {
            try {
                $pokemonDetails = $this->fetchPokemonDetails($pokemon['url']);
                $detailedPokemon[] = $this->formatPokemonData($pokemonDetails);
            } catch (\Exception $e) {
                Log::warning('Failed to fetch Pokemon details during search', [
                    'pokemon_name' => $pokemon['name'] ?? 'unknown',
                    'url' => $pokemon['url'] ?? 'unknown',
                    'error' => $e->getMessage()
                ]);
                continue;
            }
        }

        return [
            'data' => $detailedPokemon,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $totalPages,
                'total_count' => $totalMatches,
                'has_next' => $hasNext
            ]
        ];
    }

    /**
     * Fetch individual Pokemon details from PokeAPI
     *
     * @param string $url Pokemon detail URL
     * @return array
     * @throws \Exception
     */
    public function fetchPokemonDetails(string $url): array
    {
        try {
            return $this->pokeApiClient->getPokemonDetails($url);
        } catch (\Exception $e) {
            Log::error('Failed to fetch Pokemon details', [
                'url' => $url,
                'error' => $e->getMessage()
            ]);
            throw new \Exception("Failed to fetch Pokemon details: " . $e->getMessage());
        }
    }

    /**
     * Transform PokeAPI response to required JSON format
     *
     * @param array $pokemonData Raw Pokemon data from PokeAPI
     * @return array Formatted Pokemon data
     * @throws \Exception
     */
    public function formatPokemonData(array $pokemonData): array
    {
        try {
            // Validate required fields
            if (!isset($pokemonData['name'])) {
                throw new \Exception('Pokemon name is missing from API response');
            }

            // Extract official artwork image
            $image = $this->extractOfficialArtwork($pokemonData);
            
            // Extract types
            $types = [];
            if (isset($pokemonData['types']) && is_array($pokemonData['types'])) {
                foreach ($pokemonData['types'] as $typeData) {
                    if (isset($typeData['type']['name'])) {
                        $types[] = $typeData['type']['name'];
                    }
                }
            }

            // Extract height and weight (convert from hectograms/decimeters to more readable units)
            $height = isset($pokemonData['height']) ? (int) $pokemonData['height'] : 0;
            $weight = isset($pokemonData['weight']) ? (int) $pokemonData['weight'] : 0;

            return [
                'name' => $pokemonData['name'],
                'image' => $image,
                'types' => $types,
                'height' => $height, // in decimeters
                'weight' => $weight  // in hectograms
            ];

        } catch (\Exception $e) {
            Log::error('Failed to format Pokemon data', [
                'pokemon_name' => $pokemonData['name'] ?? 'unknown',
                'error' => $e->getMessage()
            ]);
            throw new \Exception("Failed to format Pokemon data: " . $e->getMessage());
        }
    }

    /**
     * Extract official artwork image from Pokemon sprites
     *
     * @param array $pokemonData Pokemon data from PokeAPI
     * @return string|null Official artwork URL or null if not available
     */
    private function extractOfficialArtwork(array $pokemonData): ?string
    {
        // Try to get official artwork first
        if (isset($pokemonData['sprites']['other']['official-artwork']['front_default'])) {
            $artwork = $pokemonData['sprites']['other']['official-artwork']['front_default'];
            if (!empty($artwork)) {
                return $artwork;
            }
        }

        // Fallback to regular front sprite if official artwork is not available
        if (isset($pokemonData['sprites']['front_default'])) {
            $sprite = $pokemonData['sprites']['front_default'];
            if (!empty($sprite)) {
                return $sprite;
            }
        }

        // Log warning if no image is available
        Log::warning('No image available for Pokemon', [
            'pokemon_name' => $pokemonData['name'] ?? 'unknown'
        ]);

        return null;
    }
}