export interface SearchFilter {
  searchText: string;
  types: string[];
  page: number;
  pageSize: number;
}

export interface SearchResult {
  results: SearchProviderResult[];
}

export interface SearchType {
  key: string;
  label: string;
  color?: string;
}

export interface SearchProviderResult {
  type: string;
  count: number;
  items: SearchResultItem[];
}

export interface SearchResultItem {
  id: string;
  label: string;
  url: string;
  description?: string;
}

export interface SearchProvider {
  // This is a type of search provider
  searchType: SearchType;
  search(filter: SearchFilter): Promise<SearchProviderResult>;
}

export class SearchHandler {
  searchProviders: SearchProvider[];

  constructor() {
    this.searchProviders = [];
  }

  register(provider: SearchProvider): void {
    this.searchProviders.push(provider);
  }

  validSearchTypes(): SearchType[] {
    return this.searchProviders.map((provider) => provider.searchType);
  }

  async search(filter: SearchFilter): Promise<SearchResult> {
    return {
      results: [
        ...(await Promise.all(
          this.searchProviders
            .filter((provider) =>
              filter.types.includes(provider.searchType.key)
            )
            .map(
              (provider): Promise<SearchProviderResult> =>
                provider.search(filter)
            )
        )),
      ],
    };
  }
}
