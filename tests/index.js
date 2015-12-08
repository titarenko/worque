var worque = require('../');
var should = require('should');
var Promise = require('bluebird');

describe('worque', function () {
	it('should allow receive published message', function (done) {
		var client = worque({ url: 'amqp://localhost' });
		client.subscribe('q1', function (p) {
			p.should.eql(1);
			done();
		});
		client.publish('q1', 1);
	});
});
