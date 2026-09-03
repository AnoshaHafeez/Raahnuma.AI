"""Gemini LLM provider (fallback)."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.ai.base import AIProvider

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    ENDPOINT_TEMPLATE = (
        "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    )

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        reraise=True,
    )
    async def generate(self, prompt: str, response_schema: dict[str, Any]) -> dict[str, Any]:
        url = self.ENDPOINT_TEMPLATE.format(model=settings.gemini_model)
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                headers={"Content-Type": "application/json"},
                params={"key": settings.gemini_api_key},
                json={
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": (
                                        "You are a travel safety advisor. Only use the facts provided below. "
                                        "If information needed to answer is missing, say so explicitly instead of guessing. "
                                        "Respond ONLY with valid JSON matching the requested schema.\n\n"
                                        + prompt
                                    )
                                }
                            ]
                        }
                    ],
                    "generationConfig": {
                        "responseMimeType": "application/json",
                        "temperature": 0.3,
                    },
                },
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return json.loads(text)
