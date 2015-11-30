var listener = require('./listener');
var generator = require('./generator');
var delErrors = require('./delErrors');
var async = require('async');
var redis = require('redis');
client = redis.createClient();

if (process.argv[2] == 'getErrors') {
    delErrors.delete();
    return;
};

async.waterfall([
    function(cb){
        client.exists('check',cb)
    },
    function(res, cp){
        if (res == 0) {
            generator.generate();
        } 
        else{
            listener.listen();
        };
    }
],function(){})