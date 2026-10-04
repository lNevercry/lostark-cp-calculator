#!/usr/bin/env bash
# Rafraîchit le réservoir de vrais joueurs du Benchmark (data/live-peers.json) et le publie
# sur CT 104 et Cloudflare Pages. Lancé chaque semaine par cron (crontab de l'utilisateur dev).
#
# - Garde-fou : si le nouveau réservoir est vide ou tronqué, l'ancien est conservé et rien n'est publié.
# - Cloudflare reçoit le code de PRODUCTION (git archive origin/master, mis à jour par chaque git push origin main:master) + le nouveau réservoir : jamais un travail en cours
#   ni une autre branche (le dépôt local peut être sur dev).
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
WORK=$(mktemp -d)
trap 'rm -rf "$WORK" "$BACKUP"' EXIT
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

# CT 104
scp -q "$POOL" root@192.168.1.104:/opt/lostark-cp/public/data/
echo "CT 104 : réservoir publié"

# Cloudflare Pages : code commité + nouveau réservoir
git -c safe.directory="$REPO" archive origin/master | tar -x -C "$WORK"
cp "$POOL" "$WORK/data/"
cd "$WORK"
mkdir site
cp $(ls ./*.js | grep -vx ./server.js) ./*.html ./*.css site/
[ -f _headers ] && cp _headers site/
cp -r images data js site/
rm -f site/data/raid_status.json
# Code de sortie de wrangler conservé (pipefail) : un échec de publication fait échouer le script
npx -y wrangler pages deploy site --project-name lostark-cp --commit-dirty=true --branch master > "$WORK/wrangler.log" 2>&1 \
  || { grep -E "ERROR|✘" "$WORK/wrangler.log"; echo "Publication Cloudflare échouée"; exit 1; }
grep -E "Success|complete" "$WORK/wrangler.log" || true
echo "=== $(date '+%F %T') terminé"
