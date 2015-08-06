var worque = require('../');
var should = require('should');

describe('worque', function () {
	it('should allow receive published message', function (done) {
		var client = new worque.Client({ host: 'localhost' });
		client.subscribe('q1', function (p) {
			p.should.eql(1);
			done();
		});
		client.publish('q1', 1);
	});
	it('should persist task, if execution was interrupted', function (done) {
		var client = new worque.Client({ host: 'localhost' });
		client.subscribe('q1', function (p, ack) {
			setTimeout(ack, 100);
		});
		client.publish('q1', 1);
		client.publish('q1', 2);
		client.getConnection().then(function (c) { 
			c.end();
			var client2 = new worque.Client({ host: 'localhost' });
			client2.subscribe('q1', function (p) {
				p.should.eql(1);
				done();
			});
		});
	});
});
