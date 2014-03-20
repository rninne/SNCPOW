//SNCPOWCFG_instance:localhost:8080
//SNCPOWCFG_table:incident
//SNCPOWCFG_sys_id:d71f7935c0a8016700802b64c67c11c6
//SNCPOW_description:This is a multiline
description
//SNCPOW_script:
if (!gs.hasRole("itil") && gs.isInteractive()) {
  var u = gs.getUserID();
  var qc = current.addQuery("caller_id", u).addOrCondition("opened_by", u).addOrCondition("watch_list", "CONTAINS", u);
  gs.print("query restricted to user: " + u);
}
//SNCPOW_active:true
//SNCPOW_action_query:true