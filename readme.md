## Description
 - grabs torrent links from thread
 - remembers downloaded torrents

---

## Install
 - the app
 - authentication
 - subscriptions

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

#### Step4. Run app

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
	/path/to/node_modules/grab-tvboxnow-torrent/bin/cli.js
	```

4. schedule execution

        $ crontab -e

    insert the following, and remember to change to real schedules and real paths

    ```
    min hr1,hr2 * * * /path/to/node_modules/grab-tvboxnow-torrent/bin/cli.js >/dev/null 2>&1
    ```
