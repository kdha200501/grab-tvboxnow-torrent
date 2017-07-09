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

