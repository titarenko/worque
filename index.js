var amqp = require('amqp');
var Q = require('q');

function Client (config) {
	this.config = config;
	this.connectionPromise = null;
	this.queues = {};
}

Client.prototype.getConnection = function () {
	if (this.connectionPromise) {
		return this.connectionPromise;
	}

	var result = Q.defer();
	this.connectionPromise = result.promise;
	
	var c = amqp.createConnection(this.config);
	
	c.on('ready', function () {
		result.resolve(c);
	});

	c.on('error', function (error) {
		result.reject(error);
	});
	
	return this.connectionPromise;
};

Client.prototype.getQueue = function (name) {
	var self = this;

	if (this.queues[name]) {
		return Q(this.queues[name]);
	}
	
	return this.getConnection().then(function (c) {
		var result = Q.defer();
		
		c.queue(name, {
			autoDelete: false,
			durable: true
		}, function (q) {
			self.queues[name] = q;
			result.resolve(q);
		});
		
		return result.promise;
	});
};

Client.prototype.publish = function (name, message) {
	try {
		message = JSON.stringify(message);
	} catch (e) {
		message = message.toString();
	}

	return this.getConnection().then(function (c) {
		return c.publish(name, message, {
			deliveryMode: 2
		});
	});
};

Client.prototype.subscribe = function (name, prefetchCount, handler) {
	if (!handler) {
		handler = prefetchCount;
		prefetchCount = 1;
	}
	return this.getQueue(name).then(function (q) {
		return q.subscribe({
			ack: true,
			prefetchCount: prefetchCount
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
};

module.exports = {
	Client: Client
};
