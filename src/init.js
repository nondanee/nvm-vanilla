const fs = require('fs');

const init = () => {
    if (process.platform === 'win32') {

    } else {
        fs.appendFileSync('~/.bashrc', '\neval "$(nvm-vanilla env --use-on-cd)"');
    }
};

module.exports = init;

// ${ZDOTDIR:-$HOME}/.zshrc
// $HOME/.profile
// $HOME/.bashrc

if (require.main === module) {
    init();
}