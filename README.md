# worque

AMQP-based work queue.

[![Build Status](https://secure.travis-ci.org/titarenko/worque.png?branch=master)](https://travis-ci.org/titarenko/worque) [![Coverage Status](https://coveralls.io/repos/titarenko/worque/badge.png)](https://coveralls.io/r/titarenko/worque)

[![NPM](https://nodei.co/npm/worque.png?downloads=true&stars=true)](https://nodei.co/npm/worque/)

# Description

Each `task` = `queue`. Publishing message = loading single worker with task.

# Motivation

- simple project bootstrap
- task survive broker restarts
- task waits for worker (handler) if it's offline

# Example

```js
var worque = require('worque');

var client = worque('amqp://myuser:mypassword@localhost/my-virtual-host');

client.on('error', console.error); // fired if handler throws error
client.on('task', console.log); // fired before handler
client.on('result', console.log); // fired after handler

client.subscribe('logthis', function (message) {
	console.log(message);
});

client.publish('logthis', {
	something: 42
});
```

# License

MIT
