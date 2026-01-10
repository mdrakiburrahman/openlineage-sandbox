#!/bin/bash
API_URL="${1:-http://localhost:9003}"
LINEAGE_FILE="${2:-./spark-mnt/lineage.json}"
[ ! -f "$LINEAGE_FILE" ] && { echo "File not found: $LINEAGE_FILE" >&2; exit 1; }
while read -r line; do
    [[ -z "${line// }" ]] && continue
    curl -s -X POST -H "Content-Type: application/json" -d "$line" "$API_URL/api/v1/lineage" >/dev/null
done < "$LINEAGE_FILE"