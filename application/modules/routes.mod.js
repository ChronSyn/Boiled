module.exports = function(app, funcs, cfg, adv_cfg, steamconfig, rescan){


	app.route('/')
			.get(function(req, res, next){
				rescan(false, function(d){
					console.log("Rescan done! Result: " + d);
					if (d == true){
						res.render('index', {steamConfig : steamconfig});
					} else {
						res.send("Error");
					}
				});
				
			})
			.post(function(req, res, next){
				res.send('NYI');
			});
			
	app.route('/steam/game/copy')
			.post(function(req, res, next){
				
			});
		
	app.route('/steam/config')
			.post(function(req, res, next){
				
			});
		
	app.route('/boiled/update/check')
			.post(function(req, res, next){
				
			})
			.get(function(req, res, next){
				
			})
		
	app.route('/boiled/update/get')
			.post(function(req, res, next){
				
			})
			.get(function(req, res, next){
				
			});
			
	app.route('/boiled/config/load')
			.post(function(req, res, next){
				
			})
			.get(function(req, res, next){
				
			});
			
	app.route('/boiled/config/save')
			.post(function(req, res, next){
				
			})
			.get(function(req, res, next){
				res.render('config');
			});
			
	app.route('*')
			.get(function(req, res, next){
				/*console.log("*** QUERY ***");
				console.log(req.query);
				console.log("*** GET HEADERS ***");
				console.log(req.headers);*/
				next();
			})
			.post(function(req, res, next){
				/*console.log("*** QUERY ***");
				console.log(req.query);
				console.log("*** POST HEADERS ***");
				console.log(req.body);
				*/
				next();
			});
};