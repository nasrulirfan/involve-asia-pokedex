<?php

namespace Tests\Unit;

use App\Services\PokemonService;
use App\Services\PokeApiClient;
use Tests\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

class PokemonServiceTest extends TestCase
{
    private PokemonService $pokemonService;
    private MockObject $mockPokeApiClient;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockPokeApiClient = $this->createMock(PokeApiClient::class);
        $this->pokemonService = new PokemonService($this->mockPokeApiClient);
    }

    public function testGetPokemonListWithValidData(): void
    {
        // Mock PokeAPI list response
        $mockListResponse = [
            'count' => 1292,
            'results' => [
                [
                    'name' => 'bulbasaur',
                    'url' => 'https://pokeapi.co/api/v2/pokemon/1/'
                ],
                [
                    'name' => 'ivysaur',
                    'url' => 'https://pokeapi.co/api/v2/pokemon/2/'
                ]
            ]
        ];

        // Mock Pokemon details responses
        $mockBulbasaurDetails = [
            'name' => 'bulbasaur',
            'height' => 7,
            'weight' => 69,
            'types' => [
                ['type' => ['name' => 'grass']],
                ['type' => ['name' => 'poison']]
            ],
            'sprites' => [
                'other' => [
                    'official-artwork' => [
                        'front_default' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png'
                    ]
                ]
            ]
        ];

        $mockIvysaurDetails = [
            'name' => 'ivysaur',
            'height' => 10,
            'weight' => 130,
            'types' => [
                ['type' => ['name' => 'grass']],
                ['type' => ['name' => 'poison']]
            ],
            'sprites' => [
                'other' => [
                    'official-artwork' => [
                        'front_default' => 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/2.png'
                    ]
                ]
            ]
        ];

        // Set up mock expectations
        $this->mockPokeApiClient
            ->expects($this->once())
            ->method('getPokemonList')
            ->with(20, 0)
            ->willReturn($mockListResponse);

        $this->mockPokeApiClient
            ->expects($this->exactly(2))
            ->method('getPokemonDetails')
            ->willReturnMap([
                ['https://pokeapi.co/api/v2/pokemon/1/', $mockBulbasaurDetails],
                ['https://pokeapi.co/api/v2/pokemon/2/', $mockIvysaurDetails]
            ]);

        // Execute the method
        $result = $this->pokemonService->getPokemonList(1, 20);

        // Assertions
        $this->assertIsArray($result);
        $this->assertArrayHasKey('data', $result);
        $this->assertArrayHasKey('pagination', $result);
        
        // Check data structure
        $this->assertCount(2, $result['data']);
        
        // Check first Pokemon
        $bulbasaur = $result['data'][0];
        $this->assertEquals('bulbasaur', $bulbasaur['name']);
        $this->assertEquals(['grass', 'poison'], $bulbasaur['types']);
        $this->assertEquals(7, $bulbasaur['height']);
        $this->assertEquals(69, $bulbasaur['weight']);
        $this->assertStringContainsString('official-artwork/1.png', $bulbasaur['image']);
        
        // Check pagination
        $pagination = $result['pagination'];
        $this->assertEquals(1, $pagination['current_page']);
        $this->assertEquals(65, $pagination['total_pages']); // ceil(1292/20)
        $this->assertEquals(1292, $pagination['total_count']);
        $this->assertTrue($pagination['has_next']);
    }

    public function testGetPokemonListWithPaginationCalculation(): void
    {
        // Test page 3 with limit 10
        $mockListResponse = [
            'count' => 100,
            'results' => []
        ];

        $this->mockPokeApiClient
            ->expects($this->once())
            ->method('getPokemonList')
            ->with(10, 20) // offset should be (3-1) * 10 = 20
            ->willReturn($mockListResponse);

        $result = $this->pokemonService->getPokemonList(3, 10);

        $this->assertEquals(3, $result['pagination']['current_page']);
        $this->assertEquals(10, $result['pagination']['total_pages']); // ceil(100/10)
        $this->assertTrue($result['pagination']['has_next']);
    }

    public function testGetPokemonListLastPage(): void
    {
        // Test last page scenario
        $mockListResponse = [
            'count' => 25,
            'results' => []
        ];

        $this->mockPokeApiClient
            ->expects($this->once())
            ->method('getPokemonList')
            ->with(10, 20) // page 3, limit 10
            ->willReturn($mockListResponse);

        $result = $this->pokemonService->getPokemonList(3, 10);

        $this->assertEquals(3, $result['pagination']['current_page']);
        $this->assertEquals(3, $result['pagination']['total_pages']); // ceil(25/10)
        $this->assertFalse($result['pagination']['has_next']);
    }

    public function testFetchPokemonDetails(): void
    {
        $url = 'https://pokeapi.co/api/v2/pokemon/1/';
        $mockDetails = [
            'name' => 'bulbasaur',
            'height' => 7,
            'weight' => 69
        ];

        $this->mockPokeApiClient
            ->expects($this->once())
            ->method('getPokemonDetails')
            ->with($url)
            ->willReturn($mockDetails);

        $result = $this->pokemonService->fetchPokemonDetails($url);

        $this->assertEquals($mockDetails, $result);
    }

    public function testFetchPokemonDetailsThrowsException(): void
    {
        $url = 'https://pokeapi.co/api/v2/pokemon/1/';
        
        $this->mockPokeApiClient
            ->expects($this->once())
            ->method('getPokemonDetails')
            ->with($url)
            ->willThrowException(new \Exception('API Error'));

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Failed to fetch Pokemon details: API Error');

        $this->pokemonService->fetchPokemonDetails($url);
    }

    public function testFormatPokemonDataWithOfficialArtwork(): void
    {
        $rawData = [
            'name' => 'pikachu',
            'height' => 4,
            'weight' => 60,
            'types' => [
                ['type' => ['name' => 'electric']]
            ],
            'sprites' => [
                'other' => [
                    'official-artwork' => [
                        'front_default' => 'https://example.com/official-artwork.png'
                    ]
                ],
                'front_default' => 'https://example.com/regular-sprite.png'
            ]
        ];

        $result = $this->pokemonService->formatPokemonData($rawData);

        $expected = [
            'name' => 'pikachu',
            'image' => 'https://example.com/official-artwork.png',
            'types' => ['electric'],
            'height' => 4,
            'weight' => 60
        ];

        $this->assertEquals($expected, $result);
    }

    public function testFormatPokemonDataWithFallbackSprite(): void
    {
        $rawData = [
            'name' => 'pikachu',
            'height' => 4,
            'weight' => 60,
            'types' => [
                ['type' => ['name' => 'electric']]
            ],
            'sprites' => [
                'front_default' => 'https://example.com/regular-sprite.png'
            ]
        ];

        $result = $this->pokemonService->formatPokemonData($rawData);

        $this->assertEquals('https://example.com/regular-sprite.png', $result['image']);
    }

    public function testFormatPokemonDataWithNoImage(): void
    {
        $rawData = [
            'name' => 'pikachu',
            'height' => 4,
            'weight' => 60,
            'types' => [
                ['type' => ['name' => 'electric']]
            ],
            'sprites' => []
        ];

        $result = $this->pokemonService->formatPokemonData($rawData);

        $this->assertNull($result['image']);
    }

    public function testFormatPokemonDataWithMultipleTypes(): void
    {
        $rawData = [
            'name' => 'bulbasaur',
            'height' => 7,
            'weight' => 69,
            'types' => [
                ['type' => ['name' => 'grass']],
                ['type' => ['name' => 'poison']]
            ],
            'sprites' => [
                'front_default' => 'https://example.com/sprite.png'
            ]
        ];

        $result = $this->pokemonService->formatPokemonData($rawData);

        $this->assertEquals(['grass', 'poison'], $result['types']);
    }

    public function testFormatPokemonDataWithMissingName(): void
    {
        $rawData = [
            'height' => 7,
            'weight' => 69,
            'types' => [],
            'sprites' => []
        ];

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Failed to format Pokemon data: Pokemon name is missing from API response');

        $this->pokemonService->formatPokemonData($rawData);
    }

    public function testFormatPokemonDataWithMissingFields(): void
    {
        $rawData = [
            'name' => 'test-pokemon',
            'sprites' => []
        ];

        $result = $this->pokemonService->formatPokemonData($rawData);

        $expected = [
            'name' => 'test-pokemon',
            'image' => null,
            'types' => [],
            'height' => 0,
            'weight' => 0
        ];

        $this->assertEquals($expected, $result);
    }
}