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
>>>NAME&nbsp;&nbsp;MAJ:MIN&nbsp;RM&nbsp;&nbsp;SIZE&nbsp;&nbsp;RO&nbsp;TYPE&nbsp;&nbsp;
>>>sda&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;8:0&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1&nbsp;&nbsp;&nbsp;&nbsp;14.5G&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;disk 
>>>└─**sda1**&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;8:1&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1&nbsp;&nbsp;&nbsp;&nbsp;14.5G&nbsp;&nbsp;0&nbsp;&nbsp;&nbsp;&nbsp;part

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
&nbsp;&nbsp;&nbsp;&nbsp;&quot;alt-speed-down&quot;: 50, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;alt-speed-enabled&quot;: false, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;alt-speed-time-begin&quot;: 540, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;alt-speed-time-day&quot;: 127, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;alt-speed-time-enabled&quot;: false, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;alt-speed-time-end&quot;: 1020, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;alt-speed-up&quot;: 50, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;bind-address-ipv4&quot;: &quot;0.0.0.0&quot;, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;bind-address-ipv6&quot;: &quot;::&quot;, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;blocklist-enabled&quot;: false, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;blocklist-url&quot;: &quot;http://www.example.com/blocklist&quot;, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;cache-size-mb&quot;: 4, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;dht-enabled&quot;: true, 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;download-dir&quot;: &quot;/mnt/SanDisk16G/transmission-downloads/&quot;,** 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;download-limit&quot;: 100, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;download-limit-enabled&quot;: 0, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;download-queue-enabled&quot;: true, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;download-queue-size&quot;: 5, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;encryption&quot;: 1, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;idle-seeding-limit&quot;: 30, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;idle-seeding-limit-enabled&quot;: false, 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;incomplete-dir&quot;: &quot;/mnt/SanDisk16G/transmission-downloads/&quot;,** 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;incomplete-dir-enabled&quot;: false,** 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;lpd-enabled&quot;: false, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;max-peers-global&quot;: 200, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;message-level&quot;: 1, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;peer-congestion-algorithm&quot;: &quot;&quot;, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;peer-id-ttl-hours&quot;: 6, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;peer-limit-global&quot;: 200, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;peer-limit-per-torrent&quot;: 50, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;peer-port&quot;: 51413, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;peer-port-random-high&quot;: 65535, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;peer-port-random-low&quot;: 49152, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;peer-port-random-on-start&quot;: false, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;peer-socket-tos&quot;: &quot;default&quot;, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;pex-enabled&quot;: true, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;port-forwarding-enabled&quot;: false, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;preallocation&quot;: 1, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;prefetch-enabled&quot;: 1, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;queue-stalled-enabled&quot;: true, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;queue-stalled-minutes&quot;: 30, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;ratio-limit&quot;: 2, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;ratio-limit-enabled&quot;: false, 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;rename-partial-files&quot;: true,** 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;rpc-authentication-required&quot;: false,** 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;rpc-bind-address&quot;: &quot;0.0.0.0&quot;, 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;rpc-enabled&quot;: true,** 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;rpc-password&quot;: &quot;{401069afc6f60e688d7dddb7ec581d76b070b180ecoHCqki&quot;, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;rpc-port&quot;: 9091, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;rpc-url&quot;: &quot;/transmission/&quot;, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;rpc-username&quot;: &quot;transmission&quot;, 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;rpc-whitelist&quot;: &quot;127.0.0.1,192.168.&#42;.&#42;&quot;,** 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;rpc-whitelist-enabled&quot;: true,** 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;scrape-paused-torrents-enabled&quot;: true, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;script-torrent-done-enabled&quot;: false, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;script-torrent-done-filename&quot;: &quot;&quot;, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;seed-queue-enabled&quot;: false, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;seed-queue-size&quot;: 10, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;speed-limit-down&quot;: 100, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;speed-limit-down-enabled&quot;: false, 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;speed-limit-up&quot;: 0,** 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;speed-limit-up-enabled&quot;: true,** 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;start-added-torrents&quot;: true,** 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;trash-original-torrent-files&quot;: true,** 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;umask&quot;: 0,** 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;upload-limit&quot;: 100, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;upload-limit-enabled&quot;: 0, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;upload-slots-per-torrent&quot;: 14, 
&nbsp;&nbsp;&nbsp;&nbsp;&quot;utp-enabled&quot;: true, 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;watch-dir&quot;: &quot;/home/pi/grab-tvboxnow-torrent/download/&quot;,** 
**&nbsp;&nbsp;&nbsp;&nbsp;&quot;watch-dir-enabled&quot;: true**
}

## Restart Transmission

`$ sudo service transmission-daemon reload`

and then point your Raspberry Pi web browser to:
http://127.0.0.1:9091