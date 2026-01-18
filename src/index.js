/* eslint-disable no-empty */
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const https = require('https');
const { spawn, execFile } = require('child_process');
const { promisify } = require('util');

const getNpmCommand = () => {
    return process.platform == 'win32' ? 'npm.cmd' : 'npm';
};

const npmCommand = getNpmCommand();

// https://github.com/aredridel/node-bin-setup/blob/514d4aa42b58b10971845c420d34330c2414eef9/index.js#L10-L17

process.env.npm_config_global = 'false';
process.env.npm_config_repository = '';

const getNodePackageName = () => {
    const platform = process.platform == 'win32' ? 'win' : process.platform;
    const arch = platform == 'win' && process.arch == 'ia32' ? 'x86' : process.arch;
    const prefix = (process.platform == 'darwin' && process.arch == 'arm64') ? 'node-bin' : 'node';
    return [prefix, platform, arch].join('-');
};

const nodePackageName = getNodePackageName();

const readJsonFile = (filePath) => (
    promisify(fs.readFile)(filePath, 'utf8').then(JSON.parse)
);

const promisifySpawn = (command, args, options) => {
    const child = spawn(command, args, Object.assign({}, {
        stdio: 'inherit',
    }, options));

    return new Promise((resolve, reject) => {
        child.on('exit', code => {
            if (code === 0) resolve();
            else reject(code);
        });
    });
};

const getNodeVersion = async (semanticVersion) => {
    const npmViewOutput = await promisify(execFile)(npmCommand, [
        'view',
        nodePackageName + '@' + semanticVersion,
        'version',
        '--json',
    ])
        .catch(() => { });

    let nodeVersion;
    try {
        nodeVersion = JSON.parse(npmViewOutput.stdout).pop();
    } catch (_) { }

    return nodeVersion;
};

const fetchJsonFile = async (fileUrl) => {
    const response = await new Promise((resolve, reject) => {
        const { get } = /^http:\/\//.test(fileUrl) ? http : https;
        get(fileUrl)
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

    return JSON.parse(Buffer.concat(chunkList));
};

const getNpmVersion = async (nodeVersion) => {
    const list = await Promise.race([
        fetchJsonFile('https://cdn.npmmirror.com/binaries/node/index.json'),
        fetchJsonFile('https://nodejs.org/dist/index.json'),
    ]);

    const target = list.find(item =>
        item.version === nodeVersion ||
        item.version === 'v' + nodeVersion
    );

    if (!target) throw 'npm version not found';

    return target.npm;
};

const install = async (cwd, nodeVersion, prefixDir) => {
    // await promisifySpawn(npmCommand, ['install', '--no-save', nodePackageName + '@' + version], {
    //     stdio: 'inherit',
    //     // shell: true,
    //     cwd,
    // });

    // const packageFile = path.join(cwd, 'node_modules', nodePackageName, 'package.json');
    // const { version: nodeVersion } = await readJsonFile(packageFile);

    const npmVersion = await getNpmVersion(nodeVersion);

    await promisifySpawn(npmCommand, [
        'install',
        '--global',
        // '--no-save',
        '--ignore-engines',
        nodePackageName + '@' + nodeVersion,
        'npm' + '@' + npmVersion,
    ], {
        stdio: 'inherit',
        // shell: true,
        cwd,
        env: Object.assign({}, process.env, {
            NPM_CONFIG_PREFIX: prefixDir,
        }),
    });

    if (process.platform === 'win32') {
        const nodeLib = path.join(prefixDir, 'node_modules', nodePackageName);
        const packageData = await readJsonFile(path.join(nodeLib, 'package.json'));
        let binPath = packageData.bin.node;
        binPath = binPath.replace(/^\//, '');
        binPath = path.join(nodeLib, binPath);
        await promisify(fs.link)(binPath, path.join(prefixDir, path.basename(binPath)));
    }

    return nodeVersion;
};

/*
const override = async (workDir) => {
    const npmDir = path.join(workDir, 'node_modules', 'npm');
    const { bin } = await readJsonFile(path.join(npmDir, 'package.json'));

    const fileList = [];

    if (typeof bin === 'string') {
        fileList.push(bin);
    } else if (bin && typeof bin === 'object') {
        for (const key in bin) {
            fileList.push(bin[key]);
        }
    }

    const promiseList = fileList.map(async relativeFilePath => {
        relativeFilePath = relativeFilePath.replace(/^\//, '');
        const relativeLibPath = path.posix.relative(
            path.join(npmDir, relativeFilePath),
            workDir,
        );
        const prefix = `
process.env.NPM_CONFIG_PREFIX = process.env.NPM_CONFIG_PREFIX
    || require("path").resolve(__filename, ${JSON.stringify(relativeLibPath)}, "prefix");
process.env.NPM_CONFIG_CACHE = process.env.NPM_CONFIG_CACHE
    || require("path").resolve(__filename, ${JSON.stringify(relativeLibPath)}, "cache");
`
        .trim();
        const filePath = path.join(npmDir, relativeFilePath);
        let content = await promisify(fs.readFile)(filePath, 'utf-8');
        content = content.replace(/\n/, '\n' + prefix + '\n'); // #!/usr/bin/env node 第一行要保留
        await promisify(fs.writeFile)(filePath, content, 'utf-8');
    });

    return Promise.all(promiseList);
};
*/

const detect = async (baseDir) => {
    const [
        nodeVersion,
        nvmrc,
        defaultVersion,
    ] = await Promise.all(
        [
            '.node-version',
            '.nvmrc',
        ]
            .map(name => promisify(fs.readFile)(name, 'utf-8').catch(() => { }))
            .concat([
                baseDir && getLocalNodeVersion(baseDir, 'default').catch(() => { }),
            ])
    );

    return String(nodeVersion || nvmrc || defaultVersion || '').trim();
};

const corrent = async (version) => {
    if (!version) version = await detect();
    if (!version) {
        throw 'cannot detect node version';
    }
    return version.replace(/^v/i, '');
};

const clear = async (dir) => {
    if (process.platform == 'win32') {
        await promisify(execFile)('cmd.exe', ['/c', 'rd', '/s', '/q', dir]);
    } else {
        await promisify(execFile)('rm', ['-rf', dir]);
    }
};

const getNodePackageFilePath = (baseDir, name) => {
    if (process.platform === 'win32') {
        return path.join(baseDir, name, 'prefix', 'node_modules', nodePackageName, 'package.json');
    }
    return path.join(baseDir, name, 'prefix', 'lib', 'node_modules', nodePackageName, 'package.json');
};

const getPrefixBinDir = (baseDir, name) => {
    if (process.platform === 'win32') {
        return path.join(baseDir, name, 'prefix');
    }
    return path.join(baseDir, name, 'prefix', 'bin');
};

const getLocalNodeVersion = async (baseDir, name) => {
    let aliasFile = path.join(baseDir, name);
    let packageFile = getNodePackageFilePath(baseDir, name);

    let [
        aliasVersion,
        packageData,
    ] = await Promise.all([
        promisify(fs.readFile)(aliasFile, 'utf-8').catch(() => { }),
        readJsonFile(packageFile).catch(() => { }),
    ]);

    if (aliasVersion) {
        packageFile = getNodePackageFilePath(baseDir, aliasVersion);
        packageData = await readJsonFile(packageFile).catch(() => { });
    }

    try {
        return packageData.version.replace(/^v/, '');
    } catch (_) {
        throw `no local node version "${name}"`;
    }
};

const alias = async (baseDir, version, targetVersion) => {
    if (version === 'system') {
        throw 'cannot alias system node version';
    }

    const linkDir = path.join(baseDir, version);

    const resetFlag = targetVersion === 'none' && false;

    if (!targetVersion) {
        const nodeVersion = await getLocalNodeVersion(baseDir, version);
        console.log(nodeVersion);
        return;
    } else if (!resetFlag) {
        targetVersion = await getLocalNodeVersion(baseDir, targetVersion); // check
    }

    // const sourceDir = path.join(baseDir, targetVersion);

    try {
        await promisify(fs.unlink)(linkDir);
    } catch (_) { }

    if (!resetFlag) {
        // await promisify(fs.symlink)(sourceDir, linkDir, 'dir');
        await promisify(fs.writeFile)(linkDir, targetVersion, 'utf-8');
    }
};

const init = async (baseDir, version) => {
    version = await corrent(version);
    if (!version) return;

    try {
        await promisify(fs.mkdir)(baseDir);
    } catch (_) { }

    const nodeVersion = await getNodeVersion(version);

    if (!nodeVersion) {
        throw `no satisified node version "${version}"`;
    }

    const workDir = path.join(baseDir, nodeVersion);

    try {
        await promisify(fs.mkdir)(workDir);
    } catch (_) {
        throw `node version "${nodeVersion}" already installed`;
    }

    const binDir = path.join(workDir, 'bin');
    const prefixDir = path.join(workDir, 'prefix');
    const templateDir = path.join(__dirname, 'template');

    const mkdirPromise = Promise.all([
        // 'bin',
        'cache',
        'prefix',
    ].map(
        name => promisify(fs.mkdir)(path.join(workDir, name))
    ))
        .then(() => (
            promisify(fs.mkdir)(path.join(workDir, 'prefix', 'lib'))
        ));

    await mkdirPromise;

    /*
    const [
        // nameList,
    ] = await Promise.all([
        // promisify(fs.readdir)(templateDir),
        install(workDir, nodeVersion, prefixDir),
        // mkdirPromise,
    ]);
    */

    await install(workDir, nodeVersion, prefixDir);

    const binNameList = await promisify(fs.readdir)(prefixDir);
    await Promise.all(binNameList.map(async name => {
        if (/\.ps1$/.test(name)) { // .ps1 路径有问题，用 .cmd
            await promisify(fs.unlink)(path.join(prefixDir, name));
        }
    }));

    // await override(workDir);

    /*
    const binNameList = await promisify(fs.readdir)(path.join(workDir, 'node_modules', '.bin'));

    const commandNameSet = new Set(binNameList.map(_ => _.split('.')[0]));

    await Promise.all(nameList.map(async name => {
        const commandName = name.split('.')[0];
        if (!commandNameSet.has(commandName)) return;
        const targetPath = path.join(binDir, name);
        await promisify(fs.copyFile)(
            path.join(templateDir, name),
            targetPath,
        );
        await promisify(fs.chmod)(targetPath, 0o755);
    }));
    */

    if (version !== nodeVersion) {
        await alias(baseDir, version, nodeVersion);
    }
};

const uninstall = async (baseDir, version) => {
    const workDir = path.join(baseDir, version);

    try {
        await promisify(fs.unlink)(workDir);
    } catch (_) { }

    try {
        await clear(workDir);
    } catch (_) { }
};

const which = async (baseDir, name) => {
    const version = await getLocalNodeVersion(baseDir, name);
    return getPrefixBinDir(baseDir, version);
};

const use = async (baseDir, version, evalFlag = true) => {
    if (version !== 'system') {
        version = await corrent(version);
        version = await getLocalNodeVersion(baseDir, version);
    }

    // const workDir = path.join(baseDir, version, 'bin');
    // const workDir = path.join(baseDir, version, 'node_modules', '.bin');

    const prefixDir = path.join(baseDir, version, 'prefix');
    const cacheDir = path.join(baseDir, version, 'cache');

    const prefixBinDir = getPrefixBinDir(baseDir, version);

    const resetFlag = version === 'system';

    // let checkFlag = false;
    // try {
    //     const stat = await promisify(fs.stat)(workDir);
    //     checkFlag = stat.isDirectory();
    // } catch (_) { }

    // if (!checkFlag && !resetFlag) {
    //     throw `node version "${version}" not installed`;
    // }

    let list = process.env.PATH.split(path.delimiter);

    list = list.filter(item => item.indexOf(baseDir) === -1);

    if (!resetFlag) list.unshift(prefixBinDir);

    const env = {};

    env.PATH = list.join(path.delimiter);

    env.NPM_CONFIG_PREFIX = resetFlag ? '' : prefixDir;
    env.NPM_CONFIG_CACHE = resetFlag ? '' : cacheDir;

    // process.stderr.write('Now using node v' + version + '\n');

    if (evalFlag) {
        for (const key in env) {
            const value = env[key];

            // shell
            let command = `export ${key}="${value}"`;

            // powershell
            if (!process.env.SHELL) {
                command = `$env:${key}="${value}"`;
            } else if (process.platform === 'win32') {
                command
                    .replace(/([\w+]):\\/g, (_, $1) => '/' + $1.toLowerCase() + '/')
                    .replace(/\\/g, '/')
                    .replace(/;/g, ':');
            }

            process.stdout.write(
                command + '\n'
            );

            // process.stderr.write(
            //     command + '\n'
            // );
        }
    }

    return env;
};

const list = async (baseDir) => {
    const nameList = await promisify(fs.readdir)(baseDir).catch(() => []);

    let versionList = await Promise.all(nameList.map(async name => {
        const version = await getLocalNodeVersion(baseDir, name).catch(() => { });
        if (!version) {
            await uninstall(baseDir, name);
            return;
        }
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
    alias,
    which,
};
