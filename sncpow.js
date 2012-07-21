var https = require('https');
var fs = require('fs');
var path = require('path');
var verbose = false;
var debug = true;
var folder = '';

if(folder == ''){
	//if folder is nto set, was is passed as a command arg?
	if(process.argv[2]){
		folder = process.argv[2];
		//check that the folder exists
		folderExists(folder);
	} else {
		//not set or passed on the command line, prompt the user for the folder.
		chooseFolder();
	}
}

function chooseFolder(){
		process.stdout.write('Please enter a folder name to watch: ');
		process.stdin.resume();
		process.stdin.setEncoding('utf8');

		process.stdin.on('data', function (chunk) {
			if(folderExists(chunk.replace('\r\n',''))){
				this.emit('end');
			} else {
				//ask for another folder
				process.stdout.write('That folder does not exist!\n');
				process.stdout.write('Please enter a folder name to watch: ');
			}
		});

		process.stdin.on('end', function () {
		});
}

function folderExists(folder){
	var exists = false;
	try{
		exists = fs.lstatSync(folder).isDirectory();
		
		if(exists){
			beginWatching(folder);
		}
	}
	catch(e){
		//folder does not exist
	}
	return exists;
}

function callServiceNow(options, call, file){
    
    var req = https.request(options, function(res) {
    
        var this_ = this;
        // var chunks = [];
        var chunks = '';
        
        if(debug){console.log('STATUS: ' + res.statusCode + '\n')};
        if(verbose){console.log('HEADERS: ' + JSON.stringify(res.headers) + '\n')};
        res.setEncoding('utf8');
        
        res.on('data', function(chunk) {
            // chunks.push(chunk);
            chunks += chunk;
            //console.log('CHUNK: '+ chunk + '\n');
        });
        
        res.on('end', function(){
            //chunks.join('');
            this_.emit('payload', chunks);
        });
    });
    
    req.on('payload', function(payload){
        //console.log('PAYLOAD: ' + payload + '\n');
        var temp = JSON.parse(payload);
        var record = temp.records[0];
    });
    
    req.on('error', function(e) {
        console.log('problem with request: ' + e.message);
    });
    if(call == 'insert' || call == 'update'){
        var update = JSON.stringify(file.record);
        req.write(update);
    }
    req.end();
}

function updateRecord(file){

    if(debug){console.log('updating record: ' + file.table + ' | ' + file.record.name);}
    
    var instance = file.instance;
    var table = file.table;
    var sys_id = file.record.sys_id;
    var update = JSON.stringify(file.record);

    var options = {
        "host": instance,
        "path": "/" + table + ".do?JSON&sysparm_action=update&sysparm_query=sys_id=" + sys_id,
        "port": 443,
        "method": "POST",
        "auth": "admin:admin",
        "Content-type": "application/json",
        "Connection-type": "Keep-alive"
    }
    
    callServiceNow(options, 'update', file);
}

function insertRecord(file){
    
    if(debug){console.log('inserting record: ' + file.table + ' | ' + file.record.name);}
    
    var instance = file.instance;
    var table = file.table;
    var update = JSON.stringify(file.record);

    var options = {
        "host": instance,
        "path": "/" + table + ".do?JSON&sysparm_action=insert",
        "port": 443,
        "method": "POST",
        "auth": "admin:admin",
        "Content-type": "application/json",
        "Connection-type": "Keep-alive"
    }
    
    callServiceNow(options, 'insert', file);
}

function parseFile(err, data){
	
    var contents = data.toString();
    var propertiesPattern = /\/\*\{[\s\S]*\}\*\//m;
    
    if(propertiesPattern.test(contents)){
        var properties = propertiesPattern.exec(contents)[0].slice(2,-2);
        var rest = contents.replace(/\/\*\{[\s\S]*\}\*\//m, '');
        
        if(verbose){console.log('SCRIPT: ' + rest + '\n');}
        
        var file = JSON.parse(properties);
        
        var content_field = file.content_field;
        
        file.record[content_field] = rest;
        
        if(file.sys_id != ''){
            updateRecord(file);
        } else {
            insertRecord(file);
        }
    } else {
        console.log();
    }
}

function beginWatching(folder){
	console.log('\nSNCPOW! is now watching folder: "' + folder + '"\n');
	fs.watch(folder, function (event, filename) {
		if(debug){console.log(folder + '\\' + filename + ' was ' + event + 'd');}
		if (filename) {
			if(event === 'change') {
				fs.readFile(folder + '\\' + filename, parseFile);
			}else if(event === 'rename'){
						
			}
		} else {
			console.log('filename not provided');
		}
	});
}