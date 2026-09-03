"""LibreTranslate fallback translation provider."""

from __future__ import annotations

import logging

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.services.translation.base import TranslationProvider

logger = logging.getLogger(__name__)


class LibreTranslateProvider(TranslationProvider):

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=1, max=4), reraise=True)
    async def translate(self, text: str, target_lang: str) -> str:
        async with httpx.AsyncClient(timeout=15.0) as client:
            payload: dict = {
                "q": text,
                "target": target_lang,
                "source": "en",
            }
            if settings.libretranslate_api_key:
                payload["api_key"] = settings.libretranslate_api_key

            resp = await client.post(
                f"{settings.libretranslate_url}/translate",
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
            return data.get("translatedText", text)
