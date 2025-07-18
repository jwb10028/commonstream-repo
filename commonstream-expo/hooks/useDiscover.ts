import { useState, useCallback } from 'react';
import { SearchResult } from '@/types/Discover';
import { DiscoverService } from '@/services/DiscoverAPI';

interface UseDiscoverResult {
  loading: boolean;
  result?: SearchResult;
  error?: string;
  errorCode?: string;
  search: (prompt: string) => Promise<void>;
}

export function useDiscover(): UseDiscoverResult {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [errorCode, setErrorCode] = useState<string | undefined>(undefined);

  const search = useCallback(async (prompt: string) => {
    setLoading(true);
    setError(undefined);
    setErrorCode(undefined);
    setResult(undefined);

    const response = await DiscoverService.search(prompt);

    if (response.success && response.data) {
      setResult(response.data);
    } else {
      setError(response.error);
      setErrorCode(response.errorCode);
    }
    setLoading(false);
  }, []);

  return { loading, result, error, errorCode, search };
}