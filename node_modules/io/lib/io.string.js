/*!
 * io
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var io = require('../')

io.prototype.split = function (delim, quote, escape) {
    this.hasDefault(arguments, ',')

    if (!quote) {
        return this.map(function (elem) {
            return elem.split(delim)
        })
    }

    //Escape special regex chars
    var d, e, q, regex = function (str) {
        return str.replace(/[.*+?|()\\[\\]{}]/g, '\\$&')
    }
    d = regex(delim)
    q = regex(quote)
    e = regex(escape || quote)

    var quote = new RegExp(e + q, 'g'), delimited = new RegExp(
        '(' + d + '|^)' +
        '(?:' + q + '([^' + q + ']*(?:' + e + q + '[^' + q + ']*)*)' + q + '|' +
        '([^' + q + d + ']*))'
    , 'g')

    return this.map(function (line) {
        var matches, value, values = []
        while (matches = delimited.exec(line)) {
            if (!matches[1] && values.length) {
                break
            } else if (matches[2]) {
                value = matches[2].replace(quote, q)
            } else {
                value = matches[3] || ''
            }
            values.push(value)
        }
        return values
    })
}

io.prototype.join = function (delim, quote, escape) {
    this.hasDefault(arguments, ',')

    if (!quote) {
        return this.map(function (elem) {
            return elem.join(delim)
        })
    }

    var quote_reg = new RegExp('[' + quote + ']', 'g')
      , requires_quotes = new RegExp('[' + delim + '\r\n]')

    escape = escape || quote

    return this.map(function (values) {
        if (Array.isArray(values)) {
            var quoted_values = [], value, i = 0, l = values.length
            for (; i < l; i++) {
                value = values[i] == null ? '' : '' + values[i]
                if (value.indexOf(quote) > -1) {
                    value = quote + value.replace(quote_reg, escape + quote) + quote
                } else if (requires_quotes.test(value)) {
                    value = quote + value + quote
                }
                quoted_values.push(value)
            }
            values = quoted_values.join(delim)
        }
        return values
    })
}

