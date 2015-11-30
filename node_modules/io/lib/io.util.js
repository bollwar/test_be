/*!
 * io
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var io = require('../')

io.prototype.stream = function (emit, end) {
    end && end()
}

io.prototype.extend = function (extend) {
    this.stream = extend(this.stream)
    return this
}

io.prototype.hasDefault = function (args) {
    var i, l, k, defaults = Array.prototype.slice.call(arguments, 1)
    for (i = 0, l = defaults.length; i < l; i++) {
        if (typeof defaults[i] === 'object') {
            if (typeof args[i] === 'undefined' || null == args[i]) {
                args[i] = defaults[i]
            } else {
                for (k in defaults[i]) {
                    if (typeof args[i][k] === 'undefined') {
                        args[i][k] = defaults[i][k]
                    }
                }
            }
        } else {
            args[i] = args[i] || defaults[i]
        }
    }
    return args
}

io.prototype.collect = function (args) {
    return Array.prototype.slice.call(args)
}

var lambdaCache = {}

io.prototype.lambda = function (fn) {
    if (typeof fn === 'string') {
        if (typeof lambdaCache[fn] !== 'undefined') {
            return lambdaCache[fn]
        }
        var key = fn
        if (fn.match(/\breturn\b/)) {
            fn = new Function(fn)
        } else {
            var params = [], sections = fn.split(/\s*->\s*/m)
            if (sections.length > 1) {
                while (sections.length) {
                    fn = sections.pop()
                    params = sections.pop().split(/\s*,\s*|\s+/m)
                    sections.length && sections.push('(function('+params+'){return ('+fn+')})')
                }
            } else if (fn.match(/\b_\b/)) {
                params = '_'
            } else {
                var leftSection = fn.match(/^\s*(?:[+*\/%&|\^\.=<>]|!=)/m),
                    rightSection = fn.match(/[+\-*\/%&|\^\.=<>!]\s*$/m)
                if (leftSection || rightSection) {
                    if (leftSection) {
                        params.push('$1')
                        fn = '$1' + fn
                    }
                    if (rightSection) {
                        params.push('$2')
                        fn = fn + '$2'
                    }
                } else {
                    var vars = this.replace(/(?:\b[A-Z]|\.[a-zA-Z_$])[a-zA-Z_$\d]*|[a-zA-Z_$][a-zA-Z_$\d]*\s*:|this|arguments|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, '')
                                   .match(/([a-z_$][a-z_$\d]*)/gi) || []
                    for (var i = 0, v; v = vars[i++]; ) {
                        params.indexOf(v) >= 0 || params.push(v)
                    }
                }
            }
            fn = new Function(params, 'return (' + fn + ')')
            lambdaCache[key] = fn
        }
    }
    return fn
}

io.prototype.async = function (options, async_fn, callback) {
    var retries = 0
      , timeout = 0
      , timer
      , complete = false

    if (typeof options === 'function') {
        callback = async_fn
        async_fn = options
    } else {
        retries = options.retries || 0
        timeout = options.timeout || 0
    }

    function handle(err) {
        if (err && retries--) {
            return async_fn(handle)
        }
        if (!complete) {
            if (timer) {
                clearTimeout(timer)
            }
            complete = true
            return callback.apply(this, arguments)
        }
    }

    async_fn(handle)

    if (timeout) {
        timer = setTimeout(function () {
            handle(new Error('timeout'))
        }, 1000 * timeout)
    }
}

io.prototype.toObject = function (elem, key) {
    if (typeof elem !== 'object') {
        var obj = {}
        obj[key] = elem
        elem = obj
    }
    return elem
}

io.prototype.each = function () {
    this.stream.apply(this, arguments);
    return this
}

