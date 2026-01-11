# 自动切换版本的钩子函数
_nvm2_autoload_hook() {
    # 查找 .node-version 或 .nvmrc 文件
    local node_version_file="$(find_up .node-version .nvmrc)"
    
    if [ -f "$node_version_file" ]; then
        local node_version="$(cat "$node_version_file")"
        # 如果当前版本与文件指定版本不同，则切换
        if [ "$(fnm current)" != "$node_version" ]; then
            fnm use "$node_version" --silent-if-unchanged
        fi
    fi
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