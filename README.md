#SNCPOW!

SNCPOW! is a light-weight NodeJS (http://nodejs.org/) server designed to make the Service-Now admin's life much easier.

SNCPOW! will watch a folder of scripts for changes and send the changes to the Service-Now isntance of your choice.

###Here's how it works:

Setup of the script is simple and uses the JSON syntax we all know:
```
/*{
"instance":"demo05.service-now.com",
"table":"sys_script",
"content_field": "script",
"record":{
    "sys_id":"2bc2f9b1c0a801640199f9eb0067326e",
    "condition":"!gs.hasRole('itil') && gs.isInteractive()",
    "name":"incident query",
    "when":"before",
    "action_query":true,
    "action_delete":true,
    "description":"Restrict task visibility for ess users to only those incidents where: the ess user is the caller, the incident was opened by the ess user an the ess user is on the watch list. Updated from JSON"
    }
}*/
```
A quick overview of the properties header:
*instance: the URL of the Service-Now instance to upload the script to
*table: the table to upload the script to
*content_field: the field on the specified table where the body of the script should be put
*record: an object which contains other optional fields to update
	*sys_id: if set SNCPOW! will update existing record, if not SNCPOW! will insert a new record

###Future hopes
SNCPOW! is pretty simplistic at the moment, I would like to see it add a few features.
*Credentials configuration file for use with multiple instances
*More error handling and logging
*Ability to sned off a sys_id and table and SNCPOW! will pull the script from Service-Now and setup a new file
*Ability to monitor a SVN or git repo and work in conjunction with these tools to make versioning with Service-Now more intergrated

