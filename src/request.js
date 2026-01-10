const http = require('http');
const https = require('https');
const { parse } = require('url');

const createRequest = (method, url, headers) => {
    const options = parse(url);
    return (options.protocol === 'https:' ? https : http).request({
        ...options,
        method,
        headers,
    });
};

const readResponse = async (stream) => {
    const chunkList = [];
    return new Promise((resolve, reject) => {
        stream
            .on('error', reject)
            .on('end', resolve)
            .on('data', (chunk) => {
                chunkList.push(chunk);
            })
    })
        .then(() => Buffer.concat(chunkList));
};

module.exports = {
    createRequest,
    readResponse,
};
