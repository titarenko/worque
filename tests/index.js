var worque = require('./..');
var should = require('should');

describe('worque', function () {
	it('should work', function (done) {
		var client = worque('amqp://localhost');
		client.on('error', done);
		client.subscribe('q1', function (p) {
			p.should.eql(1);
			done();
		}).catch(done);
		client.publish('q1', 1).catch(done);
	});
	it('should support scheduling', function (done) {
		var client = worque('amqp://localhost');
		client.on('error', done);
		client.schedule('* * * * * *', 'recurrent', function () {
			done();
		}).catch(done);
	});
});
