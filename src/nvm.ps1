function nvm {
    $result = nvm-vanilla --eval @args 2>$null
    if ($result) {
        Invoke-Expression $result
    } else {
        nvm-vanilla @args
    }
}
