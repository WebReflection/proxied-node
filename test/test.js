const proxiedNode = require('../cjs');

module.exports = proxiedNode({
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
