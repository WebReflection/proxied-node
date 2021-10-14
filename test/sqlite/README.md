# Raspberry Pi Oled Demo

Install the _pigpio_ first, and **reboot** the board:

  * in ArchLinux via [pigpio](https://aur.archlinux.org/packages/pigpio/) - Please note this requires a dedicated raspberrypi linux kernel
  * in Debian or Raspbian via `sudo apt install pigpio`

Create a folder to put files via `mkdir -p oled` and enter such folder via `cd oled`.

Download all files of this folder, or use the downloader:

```sh
bash <(curl -s https://webreflection.github.io/proxied-node/oled.sh)>
```

Install modules via `npm i`.

Start the project via `sudo node index.js`, connect via any browser to `http://${IP_ADDRESS}:3000/` and write something on the screen 🥳
