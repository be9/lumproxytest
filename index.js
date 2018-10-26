const debug = require('debug');
const fs = require('fs');
const request = require('request');
const url = require('url');

// 30 minutes
const CHECK_INTERVAL = 30 * 60 * 1000;
const HOST = 'http://plaidip.plaid.com';

async function main() {
  const fileName = process.argv[2];

  if (fileName == null) {
    throw Error('filename not specified');
  }

  const lines = fs.readFileSync(fileName).toString().split('\n').filter(l => l.length > 0);
  const proxies = lines.map(makeProxyUrl);

  proxies.forEach(proxyUrl => {
    checkProxy(proxyUrl);

    setInterval(() => checkProxy(proxyUrl), CHECK_INTERVAL);
  });
}

/**
 * Converts "proxyhost:proxyport:proxyuser:proxypass" to
 * "http://proxyuser:proxypass@proxyhost:proxyport".
 */
function makeProxyUrl(lumProxy) {
  const parts = lumProxy.split(':');

  if (parts.length !== 4) {
    throw Error(`bad proxy line: ${lumProxy}`);
  }

  const [proxyHost, proxyPort, proxyUser, proxyPass] = parts;

  return `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`;
}

/**
 *
 */
function checkProxy(proxyUrl) {
  // use ip or vip as name
  const log = debug(url.parse(proxyUrl).auth.split(':')[0].split('-').pop());
  log(`Accessing ${HOST} using ${proxyUrl}`);

  request({
    url: HOST,
    proxy: proxyUrl,
  }, (err, response, body) => {
    if (err != null) {
      log(`ERROR: ${err}`);
    } else {
      log(`Status ${response.statusCode}. Response: ${body}`)
    }
  });
}

main();
