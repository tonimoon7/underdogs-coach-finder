import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AiRecommendModalProps {
  open: boolean;
  onClose: () => void;
  onRecommend: (rfpText: string) => Promise<void>;
}

export default function AiRecommendModal({ open, onClose, onRecommend }: AiRecommendModalProps) {
  const { t } = useLanguage();
  const [rfpText, setRfpText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rfpText.trim()) {
      toast.error("RFP 내용을 입력해주세요.");
      return;
    }
    
    setIsLoading(true);
    try {
      await onRecommend(rfpText);
      toast.success("AI 추천이 완료되었습니다.");
      onClose();
      setRfpText("");
    } catch (error) {
      toast.error("추천 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-6 gap-6 rounded-[4px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Sparkles className="w-5 h-5 text-primary" />
            {t("ai_recommend") || "AI 맞춤 코치 추천"}
          </DialogTitle>
          <DialogDescription className="text-[13px] text-muted-foreground pt-1">
            {t("ai_recommend_desc") || "제안요청서(RFP) 내용을 입력하시면 전문 분야와 요구 역량을 분석하여 최적의 코치를 랭킹 순으로 추천해 드립니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <Textarea
            placeholder="여기에 제안요청서(RFP)의 요건, 과업 지시서 내용, 주요 타겟, 요구되는 전문성 등을 상세히 붙여넣어 주세요..."
            className="min-h-[250px] resize-none text-[13px] rounded-[3px] focus-visible:ring-1 focus-visible:ring-primary border-border"
            value={rfpText}
            onChange={(e) => setRfpText(e.target.value)}
          />
        </div>

        <DialogFooter className="sm:justify-between items-center border-t border-border pt-4 -mx-6 px-6 -mb-2">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Powered by Gemini
          </span>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-[12px] h-8 rounded-[2px]"
              disabled={isLoading}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!rfpText.trim() || isLoading}
              className="bg-primary text-white hover:bg-primary/90 text-[12px] h-8 rounded-[2px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                "추천받기"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
