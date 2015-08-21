# worque

AMQP-based work queue: one message per worker (by default, but configurable), restarting on unexpected disconnect of worker (task will not be lost, if worker was aborted due to exception), durability of queue.

[![Build Status](https://secure.travis-ci.org/titarenko/worque.png?branch=master)](https://travis-ci.org/titarenko/worque) [![Coverage Status](https://coveralls.io/repos/titarenko/worque/badge.png)](https://coveralls.io/r/titarenko/worque)

[![NPM](https://nodei.co/npm/worque.png?downloads=true&stars=true)](https://nodei.co/npm/worque/)

# Example

```js
var worque = require('worque');

var client = new worque.Client({
	host: 'localhost',
	port: 5672,
	login: 'guest',
	password: 'guest',
	vhost: '/'
});

client.subscribe('message-a', function (message, ack) {
	console.log(message);

	client.publish('message-b', {
		data: 'value'
	});

	ack();
});

client.publish('message-c', {
	something: 42
});
```

# API

## Client(config)

Constructs queue client using provided `config` (see example for list of properties).

## Client::publish(name, message[, options])

Promises message publishing using named channel. You could optionally provide any amqp-options which will be passed to native [method](https://github.com/postwait/node-amqp#connectionpublishroutingkey-body-options-callback).

## Client::subscribe(name, [concurrencyOrOptions,] handler)

Promises subscription on messages of named channel. Function `handler` must have signature `fn(message, ack)`, where `ack` is function which should be called after successful handling of `message`. Argument `concurrencyOrOptions` specifies either how much messages can be sent to single client at once (default is 1) or provides ability to specify amqp-options which will be passed to native [method](https://github.com/postwait/node-amqp#queuesubscribeoptions-listener) (also, using `concurrencyOrOptions.queue` property you can specify any amqp-options for [method](https://github.com/postwait/node-amqp#connectionqueuename-options-opencallback) which does obtain queue before message gets published to it).

# License

MIT
