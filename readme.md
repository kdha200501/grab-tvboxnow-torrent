## Description

A CLI tool to scrape video streams off of a `TvBoxNow` thread, it

- remembers downloaded attachments
- supports user account authentication
- provides the option to filter attachments

## What's new in 2.0

- Enforces HTTPS
- Installs globally
- More config options
- Rebuilt using *Rxjs*
- Abandons *Plex*

## Usage

### Installation

```shell
$ npm i -g grab-tvboxnow-torrent
$ mkdir grab-tvboxnow-torrent
$ cd grab-tvboxnow-torrent
$ grab-tvboxnow-torrent -i
```

### Manage threads

```shell
$ nano subscriptions/sample.json
$ touch subscriptions/another-thread.json
```

### Advanced threads
A subject can spans over multiple threads over a long period. A News subject is a good example.
```shell
$ touch subscriptions/subject-example.json
$ nano subscriptions/subject-example.json
```
To set up a subject, use the following settings: 
```json
{
  "subjectUrlPath": "forum-497-1.html",
  "subjectMatchRegexp": "(?=.*TVB)(?=.*新聞)(?=.*六點半)"
}
```
note: this regular expression matches the first thread whose title contains all the words

### Credentials

```shell
$ nano auth.json
```

​		Alternatively, remove this file if none of the threads requires sign-in

### Run

```shell
$ grab-tvboxnow-torrent
```
​		This CLI tool saves the downloaded attachments under the "downloads" folder. For more information on how to configure transmission to watch this folder, see `install-transmission.md` link [here](https://bitbucket.org/kdha200501/grab-tvboxnow-torrent/src/master/install-transmission.md).

### Options

```shell
$ grab-tvboxnow-torrent -h
Usage: grab-tvboxnow-torrent [options]

Options:
  --version        Show version number                                 [boolean]
  -d, --directory  Specify the working directory, defaults to cwd       [string]
  -i, --init       Initialize the working directory                    [boolean]
  -H, --hostname   Specify the TvBoxNow hostname, defaults to "os.tvboxnow.com"
                                                                        [string]
  -q, --quiet      Do not output to stdout or stderr                   [boolean]
  -h, --help       Show help                                           [boolean]
```

### Run from crontab

```shell
$ sudo crontab -e
```

​		Insert the following, and remember to change to real schedules and real paths
```
min hr1,hr2 * * * grab-tvboxnow-torrent -d /path/to/working/directory >/dev/null 2>&1
```
