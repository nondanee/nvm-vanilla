nvm() {
    local cmd="$(command nvm --eval "$@")"
    if [ -n "$cmd" ]; then
        eval $cmd
    else
        command nvm "$@"
    fi
}

nvm_autoload_dir=""

_nvm_autoload_hook() {
    local current_dir="$PWD"
    
    if [ "$current_dir" = "$nvm_autoload_dir" ]; then
        return
    fi

    nvm autoload

    nvm_autoload_dir="$current_dir"
}

# 根据不同 shell 设置钩子
case "$SHELL" in
    *bash*)
        # bash: 使用 PROMPT_COMMAND
        PROMPT_COMMAND="_nvm_autoload_hook; $PROMPT_COMMAND"
        ;;
    *zsh*)
        # zsh: 使用 chpwd 或 precmd 钩子
        autoload -U add-zsh-hook
        add-zsh-hook chpwd _nvm_autoload_hook
        ;;
esac