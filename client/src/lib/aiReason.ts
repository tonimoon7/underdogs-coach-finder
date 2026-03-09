import type { Coach } from "@/types/coach";

export interface AiExtractResult {
  expertise: string[];
  industries: string[];
  roles: string[];
  freeKeywords: string[];
  summary: string;
}

/**
 * 토큰 기반 퍼지 매칭: 공백/슬래시 등으로 분리한 토큰끼리 포함 관계를 비교
 * "마케팅 전문가" vs "마케팅/브랜딩 (시장조사/퍼포먼스)" → TRUE
 */
function fuzzyMatch(a: string, b: string): boolean {
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  // 직접 포함 관계
  if (al.includes(bl) || bl.includes(al)) return true;
  // 토큰 분리 후 교차 포함 검사
  const tokenize = (s: string) =>
    s.toLowerCase().split(/[\s\/\(\)\.,·\-]+/).filter((t) => t.length >= 2);
  const ta = tokenize(a);
  const tb = tokenize(b);
  return ta.some((t) => tb.some((u) => t.includes(u) || u.includes(t)));
}

/**
 * 코치 데이터와 AI 추출 결과를 비교해 매칭률(0-100%)과 추천 이유를 반환
 * - 태그 매칭: 퍼지 토큰 매칭으로 "커머스" ↔ "리테일/커머스" 등 연결
 * - 텍스트 매칭: 이력/소개 등 자유 텍스트 필드에서 키워드 검색
 */
export function scoreCoachMatch(
  coach: Coach,
  ai: AiExtractResult
): { reason: string; matchScore: number } {
  const reasons: string[] = [];

  const coachText = [
    coach.intro,
    coach.career_history,
    coach.current_work,
    coach.underdogs_history,
    coach.tools_skills,
    coach.main_field || "",
    ...coach.expertise,
    ...coach.industries,
    ...coach.roles,
  ]
    .join(" ")
    .toLowerCase();

  let score = 0;
  let maxScore = 0;

  // 1. 전문분야 매칭 (가중치 40)
  if (ai.expertise.length > 0) {
    maxScore += 40;
    const matched = ai.expertise.filter((e) =>
      coach.expertise.some((ce) => fuzzyMatch(e, ce))
    );
    score += (matched.length / ai.expertise.length) * 40;
    if (matched.length > 0) {
      reasons.push(`${matched[0].split("(")[0].trim()} 전문`);
    }
  }

  // 2. 업종 매칭 (가중치 25)
  if (ai.industries.length > 0) {
    maxScore += 25;
    const matched = ai.industries.filter((ind) =>
      coach.industries.some((ci) => fuzzyMatch(ind, ci))
    );
    score += (matched.length / ai.industries.length) * 25;
    if (matched.length > 0) {
      reasons.push(`${matched[0]} 분야`);
    }
  }

  // 3. 역할 매칭 (가중치 15)
  if (ai.roles.length > 0) {
    maxScore += 15;
    const matched = ai.roles.filter((r) =>
      coach.roles.some((cr) => fuzzyMatch(r, cr))
    );
    score += (matched.length / ai.roles.length) * 15;
    if (matched.length > 0) {
      reasons.push(`${matched.join("/")} 역할`);
    }
  }

  // 4. 자유 키워드 이력 텍스트 검색 (가중치 20)
  if (ai.freeKeywords.length > 0) {
    maxScore += 20;
    const matched = ai.freeKeywords.filter((kw) =>
      coachText.includes(kw.toLowerCase())
    );
    score += (matched.length / ai.freeKeywords.length) * 20;
    if (matched.length > 0) {
      reasons.push(`"${matched.slice(0, 2).join(", ")}" 이력 매칭`);
    }
  }

  const matchScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return { reason: reasons.join(" · "), matchScore };
}

/**
 * 코치 데이터와 AI 추출 결과를 비교해 추천 이유 문자열 생성 (순수 함수)
 * @deprecated scoreCoachMatch 사용 권장
 */
export function generateAiReason(coach: Coach, ai: AiExtractResult): string {
  const reasons: string[] = [];

  // 전문분야 매칭
  const matchedExpertise = ai.expertise.filter((e) =>
    coach.expertise.some(
      (ce) =>
        ce.toLowerCase().includes(e.toLowerCase().substring(0, 6)) ||
        e.toLowerCase().includes(ce.toLowerCase().substring(0, 6))
    )
  );
  if (matchedExpertise.length > 0) {
    const label = matchedExpertise[0].split("(")[0].trim();
    reasons.push(`${label} 전문`);
  }

  // 역할 매칭
  const matchedRoles = ai.roles.filter((r) =>
    coach.roles.some((cr) => cr.includes(r) || r.includes(cr))
  );
  if (matchedRoles.length > 0) {
    reasons.push(matchedRoles.join("/") + " 경험");
  }

  // 업종 매칭
  const matchedIndustries = ai.industries.filter((i) =>
    coach.industries.some((ci) => ci.includes(i) || i.includes(ci))
  );
  if (matchedIndustries.length > 0) {
    reasons.push(matchedIndustries[0] + " 업종");
  }

  // freeKeywords가 코치 텍스트 필드에 있는지 확인
  const coachText = [
    coach.intro,
    coach.career_history,
    coach.current_work,
    coach.underdogs_history,
    coach.tools_skills,
  ]
    .join(" ")
    .toLowerCase();

  const matchedKeywords = ai.freeKeywords.filter((kw) =>
    coachText.includes(kw.toLowerCase())
  );
  if (matchedKeywords.length > 0) {
    reasons.push(`"${matchedKeywords[0]}" 키워드 매칭`);
  }

  return reasons.join(" · ");
}
