@echo off
set "VCVARS=C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat"
call "%VCVARS%"
cd /d C:\An\Omni_channel_chatbot\pgvector
set "PG_CONFIG=C:\Program Files\PostgreSQL\18\bin\pg_config.exe"
nmake /F Makefile.win
nmake /F Makefile.win install
echo DONE
