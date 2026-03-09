import { useState, useCallback } from "react";
import type { AiExtractResult } from "@/lib/aiReason";
import {
  EXPERTISE_OPTIONS,
  INDUSTRY_OPTIONS,
  ROLE_OPTIONS,
} from "@/types/coach";

interface UseAiRecommendReturn {
  recommend: (query: string) => Promise<AiExtractResult | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useAiRecommend(): UseAiRecommendReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommend = useCallback(async (query: string): Promise<AiExtractResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          availableExpertise: EXPERTISE_OPTIONS,
          availableIndustries: INDUSTRY_OPTIONS,
          availableRoles: ROLE_OPTIONS,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const result: AiExtractResult = await response.json();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { recommend, isLoading, error, clearError };
}
