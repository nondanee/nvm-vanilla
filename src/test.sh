nvm2() {
    cmd = "$(node index --eval "$@")"
    if [ -n "$cmd" ]; then
        eval "$cmd"
    else
        node index "$@"
    fi
}

nvm2 env