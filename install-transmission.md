# Install Transmission on Raspberry Pi

## Install

```shell
$ sudo apt-get update
$ sudo apt-get install transmission-daemon
```

## Use an external drive as download folder

​		Plug in USB thumb drive, then find out the name of the partition:
```shell
$ lsblk
```

​		the partition name is "sda1" in this example:

```
NAME  MAJ:MIN RM  SIZE  RO TYPE

sda        8:0            1    14.5G  0    disk

└─sda1     8:1            1    14.5G  0    part

```

​		Verify the partition is "ext4" and make note of the **UUID**:
```shell
$ sudo file -sL /dev/sda1
```

```
/dev/sda1: Linux rev 1.0 ext4 filesystem data, UUID=`XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`, volume name "untitled" (needs journal recovery) (extents) (large files) (huge files)
```

​		Create mount point:

```shell
$ sudo mkdir -p /mnt/SanDisk16G
$ sudo mount -t ext4 -o defaults /dev/sda1 /mnt/SanDisk16G
```


​		Create download folder
```shell
$ sudo mkdir /mnt/SanDisk16G/transmission-downloads
$ sudo chown pi:pi -R /mnt/SanDisk16G/transmission-downloads/
```

​		Mount on boot:

```shell
$ sudo nano /etc/fstab
```

​		insert row:

```
UUID=`XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX` /mnt/SanDisk16G ext4 defaults 0
```

## Resolve Permission Issue
​		Add user "debian-transmission" to "pi" group:

```shell
$ sudo usermod -a -G pi debian-transmission
```

​		Grant `read`, `write` and `execute` permissions to members of the "pi" group:

```shell
$ sudo chmod 770 -R /mnt/SanDisk16G/transmission-downloads/
$ sudo chmod 770 -R /home/pi/grab-tvboxnow-torrent/download/
```

## Configure Transmission
```shell
$ sudo nano /etc/transmission-daemon/settings.json
```
​		and update these properties:

```javascript
{
  "download-dir":  "/mnt/SanDisk16G/transmission-downloads/",
  "incomplete-dir":  "/mnt/SanDisk16G/transmission-downloads/ ",
  "incomplete-dir-enabled": false,
    // add '.part' suffix to incomplete files
  "rename-partial-files": true,
    // enable WebUI
  "rpc-enabled": true,
    // disable authentication for WebUI
  "rpc-authentication-required": false,
    // enable white-listing for WebUI
  "rpc-whitelist-enabled": true,
    // expose WebUI to local machine and LAN
  "rpc-whitelist":  "127.0.0.1,192.168.*.* ",
  "speed-limit-up": 0,
  "speed-limit-up-enabled": true,
  "start-added-torrents": true,
  "trash-original-torrent-files": true,
  "umask": 0,
  "watch-dir":  "/home/pi/grab-tvboxnow-torrent/downloads/",
  "watch-dir-enabled": true
}
```

​		example:

```javascript
{
    "alt-speed-down": 50,
    "alt-speed-enabled": false,
    "alt-speed-time-begin": 540,
    "alt-speed-time-day": 127,
    "alt-speed-time-enabled": false,
    "alt-speed-time-end": 1020,
    "alt-speed-up": 50,
    "bind-address-ipv4": "0.0.0.0",
    "bind-address-ipv6": "::",
    "blocklist-enabled": false,
    "blocklist-url": "http://www.example.com/blocklist",
    "cache-size-mb": 4,
    "dht-enabled": true,
    "download-dir": "/home/osmc/Downloads/",
    "download-limit": 100,
    "download-limit-enabled": 0,
    "download-queue-enabled": true,
    "download-queue-size": 5,
    "encryption": 1,
    "idle-seeding-limit": 30,
    "idle-seeding-limit-enabled": false,
    "incomplete-dir": "/home/osmc/Downloads/",
    "incomplete-dir-enabled": false,
    "lpd-enabled": false,
    "max-peers-global": 200,
    "message-level": 1,
    "peer-congestion-algorithm": "",
    "peer-id-ttl-hours": 6,
    "peer-limit-global": 200,
    "peer-limit-per-torrent": 50,
    "peer-port": 51413,
    "peer-port-random-high": 65535,
    "peer-port-random-low": 49152,
    "peer-port-random-on-start": false,
    "peer-socket-tos": "default",
    "pex-enabled": true,
    "port-forwarding-enabled": false,
    "preallocation": 1,
    "prefetch-enabled": true,
    "queue-stalled-enabled": true,
    "queue-stalled-minutes": 30,
    "ratio-limit": 2,
    "ratio-limit-enabled": false,
    "rename-partial-files": true,
    "rpc-authentication-required": false,
    "rpc-bind-address": "0.0.0.0",
    "rpc-enabled": true,
    "rpc-host-whitelist": "",
    "rpc-host-whitelist-enabled": true,
    "rpc-password": "{862bad68154c4f178a02c38fa62122f70aabb230sa7D2wpc",
    "rpc-port": 9091,
    "rpc-url": "/transmission/",
    "rpc-username": "transmission",
    "rpc-whitelist": "127.0.0.1,192.168..",
    "rpc-whitelist-enabled": false,
    "scrape-paused-torrents-enabled": true,
    "script-torrent-done-enabled": false,
    "script-torrent-done-filename": "",
    "seed-queue-enabled": false,
    "seed-queue-size": 10,
    "speed-limit-down": 100,
    "speed-limit-down-enabled": false,
    "speed-limit-up": 0,
    "speed-limit-up-enabled": true,
    "start-added-torrents": true,
    "trash-original-torrent-files": true,
    "umask": 0,
    "upload-limit": 100,
    "upload-limit-enabled": 0,
    "upload-slots-per-torrent": 14,
    "utp-enabled": true,
    "watch-dir": "/home/osmc/grab-tvboxnow-torrent/downloads/",
    "watch-dir-enabled": true
}
```

## Daemon

​		Run Transmission at startup:

```shell
$ systemctl enable transmission-daemon
```
​		Restart Transmission:

```shell
$ sudo service transmission-daemon reload
```

## WebUI

​		Access from a local machine: http://127.0.0.1:9091

​		Access from another computer on the same LAN: http://192.168.x.y