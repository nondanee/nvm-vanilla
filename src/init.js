const os = require('os');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const insert = (content, line) => {
    if (/nvm-vanilla/.test(content)) {
        content = content.replace(/^.*nvm-vanilla.*$/m, line);
    } else {
        content += '\n' + line;
    }
    return content;
};

const init = async () => {
    if (process.platform === 'win32') {
        const profilePath = path.resolve(os.homedir(), 'Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1');
        let content = await promisify(fs.readFile)(profilePath, 'utf-8');
        const line = 'nvm-vanilla --eval env | Out-String | Invoke-Expression';
        content = insert(content, line);
        await promisify(fs.writeFile)(profilePath, content, 'utf-8');
    } else {
        const profilePath = path.resolve(os.homedir(), '.bashrc');
        let content = await promisify(fs.readFile)(profilePath, 'utf-8');
        const line = 'eval "$(nvm-vanilla --eval env)"';
        content = insert(content, line);
        await promisify(fs.writeFile)(profilePath, content, 'utf-8');
    }
};

module.exports = init;

// ${ZDOTDIR:-$HOME}/.zshrc
// $HOME/.profile
// $HOME/.bashrc

if (require.main === module) {
    init();
}