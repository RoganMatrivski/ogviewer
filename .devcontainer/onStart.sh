#!/bin/sh

# Add JSON: "postStartCommand": "chmod +x ./.devcontainer/onStart.sh; containerWorkspaceFolder=${containerWorkspaceFolder} ./.devcontainer/onStart.sh",

mount_folder="/mnt/docker-mnt";
sudo chown $(id -u $(whoami)):$(id -g $(whoami)) $mount_folder;
link_folder="node_modules .next .open-next";

for folder in $link_folder
do
    mkdir -p "$mount_folder/$folder" && \
    rm -rf ${containerWorkspaceFolder}/$folder && \
    ln -s $mount_folder/$folder ${containerWorkspaceFolder}/$folder
done