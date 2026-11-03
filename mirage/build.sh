#!/bin/sh
# まとめて1枚のページに（assets/ の空と木材は同じフォルダから読む）。車のモデル（cars.json / cars.bin）はページの最後に埋めこむ
D=$(cd "$(dirname "$0")" && pwd)
S=$D/src
O=$D/index.html
cat $S/00_head.html $S/10_core.js $S/20_assets.js $S/30_city.js $S/40_human.js $S/50_car.js $S/60_world.js $S/70_player.js $S/80_game.js $S/85_audio.js $S/90_main.js > $O
printf '</script>\n<script id="carsjson" type="application/json">' >> $O
cat $D/assets/cars.json >> $O
printf '</script>\n<script id="carsbin" type="text/plain">' >> $O
base64 -w0 $D/assets/cars.bin >> $O
printf '</script>\n</body></html>\n' >> $O
wc -c $O
