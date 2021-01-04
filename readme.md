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

### Manage subjects
A subject can span over multiple threads over a long period of time. For example, a News subject can spawn a new thread on a monthly basis.
```shell
$ touch subscriptions/news-subject.json
$ nano subscriptions/news-subject.json
```
Using a TVB news thread as an example, one can set up a subject as follows: 
```json
{
  "subjectUrlPath": "forum-497-1.html",
  "subjectMatchRegexp": "(?=.*TVB)(?=.*新聞)(?=.*六點半)"
}
```
note: the CLI takes the first thread that matches the regular expression, and this particular regular expression describes a pattern that contains all three words

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
