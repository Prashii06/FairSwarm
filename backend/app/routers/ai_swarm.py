from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from ..config import settings
from ..core.database import extract_list, get_supabase_client
from ..core.rate_limit import limiter
from ..core.security import get_current_user
from ..services.ai_swarm_engine import AISwarmEngine

router = APIRouter()
swarm_engine = AISwarmEngine()

@router.get("/analysis/{analysis_id}/results")
@limiter.limit(f"{settings.AI_RATE_LIMIT}/minute")
async def get_swarm_results(
    request: Request,
    analysis_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    _ = request
    try:
        supabase = get_supabase_client()
        ownership = (
            supabase.table("analyses")
            .select("id")
            .eq("id", analysis_id)
            .eq("user_id", current_user["id"])
            .limit(1)
            .execute()
        )
        if not getattr(ownership, "data", None):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

        results = (
            supabase.table("ai_swarm_results")
            .select("*")
            .eq("analysis_id", analysis_id)
            .order("created_at", desc=False)
            .execute()
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load AI swarm results.",
        ) from exc

    return {
        "analysis_id": analysis_id,
        "results": extract_list(results),
    }


async def ai_swarm_engine(
    analysis_id: str,
    fairness_results: dict[str, Any],
    intersectional_results: dict[str, Any],
) -> dict[str, Any]:
    return await swarm_engine.run(
        analysis_id=analysis_id,
        fairness_results=fairness_results,
        intersectional_results=intersectional_results,
    )
