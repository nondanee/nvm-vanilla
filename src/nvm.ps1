function nvm {
    $result = nvm-vanilla --eval @args
    if ($result) {
        Invoke-Expression ($result -join ";")
    } else {
        nvm-vanilla @args
    }
}

$global:_nvmAutoloadDir = ""

function _nvmAutoloadHook {
    # 只在交互式 shell 中运行
    if (-not [Environment]::UserInteractive) { return }

    $currentDir = (Get-Location).Path

    # 如果目录没变，跳过
    if ($global:_nvmAutoloadDir -eq $currentDir) { return }

    nvm autoload
    
    $global:_nvmAutoloadDir = $currentDir
}

# 集成到 prompt 中
$originalPrompt = Get-Item function:prompt -ErrorAction SilentlyContinue
if ($originalPrompt) {
    $originalPrompt = $originalPrompt.ScriptBlock
}

function global:prompt {
    _nvmAutoloadHook

    # 调用原始 prompt
    if ($originalPrompt) {
        & $originalPrompt
    } else {
        "PS $($executionContext.SessionState.Path.CurrentLocation)$('>' * ($nestedPromptLevel + 1)) "
    }
}
