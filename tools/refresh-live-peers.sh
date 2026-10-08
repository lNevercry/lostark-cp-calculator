#!/usr/bin/env bash
# Rafraîchit le réservoir de vrais joueurs du Benchmark (data/live-peers.json) et le publie
# sur CT 104 et Cloudflare Pages. Lancé chaque semaine par cron (crontab de l'utilisateur dev).
#
# - Garde-fou : si le nouveau réservoir est vide ou tronqué, l'ancien est conservé et rien n'est publié.
# - Publication par tools/publish-data.sh : Cloudflare reçoit le code de PRODUCTION (git archive origin/master) + le
#   nouveau réservoir, jamais un travail en cours ni une autre branche (le dépôt local peut être sur dev).
# - Le fichier data/live-peers.json du dépôt est mis à jour mais pas commité (à commiter avec le reste).
set -euo pipefail

REPO=/root/ia-projects/lostark-cp-calculator
POOL=data/live-peers.json
MIN_CLASSES=25
MIN_PLAYERS=800

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" >/dev/null
# Jeton Cloudflare : .env du dépôt (ignoré par Git), comme deploy.sh
if [ -f "$REPO/.env" ]; then set -a; . "$REPO/.env"; set +a; fi
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || { echo "CLOUDFLARE_API_TOKEN absent de $REPO/.env"; exit 1; }

echo "=== $(date '+%F %T') rafraîchissement du réservoir de joueurs"
cd "$REPO"

BACKUP=$(mktemp)
trap 'rm -f "$BACKUP"' EXIT
cp "$POOL" "$BACKUP"

node tools/harvest-live-peers.mjs

if ! node -e "
  const d = require('./$POOL');
  const cls = Object.keys(d.classes || {}).length;
  const players = Object.values(d.classes || {}).reduce((s, l) => s + l.length, 0);
  console.log('classes:', cls, 'joueurs:', players);
  process.exit(cls >= $MIN_CLASSES && players >= $MIN_PLAYERS ? 0 : 1);
"; then
  cp "$BACKUP" "$POOL"
  echo "Réservoir invalide : ancien fichier conservé, rien n'est publié."
  exit 1
fi

# CT 104 et Cloudflare Pages (code de production + nouveau réservoir), vérifié en ligne
tools/publish-data.sh "$POOL"
echo "=== $(date '+%F %T') terminé"
