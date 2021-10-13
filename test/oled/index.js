#!/usr/bin/env node

const {PORT = 3000} = process.env;

const express = require('express');
const proxy = require('proxied-node');
const {networkInterfaces} = require('os');

const app = express();
app.use(proxy({
  wss: {port: PORT + 1},
  namespace: require('./namespace.js')
}));
app.use(express.static(__dirname));
app.listen(PORT, () => console.log(`http://${getIPv4()}:${PORT}`));

function getIPv4() {
  const addresses = [];
  for (const [_, values] of Object.entries(networkInterfaces())) {
    addresses.push(...values.filter(
      ({family, address}) => (
        family === 'IPv4' &&
        address !== '127.0.0.1'
      )
    ));
  }
  return (addresses.shift() || {address: 'locahost'}).address;
}
