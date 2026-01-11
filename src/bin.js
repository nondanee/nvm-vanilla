#!/usr/bin/env node

const os = require('os');
const path = require('path');

const { init, use, list, detect } = require('./index');

const main = async () => {
    // process.stderr.write(JSON.stringify(process.argv) + '\n'); // debug

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
        case 'autoload': {
            if (!evalMode) return;
            const targetVersion = await detect();
            if (targetVersion) {
                await use(baseDir, targetVersion);
            } else {
                console.log(':');
            }
        }
        case 'install': {
            if (evalMode) return;
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