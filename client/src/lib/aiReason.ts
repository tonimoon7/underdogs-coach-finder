import type { Coach } from "@/types/coach";

export interface AiExtractResult {
  expertise: string[];
  industries: string[];
  roles: string[];
  freeKeywords: string[];
  summary: string;
}

/**
 * 코치 데이터와 AI 추출 결과를 비교해 추천 이유 문자열 생성 (순수 함수)
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
