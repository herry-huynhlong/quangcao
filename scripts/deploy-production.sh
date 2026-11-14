#!/usr/bin/env sh
set -eu
revision="${1:-$(git rev-parse HEAD)}"
case "$revision" in
  *[!0-9a-f]*) echo "Revision must be a Git SHA" >&2; exit 1;;
esac
revision="$(git rev-parse --verify "${revision}^{commit}")" || {
  echo "Revision does not exist in this checkout" >&2
  exit 1
}
export QAVIO_ADS_API_IMAGE="ghcr.io/herry-huynhlong/qavio-ads-api:sha-${revision}"
export QAVIO_ADS_WEB_IMAGE="ghcr.io/herry-huynhlong/qavio-ads-web:sha-${revision}"
docker compose -f docker-compose.production.yml pull
docker compose -f docker-compose.production.yml up -d --remove-orphans
docker compose -f docker-compose.production.yml ps

# Keep only the QAVIO API/Web images used by this release.  This deliberately
# does not prune volumes, containers, build cache, or images from other apps.
active_images="$(docker compose -f docker-compose.production.yml images -q | sort -u)"
docker image ls --format '{{.Repository}} {{.ID}}' | while read -r repository image_id; do
  case "$repository" in
    ghcr.io/herry-huynhlong/qavio-ads-api|ghcr.io/herry-huynhlong/qavio-ads-web)
      case " $active_images " in
        *" $image_id "*) ;;
        *) docker image rm "$image_id" >/dev/null 2>&1 || true ;;
      esac
      ;;
  esac
done
