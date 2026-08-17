#!/usr/bin/env bash
# Read-only verification for monitoring configs:
#   - promtool check rules (alert + recording)
#   - Grafana dashboard JSON schema / structural validation
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

RULES=(
  monitoring/prometheus/rules/alerts.yml
  monitoring/prometheus/rules/recording.yml
)
DASHBOARD="monitoring/grafana/dashboards/ecommerce-overview.json"
SCHEMA="monitoring/grafana/schemas/dashboard-minimal.schema.json"

pass=true
summary_parts=()

ensure_promtool() {
  if command -v promtool >/dev/null 2>&1; then
    return 0
  fi
  echo "==> promtool not on PATH; downloading prometheus release tools"
  local version="2.54.1"
  local arch
  arch="$(uname -m)"
  case "${arch}" in
    x86_64|amd64) arch="amd64" ;;
    aarch64|arm64) arch="arm64" ;;
    *) echo "unsupported arch: ${arch}"; return 1 ;;
  esac
  local url="https://github.com/prometheus/prometheus/releases/download/v${version}/prometheus-${version}.linux-${arch}.tar.gz"
  local tmp
  tmp="$(mktemp -d)"
  if ! curl -fsSL "${url}" -o "${tmp}/prometheus.tgz"; then
    echo "failed to download promtool from ${url}"
    return 1
  fi
  tar -xzf "${tmp}/prometheus.tgz" -C "${tmp}"
  export PATH="${tmp}/prometheus-${version}.linux-${arch}:${PATH}"
  command -v promtool >/dev/null 2>&1
}

echo "==> promtool check rules"
if ensure_promtool; then
  if promtool check rules "${RULES[@]}"; then
    summary_parts+=("promtool check rules: OK")
  else
    pass=false
    summary_parts+=("promtool check rules: FAILED")
  fi
else
  pass=false
  summary_parts+=("promtool unavailable")
fi

echo "==> Grafana dashboard JSON validation"
if ! command -v python3 >/dev/null 2>&1; then
  pass=false
  summary_parts+=("python3 missing for JSON schema validation")
elif python3 - "${DASHBOARD}" "${SCHEMA}" <<'PY'
import json, sys
from pathlib import Path

dashboard_path = Path(sys.argv[1])
schema_path = Path(sys.argv[2])

data = json.loads(dashboard_path.read_text())
schema = json.loads(schema_path.read_text())

required = schema.get("required", [])
missing = [k for k in required if k not in data]
if missing:
    print(f"MISSING required keys: {missing}")
    sys.exit(1)

assert isinstance(data.get("panels"), list) and len(data["panels"]) > 0, "panels must be a non-empty list"
assert data.get("schemaVersion"), "schemaVersion required"
assert data.get("title"), "title required"
assert data.get("uid"), "uid required"
for panel in data["panels"]:
    assert "type" in panel and "id" in panel and "title" in panel, f"invalid panel: {panel.get('id')}"
    assert "targets" in panel and isinstance(panel["targets"], list), f"panel {panel['id']} missing targets"

print(f"Dashboard JSON OK: {dashboard_path} ({len(data['panels'])} panels, schemaVersion={data['schemaVersion']})")
PY
then
  summary_parts+=("dashboard JSON schema validation: OK")
else
  pass=false
  summary_parts+=("dashboard JSON schema validation: FAILED")
fi

echo "==> summary"
joined=$(printf '%s; ' "${summary_parts[@]}")
joined="${joined%; }"
echo "${joined}"

if [ "${pass}" = true ]; then
  echo "VERIFY OK"
  exit 0
fi
echo "VERIFY FAILED"
exit 1
