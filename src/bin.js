#!/usr/bin/env node

const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const { init, use, list, detect, uninstall } = require('./index');

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

    const checkVersion = () => {
        if (version) return true;
        process.stderr.write("Please provide a version manually to the command.\n");
    };

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
        case 'uninstall': {
            if (evalMode) return;
            if (!checkVersion()) return;
            await uninstall(baseDir, version);
            break;
        }
        case 'ls':
        case 'list': {
            if (evalMode) return;
            await list(baseDir);
            break;
        }
        case 'exec':
        case 'run': {
            if (evalMode) return;
            if (!checkVersion()) return;
            const PATH = await use(baseDir, version, false);
            process.env.PATH = PATH;
            const childArgs = args.slice(2);
            const childCommand = command === 'run' ? 'node' : childArgs.shift();
            if (PATH) spawnSync(childCommand, childArgs, { stdio: 'inherit' });
        }
        default:
    }
};

main();