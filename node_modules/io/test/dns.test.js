var IO = require('../')
  , assert = require('assert')

module.exports = {

    'test resolve()': function() {
        var io = new IO()
               .arguments('google.com')
               .lookup()

        io.each(function (e) {
            assert.deepEqual(Object.keys(e), ['url', 'err', 'ip'])
            assert.ok(e.err === null)
            assert.ok(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/.test(e.ip))
        })
    },

    'test resolve() error': function() {
        var io = new IO()
               .arguments('google.zzzzz')
               .lookup()

        io.each(function (e) {
            assert.deepEqual(Object.keys(e), ['url', 'err', 'ip'])
            assert.equal(e.err.errno, 4)
            assert.ok(e.ip == null)
        })
    },

    'test resolve() using input object': function () {
        var io = new IO()
               .arguments({ url: 'google.com', foo: 'bar' })
               .lookup()

        io.each(function (e) {
            assert.deepEqual(Object.keys(e), ['url', 'foo', 'err', 'ip'])
            assert.ok(e.err === null)
            assert.ok(/[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/.test(e.ip))
            assert.equal(e.foo, 'bar')
        })
    },

}

