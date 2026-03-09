/*
 * CoachFormModal - Swiss Industrial Design
 * 코치 신규 등록 / 수정 폼 모달
 */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Plus, Trash2 } from "lucide-react";
import type { Coach, TierType } from "@/types/coach";
import {
  EXPERTISE_OPTIONS,
  INDUSTRY_OPTIONS,
  REGION_OPTIONS,
  ROLE_OPTIONS,
  CATEGORY_OPTIONS,
  COUNTRY_OPTIONS,
  CATEGORY_LABELS,
} from "@/types/coach";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface CoachFormModalProps {
  open: boolean;
  onClose: () => void;
  coach?: Coach | null; // null = new, Coach = edit
  onSave: (data: Omit<Coach, "id"> | Partial<Coach>, isNew: boolean) => void;
  onDelete?: (id: number) => void;
}

const emptyCoach: Omit<Coach, "id"> = {
  name: "",
  organization: "",
  position: "",
  email: "",
  phone: "",
  intro: "",
  expertise: [],
  industries: [],
  regions: [],
  roles: [],
  career_years: 0,
  career_years_raw: "",
  career_history: "",
  current_work: "",
  underdogs_history: "",
  education: "",
  overseas: false,
  overseas_detail: "",
  tools_skills: "",
  photo_url: "",
  tier: 2 as TierType,
  category: "코치",
  country: "한국",
  language: "한국어",
  main_field: "",
  has_startup: false,
  is_active: true,
};

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <label className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider block mb-1">
      {label}
      {required && <span className="text-primary ml-0.5">*</span>}
    </label>
  );
}

function TagSelector({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left flex items-center justify-between py-1.5 px-2 border border-border rounded-[2px] text-[12px] hover:border-foreground transition-colors"
      >
        <span className="text-muted-foreground">
          {selected.length > 0 ? `${selected.length}개 선택됨` : `${title} 선택...`}
        </span>
        <span className="text-[10px] text-muted-foreground">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-1 border border-border rounded-[2px] max-h-[180px] overflow-y-auto p-2 space-y-0.5 bg-white">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/30 px-1 rounded-[2px]">
              <Checkbox
                checked={selected.includes(opt)}
                onCheckedChange={() => toggle(opt)}
                className="rounded-[2px] border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-[11px] text-foreground">{opt}</span>
            </label>
          ))}
        </div>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-muted text-foreground"
            >
              {(s.length > 20 ? s.slice(0, 20) + "..." : s) as string}
              <button type="button" onClick={() => toggle(s)} className="hover:text-primary">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoachFormModal({
  open,
  onClose,
  coach,
  onSave,
  onDelete,
}: CoachFormModalProps) {
  const { lang } = useLanguage();
  const isEdit = !!coach;
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (open) {
      if (coach) {
        setForm({ ...coach });
      } else {
        setForm({ ...emptyCoach });
      }
    }
  }, [open, coach]);

  const updateField = (key: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!(form.name as string)?.trim()) {
      toast.error("이름은 필수 입력 항목입니다.");
      return;
    }
    if (isEdit && coach) {
      onSave(form as Partial<Coach>, false);
      toast.success(`${form.name} 정보가 수정되었습니다.`);
    } else {
      onSave(form as Omit<Coach, "id">, true);
      toast.success(`${form.name}이(가) 신규 등록되었습니다.`);
    }
    onClose();
  };

  const handleDelete = () => {
    if (coach && onDelete) {
      if (confirm(`${coach.name}을(를) 정말 삭제하시겠습니까?`)) {
        onDelete(coach.id);
        toast.success(`${coach.name}이(가) 삭제되었습니다.`);
        onClose();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 rounded-none border border-border shadow-lg">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[18px] font-bold text-foreground tracking-tight">
              {isEdit ? "코치 정보 수정" : "신규 인력 등록"}
            </DialogTitle>
            {isEdit && onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                className="h-7 px-2 text-[11px] text-destructive border-destructive/30 hover:bg-destructive hover:text-white rounded-[2px]"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                삭제
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)]">
          <div className="px-6 py-4 space-y-5">
            {/* 기본 정보 섹션 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-primary" />
                <h4 className="text-[12px] uppercase font-bold text-foreground tracking-wider">기본 정보</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel label="이름" required />
                  <Input
                    value={(form.name as string) || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="h-8 text-[12px] rounded-[2px]"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <FieldLabel label="소속" />
                  <Input
                    value={(form.organization as string) || ""}
                    onChange={(e) => updateField("organization", e.target.value)}
                    className="h-8 text-[12px] rounded-[2px]"
                    placeholder="(주)언더독스"
                  />
                </div>
                <div>
                  <FieldLabel label="직책" />
                  <Input
                    value={(form.position as string) || ""}
                    onChange={(e) => updateField("position", e.target.value)}
                    className="h-8 text-[12px] rounded-[2px]"
                    placeholder="대표이사"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <FieldLabel label="티어" required />
                  <div className="flex gap-1">
                    {([1, 2, 3] as TierType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateField("tier", t)}
                        className={`flex-1 h-8 text-[12px] font-mono font-semibold border transition-all ${
                          form.tier === t
                            ? t === 1
                              ? "bg-primary text-white border-primary"
                              : t === 2
                              ? "bg-foreground text-white border-foreground"
                              : "bg-muted-foreground text-white border-muted-foreground"
                            : "bg-white text-muted-foreground border-border hover:border-foreground"
                        }`}
                      >
                        T{t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel label="유형" required />
                  <select
                    value={(form.category as string) || "코치"}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full h-8 text-[12px] border border-border rounded-[2px] px-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]?.[lang] || cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel label="국적" />
                  <select
                    value={(form.country as string) || "한국"}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="w-full h-8 text-[12px] border border-border rounded-[2px] px-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="미국">미국</option>
                    <option value="중국">중국</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 연락처 섹션 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-primary" />
                <h4 className="text-[12px] uppercase font-bold text-foreground tracking-wider">연락처</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel label="이메일" />
                  <Input
                    type="email"
                    value={(form.email as string) || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="h-8 text-[12px] rounded-[2px]"
                    placeholder="coach@example.com"
                  />
                </div>
                <div>
                  <FieldLabel label="연락처" />
                  <Input
                    value={(form.phone as string) || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="h-8 text-[12px] rounded-[2px]"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </div>

            {/* 프로필 섹션 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-primary" />
                <h4 className="text-[12px] uppercase font-bold text-foreground tracking-wider">프로필</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <FieldLabel label="한줄 소개" />
                  <Input
                    value={(form.intro as string) || ""}
                    onChange={(e) => updateField("intro", e.target.value)}
                    className="h-8 text-[12px] rounded-[2px]"
                    placeholder="창업 생태계 전문가, 10년간 100개 이상 스타트업 코칭"
                  />
                </div>
                <div>
                  <FieldLabel label="사진 URL" />
                  <Input
                    value={(form.photo_url as string) || ""}
                    onChange={(e) => updateField("photo_url", e.target.value)}
                    className="h-8 text-[12px] rounded-[2px]"
                    placeholder="https://..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <FieldLabel label="경력 (년)" />
                    <Input
                      type="number"
                      value={(form.career_years as number) || 0}
                      onChange={(e) => updateField("career_years", parseInt(e.target.value) || 0)}
                      className="h-8 text-[12px] rounded-[2px]"
                    />
                  </div>
                  <div>
                    <FieldLabel label="경력 표시" />
                    <Input
                      value={(form.career_years_raw as string) || ""}
                      onChange={(e) => updateField("career_years_raw", e.target.value)}
                      className="h-8 text-[12px] rounded-[2px]"
                      placeholder="15년 이상"
                    />
                  </div>
                  <div>
                    <FieldLabel label="학력" />
                    <Input
                      value={(form.education as string) || ""}
                      onChange={(e) => updateField("education", e.target.value)}
                      className="h-8 text-[12px] rounded-[2px]"
                      placeholder="서울대학교 경영학과"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel label="주요 이력" />
                  <Textarea
                    value={(form.career_history as string) || ""}
                    onChange={(e) => updateField("career_history", e.target.value)}
                    className="text-[12px] rounded-[2px] min-h-[80px]"
                    placeholder="주요 경력 사항을 기입해 주세요"
                  />
                </div>
                <div>
                  <FieldLabel label="현재 업무" />
                  <Textarea
                    value={(form.current_work as string) || ""}
                    onChange={(e) => updateField("current_work", e.target.value)}
                    className="text-[12px] rounded-[2px] min-h-[60px]"
                    placeholder="현재 수행 중인 업무"
                  />
                </div>
                <div>
                  <FieldLabel label="언더독스 수행 이력" />
                  <Textarea
                    value={(form.underdogs_history as string) || ""}
                    onChange={(e) => updateField("underdogs_history", e.target.value)}
                    className="text-[12px] rounded-[2px] min-h-[60px]"
                    placeholder="언더독스에서의 활동 이력"
                  />
                </div>
                <div>
                  <FieldLabel label="Tool / Skill-Set" />
                  <Input
                    value={(form.tools_skills as string) || ""}
                    onChange={(e) => updateField("tools_skills", e.target.value)}
                    className="h-8 text-[12px] rounded-[2px]"
                    placeholder="Notion, Figma, Python 등"
                  />
                </div>
              </div>
            </div>

            {/* 전문 분류 섹션 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-primary" />
                <h4 className="text-[12px] uppercase font-bold text-foreground tracking-wider">전문 분류</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <FieldLabel label="주요 분야" />
                  <Input
                    value={(form.main_field as string) || ""}
                    onChange={(e) => updateField("main_field", e.target.value)}
                    className="h-8 text-[12px] rounded-[2px]"
                    placeholder="VC, 사회복지, IT/SW 등"
                  />
                </div>
                <div>
                  <FieldLabel label="전문분야" />
                  <TagSelector
                    title="전문분야"
                    options={EXPERTISE_OPTIONS}
                    selected={(form.expertise as string[]) || []}
                    onChange={(val) => updateField("expertise", val)}
                  />
                </div>
                <div>
                  <FieldLabel label="경험 업종" />
                  <TagSelector
                    title="경험 업종"
                    options={INDUSTRY_OPTIONS}
                    selected={(form.industries as string[]) || []}
                    onChange={(val) => updateField("industries", val)}
                  />
                </div>
                <div>
                  <FieldLabel label="코칭 가능 지역" />
                  <TagSelector
                    title="코칭 가능 지역"
                    options={REGION_OPTIONS}
                    selected={(form.regions as string[]) || []}
                    onChange={(val) => updateField("regions", val)}
                  />
                </div>
                <div>
                  <FieldLabel label="역할" />
                  <TagSelector
                    title="역할"
                    options={ROLE_OPTIONS}
                    selected={(form.roles as string[]) || []}
                    onChange={(val) => updateField("roles", val)}
                  />
                </div>
              </div>
            </div>

            {/* 기타 옵션 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-4 bg-primary" />
                <h4 className="text-[12px] uppercase font-bold text-foreground tracking-wider">기타</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={(form.overseas as boolean) || false}
                      onCheckedChange={(v) => updateField("overseas", !!v)}
                      className="rounded-[2px]"
                    />
                    <span className="text-[12px] text-foreground">해외 코칭 가능</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={(form.has_startup as boolean) || false}
                      onCheckedChange={(v) => updateField("has_startup", !!v)}
                      className="rounded-[2px]"
                    />
                    <span className="text-[12px] text-foreground">창업 경험 있음</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={(form.is_active as boolean) !== false}
                      onCheckedChange={(v) => updateField("is_active", !!v)}
                      className="rounded-[2px]"
                    />
                    <span className="text-[12px] text-foreground">활동 중</span>
                  </label>
                </div>
                {!!(form.overseas as boolean) && (
                  <div>
                    <FieldLabel label="해외 코칭 상세" />
                    <Input
                      value={(form.overseas_detail as string) || ""}
                      onChange={(e) => updateField("overseas_detail", e.target.value)}
                      className="h-8 text-[12px] rounded-[2px]"
                      placeholder="영어 가능, 동남아 경험 등"
                    />
                  </div>
                )}
                <div>
                  <FieldLabel label="언어" />
                  <Input
                    value={(form.language as string) || ""}
                    onChange={(e) => updateField("language", e.target.value)}
                    className="h-8 text-[12px] rounded-[2px]"
                    placeholder="한국어, 영어"
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-3 border-t border-border gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 px-4 text-[12px] rounded-[2px]"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            className="h-9 px-6 text-[12px] font-semibold bg-primary hover:bg-primary/90 text-white rounded-[2px]"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {isEdit ? "수정 저장" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
