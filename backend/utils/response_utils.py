"""Standardized API response helpers."""
from typing import Any, Optional


def success_response(data: Any, message: str = "Success") -> dict:
    return {"status": "success", "message": message, "data": data}


def error_response(message: str, code: int = 400) -> dict:
    return {"status": "error", "message": message, "code": code}


def paginated_response(data: list, total: int, page: int, page_size: int) -> dict:
    return {
        "status": "success",
        "data": data,
        "pagination": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": (total + page_size - 1) // page_size,
        },
    }
