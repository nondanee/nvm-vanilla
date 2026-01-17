#!/usr/bin/env node

const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const { init, use, list, detect, uninstall, alias, which } = require('./index');

const evalCommandSet = new Set(['use', 'autoload']);

const main = async () => {
    // process.stderr.write(JSON.stringify(process.argv) + '\n'); // debug

    const homeDir = os.homedir();

    const baseDir = path.join(homeDir, '.nvm2');

    const args = process.argv.slice(2);

    let evalMode = false;
    if (args[0] === '--eval') {
        evalMode = true;
        args.shift();
    }

    const command = args[0];
    const version = args[1];

    if (evalMode ^ evalCommandSet.has(command)) return;

    const checkVersion = () => {
        if (version) return true;
        throw 'no specific node version';
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
            break;
        }
        case 'which':
        case 'where': {
            if (!checkVersion()) return;
            const dir = await which(baseDir, version);
            console.log(dir);
            break;
        }
        case 'alias': {
            await alias(baseDir, args[1], args[2]);
            break;
        }
        case 'install': {
            await init(baseDir, version);
            break;
        }
        case 'unalias':
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
            const env = await use(baseDir, version, false);
            Object.assign(process.env, env);
            const childArgs = args.slice(2);
            const childCommand = command === 'run' ? 'node' : childArgs.shift();
            spawnSync(childCommand, childArgs, { stdio: 'inherit' });
            break;
        }
        case 'current': {
            spawnSync('node', ['--version'], { stdio: 'inherit' });
            break;
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