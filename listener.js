var redis = require('redis');
var async = require('async');
var generator = require('./generator');
client = redis.createClient();

function listener (callback) {
	async.waterfall([
		function(cb){
			client.exists('check',cb);
		},
		function(ret, cb){
			if (ret == 1) {;
			console.log(ret)
			client.blpop('generator', 10, cb)
			} 
			else{
				generator.generate();
			}
		},
		function(answer, cb){
			eventHandler(answer[1],cb);
		}
		
	],
		function(error, res){
			console.log(error,res);
			if (error) {
				console.log('err');
				client.rpush('error', res);
			} 
			else{
				console.log('msg');
				client.rpush('msg', res);
			};
		listener(callback);
		})
}

function eventHandler(msg, callback){
	function onComplete(){
		var error = Math.random() > 0.85;
		callback(error, msg);
	}
	// processing takes time...
	setTimeout(onComplete, Math.floor(Math.random()*1000));
}

module.exports = {
	listen: function(){
		listener();
	}
}