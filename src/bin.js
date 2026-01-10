const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const { promisify } = require('util');

const { init, use, list } = require('./index');

const main = async () => {
    const homeDir = os.homedir();

    const baseDir = path.join(homeDir, '.nvm2');

    let evalMode = false;
    
    const args = process.argv.slice(2).filter(_ => {
        if (_ === '--eval') {
            evalMode = true;
            return false;
        }
        return true;
    });

    const command = args[0];
    const version = args[1];

    switch (command) {
        case 'use': {
            if (!evalMode) return;
            await use(baseDir, version);
            break;
        }
        case 'env': {
            if (!evalMode) return;
            // check .nvmrc .node_version
            break;
        }
        case 'install': {
            if (evalMode) return;
            try {
                await promisify(fs.mkdir)(baseDir);
            } catch (_) { }
            await init(baseDir, version);
            break;
        }
        case 'list': {
            if (evalMode) return;
            await list(baseDir);
            break;
        }
        default: {
            if (evalMode) return;
        }
    }
};

main();