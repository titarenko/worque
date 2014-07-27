# worque

AMQP-based work queue with following features:

* one task is processed by one worker (no broadcast, this is not event queue)
* when there is no consumer, task will not disappear, but wait for first available consumer
* when consumer dies during task execution, it (task) will be sent to another consumer

## publish(name, message)

Promises message publishing using named channel.

## subscribe(name, handler)

Promises subscription on messages of named channel. Function `handler` must have signature `fn(message, ack)`, where `ack` is function which should be called after successful handling of `message`.

# License

BSD
