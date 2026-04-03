from __future__ import annotations

from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from ..config import settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Return a singleton Supabase client configured with service credentials."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def extract_single(result: Any) -> dict[str, Any] | None:
    """Return the first row from a Supabase response object."""
    data = getattr(result, "data", None)
    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, dict):
            return first
    if isinstance(data, dict):
        return data
    return None


def extract_list(result: Any) -> list[dict[str, Any]]:
    """Return list rows from a Supabase response object."""
    data = getattr(result, "data", None)
    if isinstance(data, list):
        return [row for row in data if isinstance(row, dict)]
    if isinstance(data, dict):
        return [data]
    return []
