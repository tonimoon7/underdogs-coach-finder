/*
 * AiRecommendModal - 자연어 코치 추천 입력 모달
 */
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { useAiRecommend } from "@/hooks/useAiRecommend";
import type { AiExtractResult } from "@/lib/aiReason";

interface AiRecommendModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (result: AiExtractResult) => void;
}

const EXAMPLE_QUERIES = [
  "헬스케어 스타트업 BM 검증 코치 3명 필요",
  "ESG/임팩트 투자 경험 있는 전문가 추천",
  "일본 진출 준비 중인 팀을 위한 글로벌 코치",
];

export default function AiRecommendModal({
  open,
  onClose,
  onApply,
}: AiRecommendModalProps) {
  const [query, setQuery] = useState("");
  const { recommend, isLoading, error, clearError } = useAiRecommend();

  const handleSubmit = async () => {
    if (!query.trim()) return;
    const result = await recommend(query.trim());
    if (result) {
      onApply(result);
      onClose();
      setQuery("");
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setQuery("");
      clearError();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-[4px] p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
            <Sparkles className="w-4 h-4 text-primary" />
            AI 코치 추천
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3">
          <p className="text-[12px] text-muted-foreground">
            어떤 프로그램에 필요한 코치인지 자유롭게 작성해주세요.
          </p>

          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="예: AI 스타트업 대상 IR 피칭 워크샵 진행 예정. 투자 심사 경험 있고 스타트업 멘토링을 해본 코치가 필요합니다."
            className="min-h-[100px] text-[13px] rounded-[3px] resize-none focus-visible:ring-1 focus-visible:ring-primary"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />

          {/* 예시 쿼리 */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground">예시:</p>
            <div className="flex flex-col gap-1">
              {EXAMPLE_QUERIES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setQuery(ex)}
                  className="text-left text-[11px] text-primary/70 hover:text-primary underline-offset-2 hover:underline transition-colors"
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-[3px]">
              <p className="text-[11px] text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">⌘ + Enter 로 바로 추천</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="h-8 px-4 text-[12px] rounded-[2px]"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !query.trim()}
              className="h-8 px-4 text-[12px] rounded-[2px] bg-primary text-white hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1.5" />
                  AI 추천 받기
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
