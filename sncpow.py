import sublime
import sublime_plugin
import urllib
import urllib2
import threading
import re
import json

class PowOnSaveCommand(sublime_plugin.EventListener):
    def on_post_save(self, view):
        
        if view.find('//SNCPOWCFG', 0) is None:
            return

        config = self.getConfigs(view)

        if 'instance' not in config:
            return
        elif 'table' not in config:
            return
        elif 'sys_id' not in config:
            return

        fields = self.getFields(view)

        if len(fields) is 0:
            return

        passwordManager = urllib2.HTTPPasswordMgrWithDefaultRealm()
        passwordManager.add_password(None, 'http://localhost:8080', 'admin', 'admin')
        basicAuthHandler = urllib2.HTTPBasicAuthHandler(passwordManager)
        opener = urllib2.build_opener(basicAuthHandler)
        urllib2.install_opener(opener)

        configs = self.getConfigs(view);
        fields = self.getFields(view);

        try:
            data = json.dumps(fields)
            print data
            url = 'http://' + configs['instance'] + '/' + configs['table'] +'.do?JSON&sysparm_action=update&sysparm_query=sys_id=' + configs['sys_id']
            print url
            request = urllib2.Request(url, data, {'Content-Type': 'application/json'})
            http_file = urllib2.urlopen(request, timeout=5)
            http_file.read()
            return

        except (urllib2.HTTPError) as (e):
            err = '%s: HTTP error %s contacting API' % (__name__, str(e.code))
        except (urllib2.URLError) as (e):
            err = '%s: URL error %s contacting API' % (__name__, str(e.reason))

    def getConfigs(self, view):
        r = sublime.Region(0, view.size())
        matches = re.findall('//SNCPOWCFG_([a-zA-Z_]*):(?:\n)?([\s\S]+?(?=\n//SNCPOW(?:CFG)?_|\Z))', view.substr(r), re.MULTILINE)
        configs = {}
        for c in matches:
            name = c[0]
            value = c[1]
            configs[name] = value

        return configs
    def getFields(self, view):
        r = sublime.Region(0, view.size())
        matches = re.findall('//SNCPOW_([a-zA-Z_]*):(?:\n)?([\s\S]+?(?=\n//SNCPOW(?:CFG)?_|\Z))', view.substr(r), re.MULTILINE)
        fields = {}
        for f in matches:
            name = f[0]
            value = f[1]
            fields[name] = value

        return fields
    def update(self):
        return
    def retrieve(self):
        return
class SncpowCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        passwordManager = urllib2.HTTPPasswordMgrWithDefaultRealm()
        passwordManager.add_password(None, 'http://localhost:8080', 'admin', 'admin')
        basicAuthHandler = urllib2.HTTPBasicAuthHandler(passwordManager)
        opener = urllib2.build_opener(basicAuthHandler)
        urllib2.install_opener(opener)

        configs = self.getConfigs();
        fields = self.getFields();

        try:
            data = json.dumps(fields)
            print data
            url = 'http://' + configs['instance'] + '/' + configs['table'] +'.do?JSON&sysparm_action=update&sysparm_query=sys_id=' + configs['sys_id']
            print url
            request = urllib2.Request(url, data, {'Content-Type': 'application/json'})
            http_file = urllib2.urlopen(request, timeout=5)
            http_file.read()
            return

        except (urllib2.HTTPError) as (e):
            err = '%s: HTTP error %s contacting API' % (__name__, str(e.code))
        except (urllib2.URLError) as (e):
            err = '%s: URL error %s contacting API' % (__name__, str(e.reason))

    def getConfigs(self):
        r = sublime.Region(0, self.view.size())
        matches = re.findall('//SNCPOWCFG_([a-zA-Z_]*):(?:\n)?([\s\S]+?(?=\n//SNCPOW(?:CFG)?_|\Z))', self.view.substr(r), re.MULTILINE)
        configs = {}
        for c in matches:
            name = c[0]
            value = c[1]
            configs[name] = value

        return configs
    def getFields(self):
        r = sublime.Region(0, self.view.size())
        matches = re.findall('//SNCPOW_([a-zA-Z_]*):(?:\n)?([\s\S]+?(?=\n//SNCPOW(?:CFG)?_|\Z))', self.view.substr(r), re.MULTILINE)
        fields = {}
        for f in matches:
            name = f[0]
            value = f[1]
            fields[name] = value

        return fields
    def update(self):
        return
    def retrieve(self):
        return