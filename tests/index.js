var worque = require('./..');
var should = require('should');
var Promise = require('bluebird');

describe('worque', function () {
	this.timeout(12000);
	it('should work', function (done) {
		var client = worque('amqp://localhost');
		client.on('error', done);
		client('q1').subscribe(function (p) {
			p.should.eql(1);
			done();
		}).promise.catch(done);
		client('q1').publish(1).promise.catch(done);
	});
	it('should support scheduling', function (done) {
		var client = worque('amqp://localhost');
		var count = 0;
		client.on('error', done);
		client('recurrent').subscribe(function () {
			if (!count++) {
				done();
			}
		}).schedule('* * *').catch(done);
	});
	it('should support scheduling using simplified format', function (done) {
		var client = worque('amqp://localhost');
		var count = 0;
		client.on('error', done);
		client('recurrent').subscribe(function () {
			if (!count++) {
				done();
			}
		}).schedule('*:*:*').catch(done);
	});
	it('should support retrying', function (done) {
		var client = worque('amqp://localhost');
		var count = 0;
		client('somewhat failing').subscribe(function (params) {
			if (count++ < 3) {
				throw new Error('try more');
			}
			params.should.eql({ a: 'b' });
			done();
		}).retry(1, 2, 3).catch(done);
		client('somewhat failing').publish({ a: 'b' }).catch(done);
	});
	it('should support closing connection', function (done) {
		var client = worque('amqp://localhost');
		client.close().then(function () {
			return client('any queue').publish('any message');
		}).catch(function (e) {
			if (e.message == 'Channel ended, no reply will be forthcoming') {
				done();
			} else {
				done(e);
			}
		});
	});
	it('should remove expired scheduled messages', function (done) {
		var client = worque('amqp://localhost');
		var counter = 0;
		var start;
		client('scheduled').subscribe(function () {
			counter += 1;
			if (counter == 1) {
				return Promise.delay(3000);
			} else if (counter == 2) {
				start = new Date();
			} else if (counter == 3) {
				var diff = new Date() - start;
				if (diff < 1000) {
					done(new Error('Called after ' + diff + 'ms => earlier than 1000 ms => there were several messages in a queue'));
				} else {
					done();
				}
			}
		}).schedule('*:*:*');
	});
	it('should requeue failed messages', function (done) {
		var client = worque('amqp://localhost');
		var counter = 0;
		client('task').subscribe(function (message) {
			return Promise.delay(1000).then(function () {
				if (++counter == 1) {
					throw new Error('failure first');
				} else if (counter == 2 && message != 2) {
					done(new Error('failed should be readded to the end, not the begin of queue'))
				} else if (counter == 3) {
					done();
				}
			});
		}, { requeue: true }).publish(1).publish(2);
	});
	it('should not requeue failed messages if not asked explicitly', function (done) {
		var client = worque('amqp://localhost');
		var counter = 0;
		client('task').subscribe(function (message) {
			if (++counter != message) {
				done(new Error('order is broken'));
			}
			if (counter == 2) {
				done();
			}
		}).publish(1).publish(2);
	});
});
