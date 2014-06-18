# Worque

AMQP-based work queue:

* exclusive - one task is processed by one worker (no broadcast, this is not event queue)
* durable - when there is no consumer, task will not disappear, but wait for first available consumer
* consistent - when consumer dies during task execution, it (task) will be sent to another consumer
* reliable - tested in production environment

## createProducer(name)

Promises producer object which has single method `publish(task)`.

## createConsumer(name)

Promises consumer object for producer with given `name`. Consumer has single method `subscribe(handler)`.

# License

BSD
