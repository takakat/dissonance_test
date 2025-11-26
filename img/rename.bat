@echo off
setlocal enabledelayedexpansion

rem ベース名を指定
set BASE=painting

rem 連番の開始番号
set /a N=1

for /f "delims=" %%F in ('dir /b *.jpg') do (
    rem 2桁ゼロ埋め (01, 02, 10, ...)
    set NUM=0!N!
    set NUM=!NUM:~-2!

    ren "%%F" "%BASE%_!NUM!.jpg"
    set /a N+=1
)

endlocal
