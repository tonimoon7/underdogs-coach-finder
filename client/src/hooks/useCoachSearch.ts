import { useState, useMemo, useCallback } from "react";
import type { Coach, FilterState } from "@/types/coach";
import { useCoachData } from "@/contexts/CoachDataContext";
import type { AiExtractResult } from "@/lib/aiReason";
import { scoreCoachMatch } from "@/lib/aiReason";

const initialFilter: FilterState = {
  search: "",
  expertise: [],
  industries: [],
  regions: [],
  roles: [],
  overseas: null,
  resultCount: 5,
  tiers: [],
  categories: [],
  countries: [],
};

export function useCoachSearch() {
  const { allCoaches: allCoachesData } = useCoachData();
  const [filters, setFilters] = useState<FilterState>(initialFilter);
  const [aiResult, setAiResult] = useState<AiExtractResult | null>(null);
  const [selectedCoaches, setSelectedCoaches] = useState<Set<number>>(new Set());

  const allCoaches = useMemo(() => allCoachesData, [allCoachesData]);

  // Stats
  const stats = useMemo(() => {
    const tierCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    const catCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};
    allCoaches.forEach((c) => {
      tierCounts[c.tier] = (tierCounts[c.tier] || 0) + 1;
      catCounts[c.category] = (catCounts[c.category] || 0) + 1;
      countryCounts[c.country] = (countryCounts[c.country] || 0) + 1;
    });
    return { tierCounts, catCounts, countryCounts, total: allCoaches.length };
  }, [allCoaches]);

  const filteredCoaches = useMemo(() => {
    return allCoaches.filter((coach) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const searchFields = [
          coach.name,
          coach.organization,
          coach.intro,
          coach.career_history,
          coach.current_work,
          coach.education,
          coach.underdogs_history,
          coach.tools_skills,
          coach.main_field || "",
          coach.country || "",
          ...coach.expertise,
          ...coach.industries,
          ...coach.regions,
        ].join(" ").toLowerCase();
        if (!searchFields.includes(q)) return false;
      }
      if (filters.tiers.length > 0) {
        if (!filters.tiers.includes(coach.tier)) return false;
      }
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(coach.category)) return false;
      }
      if (filters.countries.length > 0) {
        if (!filters.countries.includes(coach.country)) return false;
      }
      if (filters.expertise.length > 0) {
        const coachExp = [...coach.expertise, coach.main_field || ""].map(s => s.toLowerCase());
        if (!filters.expertise.some((e) => coachExp.some(ce => ce.includes(e.toLowerCase()) || e.toLowerCase().includes(ce)))) return false;
      }
      if (filters.industries.length > 0) {
        const coachInd = coach.industries.map(s => s.toLowerCase());
        if (!filters.industries.some((i) => coachInd.some(ci => ci.includes(i.toLowerCase()) || i.toLowerCase().includes(ci)))) return false;
      }
      if (filters.regions.length > 0) {
        const coachReg = coach.regions.map(s => s.toLowerCase());
        if (!filters.regions.some((r) => coachReg.some(cr => cr.includes(r.toLowerCase()) || r.toLowerCase().includes(cr)))) return false;
      }
      if (filters.roles.length > 0) {
        const coachRoles = coach.roles.map(s => s.toLowerCase());
        if (!filters.roles.some((r) => coachRoles.some(cr => cr.includes(r.toLowerCase()) || r.toLowerCase().includes(cr)))) return false;
      }
      if (filters.overseas !== null) {
        if (coach.overseas !== filters.overseas) return false;
      }
      return true;
    });
  }, [allCoaches, filters]);

  const rankedCoaches = useMemo(() => {
    return filteredCoaches
      .map((coach) => {
        let score = 0;
        if (coach.tier === 1) score += 10;
        else if (coach.tier === 2) score += 5;
        else score += 1;
        filters.expertise.forEach((e) => {
          const el = e.toLowerCase();
          if (coach.expertise.some(ce => ce.toLowerCase().includes(el) || el.includes(ce.toLowerCase()))) score += 3;
          if ((coach.main_field || "").toLowerCase().includes(el)) score += 2;
        });
        filters.industries.forEach((i) => {
          const il = i.toLowerCase();
          if (coach.industries.some(ci => ci.toLowerCase().includes(il) || il.includes(ci.toLowerCase()))) score += 2;
        });
        filters.regions.forEach((r) => {
          if (coach.regions.some(cr => cr.includes(r) || r.includes(cr))) score += 1;
        });
        filters.roles.forEach((r) => {
          if (coach.roles.some(cr => cr.includes(r) || r.includes(cr))) score += 2;
        });
        if (coach.photo_url) score += 0.5;
        score += Math.min(coach.career_years / 10, 1);
        if (coach.career_history) score += 1;
        if (coach.has_startup) score += 0.5;
        // AI 매칭 점수 계산 (소프트 랭킹 — 하드 필터 대신 점수로만 반영)
        let matchScore: number | undefined;
        let aiReason: string | undefined;
        if (aiResult) {
          const { matchScore: ms, reason } = scoreCoachMatch(coach, aiResult);
          matchScore = ms;
          aiReason = reason || undefined;
          // 매칭 점수를 기존 점수에 블렌딩 (AI 모드에서 주요 순위 기준)
          score += ms * 0.8;
        }
        return { coach, score, matchScore, aiReason };
      })
      .sort((a, b) => {
        // AI 모드: matchScore 우선, 동점 시 기존 점수
        if (aiResult) {
          const diff = (b.matchScore ?? 0) - (a.matchScore ?? 0);
          if (diff !== 0) return diff;
        }
        return b.score - a.score;
      });
  }, [filteredCoaches, filters, aiResult]);

  const topCoaches = useMemo(() => {
    return rankedCoaches.slice(0, filters.resultCount);
  }, [rankedCoaches, filters.resultCount]);

  const toggleCoach = useCallback((coachId: number) => {
    setSelectedCoaches((prev) => {
      const next = new Set(prev);
      if (next.has(coachId)) next.delete(coachId);
      else next.add(coachId);
      return next;
    });
  }, []);

  const selectTopCoaches = useCallback(() => {
    setSelectedCoaches(new Set(topCoaches.map((r) => r.coach.id)));
  }, [topCoaches]);

  const clearSelection = useCallback(() => {
    setSelectedCoaches(new Set());
  }, []);

  const updateFilter = useCallback((key: keyof FilterState, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilter);
  }, []);

  const applyAiResult = useCallback((result: AiExtractResult) => {
    // 하드 필터 적용 제거 — AI 결과는 점수 부스팅으로만 반영하여 빈 결과 방지
    setAiResult(result);
  }, []);

  const clearAiResult = useCallback(() => {
    setAiResult(null);
  }, []);

  const selectedCoachList = useMemo(() => {
    return allCoaches.filter((c) => selectedCoaches.has(c.id));
  }, [allCoaches, selectedCoaches]);

  return {
    filters,
    updateFilter,
    resetFilters,
    filteredCoaches,
    rankedCoaches,
    topCoaches,
    selectedCoaches,
    selectedCoachList,
    toggleCoach,
    selectTopCoaches,
    clearSelection,
    allCoaches,
    stats,
    aiResult,
    applyAiResult,
    clearAiResult,
  };
}
