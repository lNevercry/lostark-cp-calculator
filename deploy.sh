#!/usr/bin/env bash
# deploy.sh — Déploiement automatisé : vérification syntaxe + CT 104 + Cloudflare Pages
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

# Secrets locaux (jamais versionnés) : .env contient par ex. CLOUDFLARE_API_TOKEN=...
if [ -f .env ]; then set -a; . ./.env; set +a; fi
# Le token vient de l'environnement ou de .env, jamais de ce fichier (dépôt public).
# Vérifié avant tout envoi pour ne pas laisser CT 104 et Cloudflare désynchronisés.
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "Erreur : CLOUDFLARE_API_TOKEN absent. Ajoute-le dans .env (ignoré par Git) ou exporte-le." >&2
  exit 1
fi

# La production suit main / master : un déploiement depuis une autre branche publierait du code non fusionné
BRANCH=$(git -c safe.directory="$REPO_DIR" rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != main ] && [ "$BRANCH" != master ] && [ "${DEPLOY_ANY_BRANCH:-}" != 1 ]; then
  echo "Erreur : branche « $BRANCH ». Fusionner dans main avant de déployer (ou DEPLOY_ANY_BRANCH=1 pour forcer)." >&2
  exit 1
fi

echo "=== [1/4] Vérification de la syntaxe JS ==="
# node -c ne vérifie que le premier fichier passé : une commande par fichier
for f in *.js js/*.js functions/api/market/prices.js; do node -c "$f"; done
# Modules de l'analyseur de rotation (ES modules, js/rotation/package.json)
for f in js/rotation/*.js; do node --check "$f"; done
echo "Syntaxe JS : OK"

echo "=== [2/4] Synchronisation CT 104 (Docker Nginx) ==="
# Scripts du site : server.js (serveur Node local) n'est jamais publié
SITE_JS=$(ls *.js | grep -vx server.js)
# nginx.conf testé AVANT tout envoi, dans un conteneur jetable : une config cassée ne touche jamais le site
ssh root@192.168.1.104 "cat > /tmp/lostark-cp-nginx.conf && docker run --rm -v /tmp/lostark-cp-nginx.conf:/etc/nginx/conf.d/default.conf:ro nginx:alpine nginx -t" < nginx.conf >/dev/null 2>&1 \
  || { echo "Erreur : nginx.conf refusé par nginx -t, rien n'est déployé." >&2; exit 1; }
scp -q $SITE_JS *.html *.css root@192.168.1.104:/opt/lostark-cp/public/
# data/raid_status.json : écrit sur CT 104 par l'agent de raids, jamais écrasé par le déploiement
tar -c --exclude=raid_status.json images data js | ssh root@192.168.1.104 "tar -x --no-same-owner -C /opt/lostark-cp/public"
# nginx.conf est monté seul dans le conteneur : réécrit en place (même inode), un scp ne serait pas vu
ssh root@192.168.1.104 "cat /tmp/lostark-cp-nginx.conf > /opt/lostark-cp/nginx.conf && docker exec lostark-cp nginx -t && docker exec lostark-cp nginx -s reload" >/dev/null 2>&1 \
  || { echo "Erreur : rechargement de Nginx sur CT 104 impossible." >&2; exit 1; }
echo "CT 104 : déployé et Nginx rechargé"

echo "=== [3/4] Déploiement Cloudflare Pages ==="
export CLOUDFLARE_ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-8c75c7e4c291330a382ebdb9afa62dfb}"

# Environnement Node v22 via NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

cp $SITE_JS *.html *.css _headers "$WORK/"
cp -r images data js "$WORK/"
# État des raids de l'auteur (agent local) : jamais publié
rm -f "$WORK/data/raid_status.json"

npx -y wrangler pages deploy "$WORK" --project-name lostark-cp --commit-dirty=true --branch master

echo "=== [4/4] Vérification en ligne ==="
# Chaque site doit servir les versions d'index.html et les mêmes octets que les fichiers locaux
# (paramètre anti-cache ; Cloudflare peut mettre quelques secondes à propager). Échec = code de sortie 1.
sha() { sha256sum | cut -d' ' -f1; }
FILES="index.html $(ls js/*.js js/rotation/*.js | tr '\n' ' ')style.css i18n.js data.js data/bracer-t4.json data/honing-t4.json data/rotation-ref.json data/skill-shares.json data/gem-skill-groups.json"
verify_site() {
  local base="$1" f bust
  bust="nocache=$(date +%s%N)"
  for f in $FILES; do
    if [ "$(curl -fsS -L "$base/$f?$bust" | sha)" != "$(sha < "$f")" ]; then echo "  $base/$f : différent du fichier local"; return 1; fi
  done
  # Versions de cache-busting annoncées par la page servie
  local want got
  want=$(grep -o 'js/main\.js?v=[0-9.]*\|style\.css?v=[0-9.]*' index.html | sort | tr '\n' ' ')
  got=$(curl -fsS -L "$base/?$bust" | grep -o 'js/main\.js?v=[0-9.]*\|style\.css?v=[0-9.]*' | sort | tr '\n' ' ')
  [ "$want" = "$got" ] || { echo "  $base : versions servies « $got », attendues « $want »"; return 1; }
}
FAILED=0
for site in http://192.168.1.104:8080 https://lostark-cp.pages.dev; do
  ok=0
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
    if out=$(verify_site "$site" 2>&1); then ok=1; break; fi
    sleep 10
  done
  if [ "$ok" = 1 ]; then echo "$site : à jour ($(grep -o 'js/main\.js?v=[0-9.]*' index.html))"
  else echo "$site : PAS à jour après 2 min"; echo "$out"; FAILED=1; fi
done
if [ "$FAILED" = 1 ]; then echo "❌ Déploiement non vérifié" >&2; exit 1; fi
echo "✅ Déploiement vérifié : CT 104 et Cloudflare servent les fichiers locaux"
