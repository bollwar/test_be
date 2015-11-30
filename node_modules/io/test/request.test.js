var IO = require('../')
  , assert = require('assert')

module.exports = {

    'test request()': function() {
        var io = new IO()
               .arguments('http://www.google.com')
               .request()

        io.each(function (e) {
            assert.ok(e.response.statusCode === 200)
        })
    },

    'test request() with $': function() {
        var io = new IO()
               .arguments('http://www.reddit.com')
               .jquery()

        io.each(function (e) {
            assert.ok(e.$('a.title').length > 5)
        })
    },

}

