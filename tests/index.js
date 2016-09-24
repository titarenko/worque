var worque = require('./..');
var should = require('should');

describe('worque', function () {
	this.timeout(7000);
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
});
