#!/bin/sh
# まとめて1枚のページに
D=$(cd "$(dirname "$0")" && pwd)
S=$D/src
O=$D/index.html
cat $S/00_head.html $S/10_core.js $S/20_phys.js $S/30_player.js $S/40_level.js $S/50_game.js $S/60_ui.js $S/90_main.js > $O
wc -c $O
