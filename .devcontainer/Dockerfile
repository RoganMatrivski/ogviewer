ARG VARIANT=latest
FROM oven/bun:${VARIANT}

# Create a new user (e.g., 'myuser') and add to sudo group
# RUN useradd -m -s /bin/bash bun && \
#     echo 'bun ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

RUN apt-get update \
    && apt-get -y install --no-install-recommends \
    ca-certificates \
    git \
    nano \
    vim-tiny \
    sudo \
    && apt-get auto-remove -y \
    && apt-get clean -y \
    && chsh -s $(which bash) bun \
    && echo 'export PS1="\e[01;32m\u\e[m:\e[01;34m\w\e[m\$ "' >> /home/bun/.bashrc \
    && echo 'bun ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers

RUN apt-get install python3 python3-distutils python3-venv -y

USER bun