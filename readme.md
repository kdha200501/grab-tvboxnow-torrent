# Change Log

# -*-*-*-*-*-*-*-*-
# v1.1.0
# -*-*-*-*-*-*-*-*-

## Description
 - assumes installing on a Raspberry Pi
 - asks Plex server to refresh library

---

## Install
 - npm script
 - authentication config

#### Step1. Add to npm script

`$ cd /home/pi/grab-tvboxnow-torrent`
`$ nano package.json`

add to the "scripts" property:

```
{
  "scripts": {
      "refresh-plex-library": "./node_modules/grab-tvboxnow-torrent/bin/cli.js refresh-plex-library"
    }
}
```

#### Step2. Add authentication

`$ touch plex.json`

`$ nano plex.json`

copy+paste:

```
{
	"url": "http://127.0.0.1:32400",
    "credentials": {
      "username": "username_here",
      "password": "password_here"
    },
	"section": "library_title_here"
}
```

---

#### Step3. Test

`$ npm run refresh-plex-library`

---

## Schedule run script with Transmission

see `install-transmission.md` for steps to installing and configuring Transmission

1. if `node` is not present under `/usr/bin`

		$ sudo ln –s /usr/bin/nodejs /usr/bin/node

2. create executable

        $ sudo touch /etc/transmission-daemon/refresh-plex-library.sh
        $ sudo chown debian-transmission:debian-transmission /etc/transmission-daemon/refresh-plex-library.sh
        $ sudo chmod 755 /etc/transmission-daemon/refresh-plex-library.sh

3. paste the following into the executable, and remember to change to real paths

        $ sudo nano /etc/transmission-daemon/refresh-plex-library.sh
        
	copy+paste:

```
#!/bin/bash

sudo /home/pi/grab-tvboxnow-torrent/node_modules/grab-tvboxnow-torrent/bin/cli.js refresh-plex-library --workingDirectory=/home/pi/grab-tvboxnow-torrent/
```

4. add user "debian-transmission" to sudoer:

        $ sudo nano /etc/sudoers
        
	insert:

```
debian-transmission ALL=(ALL) NOPASSWD: ALL
```

5. schedule execution

        $ sudo nano /etc/transmission-daemon/settings.json

    modify the following properties:

    ```
    {
      "script-torrent-done-enabled": true,
      "script-torrent-done-filename": "/etc/transmission-daemon/refresh-plex-library.sh"
    }
    ```

6. restart Transmission

        $ sudo service transmission-daemon reload

# -*-*-*-*-*-*-*-*-
# v1.0.0
# -*-*-*-*-*-*-*-*-

## Description
 - assumes installing on a Raspberry Pi
 - grabs torrent links from thread
 - tracks downloaded torrents
 - downloads new torrents only (by default)
 - allows user to force download previously downloaded torrents
 - allows user to modify individual torrents' download status

---

## Install
 - the app
 - authentication config
 - subscriptions config

#### Step1. Install app
`$ mkdir grab-tvboxnow-torrent`
`$ cd grab-tvboxnow-torrent`
`$ touch package.json`
`$ nano package.json`

copy+paste:

```
{
  "name": "example",
  "version": "1.0.0",
  "description": "example",
  "scripts": {
    "start": "./node_modules/grab-tvboxnow-torrent/bin/cli.js"
  }
}
```

```
$ npm i --save grab-tvboxnow-torrent
```

#### Step2. Add authentication

`$ touch auth.json`

`$ nano auth.json`

copy+paste:

```
{
  "url": "https://os.tvboxnow.com/logging.php?action=login",
  "credentials": {
    "username": "username_here",
    "password": "password_here"
  }
}
```

#### Step3. Add subscriptions

run `$ npm start` to initiate app

`$ touch subscriptions/sample.json`

`$ nano subscriptions/sample.json`

copy+paste:

```
{
  "urlPath": "thread-3702288-1-1.html"
}
```

or with exclusions

```
{
  "urlPath": "thread-3702288-1-1.html",
  "excludeRegexp": "(h265)|(h.265)|(h_265)|(h 265)|(x265)|(x.265)|(x_265)|(x 265)"
}
```

#### Step4. Test

`$ npm start`

or force download all torrents

`$ npm start -- --force`

---

## Schedule run app with cronjob

1. if `node` is not present under `/usr/bin`

		$ sudo ln –s /usr/bin/nodejs /usr/bin/node

2. create executable

        $ touch grab-tvboxnow-torrent.sh
        $ chmod 744 grab-tvboxnow-torrent.sh

3. paste the following into the executable, and remember to change to real paths

        $ nano grab-tvboxnow-torrent.sh
        
	copy+paste:

```
#!/bin/bash

/home/pi/grab-tvboxnow-torrent/node_modules/grab-tvboxnow-torrent/bin/cli.js --workingDirectory=/home/pi/grab-tvboxnow-torrent/
```

4. schedule execution

        $ sudo crontab -e

    insert the following, and remember to change to real schedules and real paths

    ```
    min hr1,hr2 * * * /home/pi/grab-tvboxnow-torrent/grab-tvboxnow-torrent.sh >/dev/null 2>&1
    ```
