import json
import sys
from pathlib import Path
from typing import Any

backend_root = Path(__file__).resolve().parents[1]

_STABLE_STATUS_DESCRIPTIONS = {
    "413": "Content Too Large",
    "422": "Unprocessable Content",
}


def normalize_openapi_status_descriptions(schema: dict[str, Any]) -> None:
    for path_item in schema["paths"].values():
        for operation in path_item.values():
            if not isinstance(operation, dict):
                continue
            responses = operation.get("responses")
            if not isinstance(responses, dict):
                continue
            for status_code, description in _STABLE_STATUS_DESCRIPTIONS.items():
                response = responses.get(status_code)
                if isinstance(response, dict):
                    response["description"] = description


def main() -> None:
    sys.path.insert(0, str(backend_root))
    from app.main import app

    schema = app.openapi()
    normalize_openapi_status_descriptions(schema)
    output_path = backend_root / "openapi.json"
    output_path.write_text(
        json.dumps(schema, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
