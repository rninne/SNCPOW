//SNCPOWCFG_instance:localhost:8080
//SNCPOWCFG_table:sys_script
//SNCPOWCFG_sys_id:2bc2f9b1c0a801640199f9eb0067326e
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