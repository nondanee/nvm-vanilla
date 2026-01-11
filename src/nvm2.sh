nvm2() {
    cmd="$(command nvm2 --eval "$@")"
    if [ -n "$cmd" ]; then
        eval $cmd
    else
        command nvm2 "$@"
    fi
}

_nvm2_autoload_hook() {
    # 缓存
    nvm2 autoload
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