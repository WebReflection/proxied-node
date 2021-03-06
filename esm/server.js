/*! (c) Andrea Giammarchi */

import {stringify, parse} from '@ungap/structured-clone/json';

const PING_INTERVAL = 30000;

const APPLY = 'apply';
const GET = 'get';
const NEW = 'new';

export default (wss, Namespace) => {
  const alive = new WeakMap;

  const timer = setInterval(
    () => {
      for (const ws of wss.clients) {
        if (!alive.has(ws))
          return;

        if (!alive.get(ws)) {
          alive.delete(ws);
          return ws.terminate();
        }

        alive.set(ws, false);
        ws.send('ping');
      }
    },
    PING_INTERVAL
  );

  wss.on('connection', ws => {
    alive.set(ws, true);
    ws.on('message', onmessage);
    ws.on('close', onclose);
  });

  wss.on('close', () => {
    clearInterval(timer);
  });

  // the rest of this scope is proxied-worker server code

  const instances = new WeakMap;
  let uid = 0;

  async function loopThrough(_, $, list) {
    const action = list.shift();
    let {length} = list;

    if (action !== GET)
      length--;
    if (action === APPLY)
      length--;

    for (let i = 0; i < length; i++)
      $ = await $[list[i]];

    if (action === NEW) {
      const instance = new $(...list.pop().map(args, _));
      instances.get(this).set($ = String(uid++), instance);
    }
    else if (action === APPLY) {
      $ = await $[list[length]](...list.pop().map(args, _));
    }

    return $;
  }

  async function onmessage(data) {
    const message = String(data);
    if (message === 'ping') {
      alive.set(this, true);
      return;
    }
    try {
      const {id, list} = parse(message);
      if (!/^proxied-worker:([^:]*?):-?\d+$/.test(id))
        return;

      const instance = RegExp.$1;
      const bus = this;
  
      if (!instances.has(this))
        instances.set(this, new Map);
  
      let result, error;
      if (instance.length) {
        const ref = instances.get(this);
        if (list.length) {
          try {
            result = await loopThrough.call(this, bus, ref.get(instance), list);
          }
          catch ({message}) {
            error = message;
          }
        }
        else {
          ref.delete(instance);
          return;
        }
      }
      else {
        try {
          result = await loopThrough.call(this, bus, Namespace, list);
        }
        catch ({message}) {
          error = message;
        }
      }
  
      bus.send(stringify({id, result, error}));
    }
    catch (o_O) {}
  }

  const relatedCallbacks = new WeakMap;
  function args(id) {
    if (typeof id === 'string') {
      if (/^proxied-worker:cb:/.test(id)) {
        if (!relatedCallbacks.has(this))
          relatedCallbacks.set(this, new Map);

        const cbs = relatedCallbacks.get(this);
        if (!cbs.has(id))
          cbs.set(id, (...args) => { this.send(stringify({id, args})); });
        return cbs.get(id);
      }
      return id.slice(1);
    }
    return id;
  }

  function onclose() {
    alive.delete(this);
  }
};
