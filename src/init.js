const os = require('os');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const init = async () => {
    if (process.platform === 'win32') {
        await promisify(fs.appendFile)(
            path.resolve(os.homedir(), 'Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1'),
            '\nnvm-vanilla env --eval | Out-String | Invoke-Expression',
        )
    } else {
        await promisify(fs.appendFile)(
            path.resolve(os.homedir(), '.bashrc'),
            '\neval "$(nvm-vanilla env --eval)"',
        );
    }
};

module.exports = init;

// ${ZDOTDIR:-$HOME}/.zshrc
// $HOME/.profile
// $HOME/.bashrc

if (require.main === module) {
    init();
}