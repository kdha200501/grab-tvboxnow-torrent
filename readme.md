## ⚠️ IMPORTANT DISCLAIMER

This project is **experimental and for personal use only**. Use at your own risk. This tool interacts with TvBoxNow's services and may be subject to TvBoxNow's Terms of Service. The authors are not responsible for any issues that may arise from using this tool.

---

## Description

A CLI tool to scrape attachments off of a `TvBoxNow` thread. It:

- remembers downloaded attachments
- supports user account authentication
- provides the option to filter attachments



# Installation
```shell
$ npm i -g grab-tvboxnow-torrent

$ mkdir ~/.grab-tvboxnow-torrent
$ grab-tvboxnow-torrent init -C ~/.grab-tvboxnow-torrent
```

### Options

```shell
$ grab-tvboxnow-torrent init -h
Initialize the working directory
Usage: grab-tvboxnow-torrent init [options]

Options:
  --version        Show version number                                   [boolean]
  -C, --directory  Specify the working directory
                                                        [string] [default: <$CWD>]
  -q, --quiet      Do not output to stdout or stderr    [boolean] [default: false]
  -h, --help       Show help                                             [boolean]

Examples:
  grab-tvboxnow-torrent init -C ~/.grab-tvboxnow-torrent
```

### Manage threads

Edit the sample subscription file with a real TvBoxNow thread URL path:

```shell
$ vim ~/.grab-tvboxnow-torrent/subscriptions/sample.json
```

Example subscription file:

```json
{
  "threadUrlPath": "thread-1234567-1-1.html"
}
```

### Manage topics

A topic can span over multiple threads over a long period of time. For example, a News topic can spawn a new thread on a monthly basis.

```shell
$ touch ~/.grab-tvboxnow-torrent/subscriptions/news-topic.json
$ vim ~/.grab-tvboxnow-torrent/subscriptions/news-topic.json
```

Using a TVB news topic as an example, one can describe its presence in a subject page as follows:

```json
{
  "subjectUrlPath": "forum-497-1.html",
  "subjectMatchRegexp": "(?=.*TVB)(?=.*新聞)(?=.*六點半)"
}
```

> [!TIP]
>
> The CLI takes the first thread that matches the regular expression, and this particular regular expression describes a pattern that contains all three words

### Manage Credentials

```shell
$ vim ~/.grab-tvboxnow-torrent/subscriptions/auth.json
```

Alternatively, remove this file if none of the threads requires sign-in



# Usage

```shell
$ grab-tvboxnow-torrent -C ~/.grab-tvboxnow-torrent
```

This CLI tool saves the downloaded attachments under the working directory's `downloads` folder.

### Options

```shell
$ grab-tvboxnow-torrent -h
Download torrents from subscribed threads
Usage: grab-tvboxnow-torrent [options]

Commands:
  grab-tvboxnow-torrent init  Initialize the working directory
  grab-tvboxnow-torrent       Download torrents from subscribed threads  [default]

Options:
  --version        Show version number                                   [boolean]
  -C, --directory  Specify the working directory
                                                        [string] [default: <$CWD>]
  -q, --quiet      Do not output to stdout or stderr    [boolean] [default: false]
  -H, --hostname   Override the BoxNow hostname
                                             [string] [default: "os.tvboxnow.com"]
  -h, --help       Show help                                             [boolean]

Examples:
  grab-tvboxnow-torrent -C ~/.grab-tvboxnow-torrent
```

### Run from crontab

```shell
$ sudo crontab -e
```

Insert the following (adjust paths and schedule):

```
min hr1,hr2 * * * /bin/bash -l -c '. "/home/pi/.nvm/nvm.sh" && grab-tvboxnow-torrent -C /home/pi/.grab-tvboxnow-torrent --quiet >/dev/null 2>&1'
```
