#!/usr/bin/env bash
# Publie des fichiers de données (data/…) sur CT 104 et Cloudflare Pages sans toucher au code : utilisé par les tâches
# cron (refresh-live-peers.sh, rotation/harvest-bible.sh).
# Usage : tools/publish-data.sh data/fichier.json [data/autre.json …]
# - CT 104 : seuls ces fichiers sont copiés.
# - Cloudflare Pages : code de PRODUCTION (git archive origin/master, mis à jour par chaque git push origin main:master)
#   + ces fichiers : jamais un travail en cours ni une autre branche. Les autres fichiers de données gardent la version
#   du dernier passage (data/live-peers.json du dépôt, publié chaque semaine sans commit, est repris aussi).
# - Vérification : les deux sites servent les mêmes octets que les fichiers locaux (jusqu'à 2 min), sinon code 1.
set -euo pipefail

REPO=/root/ia-projects/lostark-cp-calculator
[ $# -gt 0 ] || { echo "Usage : $0 data/fichier.json [...]"; exit 1; }
cd "$REPO"
for f in "$@"; do
  case "$f" in data/*) ;; *) echo "$f : seuls les fichiers de data/ sont publiés ici"; exit 1 ;; esac
  [ -f "$f" ] || { echo "$f introuvable"; exit 1; }
done

export NVM_DIR="$HOME/.nvm"
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" >/dev/null
# Jeton Cloudflare : .env du dépôt (ignoré par Git), comme deploy.sh
if [ -f .env ]; then set -a; . ./.env; set +a; fi
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] || { echo "CLOUDFLARE_API_TOKEN absent de $REPO/.env"; exit 1; }

# CT 104
for f in "$@"; do scp -q "$f" "root@192.168.1.104:/opt/lostark-cp/public/$f"; done
echo "CT 104 : $* publié"

# Cloudflare Pages : code commité + fichiers de données
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
git -c safe.directory="$REPO" archive origin/master | tar -x -C "$WORK"
for f in "$@" data/live-peers.json; do cp "$f" "$WORK/$f"; done
(
  cd "$WORK"
  mkdir site
  cp $(ls ./*.js | grep -vx ./server.js) ./*.html ./*.css site/
  [ -f _headers ] && cp _headers site/
  cp -r images data js site/
  rm -f site/data/raid_status.json
  # Code de sortie de wrangler conservé : un échec de publication fait échouer le script
  npx -y wrangler pages deploy site --project-name lostark-cp --commit-dirty=true --branch master > wrangler.log 2>&1 \
    || { grep -E "ERROR|✘" wrangler.log; echo "Publication Cloudflare échouée"; exit 1; }
  grep -E "Success|complete" wrangler.log || true
)

# Vérification en ligne (propagation Cloudflare : jusqu'à 2 min)
for site in http://192.168.1.104:8080 https://lostark-cp.pages.dev; do
  for f in "$@"; do
    ok=0
    for _ in $(seq 1 12); do
      if curl -sf "$site/$f?nocache=$(date +%s)" | cmp -s - "$f"; then ok=1; break; fi
      sleep 10
    done
    [ "$ok" = 1 ] || { echo "$site/$f : pas à jour après 2 min"; exit 1; }
  done
  echo "$site : à jour"
done
