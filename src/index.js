const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');
// const { promisify } = require('util');

const getNpmVersion = async (nodeVersion) => {
    const response = await new Promise((resolve, reject) => {
        https.get('https://nodejs.org/dist/index.json')
            .on('response', resolve)
            .on('error', reject);
    });

    const chunkList = [];

    await new Promise((resolve, reject) => {
        response
            .on('error', reject)
            .on('end', resolve)
            .on('data', (chunk) => {
                chunkList.push(chunk);
            });
    });

    const list = JSON.parse(Buffer.concat(chunkList));

    const target = list.find(item =>
        item.version === targetVersion ||
        item.version === 'v' + targetVersion
    );

    return target.npm;
};

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
