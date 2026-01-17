const os = require('os');
const fs = require('fs');

const init = () => {
    if (process.platform === 'win32') {
        fs.appendFileSync(
            path.resolve(os.homedir(), 'Documents/WindowsPowerShell/Microsoft.PowerShell_profile.ps1'),
            '\nnvm-vanilla env --eval | Out-String | Invoke-Expression',
        )
    } else {
        fs.appendFileSync(
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