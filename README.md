# worque

AMQP-based work queue.

[![Build Status](https://secure.travis-ci.org/titarenko/worque.png?branch=master)](https://travis-ci.org/titarenko/worque) [![Coverage Status](https://coveralls.io/repos/titarenko/worque/badge.png)](https://coveralls.io/r/titarenko/worque)

## Installation

```bash
npm i worque --save
```

## Description

Each `task` = `queue`. 

Publishing message = loading single worker with task.

## Motivation

- simple project bootstrap
- task survives broker restarts
- task waits for worker (handler) if it's offline
- task can be scheduled (cron)

## Example

```js
var client = require('worque')('amqp://localhost');

client.on('task', console.log); // fired before handler
client.on('result', console.log); // fired after handler
client.on('error', console.error); // fired if handler fails

client.subscribe('logthis', function (message) {
	console.log(message);
});

client.publish('logthis', { something: 42 });

client.schedule('0 * * * * *', 'recurrent task runs each minute', function () {
	console.log('I run each minute');
});
```

## License

MIT
