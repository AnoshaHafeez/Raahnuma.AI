"""Abstract base class for AI/LLM providers."""

from abc import ABC, abstractmethod
from typing import Any


class AIProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, response_schema: dict[str, Any]) -> dict[str, Any]:
        """Send a prompt and return parsed structured JSON."""
        ...
