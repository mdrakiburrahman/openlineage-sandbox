#!/bin/bash
API_URL="${1:-http://localhost:9003}"
CLOUD_URL="https://rakirahman.blob.core.windows.net/public/datasets/openlineage-from-spark-delta.json"
TMP_FILE=$(mktemp /tmp/openlineage-cloud-XXXXXX.json)
trap 'rm -f "$TMP_FILE"' EXIT

if curl -sf -o "$TMP_FILE" "$CLOUD_URL"; then
    echo "Using cloud lineage file from $CLOUD_URL"
    LINEAGE_FILE="$TMP_FILE"
else
    echo "Cloud file unavailable, falling back to local file"
    LINEAGE_FILE="${2:-./spark-mnt/lineage.json}"
fi

[ ! -f "$LINEAGE_FILE" ] && { echo "File not found: $LINEAGE_FILE" >&2; exit 1; }
while read -r line; do
    [[ -z "${line// }" ]] && continue
    curl -s -X POST -H "Content-Type: application/json" -d "$line" "$API_URL/api/v1/lineage" >/dev/null
done < "$LINEAGE_FILE"