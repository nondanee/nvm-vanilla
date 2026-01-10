const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');
const { promisify } = require('util');

const getNpmVersion = async (targetVersion) => {
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

    if (!target) throw 'NPM version not found';

    return target.npm;
};

const getNpmCommand = () => {
    return process.platform == 'win32' ? 'npm.cmd' : 'npm';
};

const getNodePackageName = () => {
    const platform = process.platform == 'win32' ? 'win' : process.platform;
    const arch = platform == 'win' && process.arch == 'ia32' ? 'x86' : process.arch;
    const prefix = (process.platform == 'darwin' && process.arch == 'arm64') ? 'node-bin' : 'node';
    return [prefix, platform, arch].join('-');
};

const install = async (cwd, version) => {
    process.env.npm_config_global = 'false';
    process.env.npm_config_repository = '';

    const npmCommand = getNpmCommand();

    const nodePackageName = getNodePackageName();

    spawnSync(npmCommand, ['install', '--no-save', nodePackageName + '@' + version], {
        stdio: 'inherit',
        // shell: true,
        cwd,
    });

    const { version: nodeVersion } = require(path.join(cwd, 'node_modules', nodePackageName, 'package.json'));

    const npmVersion = await getNpmVersion(nodeVersion);

    spawnSync(npmCommand, ['install', '--no-save', 'npm' + '@' + npmVersion], {
        stdio: 'inherit',
        // shell: true,
        cwd,
    });
};

const init = async (baseBir, version) => {
    const workDir = path.join(baseBir, version);

    await promisify(fs.mkdir)(workDir);

    const binDir = path.join(workDir, 'bin');
    const templateDir = path.join(__dirname, 'template');

    const mkdirPromise = [
        'bin',
        'cache',
        'prefix',
    ].map(
        name => promisify(fs.mkdir)(path.join(workDir, name))
    );

    const [
        nameList,
    ] = await Promise.all([
        promisify(fs.readdir)(templateDir),
        install(workDir, version),
    ]
        .concat(mkdirPromise))

    await Promise.all(nameList.map(async name => {
        const targetPath = path.join(binDir, name)
        await promisify(fs.copyFile)(
            path.join(templateDir, name),
            targetPath,
        );
        await promisify(fs.chmod)(targetPath, 0o755);
    }));
};

const use = async (baseDir, version) => {
    const workDir = path.join(baseDir, version, 'bin');
    
    let list = process.env.PATH.split(path.delimiter);

    list.filter(item => item.indexOf(baseDir) === -1);

    list.push(workDir);

    process.stdout.write('export PATH=' + list.join(path.delimiter) + '\n');
};

const list = async () => {
    const nameList = await promisify(fs.readdir)(baseDir);

    const versionList = await Promise.all(nameList.map(async name => {
        const packageFile = path.join(baseDir, name, 'node_modules', 'node', 'package.json');
    }))
};

const main = async () => {
    const homeDir = os.homedir();

    const baseDir = path.join(homeDir, '.nvm2');

    // console.log(typeof process.argv[2]);

    switch (process.argv[2]) {
        case 'use': {
            await use(baseDir, process.argv[3]);
            break;
        }
        case 'install': {
            try {
                await promisify(fs.mkdir)(baseDir);
            } catch (_) { }
            await init(baseDir, process.argv[3]);
            break;
        }
        case '':
        case undefined: {
            // check .nvmrc .node_version
            break;
        }
        case 'list': {
            break;
        }
        default: {

        }
    }
};

main();
