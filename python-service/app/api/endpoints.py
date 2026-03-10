from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from pathlib import Path
import json

from app.core.rag import extract_rfp_info

router = APIRouter()


class RecommendRequest(BaseModel):
    rfp_text: str
    top_k: int = 10


@router.post("/recommend")
async def recommend_coaches(req: RecommendRequest):
    try:
        # 1. Gemini로 RFP에서 키워드 추출
        extraction = extract_rfp_info(req.rfp_text)
        keywords = (
            extraction.get("required_domains", [])
            + extraction.get("required_skills", [])
        )

        # 2. coaches_db.json 로드 (빌드 컨텍스트 루트에 복사됨)
        coaches_path = Path(__file__).parent.parent.parent / "coaches_db.json"
        with open(coaches_path, encoding="utf-8") as f:
            coaches = json.load(f)

        # 3. 티어 가중치 + 키워드 스코링
        results = []
        for coach in coaches:
            tier = coach.get("tier", 3)
            score = {1: 10, 2: 5}.get(tier, 1)

            haystack = " ".join([
                coach.get("name", ""),
                coach.get("intro", ""),
                coach.get("career_history", ""),
                coach.get("current_work", ""),
                coach.get("underdogs_history", ""),
                coach.get("main_field", ""),
                " ".join(coach.get("expertise", [])),
                " ".join(coach.get("industries", [])),
                " ".join(coach.get("roles", [])),
            ]).lower()

            for kw in keywords:
                if kw and kw.lower() in haystack:
                    score += 3

            results.append({
                "score": score,
                "metadata": {
                    "id": coach.get("id"),
                    "name": coach.get("name"),
                    "tier": tier,
                }
            })

        results.sort(key=lambda x: x["score"], reverse=True)

        return {
            "extraction": extraction,
            "recommendations": results[:req.top_k],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
