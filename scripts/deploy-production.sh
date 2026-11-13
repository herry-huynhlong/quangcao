#!/usr/bin/env sh
set -eu
revision="${1:-$(git rev-parse HEAD)}"
case "$revision" in
  *[!0-9a-f]*) echo "Revision must be a Git SHA" >&2; exit 1;;
esac
export QAVIO_ADS_API_IMAGE="ghcr.io/herry-huynhlong/qavio-ads-api:sha-${revision}"
export QAVIO_ADS_WEB_IMAGE="ghcr.io/herry-huynhlong/qavio-ads-web:sha-${revision}"
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d --remove-orphans
docker compose -f docker-compose.production.yml ps
