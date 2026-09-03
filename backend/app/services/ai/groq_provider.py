"""Groq LLM provider (primary) — OpenAI-compatible chat completions."""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.ai.base import AIProvider

logger = logging.getLogger(__name__)


class GroqProvider(AIProvider):
    ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"

    @retry(
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        reraise=True,
    )
    async def generate(self, prompt: str, response_schema: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                self.ENDPOINT,
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.groq_model,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a travel safety advisor. Only use the facts provided below. "
                                "If information needed to answer is missing, say so explicitly instead of guessing. "
                                "Respond ONLY with valid JSON matching the requested schema."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.3,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
