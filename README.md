# worque

AMQP-based work queue: one message per worker, rescheduling on unexpected disconnect of worker, durability of queue.

# Example

```js
var worque = require('worque');

var client = new worque.Client({
	host: 'localhost',
	port: 5672,
	user: 'guest',
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

Constructs queue client using provided `config` (see example for list of its properties).

## Client::publish(name, message)

Promises message publishing using named channel.

## Client::subscribe(name, handler)

Promises subscription on messages of named channel. Function `handler` must have signature `fn(message, ack)`, where `ack` is function which should be called after successful handling of `message`.

# License

BSD
