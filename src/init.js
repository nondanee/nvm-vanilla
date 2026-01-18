const os = require('os');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const init = async () => {
    if (process.platform === 'win32') {
        const profilePath = path.resolve(os.homedir(), 'Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1');
        let content = await promisify(fs.readFile)(profilePath, 'utf-8');
        const line = 'nvm-vanilla --eval env | Out-String | Invoke-Expression';
    } else {
        const profilePath = path.resolve(os.homedir(), '.bashrc');
        let content = await promisify(fs.readFile)(profilePath, 'utf-8');
        const line = 'eval "$(nvm-vanilla --eval env)"';
    }
};

module.exports = init;

// ${ZDOTDIR:-$HOME}/.zshrc
// $HOME/.profile
// $HOME/.bashrc

if (require.main === module) {
    init();
}