#!/usr/bin/env bash

printf "OVERWRITE_SNAPSHOTS enabled.\n"
printf "This will overwrite ALL expected snapshots.\n\n"
printf "Type OVERWRITE to continue: "

read -r overwrite
if [[ $overwrite == "OVERWRITE" ]]; then
    echo "...compiling typescript" && npm run compile:test || exit 1
    echo "...running tests" && OVERWRITE_SNAPSHOTS=true npx vitest
fi
