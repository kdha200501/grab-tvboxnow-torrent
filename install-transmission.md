# Install Transmission

## Description
 - assumes installing on a Raspberry Pi
 - enables Web UI
 - disables authentication for Web UI
 - configures folder watch for new torrents
 - adds *.part* suffix to incomplete files
 - configure shell script to execute upon download completion
 - solves permission issue

## Known Issues
 - needs to restart transmission upon reboot:
 
 `$ sudo service transmission-daemon reload`

---

## Install

`$ sudo apt-get update`

`$ sudo apt-get install transmission-daemon`

## Mount Thumb Drive

plug in USB thumb drive, then find out the name of the partition:
`$ lsblk`

the partition name is "sda1" in this example:
>>>NAME  MAJ:MIN RM  SIZE  RO TYPE
>>>  
>>>sda             8:0           1    14.5G  0    disk
>>>
>>>└─**sda1**     8:1            1    14.5G  0    part

verify the partition is "ext4" and make note of the **UUID**:
`$ sudo file -sL /dev/sda1`

>>>/dev/sda1: Linux rev 1.0 **ext4** filesystem data, UUID=`XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`, volume name "untitled" (needs journal recovery) (extents) (large files) (huge files)

create mount point:

`$ sudo mkdir -p /mnt/SanDisk16G`

mount:

`$ sudo mount -t ext4 -o defaults /dev/sda1 /mnt/SanDisk16G`

`$ sudo mkdir /mnt/SanDisk16G/transmission-downloads`

`$ sudo chown pi:pi -R /mnt/SanDisk16G/transmission-downloads/`

mount on boot:

`$ sudo nano /etc/fstab`

insert row:

>>>UUID=`XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX` /mnt/SanDisk16G **ext4** defaults 0

## Resolve Permission Issue
add user "debian-transmission" to "pi" group:

`$ sudo usermod -a -G pi debian-transmission`

grant read, write and execute permissions to members of the "pi" group:

`$ sudo chmod 770 -R /mnt/SanDisk16G/transmission-downloads/`

`$ sudo chmod 770 -R /home/pi/grab-tvboxnow-torrent/download/`

## Configure Transmission

{

"alt-speed-down ": 50, 

"alt-speed-enabled ": false,

"alt-speed-time-begin ": 540,

"alt-speed-time-day ": 127,

"alt-speed-time-enabled ": false,

"alt-speed-time-end ": 1020,

"alt-speed-up ": 50,

"bind-address-ipv4 ":  "0.0.0.0 ",

"bind-address-ipv6 ":  ":: ",

"blocklist-enabled ": false,

"blocklist-url ":  "http://www.example.com/blocklist ",

"cache-size-mb ": 4,

"dht-enabled ": true,

**     "download-dir ":  "/mnt/SanDisk16G/transmission-downloads/ ",**

"download-limit ": 100,

"download-limit-enabled ": 0,

"download-queue-enabled ": true,

"download-queue-size ": 5,

"encryption ": 1,

"idle-seeding-limit ": 30,

"idle-seeding-limit-enabled ": false,

**     "incomplete-dir ":  "/mnt/SanDisk16G/transmission-downloads/ ",**

**     "incomplete-dir-enabled ": false,**

"lpd-enabled ": false,

"max-peers-global ": 200,

"message-level ": 1,

"peer-congestion-algorithm ":  " ",

"peer-id-ttl-hours ": 6,

"peer-limit-global ": 200,

"peer-limit-per-torrent ": 50,

"peer-port ": 51413,

"peer-port-random-high ": 65535,

"peer-port-random-low ": 49152,

"peer-port-random-on-start ": false,

"peer-socket-tos ":  "default ",

"pex-enabled ": true,

"port-forwarding-enabled ": false,

"preallocation ": 1,

"prefetch-enabled ": 1,

"queue-stalled-enabled ": true,

"queue-stalled-minutes ": 30,

"ratio-limit ": 2,

"ratio-limit-enabled ": false,

**     "rename-partial-files ": true,**

**     "rpc-authentication-required ": false,**

"rpc-bind-address ":  "0.0.0.0 ",

**     "rpc-enabled ": true,**

"rpc-password ":  "{401069afc6f60e688d7dddb7ec581d76b070b180ecoHCqki ",

"rpc-port ": 9091,

"rpc-url ":  "/transmission/ ",

"rpc-username ":  "transmission ",

**     "rpc-whitelist ":  "127.0.0.1,192.168.*.* ",**

**     "rpc-whitelist-enabled ": true,**

"scrape-paused-torrents-enabled ": true,

"script-torrent-done-enabled ": false,

"script-torrent-done-filename ":  " ",

"seed-queue-enabled ": false,

"seed-queue-size ": 10,

"speed-limit-down ": 100,

"speed-limit-down-enabled ": false,

**     "speed-limit-up ": 0,**

**     "speed-limit-up-enabled ": true,**

**     "start-added-torrents ": true,**

**     "trash-original-torrent-files ": true,**

**     "umask ": 0,**

"upload-limit ": 100,

"upload-limit-enabled ": 0,

"upload-slots-per-torrent ": 14,

"utp-enabled ": true,

**     "watch-dir ":  "/home/pi/grab-tvboxnow-torrent/download/ ",**

**     "watch-dir-enabled ": true**

}

## Restart Transmission

`$ sudo service transmission-daemon reload`

and then point your Raspberry Pi web browser to:

http://127.0.0.1:9091