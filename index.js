var amqp = require('amqp');
var Q = require('q');

function connect (channelName) {
	var result = Q.defer();

	var connection = amqp.createConnection();

	connection.on('ready', function () {
		connection.queue(channelName, {
			autoDelete: false, 
			durable: true
		}, function (queue) {
			result.resolve({
				connection: connection,
				queue: queue
			});
		});
	});

	connection.on('error', function (error) {
		result.reject(error);
	});

	return result.promise;
}

function publish (client, message) {
	try {
		message = JSON.stringify(message);
	} catch (e) {
		message = message.toString();
	}
	client.connection.publish(channelName, message, {
		deliveryMode: 2
	});
}

function subscribe (client, handler) {
	client.queue.subscribe({
		ack: true,
		prefetchCount: 1
	}, function (message) {
		message = message.data.toString('utf-8');
		try {
			message = JSON.parse(message);
		} catch (e) {
		}
		handler(message, function () {
			client.queue.shift();
		});
	});
}

module.exports = {

	createProducer: function (channelName) {
		return connect(channelName).then(function (client) {
			return {
				publish: publish.bind(this, client)
			};
		});
	},

	createConsumer: function (channelName) {
		return connect(channelName).then(function (client) {
			return {
				subscribe: subscribe.bind(this, client)
			};
		});
	}

};
