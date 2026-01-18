function nvm {
    $result = nvm-vanilla --eval @args
    if ($result) {
        Invoke-Expression ($result -join ";")
    } else {
        nvm-vanilla @args
    }
}
