<?php

namespace Tests\Feature;

use App\Services\PokemonService;
use Illuminate\Support\Facades\Log;
use Mockery;
use Tests\TestCase;

class PokemonApiTest extends TestCase
{

    protected function setUp(): void
    {
        parent::setUp();
        
        // Disable logging during tests to avoid cluttering output
        Log::shouldReceive('info')->andReturn(null);
        Log::shouldReceive('warning')->andReturn(null);
        Log::shouldReceive('error')->andReturn(null);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /**
     * Test successful Pokemon list retrieval with default parameters
     */
    public function test_pokemon_list_success_with_defaults(): void
    {
        // Mock the PokemonService
        $mockService = Mockery::mock(PokemonService::class);
        $mockService->shouldReceive('getPokemonList')
            ->with(1, 20)
            ->once()
            ->andReturn([
                'data' => [
                    [
                        'name' => 'bulbasaur',
                        'image' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png',
                        'types' => ['grass', 'poison'],
                        'height' => 7,
                        'weight' => 69
                    ],
                    [
                        'name' => 'ivysaur',
                        'image' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png',
                        'types' => ['grass', 'poison'],
                        'height' => 10,
                        'weight' => 130
                    ]
                ],
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 65,
                    'total_count' => 1292,
                    'has_next' => true
                ]
            ]);

        $this->app->instance(PokemonService::class, $mockService);

        $response = $this->getJson('/api/pokemons');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'name',
                        'image',
                        'types',
                        'height',
                        'weight'
                    ]
                ],
                'pagination' => [
                    'current_page',
                    'total_pages',
                    'total_count',
                    'has_next'
                ]
            ])
            ->assertJson([
                'success' => true,
                'message' => 'Pokemon list retrieved successfully',
                'data' => [
                    [
                        'name' => 'bulbasaur',
                        'types' => ['grass', 'poison'],
                        'height' => 7,
                        'weight' => 69
                    ],
                    [
                        'name' => 'ivysaur',
                        'types' => ['grass', 'poison'],
                        'height' => 10,
                        'weight' => 130
                    ]
                ],
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 65,
                    'total_count' => 1292,
                    'has_next' => true
                ]
            ]);
    }

    /**
     * Test Pokemon list with custom page and limit parameters
     */
    public function test_pokemon_list_with_custom_parameters(): void
    {
        $mockService = Mockery::mock(PokemonService::class);
        $mockService->shouldReceive('getPokemonList')
            ->with(2, 10)
            ->once()
            ->andReturn([
                'data' => [
                    [
                        'name' => 'wartortle',
                        'image' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/8.png',
                        'types' => ['water'],
                        'height' => 10,
                        'weight' => 225
                    ]
                ],
                'pagination' => [
                    'current_page' => 2,
                    'total_pages' => 130,
                    'total_count' => 1292,
                    'has_next' => true
                ]
            ]);

        $this->app->instance(PokemonService::class, $mockService);

        $response = $this->getJson('/api/pokemons?page=2&limit=10');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'pagination' => [
                    'current_page' => 2,
                    'total_pages' => 130,
                    'has_next' => true
                ]
            ]);
    }

    /**
     * Test validation error for invalid page parameter
     */
    public function test_validation_error_invalid_page(): void
    {
        $response = $this->getJson('/api/pokemons?page=0');

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid request parameters',
                'errors' => [
                    'page' => ['The page field must be at least 1.']
                ]
            ]);
    }

    /**
     * Test validation error for invalid limit parameter
     */
    public function test_validation_error_invalid_limit(): void
    {
        $response = $this->getJson('/api/pokemons?limit=101');

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid request parameters',
                'errors' => [
                    'limit' => ['The limit field must not be greater than 100.']
                ]
            ]);
    }

    /**
     * Test validation error for negative limit
     */
    public function test_validation_error_negative_limit(): void
    {
        $response = $this->getJson('/api/pokemons?limit=-5');

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid request parameters',
                'errors' => [
                    'limit' => ['The limit field must be at least 1.']
                ]
            ]);
    }

    /**
     * Test validation error for non-integer parameters
     */
    public function test_validation_error_non_integer_parameters(): void
    {
        $response = $this->getJson('/api/pokemons?page=abc&limit=xyz');

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid request parameters',
                'errors' => [
                    'page' => ['The page field must be an integer.'],
                    'limit' => ['The limit field must be an integer.']
                ]
            ]);
    }

    /**
     * Test external API service unavailable (503 error)
     */
    public function test_external_api_unavailable(): void
    {
        $mockService = Mockery::mock(PokemonService::class);
        $mockService->shouldReceive('getPokemonList')
            ->with(1, 20)
            ->once()
            ->andThrow(new \Exception('PokeAPI connection timeout'));

        $this->app->instance(PokemonService::class, $mockService);

        $response = $this->getJson('/api/pokemons');

        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
                'message' => 'External service temporarily unavailable. Please try again later.'
            ]);
    }

    /**
     * Test HTTP connection error (503 error)
     */
    public function test_http_connection_error(): void
    {
        $mockService = Mockery::mock(PokemonService::class);
        $mockService->shouldReceive('getPokemonList')
            ->with(1, 20)
            ->once()
            ->andThrow(new \Exception('HTTP request failed'));

        $this->app->instance(PokemonService::class, $mockService);

        $response = $this->getJson('/api/pokemons');

        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
                'message' => 'External service temporarily unavailable. Please try again later.'
            ]);
    }

    /**
     * Test internal server error (500 error)
     */
    public function test_internal_server_error(): void
    {
        $mockService = Mockery::mock(PokemonService::class);
        $mockService->shouldReceive('getPokemonList')
            ->with(1, 20)
            ->once()
            ->andThrow(new \Exception('Database connection failed'));

        $this->app->instance(PokemonService::class, $mockService);

        $response = $this->getJson('/api/pokemons');

        $response->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => 'An internal error occurred. Please try again later.'
            ]);
    }

    /**
     * Test maximum limit boundary
     */
    public function test_maximum_limit_boundary(): void
    {
        $mockService = Mockery::mock(PokemonService::class);
        $mockService->shouldReceive('getPokemonList')
            ->with(1, 100)
            ->once()
            ->andReturn([
                'data' => [],
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 13,
                    'total_count' => 1292,
                    'has_next' => true
                ]
            ]);

        $this->app->instance(PokemonService::class, $mockService);

        $response = $this->getJson('/api/pokemons?limit=100');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 13
                ]
            ]);
    }

    /**
     * Test empty Pokemon list response
     */
    public function test_empty_pokemon_list(): void
    {
        $mockService = Mockery::mock(PokemonService::class);
        $mockService->shouldReceive('getPokemonList')
            ->with(999, 20)
            ->once()
            ->andReturn([
                'data' => [],
                'pagination' => [
                    'current_page' => 999,
                    'total_pages' => 65,
                    'total_count' => 1292,
                    'has_next' => false
                ]
            ]);

        $this->app->instance(PokemonService::class, $mockService);

        $response = $this->getJson('/api/pokemons?page=999');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [],
                'pagination' => [
                    'current_page' => 999,
                    'has_next' => false
                ]
            ]);
    }

    /**
     * Test response structure matches API specification
     */
    public function test_response_structure_matches_specification(): void
    {
        $mockService = Mockery::mock(PokemonService::class);
        $mockService->shouldReceive('getPokemonList')
            ->with(1, 20)
            ->once()
            ->andReturn([
                'data' => [
                    [
                        'name' => 'pikachu',
                        'image' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
                        'types' => ['electric'],
                        'height' => 4,
                        'weight' => 60
                    ]
                ],
                'pagination' => [
                    'current_page' => 1,
                    'total_pages' => 65,
                    'total_count' => 1292,
                    'has_next' => true
                ]
            ]);

        $this->app->instance(PokemonService::class, $mockService);

        $response = $this->getJson('/api/pokemons');

        // Verify exact structure matches the API specification
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    '*' => [
                        'name',
                        'image',
                        'types',
                        'height',
                        'weight'
                    ]
                ],
                'pagination' => [
                    'current_page',
                    'total_pages',
                    'total_count',
                    'has_next'
                ]
            ]);

        // Verify data types
        $responseData = $response->json();
        $this->assertIsBool($responseData['success']);
        $this->assertIsString($responseData['message']);
        $this->assertIsArray($responseData['data']);
        $this->assertIsArray($responseData['pagination']);
        
        if (!empty($responseData['data'])) {
            $pokemon = $responseData['data'][0];
            $this->assertIsString($pokemon['name']);
            $this->assertIsString($pokemon['image']);
            $this->assertIsArray($pokemon['types']);
            $this->assertIsInt($pokemon['height']);
            $this->assertIsInt($pokemon['weight']);
        }

        $pagination = $responseData['pagination'];
        $this->assertIsInt($pagination['current_page']);
        $this->assertIsInt($pagination['total_pages']);
        $this->assertIsInt($pagination['total_count']);
        $this->assertIsBool($pagination['has_next']);
    }
}