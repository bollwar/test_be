/*!
 * io
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var io = require('../')
  , request = require('request')
  , jsdom = require('jsdom')
  , fs = require('fs')
  , jquery = __dirname + '/../support/jquery-1.6.4.min.js'

/**
 * Ignore parser errors.
 */

jsdom.dom.level3.core.Node.prototype.trigger = function () {}

/**
 * Load jQuery.
 */

jquery = fs.readFileSync(jquery).toString()

/**
 * Make an HTTP request.
 *
 * Input:
 *     A string containing a URL, e.g. 'http://www.google.com'
 *     An object containing a `url` key, e.g. { url: 'google.com }
 *
 * Output:
 *     { url: url, response: response, err: err, $: $ }
 *
 * Options:
 *     retries - the number of times to retry a failed request
 *     timeout - the number of seconds before failing
 *     jquery  - whether to include the $ jquery object
 *
 * @param {Object} options (optional)
 * @return this
 * @api public
 */

io.prototype.request = function (options) {
    this.hasDefault(arguments, { retries: 0, timeout: 30, jquery: false })

    options.timeout *= 1000

    var io = this, req = request.defaults(options)

    return this.mapAsync(function (input, emit) {
        input = io.toObject(input, 'url')

        if (input.timeout) {
            input.timeout *= 1000
        }

        io.async(options, function (callback) {

            req(input, callback)

        }, function (err, response) {

            input.response = response
            input.err = err || null

            if (!options.jquery) {
                return emit(input)
            }

            jsdom.env({ html: response.body, src: [jquery], done: function (err, window) {
                input.err = err || null
                input.response.window = window || null
                input.$ = window.$ || null
                return emit(input)
            }})

        })
    })
}

/**
 * An alias for `request({ jquery: true })`.
 */

io.prototype.jquery = function (options) {
    options = options || {}
    options.jquery = true
    return this.request(options)
}

