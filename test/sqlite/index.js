#!/usr/bin/env node

const {PORT = 3000} = process.env;

const IPv4 = require('any-ipv4');
const express = require('express');
const proxy = require('proxied-node');

const app = express();
app.use(proxy({
  wss: {port: PORT + 1},
  namespace: require('./namespace.js')
}));
app.use(express.static(__dirname));
app.listen(PORT, () => console.log(`http://${IPv4}:${PORT}`));
