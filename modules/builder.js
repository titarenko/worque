'use strict';

var EventEmitter = require('events').EventEmitter;
var memoizee = require('memoizee');
var _ = require('lodash');
var amqplib = require('amqplib');
var Promise = require('bluebird');
var Queue = require('./queue');

module.exports = build;

function build (url) {
	var emitter = new EventEmitter();
	var getChannel = memoizee(_.partial(createChannel, url));

	getChannel().then(createRetryBuffer).catch(function (e) {
		emitter.emit('failure', { error: e });
	});

	init.on = emitter.on.bind(emitter);
	init.once = emitter.once.bind(emitter);
	init.close = _.partial(close, getChannel);

	return init;
	
	function init (queueName) {
		var instance = new Queue(getChannel, 'worque-buffer', queueName);
		['task', 'result', 'failure'].forEach(wire);
		return instance;

		function wire (eventName) {
			instance.on(eventName, function (eventData) {
				emitter.emit(eventName, eventData);
			});
		}
	}
}

function createChannel (url) {
	return amqplib.connect(url).then(function (connection) {
		return connection.createChannel();
	}).then(function (channel) {
		channel.prefetch(1);
		return channel;
	});
}

function close (getChannel) {
	return getChannel().then(function (channel) {
		return channel.connection.close();
	});
}

function createRetryBuffer (channel) {
	return Promise.all([
		channel.assertQueue('worque-retry', { durable: true }),
		channel.assertExchange('worque-retry', 'topic', { durable: true })
	]).then(function () {
		return Promise.all([
			channel.assertQueue('worque-buffer', { durable: true, arguments: { 'x-dead-letter-exchange': 'worque-retry', 'x-message-ttl': 1000, 'x-dead-letter-routing-key': 'worque-retry' } }),
			channel.bindQueue('worque-retry', 'worque-retry', '*')
		]);
	}).then(function () {
		return channel.consume('worque-retry', function (message) {
			var data = JSON.parse(message.content.toString());
			if (--data.ttl) {
				channel.sendToQueue('worque-buffer', new Buffer(JSON.stringify(data)), { persistent: true });
			} else {
				channel.sendToQueue(data.name, new Buffer(JSON.stringify(_.pick(data, ['context', 'content']))), { persistent: true });
			}
			channel.ack(message);
		});
	});
}
