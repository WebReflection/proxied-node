const five = require('johnny-five');
const {RaspiIO} = require('raspi-io');

const font = require('oled-font-5x7');
const Oled = require('oled-js');

const {ceil, pow} = Math;
const options = {
  width: 128,
  height: 32,
  address: 0x3c
};

const board = new five.Board({io: new RaspiIO});
const ready = new Promise($ => {
  board.on('ready', () => {
    $(new Oled(board, five, options));
  });
});

module.exports = {
  show: async (text, scale = 2, h = 7) => {
    return ready.then(oled => {
      oled.clearDisplay();
      oled.setCursor(1, ceil((options.height - h) / pow(2, scale)));
      oled.writeString(font, scale, text, 1, true, 2);
      oled.update();
    });
  }
};
