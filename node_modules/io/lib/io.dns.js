/*!
 * io
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var io = require('../')
  , dns = require('dns')

/**
 * Resolves a domain into the first found A (IPv4) or AAAA (IPv6) record.
 *
 * Input:
 *     A string containing a domain, e.g. 'google.com'
 *     An object containing a `url` key, e.g. { url: 'google.com }
 *
 * Output:
 *     { url: url, ip: ip, err: err }
 *
 * Options:
 *     retries - the number of times to retry a failed request
 *     timeout - the number of seconds before failing
 *     family  - the IPv to lookup, 4 or 6
 *
 * @param {Object} options (optional)
 * @return this
 * @api public
 */

io.prototype.lookup = function (options) {
    this.hasDefault(arguments, { retries: 0, timeout: 5, family: 4 })

    var io = this

    return this.mapAsync(function (input, emit) {
        input = io.toObject(input, 'url')

        io.async(options, function (callback) {

            dns.lookup(input.url, options.family, callback)

        }, function (err, ip) {

            input.err = err
            input.ip = !Array.isArray(ip) || ip.length
                     ? ip
                     : null

             emit(input)

        })
    })
}

