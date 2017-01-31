module.exports = function(cfg, adv_cfg, io, funcs, router){
	var exec 					=	require('child_process').exec;
	
	io.on('connection', function(client){
		client		
			.on('cmd', function(o){
				funcs.runFunction(o, function(data){
					var obj = {
						cmd	:	cmd,
						data	:	data
					};
					client.emit('cmd', obj);
				});
			})			
	});
};