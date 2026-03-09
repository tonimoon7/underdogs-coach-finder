/*
 * CoachDataContext - localStorage 기반 코치 데이터 CRUD 관리
 * 원본 JSON + localStorage 오버레이로 신규 등록/수정/삭제 지원
 */
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Coach } from "@/types/coach";
import coachesRaw from "@/data/coaches_db.json";

const STORAGE_KEY = "underdogs_coach_custom_data";

interface CustomData {
  added: Coach[];
  edited: Record<number, Partial<Coach>>;
  deleted: number[];
}

function loadCustomData(): CustomData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { added: [], edited: {}, deleted: [] };
}

function saveCustomData(data: CustomData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface CoachDataContextType {
  allCoaches: Coach[];
  addCoach: (coach: Omit<Coach, "id">) => void;
  updateCoach: (id: number, updates: Partial<Coach>) => void;
  deleteCoach: (id: number) => void;
  resetCustomData: () => void;
  customDataStats: { added: number; edited: number; deleted: number };
}

const CoachDataContext = createContext<CoachDataContextType>({
  allCoaches: [],
  addCoach: () => {},
  updateCoach: () => {},
  deleteCoach: () => {},
  resetCustomData: () => {},
  customDataStats: { added: 0, edited: 0, deleted: 0 },
});

const baseCoaches = coachesRaw as Coach[];

export function CoachDataProvider({ children }: { children: ReactNode }) {
  const [customData, setCustomData] = useState<CustomData>(loadCustomData);

  useEffect(() => {
    saveCustomData(customData);
  }, [customData]);

  const allCoaches: Coach[] = (() => {
    // Start with base data
    let result = baseCoaches
      .filter((c) => !customData.deleted.includes(c.id))
      .map((c) => {
        const edits = customData.edited[c.id];
        if (edits) return { ...c, ...edits };
        return c;
      });
    // Add custom coaches
    result = [...result, ...customData.added];
    return result;
  })();

  const addCoach = useCallback((coachData: Omit<Coach, "id">) => {
    const maxId = Math.max(
      ...baseCoaches.map((c) => c.id),
      ...customData.added.map((c) => c.id),
      0
    );
    const newCoach: Coach = { ...coachData, id: maxId + 1 } as Coach;
    setCustomData((prev) => ({
      ...prev,
      added: [...prev.added, newCoach],
    }));
  }, [customData.added]);

  const updateCoach = useCallback((id: number, updates: Partial<Coach>) => {
    setCustomData((prev) => {
      // Check if it's a custom-added coach
      const addedIdx = prev.added.findIndex((c) => c.id === id);
      if (addedIdx >= 0) {
        const newAdded = [...prev.added];
        newAdded[addedIdx] = { ...newAdded[addedIdx], ...updates };
        return { ...prev, added: newAdded };
      }
      // It's a base coach - merge edits
      return {
        ...prev,
        edited: {
          ...prev.edited,
          [id]: { ...(prev.edited[id] || {}), ...updates },
        },
      };
    });
  }, []);

  const deleteCoach = useCallback((id: number) => {
    setCustomData((prev) => {
      // If custom-added, just remove from added list
      const addedIdx = prev.added.findIndex((c) => c.id === id);
      if (addedIdx >= 0) {
        return {
          ...prev,
          added: prev.added.filter((c) => c.id !== id),
        };
      }
      // Base coach - add to deleted list
      return {
        ...prev,
        deleted: [...prev.deleted, id],
      };
    });
  }, []);

  const resetCustomData = useCallback(() => {
    setCustomData({ added: [], edited: {}, deleted: [] });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const customDataStats = {
    added: customData.added.length,
    edited: Object.keys(customData.edited).length,
    deleted: customData.deleted.length,
  };

  return (
    <CoachDataContext.Provider
      value={{ allCoaches, addCoach, updateCoach, deleteCoach, resetCustomData, customDataStats }}
    >
      {children}
    </CoachDataContext.Provider>
  );
}

export function useCoachData() {
  return useContext(CoachDataContext);
}
