var worque = require('./..');
var should = require('should');
var Promise = require('bluebird');

describe('worque', function () {
	this.timeout(12000);
	it('should work', function (done) {
		var client = worque('amqp://localhost');
		client.on('error', done);
		client('should work').subscribe(function (p) {
			p.should.eql(1);
			done();
		}).promise.catch(done);
		client('should work').publish(1).promise.catch(done);
	});
	it('should support scheduling', function (done) {
		var client = worque('amqp://localhost');
		var count = 0;
		client.on('error', done);
		client('should support scheduling').subscribe(function () {
			if (!count++) {
				done();
			}
		}).schedule('* * *').catch(done);
	});
	it('should support scheduling using simplified format', function (done) {
		var client = worque('amqp://localhost');
		var count = 0;
		client.on('error', done);
		client('should support scheduling using simplified format').subscribe(function () {
			if (!count++) {
				done();
			}
		}).schedule('*:*:*').catch(done);
	});
	it('should support retrying', function (done) {
		var client = worque('amqp://localhost');
		var count = 0;
		client('should support retrying').subscribe(function (params) {
			if (count++ < 3) {
				throw new Error('try more');
			}
			params.should.eql({ a: 'b' });
			done();
		}).retry(1, 2, 3).catch(done);
		client('should support retrying').publish({ a: 'b' }).catch(done);
	});
	it('should support closing connection', function (done) {
		var client = worque('amqp://localhost');
		client.close().then(function () {
			return client('should support closing connection').publish('any message');
		}).catch(function (e) {
			if (e.message == 'Channel ended, no reply will be forthcoming') {
				done();
			} else {
				done(e);
			}
		});
	});
	it('should remove expired scheduled messages', function (done) {
		// correct:
		// 0ms - 1st message
		// (u)ms - worker takes 1st message (u is much less than 2000)
		// 2000ms - 2nd message
		// 4000ms - 2nd message is expired, 3rd is published
		// (4000 + u)ms - worker ends with 1st message
		// (4000 + 2u)ms - worker takes 3rd message
		// (4000 + 3u)ms - worker ends with 3rd message
		// 6000ms - 4th message
		// (6000 + u)ms - worker takes 4th message
		
		// wrong:
		// 0ms - 1st message
		// (u)ms - worker takes 1st message (u is much less than 2000)
		// 2000ms - 2nd message
		// 4000ms - 3rd message
		// (4000 + u)ms - worker ends with 1st message
		// (4000 + 2u)ms - worker takes 2nd message
		// (4000 + 3u)ms - worker ends with 2nd message
		// (4000 + 4u)ms - worker starts with 3rd message
		// (4000 + 5u)ms - worker ends with 3rd message
		// (4000 + 6u)ms - worker starts with 4th message

		var client = worque('amqp://localhost');
		var counter = 0;
		var start = new Date(), u;
		client('should remove expired scheduled messages').subscribe(function () {
			counter += 1;
			if (counter == 1) {
				u = new Date() - start;
				return Promise.delay(4000);
			} else if (counter == 4) {
				var diff = new Date() - start;
				if (diff <= 6000 + u) {
					done(new Error('4th message received earlier than (3000 + u)ms'));
				} else {
					done();
				}
			}
		}).schedule('*:*:*/2');
	});
});
