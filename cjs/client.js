'use strict';
/*! (c) Andrea Giammarchi */

const {readFileSync} = require('fs');
const {dirname, join} = require('path');
const umeta = (m => /* c8 ignore start */ m.__esModule ? m.default : m /* c8 ignore stop */)(require('umeta'));

const {require: cjs} = umeta(({url: require('url').pathToFileURL(__filename).href}));

const StructuredJSON = readFileSync(
  join(
    dirname(cjs.resolve('@ungap/structured-clone')),
    '..',
    'structured-json.js'
  )
).toString().replace(/^var\s*/, 'const ');

const proxy = String(function ({parse, stringify}) {

  const worker = $ => $;

  const bus = new Promise(resolve => {
    const ws = new WebSocket('{{URL}}');
    ws.addEventListener('open', () => resolve(new Port(ws)), {once: true});
    ws.addEventListener('message', ({data}) => {
      if (data == 'ping')
        ws.send('ping');
    });
    ws.addEventListener('error', error => {
      console.error(error);
      location.reload(true);
    });
    ws.addEventListener('close', () => {
      location.reload(true);
    });
  });

  class Port {
    constructor(_) {
      this._ = _;
      this.$ = new Map;
    }
    postMessage(data) {
      this._.send(stringify(data));
    }
    addEventListener(type, callback) {
      const {_: ws, $: types} = this;
      if (!types.has(type))
        types.set(type, new Map);
      const listeners = types.get(type);
      if (!listeners.has(callback)) {
        listeners.set(callback, ({data}) => {
          if (data != 'ping')
            callback.call(ws, {data: parse(data)});
        });
        ws.addEventListener(type, listeners.get(callback));
      }
    }
    removeEventListener(type, callback) {
      const {_: ws, $: types} = this;
      if (!types.has(type))
        return;

      const listeners = types.get(type);
      if (listeners.has(callback)) {
        ws.removeEventListener(type, listeners.get(callback));
        listeners.delete(callback);
      }
    }
  }

  // the rest of this scope is proxied-worker client code

  const {isArray} = Array;
  const {random} = Math;

  const ids = [];
  const cbs = [];

  const callbacks = ({data: {id, args}}) => {
    if (isArray(args)) {
      const i = ids.indexOf(id);
      if (-1 < i)
        cbs[i](...args);
    }
  };

  let uid = 0;
  const post = (
    port, instance, list,
    args = null,
    $ = o => o
  ) => new Promise((ok, err) => {
    const id = `proxied-worker:${instance}:${uid++}`;
    const target = worker(port);
    target.addEventListener('message', function message({
      data: {id: wid, result, error}
    }) {
      if (wid === id) {
        target.removeEventListener('message', message);
        if (error != null)
          err(new Error(error));
        else
          ok($(result));
      }
    });
    if (isArray(args)) {
      list.push(args);
      for (let i = 0, {length} = args; i < length; i++) {
        switch (typeof args[i]) {
          case 'string':
            args[i] = '$' + args[i];
            break;
          case 'function':
            target.addEventListener('message', callbacks);
            let index = cbs.indexOf(args[i]);
            if (index < 0) {
              index = cbs.push(args[i]) - 1;
              ids[index] = `proxied-worker:cb:${uid++ + random()}`;
            }
            args[i] = ids[index];
            break;
        }
      }
    }
    port.postMessage({id, list});
  });

  const create = (id, list) => new Proxy(Proxied.bind({id, list}), handler);

  const registry = new FinalizationRegistry(instance => {
    bus.then(port => port.postMessage({
      id: `proxied-worker:${instance}:-0`,
      list: []
    }));
  });

  const handler = {
    apply(target, _, args) {
      const {id, list} = target();
      return bus.then(port => post(
        port, id, ['apply'].concat(list), args)
      );
    },
    construct(target, args) {
      const {id, list} = target();
      return bus.then(
        port => post(
          port,
          id,
          ['new'].concat(list),
          args,
          result => {
            const proxy = create(result, []);
            registry.register(proxy, result);
            return proxy;
          }
        )
      );
    },
    get(target, key) {
      const {id, list} = target();
      const {length} = list;
      switch (key) {
        case 'then':
          return length ?
            (ok, err) => bus.then(
              port => post(port, id, ['get'].concat(list)).then(ok, err)
            ) :
            void 0;
        case 'addEventListener':
        case 'removeEventListener':
          if (!length && !id)
            return (...args) => bus.then(port => {
              worker(port)[key](...args);
            });
      }
      return create(id, list.concat(key));
    }
  };

  return create('', []);

  function Proxied() {
    return this;
  }
});

module.exports = (URL, keys) => `${StructuredJSON}
const _ = (${proxy})(StructuredJSON);
export default _;
export const {${keys.join(', ')}} = _;
`.replace('{{URL}}', URL);
