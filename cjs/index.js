'use strict';
/*! (c) Andrea Giammarchi */

const IPv4 = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require('any-ipv4'));
const {WebSocketServer} = require('ws');

const clientExport = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require('./client.js'));
const serverExport = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require('./server.js'));

/**
 * @callback RequestHandler an express or generic node http server handler
 * @param {object} request the request instance
 * @param {object} response the response instance
 * @param {function=} next the optional `next()` to call in express
 */

/**
 * @typedef {Object} ProxiedNodeConfig used to configure the proxied namespace
 * @property {WebSocketServer|object} wss a WebSocketServer options or a WebSocketServer instance
 * @property {object} namespace the namespace to proxy to each client
 * @property {RegExp=} match an optional client side URL to match. By default is /\/(?:m?js\/)?proxied-node\.m?js$/
 * @property {string=} host an optional host name to use. it's IPv4 / localhost otherwise
 * @property {number=} port an optional  port to use when wss is an instance of WebSocketServer already
 */

/**
 * Configure the proxied namespace handling.
 * @param {ProxiedNodeConfig} config
 * @returns {RequestHandler}
 */
module.exports = function ({wss: options, namespace, match, host, port}) {
  const address = host || (IPv4.length ? IPv4 : 'localhost');
  const ws = `ws://${address}:${port || options.port}`;
  const re = match || /\/(?:m?js\/)?proxied-node\.m?js$/;
  serverExport(
    options instanceof WebSocketServer ?
      options : new WebSocketServer(options),
    namespace
  );
  return (request, response, next) => {
    const {method, url} = request;
    if (method === 'GET' && re.test(url)) {
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/javascript;charset=utf-8'
      });
      response.end(clientExport(ws));
      return true;
    }
    try { return false; }
    finally {
      if (typeof next === 'function')
        next();
    }
  };
}
