import { describe, it, expect } from "vitest";
import { generateAiReason } from "./aiReason";
import type { Coach } from "@/types/coach";

const mockCoach: Partial<Coach> = {
  id: 1,
  name: "홍길동",
  expertise: ["사업계획서/IR (투자유치/피칭)", "AI/DX (생성형 AI 활용/노코드)"],
  industries: ["IT/소프트웨어"],
  roles: ["VC", "멘토링"],
  intro: "AI 스타트업 투자 전문가",
  career_history: "10년간 VC 투자 경력, AI 스타트업 20개사 투자",
  current_work: "시드 투자사 파트너",
  underdogs_history: "IR 피칭 코칭 5회",
  tools_skills: "",
};

const aiResult = {
  expertise: ["사업계획서/IR (투자유치/피칭)"],
  industries: ["IT/소프트웨어"],
  roles: ["VC"],
  freeKeywords: ["투자경험", "AI스타트업"],
  summary: "AI 분야 IR 경험 있는 투자/멘토 전문가",
};

describe("generateAiReason", () => {
  it("전문분야 매칭 시 이유에 포함", () => {
    const reason = generateAiReason(mockCoach as Coach, aiResult);
    expect(reason).toContain("IR");
  });

  it("역할 매칭 시 이유에 포함", () => {
    const reason = generateAiReason(mockCoach as Coach, aiResult);
    expect(reason).toContain("VC");
  });

  it("freeKeyword가 career_history에 있으면 이유에 포함", () => {
    const reason = generateAiReason(mockCoach as Coach, aiResult);
    expect(reason.length).toBeGreaterThan(0);
  });

  it("매칭 없으면 빈 문자열 반환", () => {
    const noMatchCoach = {
      ...mockCoach,
      expertise: ["세무개론"],
      industries: ["교육"],
      roles: ["강의"],
      career_history: "",
      intro: "",
      current_work: "",
      underdogs_history: "",
    } as Coach;
    const noMatchResult = {
      expertise: ["글로벌코칭"],
      industries: ["헬스케어/바이오"],
      roles: ["글로벌코치"],
      freeKeywords: ["영어"],
      summary: "",
    };
    const reason = generateAiReason(noMatchCoach, noMatchResult);
    expect(reason).toBe("");
  });
});
