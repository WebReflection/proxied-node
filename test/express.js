const {PORT = 8080} = process.env;

const express = require('express');

const handler = require('./test.js');

const app = express();
app.use(handler);
app.use(express.static(__dirname));
app.listen(PORT);
