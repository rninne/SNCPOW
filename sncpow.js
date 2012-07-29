function start (folder, credentials, debug, verbose) {
	//folder: name of the folder to watch with this instance of SNCPOW
	//credentails: name of the credentials file
	
	this.https = require('https');
	this.fs = require('fs');
	
	this.fileExists = function (file) {
		var exists = false;
		try {
			exists = this.fs.lstatSync(file).isFile();
		}
		catch (e) {
			console.log('The file ' + file + ' does not exist!');
		}
		return exists;
	}
	
	this.folderExists = function (folder) {
		var exists = false
		try {
			exists = this.fs.lstatSync(folder).isDirectory();
		}
		catch (e) {
			console.log('The folder ' + folder + ' does not exist!');
		}
		return exists;
	}
	
	if (this.fileExists(credentials)) {
		try {
			this.credentials = require('./' + credentials).generate();
		}
		catch (e) {
			console.log('Your credentials file is not well formed.');
			//Throw an error;
		}
	}
	
	if (this.folderExists(folder)) {
		this.folder = folder;	
	} else {
		//Throw and error;
	}
	
	//flag these on or off for a more verbose running log
	if (verbose) {
		this.verbose = true;
		this.debug = true;
	} else if (debug) {
		this.verbose = false;
		this.debug = true;
	} else {
		this.verbose = false;
		this.debug = false;
	}
	
	this.time = new Date();
	this.last_run = ['', this.time.getTime()];
	
	this.callServiceNow = function (options, call, file) {
		var req = https.request(options, function(res) {
		
			var this_ = this;
			// var chunks = [];
			var chunks = '';
			
			if (debug) {console.log('STATUS: ' + res.statusCode + '\n')};
			if (verbose) {console.log('HEADERS: ' + JSON.stringify(res.headers) + '\n')};
			res.setEncoding('utf8');
			
			res.on('data', function(chunk) {
				// chunks.push(chunk);
				chunks += chunk;
				//console.log('CHUNK: '+ chunk + '\n');
			});
			
			res.on('end', function() {
				//chunks.join('');
				this_.emit('payload', chunks);
			});
		});
		
		req.on('payload', function(payload) {
			//console.log('PAYLOAD: ' + payload + '\n');
			var temp = JSON.parse(payload);
			var record = temp.records[0];
		});
		
		req.on('error', function(e) {
			console.log('problem with request: ' + e.message);
		});
		if (call == 'insert' || call == 'update') {
			var update = JSON.stringify(file.record);
			req.write(update);
		}
		req.end();
	}
	
	this.updateRecord = function (file) {

		if (debug) {console.log('updating record: ' + file.table + ' | ' + file.record.name);}
		
		var instance = file.instance;
		var table = file.table;
		var sys_id = file.record.sys_id;
		var update = JSON.stringify(file.record);
		var user_name = credentials[instance].user_name;
		var password = credentials[instance].password;

		var options = {
			"host": instance,
			"path": "/" + table + ".do?JSON&sysparm_action=update&sysparm_query=sys_id=" + sys_id,
			"port": 443,
			"method": "POST",
			"auth": user_name + ":" + password,
			"Content-type": "application/json",
			"Connection-type": "Keep-alive"
		}
		
		callServiceNow(options, 'update', file);
	}

	this.insertRecord = function (file) {
		
		if (debug) {console.log('inserting record: ' + file.table + ' | ' + file.record.name);}
		
		var instance = file.instance;
		var table = file.table;
		var update = JSON.stringify(file.record);
		var user_name = credentials[instance].user_name;
		var password = credentials[instance].password;

		var options = {
			"host": instance,
			"path": "/" + table + ".do?JSON&sysparm_action=insert",
			"port": 443,
			"method": "POST",
			"auth": user_name + ":" + password,
			"Content-type": "application/json",
			"Connection-type": "Keep-alive"
		}
		
		callServiceNow(options, 'insert', file);
	}
	
	this.parseFile = function (_this, err, data) {
		console.log('asdf ' + err + ' : ' + data);
		//var _this = this;
		
		for(a in this) {
			console.log('this ' + a);
		}
		for(b in _this) {
			console.log('_this ' + b);
		}
		
		var contents = data.toString();
		var propertiesPattern = /\/\*\{[\s\S]*\}\*\//m;
		
		if (propertiesPattern.test(contents)) {
			var properties = propertiesPattern.exec(contents)[0].slice(2,-2);
			var rest = contents.replace(/\/\*\{[\s\S]*\}\*\//m, '');
			
			if (_this.verbose) {console.log('SCRIPT: ' + rest + '\n');}
			
			//need to write some error handling
			try{
				var file = JSON.parse(properties);
			}
			catch(e) {
				console.log('Parsing the file properties header failed! \nReason: ' + e + '\n');
				return;
			}
			
			var content_field = file.content_field;
			
			file.record[content_field] = rest;
			
			if (file.record.sys_id != '') {
				_this.updateRecord(file);
			} else {
				_this.insertRecord(file);
			}
		} else {
			console.log('The file does not appear to have a well formed properties header.');
		}
	}
	
	this.beginWatching = function () {
		var folder = this.folder;
		var _this = this;
		
		for (a in this) {
			console.log('asdf ' + a);
		}
		
		console.log('\nSNCPOW! is now watching folder: "' + folder + '"\n');
		this.fs.watch(folder, function (event, filename) {
		
			for (b in this) {
				console.log('qwer ' + b);
			}
			filename = folder + '\\' + filename;
			if (filename) {
				if (event === 'change') {
					var now = _this.time.getTime();
					console.log('VERBOSE ' + _this.verbose);
					if (_this.verbose) {console.log('Last run: ' + _this.last_run[0] + ' : ' + _this.last_run[1] + ' | ' + now + '\n');}
					if (_this.last_run[0] == filename && _this.last_run[1] + 1000 > now) {                
						if (_this.debug) {console.log('Ignoring duplicate change event for: "' + filename + '"\n');}
					} else {
						if (_this.debug) {console.log(filename + ' was changed\n');}
						_this.last_run[0] = filename;
						_this.last_run[1] = now;
						_this.fs.readFile(filename, _this.parseFile(_this));
					}
				} else if (event === 'rename') {
					
				}
			} else {
				console.log('filename not provided');
			}
		});
	}
}
exports.start = start;