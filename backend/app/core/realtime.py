from __future__ import annotations

import asyncio
from typing import Any

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, analysis_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            if analysis_id not in self.active_connections:
                self.active_connections[analysis_id] = set()
            self.active_connections[analysis_id].add(websocket)

    async def disconnect(self, analysis_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            if analysis_id not in self.active_connections:
                return
            self.active_connections[analysis_id].discard(websocket)
            if not self.active_connections[analysis_id]:
                del self.active_connections[analysis_id]

    async def broadcast(self, analysis_id: str, message: dict[str, Any]) -> None:
        async with self._lock:
            sockets = list(self.active_connections.get(analysis_id, set()))

        stale_sockets: list[WebSocket] = []
        for socket in sockets:
            try:
                await socket.send_json(message)
            except Exception:
                stale_sockets.append(socket)

        if stale_sockets:
            async with self._lock:
                if analysis_id in self.active_connections:
                    for socket in stale_sockets:
                        self.active_connections[analysis_id].discard(socket)
                    if not self.active_connections[analysis_id]:
                        del self.active_connections[analysis_id]


analysis_ws_manager = ConnectionManager()
