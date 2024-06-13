export interface SearchFilter {
  searchText: string;
  types: string[];
  page: number;
  pageSize: number;
}

export interface SearchResult {
  results: WrappedSearchProviderResult[];
}

export interface SearchType {
  key: string;
  label: string;
}

export interface SearchProviderResult {
  count: number;
  items: SearchResultItem[];
}

export interface WrappedSearchProviderResult extends SearchProviderResult {
  type: string;
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
              async (provider): Promise<WrappedSearchProviderResult> => ({
                ...(await provider.search(filter)),
                type: provider.searchType.key,
              })
            )
        )),
      ],
    };
  }
}
