const os = require('os');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const pattern = /^.*nvm-vanilla.*$/m;

const insert = async (profilePath) => {
    const line = /\.ps1$/.test(profilePath)
        ? 'nvm-vanilla --eval env | Out-String | Invoke-Expression'
        : 'eval "$(nvm-vanilla --eval env)"';

    let content = await promisify(fs.readFile)(profilePath, 'utf-8');
    if (pattern.test(content)) {
        content = content.replace(pattern, line);
    } else {
        content += '\n' + line;
    }
    await promisify(fs.writeFile)(profilePath, content, 'utf-8');
};

const init = async () => {
    const profileList = [
        'Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1',
        '.bashrc',
        '.zshrc',
        // '.profile',
    ];

    let index = 0;
    while (index < profileList.length) {
        const profileName = profileList[index];
        const profilePath = path.resolve(os.homedir(), profileName);
        await insert(profilePath).catch(() => {});
        index += 1;
    }
};

module.exports = init;

// ${ZDOTDIR:-$HOME}/.zshrc
// $HOME/.profile
// $HOME/.bashrc

if (require.main === module) {
    init();
}