var amqplib = require('amqplib');
var memoizee = require('memoizee');
var Promise = require('bluebird');

module.exports = build;

function build (config) {
	var getChannel = memoizee(createChannel);

	return {
		publish: publish,
		subscribe: subscribe
	};

	function publish (queueName, message, context) {
		return getChannel(config.url).then(assertQueue(queueName)).then(function (channel) {
			var content = {
				context: config.preserveContext ? this : context,
				message: message
			};
			return channel.sendToQueue(queueName, new Buffer(JSON.stringify(content)));
		});
	}

	function subscribe (queueName, handler) {
		return getChannel(config.url).then(assertQueue(queueName)).then(function (channel) {
			return channel.consume(queueName, function (message) {
				var content = JSON.parse(message.content.toString());
				return Promise.resolve().tap(function () {
					if (typeof config.before === 'function') {
						return config.before.call(content.context, queueName, content.message);
					}
				}).then(function () {
					return handler.call(content.context, content.message);
				}).tap(function (result) {
					if (typeof config.after === 'function') {
						return config.after.call(content.context, queueName, content.message, result);
					}
				}).catch(function (error) {
					if (typeof config.handleError === 'function') {
						return config.handleError.call(content.context, queueName, content.message, error);
					} else {
						throw error;
					}
				}).tap(function () {
					return channel.ack(message);
				}).catch(function (error) {
					var nackResult = channel.nack(message);
					return Promise.resolve(nackResult).throw(error);
				});
			});
		});
	}
}

function createChannel (url) {
	return amqplib.connect(url).then(function (connection) {
		return connection.createChannel();
	});
}

function assertQueue (queueName) {
	return function (channel) {
		var assertionResult = channel.assertQueue(queueName, { durable: true });
		return Promise.resolve(assertionResult).return(channel);
	};
}
