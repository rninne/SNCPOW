import sublime
import sublime_plugin
import urllib
import urllib2
import threading
import re
import json

import xml.etree.ElementTree as ET

REQUEST_MODE = sublime.active_window().active_view().settings().get('sncpow_mode', 'SOAP')
REQUEST_MODE_JSON = 'JSON'
REQUEST_MODE_XML = 'SOAP'



class InitPowCommand(sublime_plugin.TextCommand):
    def run(self, edit):
        #Initialise a folder with basic structure needed for SNCPOW
        #Takes an argument of instance name or uses parent folder name for instance
        return
    def createFolders():
        return
    def createConfig():
        return

def createSOAPEnvelope(config, method):
    envelope = ET.Element('soapenv:Envelope')
    envelope.set('xmlns:soapenv', 'http://schemas.xmlsoap.org/soap/envelope/')
    envelope.set('xmlns:record', 'http://www.service-now.com/' + config['table'])
    ET.SubElement(envelope, 'soapenv:Header')
    soapBody = ET.SubElement(envelope, 'soapenv:Body')
    record = ET.SubElement(soapBody, 'record:' + method)
    sys_id = ET.SubElement(record, 'sys_id')
    sys_id.text = config['sys_id']

    return envelope, record

'''
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:inc="http://www.service-now.com/incident">
   <soapenv:Header/>
   <soapenv:Body>
      <inc:update>
         <sys_id>46e18c0fa9fe19810066a0083f76bd56</sys_id>
         <short_description>this is updated</short_description>
      </inc:update>
   </soapenv:Body>
</soapenv:Envelope>
'''

def insertRecord(config, fields):
    inserted = False

    url = generateURL(config, 'insert')
    data = encodeData(fields)

    inserted = serviceNowRequest(url, data)

    return inserted

def updateRecord(config, fields):
    updated = False

    url = generateURL(config, 'update')
    data = encodeData(config, fields, 'update')
    print url
    print data
    updated = serviceNowRequest(url, data)

    return updated

def retrieveRecord(config):
    retreived = False

    url = generateURL(config, 'get')

    retrieved = serviceNowRequest(url)

    return retreived

def serviceNowRequest(url, data):
    success = False

    try:

        if not data:
            #Retrieve the record and populate the file
            return

        passwordManager = urllib2.HTTPPasswordMgrWithDefaultRealm()
        passwordManager.add_password(None, 'http://localhost:8080', 'admin', 'admin')
        basicAuthHandler = urllib2.HTTPBasicAuthHandler(passwordManager)
        opener = urllib2.build_opener(basicAuthHandler)
        urllib2.install_opener(opener)

        #handleCredentails()
        contentType = 'application/json';

        request = urllib2.Request(url, data, {'Content-Type': 'application/json'})

        http_file = urllib2.urlopen(request, timeout=5)
        http_file.read()
        return success

    except (urllib2.HTTPError) as (e):
        err = '%s: HTTP error %s contacting API' % (__name__, str(e.code))
    except (urllib2.URLError) as (e):
        err = '%s: URL error %s contacting API' % (__name__, str(e.reason))

def handleCredentails():
    passwordManager = urllib2.HTTPPasswordMgrWithDefaultRealm()
    passwordManager.add_password(None, 'http://localhost:8080', 'admin', 'admin')
    basicAuthHandler = urllib2.HTTPBasicAuthHandler(passwordManager)
    opener = urllib2.build_opener(basicAuthHandler)
    urllib2.install_opener(opener)
    return

def generateURL(config, action):
    #generates a url to one of ServiceNow's web service endpoints
    #used by record functions 
    #mode is a global setting of either XML, JSON or JSONv2 to correspond with the desired web service endpoint

    mode = REQUEST_MODE
    return 'http://' + config['instance'] + '/' + config['table'] +'.do?' + mode + '&sysparm_action=' + action + '&sysparm_query=sys_id=' + config['sys_id']

def encodeData(config, fields, method):

    if REQUEST_MODE is REQUEST_MODE_XML:
        data = encodeXML(config, fields, method)
    elif REQUEST_MODE is REQUEST_MODE_JSON:
        data = encodeJSON(fields)

    return data

def encodeJSON(fields):
    #endode the fields to be updated into a JSON string
    return json.dumps(fields)

def encodeXML(config, fields, method):
    #encode the fields to be updated into an XML document

    envelope, record = createSOAPEnvelope(config, method)

    for field in fields:
        value = fields[field]
        el = ET.SubElement(record, field)
        el.text = value

    return ET.tostring(envelope)

    '''
    data = ET.Element('incident')

    for field in fields:
        value = fields[field]
        el = ET.SubElement(data, field)
        el.text = value

    return ET.tostring(data)
    '''

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

        #print encodeXML(fields)
        #print encodeJSON(fields)

        #if isNewFile:
        #   insertRecord()
        #elif isStub:
        #   retrieveRecord()
        #else:
        #   updateRecord()

        print updateRecord(config, fields)

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