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
    if (-not [Environment]::UserInteractive) { return }
    
    $currentDir = (Get-Location).Path
    
    if ($global:_nvmAutoloadDir -eq $currentDir) { return }

    nvm autoload
    
    $global:_nvmAutoloadDir = $currentDir
}

$originalPrompt = Get-Item function:prompt -ErrorAction SilentlyContinue
if ($originalPrompt) {
    $originalPrompt = $originalPrompt.ScriptBlock
}

function global:prompt {
    _nvmAutoloadHook
    
    if ($originalPrompt) {
        & $originalPrompt
    } else {
        "PS $($executionContext.SessionState.Path.CurrentLocation)$('>' * ($nestedPromptLevel + 1)) "
    }
}
