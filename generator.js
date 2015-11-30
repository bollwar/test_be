var redis = require('redis');
var async = require('async');
client = redis.createClient();

function generator (callback) {
	async.waterfall([
		function(cb){
			client.set('check', '1');
			client.expire('check',10 ,cb)
		},
		function(res,cb){
			//console.log('tut',res)
			client.rpush('generator', getMessage(),cb)
		},
		function(answer,cb){
			//console.log('tam', answer);
			setTimeout(function(){generator(cb);},
			 500);
		}
],function(err){
	console.log('end',err)
	if (err) {
		client.del('check')
	};
});
}
function getMessage(){
		this.cnt = this.cnt || 0;
		return this.cnt++;
	}
module.exports = {
	generate: function(){
		generator();
	}
}
process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    client.del('check');
	process.exit();
});