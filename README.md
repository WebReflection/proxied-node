# proxied-node DEPRECATED - See [coincident](https://github.com/WebReflection/coincident#coincidentserver)

This is exactly the same [proxied-worker](https://github.com/WebReflection/proxied-worker#readme) module, specific for a *NodeJS* proxied namespace.

The only difference is that the client side is already the exported namespace, not a Worker to initialize, and transported data uses the [Structured Clone algorithm](https://github.com/ungap/structured-clone/#readme), enabling both recursive data, but also much more than what JSON allows.

Check the [oled screen demo](./test/oled/) to try it out on a Raspberry Pi.


## API

The default export is a common server handler factory function.

It accepts few configurations options to enable a variety of use cases, even multiple proxied namespaces, whenever that's needed.

```js
// same as: const proxiedNode = require('proxied-node');
import proxiedNode from 'proxied-node';

// handler(request, response, next = void 0)
const handler = proxiedNode({
  wss,        // a WebSocketServer options or a WebSocketServer instance
  namespace,  // the namespace to proxy to each client
  match,      // an optional client side URL to match. By default is /js/proxied-node.js
  host,       // an optional host name to use. it's IPv4 / localhost otherwise
  port,       // an optional  port to use when wss is an instance of WebSocketServer already
});

// express
app.use(handler);

// or standard http
createServer((req, res) => {
  if (handler(req, res))
    return;
  // ... rest of the logic
});
```


### Server Side Example
```js
const express = require('express');
const proxiedNode = require('proxied-node');

const {PORT = 8080} = process.env;

const app = express();

const handler = proxiedNode({
  wss: {port: 5000},
  namespace: {
    test: 'OK',
    exit() {
      console.log('bye bye');
      process.exit(0);
    },
    sum(a, b) {
      return a + b;
    },
    on(type, callback) {
      setTimeout(() => {
        callback('Event', type);
      });
    },
    async delayed() {
      console.log('context', this.test);
      // postMessage({action: 'greetings'});
      return await new Promise($ => setTimeout($, 500, Math.random()));
    },
    Class: class {
      constructor(name) {
        this.name = name;
      }
      sum(a, b) {
        console.log(this.name, a, b);
        return a + b;
      }
    }
  }
});

app.use(handler);
app.use(express.static(__dirname));
app.listen(PORT);
```


### Client Side Example
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>proxied-node</title>
  <script type="module">
  // the namespace is exported automatically as default
  import('/proxied-node.js').then(async (nmsp) => {
    console.log(await nmsp.test);
    console.log(await nmsp.sum(1, 2));
    await nmsp.delayed();

    const instance = await new nmsp.Class('🍻');
    console.log(await instance.sum(1, 2));

    nmsp.on('listener', type => {
      console.log('listener', type);
    });

    const btn = document.body.appendChild(document.createElement('button'));
    btn.addEventListener('click', () => { nmsp.exit(); });
    btn.textContent = '☠ exit';
  });
  </script>
</head>
</html>

```
