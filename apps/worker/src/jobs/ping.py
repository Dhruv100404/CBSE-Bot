from datetime import datetime


def ping() -> str:
    return f"worker-ping:{datetime.utcnow().isoformat()}"
