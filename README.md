# worque

AMQP-based work queue: one message per worker, restarting on unexpected disconnect of worker (task will not be lost, if worker was aborted due to exception), durability of queue (queue survives broken restarts).

[![Build Status](https://secure.travis-ci.org/titarenko/worque.png?branch=master)](https://travis-ci.org/titarenko/worque) [![Coverage Status](https://coveralls.io/repos/titarenko/worque/badge.png)](https://coveralls.io/r/titarenko/worque)

[![NPM](https://nodei.co/npm/worque.png?downloads=true&stars=true)](https://nodei.co/npm/worque/)

# Migration

## [v0.5](https://github.com/titarenko/worque/tree/39fcfdd1605211916f4e1c0e46786f530d69127c) -> v0.6 (current)

- There is no more `Client` class. Library exposes function-builder which returns object with methods `publish` and `subscribe`.
- Do not expect `ack` as a second argument in your handler. Simpy return promise whithout throwing an error (or provide custom `errorHandler`) and message will be acked (otherwise, nacked).

# Example

```js
var worque = require('worque');

var client = worque({ url: 'amqp://myuser:mypassword@localhost/my-virtual-host' });

client.subscribe('logthis', function (message) {
	console.log(message);
});

client.publish('logthis', {
	something: 42
});
```

Complete configuration example:

```js
var client = worque({
	url: 'amqp://myuser:mypassword@localhost/my-virtual-host',
	preserveContext: true,
	before: function (queueName, message) {
		console.log('%s subscriber is about to be invoked with message %j, context (this) is %j', queueName, message, this);
	},
	after: function (queueName, message, result) {
		console.log('%s subscriber ended successfully with result %j (message was %j, context (this) was %j)', queueName, result, message, this);
	},
	handleError: function (queueName, message, error) {
		console.log('%s (%j) failed with %s', queueName, message, error.stack);
	}
});

client.subscribe('task', function (params) {
	task.onBehalfOf(this.user).execute(params);
});

client.publish.call(this, { a: 10, b: 'str' });
```

Yes, it allows you to pass arbitrary context (`this`) when `preserveContext` is `true`.

# License

MIT
