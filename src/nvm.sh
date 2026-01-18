nvm() {
    local cmd="$(command nvm-vanilla --eval "$@")"
    if [ -n "$cmd" ]; then
        eval $cmd
    else
        command nvm-vanilla "$@"
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

case "$SHELL" in
    *bash*)
        PROMPT_COMMAND="_nvm_autoload_hook; $PROMPT_COMMAND"
        ;;
    *zsh*)
        autoload -U add-zsh-hook
        add-zsh-hook chpwd _nvm_autoload_hook
        ;;
esac
