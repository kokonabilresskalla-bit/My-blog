import json
from pathlib import Path

data = json.loads(Path("data/experiments.json").read_text(encoding="utf-8"))
required = {"wire", "coil", "solenoid", "flux"}
assert set(data) == required, f"Unexpected experiment keys: {set(data)}"
fields = {"observe", "explain", "challenge", "title", "equation", "description"}
for name, experiment in data.items():
    missing = fields - experiment.keys()
    assert not missing, f"{name} missing: {missing}"
print(f"OK: {len(data)} experiments and all learning fields validated.")
