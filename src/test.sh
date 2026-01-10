nvm2() {
    cmd="$(node index --eval "$@")"
    # echo $cmd
    if [ -n "$cmd" ]; then
        eval $cmd
    else
        node index "$@"
    fi
}

nvm2 env