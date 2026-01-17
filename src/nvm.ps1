function nvm {
    param([string]$Command)
    
    $result = nvm-vanilla --eval $Command 2>$null
    if ($result) {
        Invoke-Expression $result
    } else {
        nvm-vanilla $Command
    }
}