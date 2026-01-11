nvm2() {
    cmd="$(command nvm2 --eval "$@")"
    # echo $cmd
    if [ -n "$cmd" ]; then
        eval $cmd
    else
        command nvm2 "$@"
    fi
}

nvm2 env