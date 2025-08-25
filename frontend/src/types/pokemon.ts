export interface Pokemon {
  name: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
}

export interface PokemonListResponse {
  data: Pokemon[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_next: boolean;
  };
}

export interface PokemonCardProps {
  pokemon: Pokemon;
}

export interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_count: number;
  has_next: boolean;
}