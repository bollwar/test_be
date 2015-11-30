var redis = require('redis');
var async = require('async');
client = redis.createClient();

function delerr () {
	async.waterfall([
		function(cb){
			client.lrange('error',0,-1, redis.print);
			cb(null,'next');
		},
		function(ret,cb){
			console.log('delete');
			client.del('error',cb);
		}
	],function(){
		console.log("Errors deleted");
		process.exit();
	});
		
		
}

module.exports = {
	delete: function(){
		delerr();
	}
}