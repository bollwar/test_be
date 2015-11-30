/*!
 * io
 * Copyright(c) 2011 Chris O'Hara <cohara87@gmail.com>
 * MIT Licensed
 */

var io = module.exports = function () {}

/**
 * Load modules from `./lib`.
 */

var modules = ['util', 'functional', 'string', 'stream', 'dns', 'request']

modules.forEach(function (module) {
    require('./lib/io.' + module);
});

