function SNCPOW (folder, credentials, debug, vebose) {
	//folder: name of the folder to watch with this instance of SNCPOW
	//credentails: name of the credentials file
	
	this.https = require('https');
	this.fs = require('fs');
	
	if (fs.lstasSync(credentials).isFile()) {
		try {
			this.credentails = require('credentials').generate();
		}
		catch (e) {
			console.log('Your credentials file is not well formed.');
			//Throw an error;
		}
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
	
	//set the folder variable to the name of the folder you wish to watch.
	this.folder = 'scripts';
	this.time = new Date();
	this.last_run = ['', time.getTime()];
	
	
	
	this.beginWatching = function (folder) {
		console.log('\nSNCPOW! is now watching folder: "' + folder + '"\n');
		fs.watch(folder, function (event, filename) {
			filename = folder + '\\' + filename;
			if (filename) {
				if (event === 'change') {
					var now = new Date().getTime();
					if (verbose) {console.log('Last run: ' + last_run[0] + ' : ' + last_run[1] + ' | ' + now + '\n');}
					if (last_run[0] == filename && last_run[1] + 1000 > now) {                
						if (debug) {console.log('Ignoring duplicate change event for: "' + filename + '"\n');}
					} else {
						if (debug) {console.log(filename + ' was changed\n');}
						last_run[0] = filename;
						last_run[1] = now;
						fs.readFile(filename, parseFile);
					}
				} else if (event === 'rename') {
					
				}
			} else {
				console.log('filename not provided');
			}
		});
	}
}

var https = require('https');
var fs = require('fs');
var path = require('path');
var credentials = require('./credentials');
var credentials = credentials.generate();
var verbose = false;
var debug = true;
var folder = 'scripts';
var time = new Date;
var last_run = ['', time.getTime()];





if (folder == '') {
	//if folder is not set, was is passed as a command arg?
	if (process.argv[2]) {
		folder = process.argv[2];
		//check that the folder exists
		if (folderExists(folder)) {
            
        } else {
            chooseFolder();
        }
	} else {
		//not set or passed on the command line, prompt the user for the folder.
		chooseFolder();
	}
} else {
    // folder defined in script
    if (folderExists(folder)) {
        
    } else {
        chooseFolder();
    }
}

function chooseFolder() {
		process.stdout.write('Please enter a folder name to watch: ');
		process.stdin.resume();
		process.stdin.setEncoding('utf8');

		process.stdin.on('data', function (chunk) {
			if (folderExists(chunk.replace('\r\n',''))) {
				this.emit('end');
			} else {
				//ask for another folder
				// process.stdout.write('That folder does not exist!\n');
				process.stdout.write('Please enter a folder name to watch: ');
			}
		});

		process.stdin.on('end', function () {
		});
}

function folderExists(folder) {
	var exists = false;
	try{
		exists = fs.lstatSync(folder).isDirectory();
		
		if (exists) {
			beginWatching(folder);
		}
	}
	catch(e) {
		//folder does not exist
        console.log('\nFolder "' + folder + '" does not exist.' + '\n' + e + '\n');
	}
	return exists;
}

function callServiceNow(options, call, file) {
    
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

function updateRecord(file) {

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

function insertRecord(file) {
    
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

function parseFile(err, data) {
	
    var contents = data.toString();
    var propertiesPattern = /\/\*\{[\s\S]*\}\*\//m;
    
    if (propertiesPattern.test(contents)) {
        var properties = propertiesPattern.exec(contents)[0].slice(2,-2);
        var rest = contents.replace(/\/\*\{[\s\S]*\}\*\//m, '');
        
        if (verbose) {console.log('SCRIPT: ' + rest + '\n');}
        
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
            updateRecord(file);
        } else {
            insertRecord(file);
        }
    } else {
        console.log();
    }
}

function beginWatching(folder) {
	console.log('\nSNCPOW! is now watching folder: "' + folder + '"\n');
	fs.watch(folder, function (event, filename) {
        filename = folder + '\\' + filename;
		if (filename) {
			if (event === 'change') {
                var now = new Date().getTime();
                if (verbose) {console.log('Last run: ' + last_run[0] + ' : ' + last_run[1] + ' | ' + now + '\n');}
                if (last_run[0] == filename && last_run[1] + 1000 > now) {                
                    if (debug) {console.log('Ignoring duplicate change event for: "' + filename + '"\n');}
                } else {
                    if (debug) {console.log(filename + ' was changed\n');}
                    last_run[0] = filename;
                    last_run[1] = now;
                    fs.readFile(filename, parseFile);
                }
			} else if (event === 'rename') {
				
			}
		} else {
			console.log('filename not provided');
		}
	});
}

exports.SNCPOW = SNCPOW;