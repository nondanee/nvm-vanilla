#!/usr/bin/env node

const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const { init, use, list, detect, uninstall } = require('./index');

const evalCommandSet = new Set(['use', 'autoload'])

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

    if (evalMode ^ evalCommandSet.has(command)) return;

    const checkVersion = () => {
        if (version) return true;
        process.stderr.write("Please provide a version manually to the command.\n");
    };

    switch (command) {
        case 'use': {
            await use(baseDir, version);
            break;
        }
        case 'autoload': {
            const targetVersion = await detect();
            if (targetVersion) {
                await use(baseDir, targetVersion);
            } else {
                console.log(':');
            }
        }
        case 'install': {
            await init(baseDir, version);
            break;
        }
        case 'uninstall': {
            if (!checkVersion()) return;
            await uninstall(baseDir, version);
            break;
        }
        case 'ls':
        case 'list': {
            await list(baseDir);
            break;
        }
        case 'exec':
        case 'run': {
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

main()
    .catch((error) => {
        const message = (error || {}).stack || error;
        process.stderr.write(message + '\n');
        process.exit(-1);
    });