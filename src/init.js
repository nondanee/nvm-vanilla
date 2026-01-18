const os = require('os');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const pattern = /^.*nvm-vanilla.*$/m;

const insert = async (profilePath, line) => {
    let content = await promisify(fs.readFile)(profilePath, 'utf-8');
    if (pattern.test(content)) {
        content = content.replace(pattern, line);
    } else {
        content += '\n' + line;
    }
    await promisify(fs.writeFile)(profilePath, content, 'utf-8');
};

const init = async () => {
    if (process.platform === 'win32') {
        const profilePath = path.resolve(os.homedir(), 'Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1');
        const line = 'nvm-vanilla --eval env | Out-String | Invoke-Expression';
        await insert(profilePath, line);
    } else {
        const profilePath = path.resolve(os.homedir(), '.bashrc');
        const line = 'eval "$(nvm-vanilla --eval env)"';
        await insert(profilePath, line);
    }
};

module.exports = init;

// ${ZDOTDIR:-$HOME}/.zshrc
// $HOME/.profile
// $HOME/.bashrc

if (require.main === module) {
    init();
}