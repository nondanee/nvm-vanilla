#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { promisify } = require('util');
const { spawnSync, execFile } = require('child_process');
const { version } = require('../package.json');

const { init: install, use, list, detect, uninstall, alias, which } = require('./index');

const init = require('./init');

const evalCommandSet = new Set(['use', 'autoload', 'env']);

const main = async () => {
    // process.stderr.write(JSON.stringify(process.argv) + '\n'); // debug

    await promisify(fs.appendFile)(path.resolve(__dirname, '.history'), JSON.stringify({
        argv: process.argv,
        cwd: process.cwd(),
        time: Date.now(),
        pwsh: !!process.env.PSModulePath,
    }, null, 4) + '\n');

    const homeDir = os.homedir();

    const baseDir = path.join(homeDir, '.nvm-vanilla');

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
        case '--version': {
            console.log(version);
            break;
        }
        case 'env': {
            const content = await promisify(fs.readFile)(path.resolve(
                __dirname,
                process.env.PSModulePath ? 'nvm.ps1' : 'nvm.sh'
            ), 'utf-8');
            process.stdout.write(content);
            break;
        }
        case 'use': {
            await use(baseDir, version);
            break;
        }
        case 'autoload': {
            const targetVersion = await detect(baseDir);
            try {
                if (!targetVersion) throw '';
                await use(baseDir, targetVersion);
            } catch (_) {
                console.log(process.env.PSModulePath ? ';' : ':');
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
            await install(baseDir, version);
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
            const output = await promisify(execFile)('node', ['--version']).catch(() => {});
            if (output) console.log(output.stdout.replace(/^v/, '').trim());
            break;
        }
        case 'init': {
            await init();
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