@echo off
REM copy-images.bat
REM Copies PNG files from /images/ to /public/images/{items,tokens,maps,portraits}/
REM Based on filename suffix:
REM   _portrait.png -> portraits
REM   _bm.png       -> tokens
REM   _enc.png      -> maps
REM   _item.png     -> items
REM   default       -> items

setlocal enabledelayedexpansion

set "SRC_DIR=%~dp0..\images"
set "DST_BASE=%~dp0..\public\images"

REM Create destination directories
if not exist "%DST_BASE%\items" mkdir "%DST_BASE%\items"
if not exist "%DST_BASE%\tokens" mkdir "%DST_BASE%\tokens"
if not exist "%DST_BASE%\maps" mkdir "%DST_BASE%\maps"
if not exist "%DST_BASE%\portraits" mkdir "%DST_BASE%\portraits"

set "COUNT=0"
for %%f in ("%SRC_DIR%\*.png") do (
    set "FILE=%%~nxf"
    set "FOLDER=items"
    
    echo !FILE! | findstr /r "_portrait\.png$" >nul && set "FOLDER=portraits"
    echo !FILE! | findstr /r "_bm\.png$" >nul && set "FOLDER=tokens"
    echo !FILE! | findstr /r "_enc\.png$" >nul && set "FOLDER=maps"
    echo !FILE! | findstr /r "_item\.png$" >nul && set "FOLDER=items"
    
    copy "%%f" "%DST_BASE%\!FOLDER!\" >nul
    set /a COUNT+=1
)

echo Copied %COUNT% PNG assets to public/images/
