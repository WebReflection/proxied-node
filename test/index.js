const {createServer} = require('http');
const {readFileSync} = require('fs');
const {join} = require('path');

const handler = require('./test.js');

const index = readFileSync(join(__dirname, 'index.html'));
const headers = {'Content-Type': 'text/html;charset=utf-8'};

createServer((request, response) => {
  if (handler(request, response))
    return;
  response.writeHead(200, headers);
  response.end(index);
}).listen(8080);
