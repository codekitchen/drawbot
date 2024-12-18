#!/bin/bash

set -e

# ldflags reduces binary size a bit, which is good because scp to the pi is slow
GOOS=linux GOARCH=arm CGO_ENABLED=0 go build -ldflags="-w -s" -o tmp/drawbot_rpi
scp tmp/drawbot_rpi drawbot.local:
ssh -t drawbot.local 'sudo systemctl stop drawbot && sudo cp drawbot_rpi /usr/bin/drawbot && sudo systemctl start drawbot'
