<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PokeApiClient
{
    private Client $httpClient;
    private string $baseUrl;
    private int $cacheTtl;

    public function __construct()
    {
        $this->httpClient = new Client([
            'timeout' => 30,
            'connect_timeout' => 10,
            'headers' => [
                'Accept' => 'application/json',
                'User-Agent' => 'Pokedex-App/1.0'
            ]
        ]);
        
        $this->baseUrl = config('app.pokeapi_base_url', 'https://pokeapi.co/api/v2');
        $this->cacheTtl = config('app.pokeapi_cache_ttl', 86400); // 24 hours default
    }

    /**
     * Fetch Pokemon list from PokeAPI with pagination
     *
     * @param int $limit Number of Pokemon to fetch
     * @param int $offset Starting offset for pagination
     * @return array
     * @throws \Exception
     */
    public function getPokemonList(int $limit = 20, int $offset = 0): array
    {
        $cacheKey = "pokemon_list_{$limit}_{$offset}";
        
        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($limit, $offset) {
            try {
                $url = "{$this->baseUrl}/pokemon";
                $response = $this->httpClient->get($url, [
                    'query' => [
                        'limit' => $limit,
                        'offset' => $offset
                    ]
                ]);

                $data = json_decode($response->getBody()->getContents(), true);
                
                if (!$data || !isset($data['results'])) {
                    throw new \Exception('Invalid response format from PokeAPI');
                }

                Log::info("Fetched Pokemon list", [
                    'limit' => $limit,
                    'offset' => $offset,
                    'count' => count($data['results'])
                ]);

                return $data;
                
            } catch (RequestException $e) {
                Log::error('PokeAPI request failed', [
                    'url' => $url ?? 'unknown',
                    'error' => $e->getMessage(),
                    'code' => $e->getCode()
                ]);
                
                if ($e->hasResponse()) {
                    $statusCode = $e->getResponse()->getStatusCode();
                    throw new \Exception("PokeAPI request failed with status {$statusCode}: " . $e->getMessage());
                }
                
                throw new \Exception('PokeAPI request failed: ' . $e->getMessage());
                
            } catch (GuzzleException $e) {
                Log::error('HTTP client error', [
                    'error' => $e->getMessage(),
                    'code' => $e->getCode()
                ]);
                
                throw new \Exception('HTTP client error: ' . $e->getMessage());
            }
        });
    }

    /**
     * Fetch individual Pokemon details from PokeAPI
     *
     * @param string $url Pokemon detail URL
     * @return array
     * @throws \Exception
     */
    public function getPokemonDetails(string $url): array
    {
        // Extract Pokemon ID or name from URL for cache key
        $cacheKey = 'pokemon_details_' . md5($url);
        
        return Cache::remember($cacheKey, $this->cacheTtl, function () use ($url) {
            try {
                $response = $this->httpClient->get($url);
                $data = json_decode($response->getBody()->getContents(), true);
                
                if (!$data || !isset($data['name'])) {
                    throw new \Exception('Invalid Pokemon details response format');
                }

                Log::debug("Fetched Pokemon details", [
                    'name' => $data['name'] ?? 'unknown',
                    'url' => $url
                ]);

                return $data;
                
            } catch (RequestException $e) {
                Log::error('Pokemon details request failed', [
                    'url' => $url,
                    'error' => $e->getMessage(),
                    'code' => $e->getCode()
                ]);
                
                if ($e->hasResponse()) {
                    $statusCode = $e->getResponse()->getStatusCode();
                    throw new \Exception("Pokemon details request failed with status {$statusCode}: " . $e->getMessage());
                }
                
                throw new \Exception('Pokemon details request failed: ' . $e->getMessage());
                
            } catch (GuzzleException $e) {
                Log::error('HTTP client error for Pokemon details', [
                    'url' => $url,
                    'error' => $e->getMessage(),
                    'code' => $e->getCode()
                ]);
                
                throw new \Exception('HTTP client error: ' . $e->getMessage());
            }
        });
    }

    /**
     * Clear cache for Pokemon data
     *
     * @param string|null $pattern Optional pattern to clear specific cache entries
     * @return bool
     */
    public function clearCache(?string $pattern = null): bool
    {
        try {
            if ($pattern) {
                // Clear specific cache entries matching pattern
                $keys = Cache::getRedis()->keys("*{$pattern}*");
                if (!empty($keys)) {
                    Cache::getRedis()->del($keys);
                }
            } else {
                // Clear all Pokemon-related cache
                $keys = Cache::getRedis()->keys('*pokemon*');
                if (!empty($keys)) {
                    Cache::getRedis()->del($keys);
                }
            }
            
            Log::info('Pokemon cache cleared', ['pattern' => $pattern]);
            return true;
            
        } catch (\Exception $e) {
            Log::error('Failed to clear Pokemon cache', [
                'pattern' => $pattern,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Get cache statistics
     *
     * @return array
     */
    public function getCacheStats(): array
    {
        try {
            $keys = Cache::getRedis()->keys('*pokemon*');
            return [
                'total_cached_items' => count($keys),
                'cache_ttl' => $this->cacheTtl,
                'cache_driver' => config('cache.default')
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get cache stats', ['error' => $e->getMessage()]);
            return [
                'total_cached_items' => 0,
                'cache_ttl' => $this->cacheTtl,
                'cache_driver' => config('cache.default'),
                'error' => $e->getMessage()
            ];
        }
    }
}