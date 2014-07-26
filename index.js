var amqp = require('amqp');
var Q = require('q');

var connection, queues = {};

function getConnection () {
	if (connection) {
		return Q(connection);
	}

	var result = Q.defer();
	
	var c = amqp.createConnection();
	c.on('ready', function () {
		result.resolve(c);
	});
	c.on('error', function (error) {
		result.reject(error);
	});
	
	return result.promise;
}

function getQueue (name) {
	if (queues[name]) {
		return Q(queues[name]);
	}
	
	return getConnection().then(function (c) {
		var result = Q.defer();
		
		c.queue(name, {
			autoDelete: false,
			durable: true
		}, function (q) {
			queues[name] = q;
			result.resolve(q);
		});
		
		return result.promise;
	});
}

function publish (name, message) {
	try {
		message = JSON.stringify(message);
	} catch (e) {
		message = message.toString();
	}

	return getConnection().then(function (c) {
		connection.publish(name, message, {
			deliveryMode: 2
		});
	});
}

function subscribe (name, handler) {
	return getQueue(name).then(function (q) {
		q.subscribe({
			ack: true,
			prefetchCount: 1
		}, function (message) {
			message = message.data.toString('utf-8');
			try {
				message = JSON.parse(message);
			} catch (e) {
			}
			handler(message, function () {
				q.shift();
			});
		});
	});
}

module.exports = {
	publish: publish,
	subscribe: subscribe
};
