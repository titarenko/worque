var amqp = require('amqp');
var Promise = require('bluebird');

function Client (config) {
	this.config = config;
	this.connectionPromise = null;
	this.queuePromises = {};
}

Client.prototype.getConnection = function () {
	var self = this;
	return this.connectionPromise || (this.connectionPromise = new Promise(function (resolve, reject) {
		var c = amqp.createConnection(self.config);
		c.on('ready', function () { resolve(c); });
		c.on('error', function (error) { reject(error); });
	}));
};

Client.prototype.getQueue = function (name, options) {
	options = options || {
		autoDelete: false,
		durable: true
	};
	return this.queuePromises[name] || (
		this.queuePromises[name] = this.getConnection().then(function (c) {
			return new Promise(function (resolve, reject) {
				c.queue(name, options, function (q) { resolve(q); });
			});
		})
	);
};

Client.prototype.publish = function (name, message, options) {
	message = message || null;
	
	try {
		message = JSON.stringify(message);
	} catch (e) {
		message = message.toString();
	}

	return Promise.all([this.getConnection(), this.getQueue(name, options && options.queue)]).spread(function (c) {
		return c.publish(name, message, options || { deliveryMode: 2 });
	});
};

Client.prototype.subscribe = function (name, prefetchCount, handler) {
	if (!handler) {
		handler = prefetchCount;
		prefetchCount = 1;
	}
	var options = {
		ack: true,
		prefetchCount: prefetchCount
	};
	if (!(+prefetchCount === prefetchCount)) {
		options = prefetchCount;
	}
	return this.getQueue(name, options.queue).then(function (q) {
		return q.subscribe(options, function (message, headers, deliveryInfo, ack) {
			message = message && message.data && message.data.toString('utf-8') || message;
			try {
				message = JSON.parse(message);
			} catch (e) {
			}
			handler(message, function (error) {
				var reject = !!error;
				if (options.prefetchCount === 1) {
					q.shift(reject, reject);
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
