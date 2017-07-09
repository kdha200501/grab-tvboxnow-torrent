# Change Log

# v1.1.0

## Description
 - asks Plex to refresh library

---

## Install
 - npm script
 - authentication config

#### Step1. Add to npm script

`$ vim package.json`

add:

```
{
  "scripts": {
      "refresh-plex-library": "./node_modules/grab-tvboxnow-torrent/bin/cli.js refresh-plex-library"
    }
}
```

#### Step2. Add authentication

`$ touch plex.json`

`$ vim plex.json`

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

1. if `node` is not present under `/usr/bin`

		$ sudo ln –s /usr/bin/nodejs /usr/bin/node

2. create executable

        $ touch refresh-plex-library.command
        $ chmod u+x refresh-plex-library.command

3. paste the following into the executable, and remember to change to real paths

        $ vim refresh-plex-library.command
        
	copy+paste:

```
#! /bin/bash
/path/to/install/directory/node_modules/grab-tvboxnow-torrent/bin/cli.js refresh-plex-library --workingDirectory=/path/to/install/directory/
```

4. schedule execution

        $ vim /etc/transmission-daemon/settings.json

    insert/modify the following, and remember to change to real paths

    ```
    {
      "script-torrent-done-enabled": true,
      "script-torrent-done-filename": "/path/to/refresh-plex-library.command"
    }
    ```

        $ chmod 750 refresh-plex-library.command

    restart Transmission

# v1.0.0

## Description
 - grabs torrent links from thread
 - remembers downloaded torrents

---

## Install
 - the app
 - authentication config
 - subscriptions config

#### Step1. Install app
`$ touch package.json`

`$ vim package.json`

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

`$ vim auth.json`

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

`$ vim subscriptions/sample.json`

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

        $ touch grab-tvboxnow-torrent.command
        $ chmod u+x grab-tvboxnow-torrent.command

3. paste the following into the executable, and remember to change to real paths

        $ vim grab-tvboxnow-torrent.command
        
	copy+paste:

```
#! /bin/bash
/path/to/install/directory/node_modules/grab-tvboxnow-torrent/bin/cli.js --workingDirectory=/path/to/install/directory/
```

4. schedule execution

        $ crontab -e

    insert the following, and remember to change to real schedules and real paths

    ```
    min hr1,hr2 * * * /path/to/grab-tvboxnow-torrent.command >/dev/null 2>&1
    ```
