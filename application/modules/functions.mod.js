	var lib_vdf		=	require(__dirname + '/libs/vdf.js');
	var fs			=	require('fs');
	var path		=	require('path');
	var wmi			=	require('ms-wmic');
	var csvtojson	=	require('csvtojson').Converter;
	
	// Regex a key data from JSON
	// Used to extract the BaseInstallFolder entries
	var getPropertyByRegex = function(obj,propName, cb) {
	   var re = new RegExp("^" + propName + "(\\[\\d*\\])?$"),
		   key;
	   for (key in obj)
		  if (re.test(key))
			 return cb(obj[key]);
	   return null; // put your default "not found" return value here
	}
	
	// Extracts directories using regex
	var extractDirs = function(strin, cb){
		var arr	=	[];
		for (var key in strin){
			if (/^BaseInstallFolder/.test(key)){
				arr.push(strin[key]);
			};
		}
		return cb(arr);
	};
	module.exports.extractDirs = extractDirs;
	
	// Extracts game id's from JSON
	var extractGameIds = function(strin, cb){
		var arr = [];
		for (var key in strin){
			arr.push(key);
		};	
		return cb(arr)
	};
	
	// Extracts an array of ACF files in steam BaseInstallFolder locations
	var getGameAcfs	=	function(dirs, cb){										//
		var arr	=	[];																		// Create empty array
		for (i = 0; i < dirs.length; i++){
			var files = fs.readdirSync(dirs[i]+"\\steamapps\\");				// Read all files from 'steamapps' subdirectory in each directory
			for (var ia in files){
				if (path.extname(files[ia]) === ".acf"){							// If the file extension is .acf...
					arr.push(dirs[i]+"\\steamapps\\"+files[ia]);					// ..Add to empty array
				}
			};
		};
		return cb(arr);
	};
	module.exports.getGameAcfs = getGameAcfs;
	
	
	// Change all JSON keys to lowercase for parsing simplicity
	function keysToLowerCase(obj){
		Object.keys(obj).forEach(function(key){
			var k=key.toLowerCase();
			if(k!= key){
				obj[k]= obj[key];
				delete obj[key];
			}
		});
		return (obj);
	}
	
	// Convert CSV to JSON (wrapper around csvtojson lib)
	function _csvtojson(strin, cb){
		var csvConverter=new csvtojson();
		csvConverter.fromString(strin, function(err,data){
			return cb(data);
		});
	};
	
	function getDriveBusType(id, cb){
		var BusTypes = [
			'Unknown',
			'SCSI',
			'ATAPI',
			'ATA',
			'IEEE 1394',
			'SSA',
			'Fibre Channel',
			'USB',
			'RAID',
			'iSCSI',
			'SAS',
			'SATA',
			'SD',
			'MMC',
			'MAX',
			'File Backed Virtual',
			'Storage Spaces',
			'NVMe',
			'Microsoft Reserved'
		]
		
		return cb(BusTypes[id]);
	};

	function getPhysicalDisks(cb){
		wmi.execute("/NAMESPACE:\\\\root\\Microsoft\\Windows\\Storage Path MSFT_PhysicalDisk get SpindleSpeed, MediaType, BusType, DeviceId, SerialNumber, UniqueId, FriendlyName /FORMAT:CSV", function(err, res){
			if (err){
				console.log(err);
			};
			_csvtojson(res, function(d){
				for (var i in d){
					var thisDriveType = '';
					driveTypes = ["Unspecified","","","HDD","SSD"];
					var dtint = d[i].MediaType;
					d[i].DriveType = driveTypes[dtint];
					d[i].DriveLetter = "";
				};
				//console.log(d);
				return cb(d);
			});
			//return cb(d);
		});
	};
	//wmic /NAMESPACE:\\root\Microsoft\Windows\Storage Path MSFT_PhysicalDisk get SpindleSpeed, SerialNumber
	function mapPhysicalDisksToPartitions(cb){
		wmi.execute('Path Win32_LogicalDiskToPartition get /FORMAT:CSV', function(err, res){
			_csvtojson(res, function(d){
				//console.log(d);
				var diskarr = [];
				for (var i in d){
					var diskindex	= d[i].Antecedent.substring(d[i].Antecedent.length-1);
					var diskletter	= d[i].EndingAddress.substring(d[i].EndingAddress.length-4,d[i].EndingAddress.length-2);
					getPhysicalDisks(function(phys){
						for (var disk in phys){
							if (phys[disk].DeviceId == diskindex){
								if (phys[disk].DriveLetter.length <= 0){
									phys[disk].DriveLetter = diskletter;
								};
								diskarr.push(phys);
							};
							
						};
					});
				};
			});
		});
	};
	
	// Returns a list of accessible disks and data from WMI
	var getDriveLetters = function(cb){
		wmi.execute('logicaldisk WHERE "DriveType = 3" get DeviceId, FreeSpace, Size, FileSystem /FORMAT:CSV', function(err, res){	// Query data from WMI logicaldisk alias
			_csvtojson(res, function(d){																																			// Convert WMI results from CSV to JSON
				for (var i in d){
					delete(d[i].Node);																																				// Remove node 'dummy' entry from JSON
					d[i].percentFull = ((d[i].Size - d[i].FreeSpace) / d[i].Size *100).toFixed(2);																// Calculate the drive full percentage
					d[i].percentFree = (d[i].FreeSpace / d[i].Size *100).toFixed(2);																				// Calculate the drive free percentage
				}
				return cb(d);
			});
		});
	};
	module.exports.getDriveLetters = getDriveLetters;
	
	// Extracts relevant game data from ACF file
	var getGameDataFromAcf	=	function(acf, cb){
		var data = fs.readFileSync(acf, "utf8");//[], function(err, data){
			data	=	lib_vdf.parse(data);
			data	=	data.AppState;
			data	=	keysToLowerCase(data);
			
			var installdir = path.dirname(acf)+"\\common\\"+data.installdir;
			
			var gameData	=	{
				"AppId"					:	data.appid,
				"BuildId"				:	data.buildid,
				"Language"			:	data.userconfig.language,
				"Title"					:	data.name,
				"SizeOnDisk"			:	data.sizeondisk,
				"BytesToDownload"	:	data.bytestodownload,//(data.bytestodownload/1048576).toFixed(1),
				"BytesDownloaded"	:	data.bytesdownloaded,//(data.bytesdownloaded/1048576).toFixed(1),
				"PercentDownload"	:	0.00,
				"ImageUrl"			:	"http://cdn.akamai.steamstatic.com/steam/apps/"+data.appid+"/header.jpg",
				"InstallDir"				:	installdir
			};
			gameData.PercentDownload	=	(gameData.BytesDownloaded / gameData.BytesToDownload * 100).toFixed(2);
			if (gameData.PercentDownload == 'NaN'){
				gameData.PercentDownload = (0.00).toFixed(2);
			}
			return cb(gameData);
	};
	module.exports.getGameDataFromAcf	=	getGameDataFromAcf;
	
	// Runs function based upon object passed from client
	var runFunction	=	function(obj, cb){
		var thisfunc	=	obj.func;
		if (thisfunc == "STEAM_GAME_COPY"){
			var game_id	=	obj.settings.game_id;
			var dest_loc	=	obj.settings.dest_loc;
			
		};
		
		if (thisfunc == "BOILED_SAVE_CONFIG"){
			
		};
		
		if (thisfunc == "BOILED_LOAD_CONFIG"){
			
		};
		
		if (thisfunc == "STEAM_LOAD_GAMES"){
			
		};
		
		if (thisfunc == "BOILED_CHECK_UPDATE"){
			
		};
	};
	module.exports.runFunction	=	runFunction;
	
	
	
	
	
	
	
	
	
	