'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _ = require('lodash');
var Promise = require('bluebird');
var CronJob = require('cron').CronJob;

module.exports = Queue;

function Queue (getChannel, bufferQueue, name, options) {
	EventEmitter.call(this);

	this._getChannel = getChannel;
	this._bufferQueue = bufferQueue;
	this._name = name;
	
	this.promise = getChannel().then(function (channel) {
		return channel.assertQueue(name, options || { durable: true });
	});

	var self = this;
	['then', 'catch', 'done', 'finally'].forEach(wire);
	function wire (methodName) {
		self[methodName] = function () {
			self.promise[methodName].apply(self.promise, arguments);
		};
	}
}

util.inherits(Queue, EventEmitter);

Queue.prototype._exec = function (fn) {
	var self = this;
	this.promise = this.promise.then(function () {
		return self._getChannel().then(function (channel) {
			return fn.call(self, channel);
		});
	});
	return this;
};

Queue.prototype.bind = function (source, pattern, options) {
	return this._exec(function (channel) {
		return channel.bindQueue(this._name, source, pattern, options);
	});
};

Queue.prototype.publish = function (content, context, options) {
	var data = { context: context, content: content };
	var rawContent = new Buffer(JSON.stringify(data));
	return this._exec(function (channel) {
		return channel.sendToQueue(this._name, rawContent, options || { persistent: true });
	});
};

Queue.prototype.subscribe = function (handler, options) {
	return this._exec(function (channel) {
		var self = this;
		return channel.consume(this._name, onMessage, options);
		function onMessage (message) {
			var rawContent = message.content || new Buffer('{}');
			var data;
			try {
				data = JSON.parse(rawContent.toString());
			} catch (e) {
				self.emit('failure', { error: error });
				channel.ack(message);
			}
			self.emit('task', _.extend(data, { name: self._name }));
			return Promise.resolve().then(function () {
				return handler.call(data.context, data.content);
			}).tap(function (result) {
				self.emit('result', _.extend({ result: result }, data));
			}).catch(function (error) {
				self.emit('failure', _.extend({ error: error }, data));
			}).finally(function () {
				channel.ack(message);
			});
		}
	});
};

Queue.prototype.schedule = function (cronTime) {
	if (cronTime.indexOf(':') !== 0) {
		cronTime = cronTime.split(':').reverse().join(' ');
	}
	
	var padding = 6 - cronTime.split(' ').length;
	if (padding > 0) {
		cronTime = cronTime + _.repeat(' *', padding);
	}

	var args = _.slice(arguments, 1);
	args[2] = args[2] || { persistent: true, expiration: 1000 };
	
	return this._exec(function (channel) {
		var self = this;
		new CronJob(cronTime, publish, null, true);
		function publish () { 
			self.publish.apply(self, args);
		}
	});
};

Queue.prototype.retry = function (getTtl) {
	if (!_.isFunction(getTtl)) {
		var timings = _.isArray(getTtl) ? getTtl : _.slice(arguments)
		getTtl = buildGetTtl(timings.map(function (it) {
			return it/(process.env.TIME_DENOM || 1);
		}));
	}

	return this._exec(function (channel) {
		var errorCounter = 0, bufferQueue = this._bufferQueue;
		this.on('result', function (ev) {
			errorCounter = 0;
		});
		this.on('failure', function (ev) {
			var ttl = getTtl(errorCounter++);
			if (!ttl) {
				return;
			}
			var data = _.extend({ ttl: ttl }, ev);
			channel.sendToQueue(bufferQueue, new Buffer(JSON.stringify(data)), { persistent: true });
		});
	});

	function buildGetTtl (ttls) {
		return function getTtl (counter) {
			if (counter < ttls.length) {
				return ttls[counter];
			};
		};
	}
};
