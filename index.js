var amqp = require('amqp');
var Promise = require('bluebird');

function Client (config) {
	this.config = config;
	this.connectionPromise = null;
	this.queuePromises = {};
}

Client.prototype.getConnection = function () {
	return this.connectionPromise || (this.connectionPromise = new Promise(function (resolve, reject) {
		var c = amqp.createConnection(this.config);
		c.on('ready', function () { resolve(c); });
		c.on('error', function (error) { reject(error); });
	}));
};

Client.prototype.getQueue = function (name) {
	return this.queuePromises[name] || (this.queuePromises[name] = this.getConnection().then(function (c) {
		return new Promise(function (resolve, reject) {
			c.queue(name, {
				autoDelete: false,
				durable: true
			}, function (q) { resolve(q); });
		});
	}));
};

Client.prototype.publish = function (name, message) {
	message = message || null;
	
	try {
		message = JSON.stringify(message);
	} catch (e) {
		message = message.toString();
	}

	return Promise.all([this.getConnection(), this.getQueue(name)]).spread(function (c) {
		return c.publish(name, message, { deliveryMode: 2 });
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
		}, function (message, headers, deliveryInfo, ack) {
			message = message.data.toString('utf-8');
			try {
				message = JSON.parse(message);
			} catch (e) {
			}
			handler(message, function () {
				if (prefetchCount === 1) {
					q.shift();
				} else {
					ack.acknowledge();
				}
			});
		});
	});
};

module.exports = {
	Client: Client
};
