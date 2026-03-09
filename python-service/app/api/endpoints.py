from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.core.rag import extract_rfp_info, build_search_query, RFPExtraction
from app.core.database import vector_db

router = APIRouter()

class RecommendRequest(BaseModel):
    rfp_text: str
    top_k: int = 5

class RecommendResponse(BaseModel):
    extraction: RFPExtraction
    recommendations: List[Dict[str, Any]]

@router.post("/recommend", response_model=RecommendResponse)
async def recommend_coaches(req: RecommendRequest):
    try:
        # 1. 텍스트 분석 및 요구사항 추출 (LLM)
        extraction = extract_rfp_info(req.rfp_text)
        
        # 2. 검색 쿼리 조립
        query = build_search_query(extraction)
        
        # 3. 벡터 DB 검색 (FAISS) 
        # TODO: Tier 필터링(Tier 1 우선 등) 로직을 여기에 고도화
        results = vector_db.search_coaches(query, top_k=req.top_k)
        
        # 4. 결과 매핑
        recommendations = []
        for doc, score in results:
            recommendations.append({
                "score": float(score),
                "content": doc.page_content,
                "metadata": doc.metadata
            })
            
        return RecommendResponse(
            extraction=extraction,
            recommendations=recommendations
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Document Generation Endpoint =====
from fastapi.responses import StreamingResponse
import tempfile
import os
from app.docs.generator import generate_coach_proposal_docx, generate_coach_profile_pptx


class GenerateDocRequest(BaseModel):
    coaches: List[Dict[str, Any]]
    project_title: str = "언더독스 코치 프로필"
    doc_type: str = "docx"  # "docx" or "pptx"


@router.post("/generate")
async def generate_document(req: GenerateDocRequest):
    try:
        with tempfile.TemporaryDirectory() as tmpdir:
            if req.doc_type == "docx":
                output_path = os.path.join(tmpdir, "proposal.docx")
                for coach in req.coaches:
                    coach_data = {
                        "name": coach.get("name", "이름 없음"),
                        "domain": ", ".join(coach.get("expertise", [])),
                        "skills": coach.get("tools_skills", ""),
                        "tier": f"Tier {coach.get('tier', 2)}",
                        "summary": coach.get("intro", ""),
                    }
                    generate_coach_proposal_docx(coach_data, output_path)
                
                media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                filename = f"{req.project_title}.docx"
            else:
                output_path = os.path.join(tmpdir, "profile.pptx")
                for coach in req.coaches:
                    coach_data = {
                        "name": coach.get("name", "이름 없음"),
                        "summary": coach.get("intro", ""),
                    }
                    generate_coach_profile_pptx(coach_data, None, output_path)
                
                media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
                filename = f"{req.project_title}.pptx"

            with open(output_path, "rb") as f:
                file_bytes = f.read()

        def iterfile():
            yield file_bytes

        return StreamingResponse(
            iterfile(),
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

