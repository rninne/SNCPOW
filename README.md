#SNCPOW!

SNCPOW! is a light-weight NodeJS (http://nodejs.org/) server designed to make the Service-Now admin's life much easier.

SNCPOW! cuts the copy-paste-update out of managing your business rules, script includes, ui macros etc.

SNCPOW! allows you to use your own text editor, and seamlessly update Service-Now scripts at the same time.

Bottom line, you save a local copy of a script, SNCPOW! pushes it to your instance.

###How does it work?:
SNCPOW! uses NodeJS' fs.watch() utility to watch a folder of scripts for changes.

If a sctipt is modified, SNCPOW! parses a JSON properties header in the script and sends the contents up to your Service-Now instance through the JSON webservices interface.

###Let's get started:
#####SNCPOW! requires the JSON webservices plugin to be turned on in your Service-Now instance.

* Install NodeJS http://nodejs.org/#download
* Create a working directory on your local drive, or a network drive.
* Download the sncpow.js and credentails.js file into this directory.
* Create a sup-directory (for example "scripts") for SNCPOW! to watch and populate it with your Service-Now scripts as follows:
    * Copy the script field from a business rule Service-Now and save it as a .js file in your scripts folder.
    * Setup a properties header that tells SNCPOW! which instance this script comes from and what type of script it is.

Setup of this header is simple and uses the JSON syntax we all know! See the example below.

Example script:
```javascript
/*START SNCPOW!{
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
}END SNCPOW!*/
var user = gs.getUserID();

var incident_query = current.addQuery("caller_id", user);
incident_query.addOrCondition("opened_by", user);
incident_query.addOrCondition("watch_list", "CONTAINS", user);
```

A quick overview of the properties header:
* instance: the URL of the Service-Now instance to upload the script to.
* table: the table to upload the script to.
* content_field: the field on the specified table where the body of the script should be put.
* record: an object which contains other optional fields to update: in this example the description, name, condition, when choice list, and action options will be updated.
	* sys_id: if set SNCPOW! will update existing record, if not SNCPOW! will insert a new record.

###Future hopes
SNCPOW! is pretty simplistic at the moment, I would like to see it add a few features:
* Need to get my hands on a Mac to test compatibility
* ~~Credentials configuration file for use with multiple instances~~ _*Done! :D*_ rninne, 23/07/2012
* More error handling and logging
    * around the credentials (would like to not have to store these in the clear)
    * HTTP status codes returned from the Service-Now instance (eg handling 403 access denied)
    * Wrong sys_id?
* Capture of the script updates in Service-Now update sets. Currently these changes are not recorded unless logged in under the same user as the one which SNCPOW! uses.
* Objectify the code?
* Node package, available through NPM.
* Proxy (Squid, ironport) support. SNCPOW! currently does not support HTTPS requests through a proxy, make sure you deply SNCPOW! to a platform with a clear view to your instance, through a VPN or otherwise.
* Ability to set up a basic properties header with at least the instance, table and sys_id filled in and SNCPOW! will pull the script from Service-Now and fill in the blanks!
* Ability to monitor an SVN or git repo and work in conjunction with these tools to make versioning with Service-Now more intergrated
    * Spin off git/svn plugin?

