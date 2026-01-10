nvm2() {
    cmd="$(node bin --eval "$@")"
    # echo $cmd
    if [ -n "$cmd" ]; then
        eval $cmd
    else
        node bin "$@"
    fi
}

nvm2 env