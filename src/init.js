const fs = require('fs');

// if (!/node_modules/.test(__dirname)) {
//     process.exit();
// }

const init = () => {
    if (process.platform === 'win32') {

    } else {
        fs.appendFileSync('~/.bashrc', 
    `
    NVM_VANILLA_DIR="${__dirname}"
    [ -s "$NVM_VANILLA_DIR/init.sh" ] && \. "$NVM_VANILLA_DIR/init.sh"
    `
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