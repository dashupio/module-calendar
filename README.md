Dashup Module Calendar
&middot;
[![Latest Github release](https://img.shields.io/github/release/dashup/module-calendar.svg)](https://github.com/dashup/module-calendar/releases/latest)
=====

A connect interface for calendar on [dashup](https://dashup.io).

## Contents
* [Get Started](#get-started)
* [Connect interface](#connect)

## Get Started

This calendar connector adds calendars functionality to Dashup calendars:

```json
{
  "url" : "https://dashup.io",
  "key" : "[dashup module key here]"
}
```

To start the connection to dashup:

`npm run start`

## Deployment

1. `docker build -t dashup/module-calendar .`
2. `docker run -d -v /path/to/.dashup.json:/usr/src/module/.dashup.json dashup/module-calendar`