#!/usr/bin/env node
	// CONFIG FILE
	var cfg_file				= require('../application.config');
	var cfg 						= cfg_file.cfg;
	var adv_cfg				= cfg_file.adv_cfg;
	var express				=	require('express');
	var util						=	require('util');
	var fs						=	require('fs');
	var os						=	require('os');
	var cookies				=	require('cookies');
	var http						=	require('http');
	var https					=	require('https');
	var moment				=	require('moment');
	var bodyParser			=	require('body-parser');
	//var timeout				=	require('connect-timeout');
	//var methodOverride	=	require('method-override');
	var csrf						=	require('csurf');
	var responseTime		=	require('response-time');
	//var session				=	require('express-session');
	var cookieParser		=	require('cookie-parser');
	var compression			=	require('compression');
	var winreg					=	require('winreg');
	var cheerio				=	require('cheerio');
	var request				=	require('request');
	//var prettyerror			=	require('pretty-error').start();
	
	var port						= process.env.PORT || cfg.app_port;
	var log_stdout			= process.stdout;
	var log_file				= fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
	console.log = function(d) {
		log_file.write(moment().format("MMMM DD YYYY HH:mm:ss.SSS ZZ - ") + util.format(d) + '\n');
		log_stdout.write(moment().format("MMMM DD YYYY HH:mm:ss.SSS ZZ - ") + util.format(d) + '\n');
	};
	
	/*
	function haltOnTimedout(req, res, next){
		if (!req.timedout){
			next();
		} else {
			res.send('TIMED OUT');
		}
	};
	*/

	var app	= express();
	
	//app.use(timeout('15s'));
	/*
	app.use(responseTime(function(req, res, time){
		var ip = req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : req.connection.remoteAddress;
		console.log("REQUEST PATH: " + req.path);
		console.log("RESPONSE TIME: " + time);
		console.log("REQUEST IP: " + ip);
	}));
	*/
	//app.use(haltOnTimedout);
	
	// SET APPLICATION PARAMETERS
	//app.use(methodOverride());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended:true}));
	app.use(cookieParser());
	app.set('views', __dirname+ '/views');
	app.set('view engine', adv_cfg.view_engine);
	if (adv_cfg.compress == true){app.use(compression())};
	if (adv_cfg.public_route !== false){app.use(adv_cfg.public_route, express.static(__dirname + '/public'))};     // Define public directory	
	
	process.env.CFG				=	cfg;
	process.env.ADV_CFG		=	adv_cfg;	
	

	var funcs 		= require(__dirname + "/modules/functions.mod.js");	
	
	var lib_vdf			=	require(__dirname + '/modules/libs/vdf.js');	
	var steamconfig	=	{
		"system"		:	{
			"drives"			:	[
			
			]
		},
		"config"			:	{
			"regpath"		:	"\\SOFTWARE\\Wow6432Node\\Valve\\Steam",
			"InstallLoc"	:	"",
			"SteamLibraries"	:	[
			
			]
		},
		"status"				:	{
			"InitTime"			:	"",
			"RescanTime"	:	""
		},
		"Games"		:	[]
	};
	
	var initialization	=	function(log, cb){
		var regKey	=	new winreg({
			key	:	steamconfig.config.regpath
		});
		if(log){console.log("Detecting Steam Install Location...");};
		regKey.values(function(err, regkeys){
			for (var reg in regkeys){
				if (regkeys[reg].name == 'InstallPath'){
					steamconfig.config.InstallLoc = regkeys[reg].value;
					if(log){console.log("Detecting Steam Library Locations...");};
					data = fs.readFileSync(regkeys[reg].value+'\\config\\config.vdf', "utf8");
					var	config 		=	lib_vdf.parse(data);
							config		=	config.InstallConfigStore.Software.Valve.Steam;
					funcs.extractDirs(config, function(dirs){
						steamconfig.config.SteamLibraries = dirs;
						if(log){console.log("Detecting Installed Games and Applications...");};
						funcs.getGameAcfs(dirs, function(acf_arr){
								steamconfig.Games = [];
							if(log){console.log("Reading Game Information...");};
							for (i in acf_arr){
								funcs.getGameDataFromAcf(acf_arr[i], function(game_data){
									/*
									request("http://store.steampowered.com/app/"+game_data.AppId, function(err, res, body){
										$ = cheerio.load(body);
										var img = $('.game_header_image_full').attr('src');
										game_data.ImageUrl = img;
									*/
										steamconfig.Games.push(game_data);
									});
							};
							funcs.getDriveLetters(function(drives){
								steamconfig.system.drives = drives;
							});
						});
					});
					steamconfig.status.InitTime	=	moment().format("MMMM DD YYYY HH:mm:ss.SSS ZZ");
					return cb(true);
				} else {
					if(log){console.log("Could not detect Steam Install Dir");};
				};
			};
		});
	};
	
	module.exports.initialization = initialization;
	module.exports.app	= app;
	module.exports			= app;
	
	console.log("Initializing...");
	initialization(true, function(status){
		console.log("Initialized: " + status);
		var srv			=	http.createServer(app);
		var io			=	require('socket.io').listen(srv);
		var socks		=	require(__dirname + "/modules/socket.mod.js")(cfg, adv_cfg, io, funcs, router);
		var router		= require(__dirname + "/modules/routes.mod.js")(app, funcs, cfg, adv_cfg, steamconfig, initialization);
		srv.listen(cfg.app_port, function(){
			console.log('Listen on ' + cfg.app_port+"!");
		});
	});