#!/bin/sh
# まとめて1枚のページに（assets/ の空と木材は同じフォルダから読む）
D=$(cd "$(dirname "$0")" && pwd)
S=$D/src
cat $S/00_head.html $S/10_core.js $S/20_assets.js $S/30_city.js $S/40_human.js $S/50_car.js $S/60_world.js $S/70_player.js $S/80_game.js $S/85_audio.js $S/90_main.js $S/99_tail.html > $D/index.html
wc -c $D/index.html
