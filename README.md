# worque

AMQP-based work queue:

* exclusive - one task is processed by one worker (no broadcast, this is not event queue)
* durable - when there is no consumer, task will not disappear, but wait for first available consumer
* consistent - when consumer dies during task execution, it (task) will be sent to another consumer
* reliable - tested in production environment

## publish(name, message)

Promises message publishing using named channel.

## subscribes(name, handler)

Promises subscription on messages of named channel. Function `handler` must have signature `fn(message, ack)`, where `ack` is function which should be called after successful handling of `message`.

# License

BSD
