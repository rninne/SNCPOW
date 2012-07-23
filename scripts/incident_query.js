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
//asdf

var u = gs.getUserID();

var qc = current.addQuery("caller_id", u).addOrCondition("opened_by", u).addOrCondition("watch_list", "CONTAINS", u);