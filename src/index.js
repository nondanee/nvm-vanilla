const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { spawn, execFile } = require('child_process');
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

const promisifySpawn = (command, args, options) => {
    const child = spawn(command, args, {
        stdio: 'inherit',
        ...options,
    });

    return new Promise((resolve, reject) => {
        child.on('exit', code => {
            if (code === 0) resolve();
            else reject(code);
        });
    });
};

const install = async (cwd, version) => {
    // https://github.com/aredridel/node-bin-setup/blob/514d4aa42b58b10971845c420d34330c2414eef9/index.js#L10-L17

    process.env.npm_config_global = 'false';
    process.env.npm_config_repository = '';

    const npmCommand = getNpmCommand();

    const nodePackageName = getNodePackageName();

    await promisifySpawn(npmCommand, ['install', '--no-save', nodePackageName + '@' + version], {
        stdio: 'inherit',
        // shell: true,
        cwd,
    });

    const packageFile = path.join(cwd, 'node_modules', nodePackageName, 'package.json');
    const { version: nodeVersion } = await promisify(fs.readFile)(packageFile, 'utf8').then(JSON.parse);

    const npmVersion = await getNpmVersion(nodeVersion);

    await promisifySpawn(npmCommand, ['install', '--no-save', 'npm' + '@' + npmVersion], {
        stdio: 'inherit',
        // shell: true,
        cwd,
    });

    return nodeVersion;
};

const detect = async () => {
    const [
        nodeVersion,
        nvmrc,
    ] = await Promise.all(
        ['.node-version', '.nvmrc'].map(name => promisify(fs.readFile)(name, 'utf-8').catch(() => {}))
    );
    
    return String(nodeVersion || nvmrc || '').trim();
};

const fill = async (version) => {
    if (!version) version = await detect();
    if (!version) {
        process.stderr.write("Can't find version in dotfiles. Please provide a version manually to the command.\n");
        return;
    }
    return version.replace(/^v/i, '');
};

const clear = async (dir) => {
    if (process.platform == 'win32') {
        await promisify(execFile)('rd', ['/s', '/q', dir]);
    } else {
        await promisify(execFile)('rm', ['-rf', dir]);
    }
};

const init = async (baseDir, version) => {
    version = await fill(version);
    if (!version) return;

    try {
        await promisify(fs.mkdir)(baseDir);
    } catch (_) { }

    const workDir = path.join(baseDir, version);

    try {
        await clear(workDir);
    } catch (_) { }

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
        specificNodeVersion,
    ] = await Promise.all([
        promisify(fs.readdir)(templateDir),
        install(workDir, version),
    ]
        .concat(mkdirPromise));

    await promisify(fs.mkdir)(path.join(workDir, 'prefix', 'lib'));

    await Promise.all(nameList.map(async name => {
        const targetPath = path.join(binDir, name)
        await promisify(fs.copyFile)(
            path.join(templateDir, name),
            targetPath,
        );
        await promisify(fs.chmod)(targetPath, 0o755);
    }));

    const linkDir = path.join(baseDir, specificNodeVersion);

    try {
        await promisify(fs.unlink)(linkDir);
    } catch (_) {}

    await promisify(fs.symlink)(workDir, linkDir, 'dir');
};

const uninstall = async (baseDir, version) => {
    const workDir = path.join(baseDir, version);

    try {
        await clear(workDir);
    } catch (_) { }
};

const use = async (baseDir, version, evalFlag = true) => {
    version = await fill(version);
    if (!version) return;

    const workDir = path.join(baseDir, version, 'bin');
    const prefixDir = path.join(baseDir, version, 'prefix');

    let checkFlag = false;
    try {
     const stat = await promisify(fs.stat)(workDir);
     checkFlag = stat.isDirectory();
    } catch (_) {}

    if (!checkFlag && version !== 'system') {
        process.stderr.write("Can't find an installed Node version matching v" + version + ".\n");
        if (evalFlag) console.log(':');
        return;
    }

    let list = process.env.PATH.split(path.delimiter);

    list = list.filter(item => item.indexOf(baseDir) === -1);

    if (version !== 'system') list.unshift(workDir, prefixDir);

    const PATH = list.join(path.delimiter);

    // process.stderr.write('Now using node v' + version + '\n');

    if (evalFlag) console.log('export PATH=' + PATH);

    return PATH;
};

const list = async (baseDir) => {
    const nameList = await promisify(fs.readdir)(baseDir);

    const nodePackageName = getNodePackageName();

    let versionList = await Promise.all(nameList.map(async name => {
        const packageFile = path.join(baseDir, name, 'node_modules', nodePackageName, 'package.json');
        const { version } = await promisify(fs.readFile)(packageFile, 'utf8').then(JSON.parse).catch(() => ({}));
        if (!version) return;
        return 'node@' + name + ' (' + version + ')';
    }));

    versionList = versionList.filter(Boolean);

    if (versionList.length) console.log(versionList.join('\n'));
};

module.exports = {
    init,
    uninstall,
    use,
    list,
    detect,
};
