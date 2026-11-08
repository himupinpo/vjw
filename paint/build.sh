#!/bin/sh
# まとめて1枚のページに
D=$(cd "$(dirname "$0")" && pwd)
S=$D/src
O=$D/index.html
cat $S/00_head.html $S/10_core.js $S/20_data.js $S/25_stage.js $S/30_map.js $S/32_deco.js $S/40_actor.js $S/50_combat.js $S/60_ai.js $S/70_game.js $S/75_rules.js $S/80_ui.js $S/90_main.js > $O
wc -c $O
