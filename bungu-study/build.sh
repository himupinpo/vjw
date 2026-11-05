#!/bin/sh
# まとめて1枚のページに
D=$(cd "$(dirname "$0")" && pwd)
S=$D/src
O=$D/index.html
cat $S/00_head.html $S/10_core.js $S/20_data.js $S/22_econ.js $S/25_mech.js $S/30_models.js $S/40_office.js $S/47_furniture.js $S/50_sim.js $S/52_econsim.js $S/55_event.js $S/57_figs.js $S/58_learn.js $S/60_ui.js $S/90_main.js > $O
wc -c $O
