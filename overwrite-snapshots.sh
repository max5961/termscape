#!/usr/bin/env bash

printf "OVERWRITE_SNAPSHOTS enabled.\n"
printf "This will overwrite ALL expected snapshots.\n\n"
printf "Type OVERWRITE to continue: "

read -r overwrite
if [[ $overwrite == "OVERWRITE" ]]; then
    echo "...compiling typescript" && npm run compile || exit 1
    echo "...running tests" && NODE_ENV=test && OVERWRITE_SNAPSHOTS=true && LOGGER=true npx vitest
fi
