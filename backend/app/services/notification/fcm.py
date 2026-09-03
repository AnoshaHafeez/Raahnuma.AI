"""FCM (Firebase Cloud Messaging) push notification stub.

This is a stub implementation. Replace with actual FCM integration
when the mobile client is ready.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class FCMService:
    """Stub — logs push notifications instead of sending them."""

    async def send_push(
        self,
        device_token: str,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
    ) -> bool:
        logger.info(
            "FCM stub: would send push to %s — title=%r body=%r data=%r",
            device_token,
            title,
            body,
            data,
        )
        return True
