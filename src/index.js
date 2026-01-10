const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
// const { promisify } = require('util');

const install = async (cwd, version) => {
    process.env.npm_config_global = 'false';
    process.env.npm_config_repository = '';

    const platform = process.platform == 'win32' ? 'win' : process.platform;
    const arch = platform == 'win' && process.arch == 'ia32' ? 'x86' : process.arch;
    const prefix = (process.platform == 'darwin' && process.arch == 'arm64') ? 'node-bin' : 'node';

    const npmCommand = platform == 'win' ? 'npm.cmd' : 'npm';
    const packageName = [prefix, platform, arch].join('-');

    spawnSync(npmCommand, ['install', '--no-save', packageName + '@' + version], {
        stdio: 'inherit',
        shell: true,
        cwd,
    });

    const { version: nodeVersion } = require(path.join(cwd, 'node_modules', packageName, 'package.json'));
};

const use = async (version) => {

};

const main = () => {

};

main();
