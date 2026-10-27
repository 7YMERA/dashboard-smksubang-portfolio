#!/usr/bin/env bash
# Pasang / kemas kini Apps Script dashboard ke akaun Google anda.
#   Kali pertama : cipta projek baharu "Dashboard SMK Subang Sync" dan muat naik semua fail .gs
#   Kali seterusnya: muat naik versi terkini sahaja (selepas git pull)
# Guna: cd dashboard-smksubang/google-apps-script && bash pasang.sh
set -euo pipefail
cd "$(dirname "$0")"

# Find clasp: on PATH, in Homebrew's folder, or run it through npx (same login either way).
if command -v clasp >/dev/null 2>&1; then
  CLASP=(clasp)
elif [ -x /opt/homebrew/bin/clasp ]; then
  CLASP=(/opt/homebrew/bin/clasp)
elif [ -x /usr/local/bin/clasp ]; then
  CLASP=(/usr/local/bin/clasp)
elif command -v npx >/dev/null 2>&1; then
  CLASP=(npx --yes @google/clasp)
else
  echo "✗ clasp tidak dijumpai. Pasang Node (brew install node), kemudian: npm install -g @google/clasp"
  exit 1
fi

if [ ! -f .clasp.json ]; then
  echo "→ Mencipta projek Apps Script baharu…"
  "${CLASP[@]}" create-script --type standalone --title "Dashboard SMK Subang Sync"
  # create-script downloads Google's starter files over ours: put ours back, drop the starter Code file.
  git checkout -- appsscript.json
  rm -f Code.js Code.gs
fi

echo "→ Memuat naik fail…"
"${CLASP[@]}" push --force
echo
echo "→ Membuka projek dalam pelayar…"
"${CLASP[@]}" open-script || echo "  (Buka sendiri: https://script.google.com → Dashboard SMK Subang Sync)"
echo "✓ Siap."
echo "  Kemudian ikut langkah 'Selepas muat naik' dalam google-apps-script/README.md"
