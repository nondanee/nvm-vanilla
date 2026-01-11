nvm2() {
    local cmd="$(command nvm2 --eval "$@")"
    if [ -n "$cmd" ]; then
        eval $cmd
    else
        command nvm2 "$@"
    fi
}

nvm2_autoload_dir=""

_nvm2_autoload_hook() {
    local current_dir="$PWD"
    
    if [ "$current_dir" = "$nvm2_autoload_dir" ]; then
        return
    fi

    nvm2 autoload

    nvm2_autoload_dir="$current_dir"
}

# 根据不同 shell 设置钩子
case "$SHELL" in
    *bash*)
        # bash: 使用 PROMPT_COMMAND
        PROMPT_COMMAND="_nvm2_autoload_hook; $PROMPT_COMMAND"
        ;;
    *zsh*)
        # zsh: 使用 chpwd 或 precmd 钩子
        autoload -U add-zsh-hook
        add-zsh-hook chpwd _nvm2_autoload_hook
        ;;
esac