@echo off
set SRC=C:\Users\mikej\OneDrive\Documents\apps\pedal-sheet\public
set DST=vtt\public\images

if not exist "%DST%\battlemaps" mkdir "%DST%\battlemaps"
if not exist "%DST%\portraits" mkdir "%DST%\portraits"
if not exist "%DST%\tokens" mkdir "%DST%\tokens"
if not exist "%DST%\items" mkdir "%DST%\items"

copy "%SRC%\screwbeard_cave_enc.png" "%DST%\battlemaps\screwbeard_cave_enc.png" /Y
copy "%SRC%\boathouse_enc.png" "%DST%\battlemaps\boathouse_enc.png" /Y
copy "%SRC%\prison_enc.png" "%DST%\battlemaps\prison_enc.png" /Y
copy "%SRC%\scorpion_enc.png" "%DST%\battlemaps\scorpion_enc.png" /Y
copy "%SRC%\tutorial_forest_enc.png" "%DST%\battlemaps\tutorial_forest_enc.png" /Y

copy "%SRC%\bengo_bm.png" "%DST%\tokens\bengo_bm.png" /Y
copy "%SRC%\chauzy_map.png" "%DST%\tokens\chauzy_map.png" /Y
copy "%SRC%\geepo_bm.png" "%DST%\tokens\geepo_bm.png" /Y
copy "%SRC%\hansel_bm.png" "%DST%\tokens\hansel_bm.png" /Y
copy "%SRC%\heago_bm.png" "%DST%\tokens\heago_bm.png" /Y
copy "%SRC%\jewl_bm.png" "%DST%\tokens\jewl_bm.png" /Y
copy "%SRC%\kehrfuffle_bm.png" "%DST%\tokens\kehrfuffle_bm.png" /Y
copy "%SRC%\kort_bm.png" "%DST%\tokens\kort_bm.png" /Y
copy "%SRC%\leeta_bm.png" "%DST%\tokens\leeta_bm.png" /Y
copy "%SRC%\pavel_bm.png" "%DST%\tokens\pavel_bm.png" /Y
copy "%SRC%\scant_bm.png" "%DST%\tokens\scant_bm.png" /Y
copy "%SRC%\scorpio_bm.png" "%DST%\tokens\scorpio_bm.png" /Y
copy "%SRC%\screwbeard_bm.png" "%DST%\tokens\screwbeard_bm.png" /Y
copy "%SRC%\strider_bm.png" "%DST%\tokens\strider_bm.png" /Y
copy "%SRC%\toern_bm.png" "%DST%\tokens\toern_bm.png" /Y
copy "%SRC%\wendy_bm.png" "%DST%\tokens\wendy_bm.png" /Y

copy "%SRC%\kehrfuffle.png" "%DST%\portraits\kehrfuffle.png" /Y
copy "%SRC%\strider.png" "%DST%\portraits\strider.png" /Y
copy "%SRC%\toern.png" "%DST%\portraits\toern.png" /Y
copy "%SRC%\wendy.png" "%DST%\portraits\wendy.png" /Y

copy "%SRC%\accordion.png" "%DST%\items\accordion.png" /Y
copy "%SRC%\duku_belt.png" "%DST%\items\duku_belt.png" /Y
copy "%SRC%\tudul_ring.png" "%DST%\items\tudul_ring.png" /Y
copy "%SRC%\wendy_belt.png" "%DST%\items\wendy_belt.png" /Y
copy "%SRC%\wendy_parents.png" "%DST%\items\wendy_parents.png" /Y
copy "%SRC%\wendy_resto.png" "%DST%\items\wendy_resto.png" /Y

echo Done! All PNGs copied.
