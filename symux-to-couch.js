#!/usr/bin/env node

//-------------------start of config

var symux_port = 2100; 
var symux_host = '192.168.0.10';

var couch_host = '192.168.0.10';
var couch_port = '5984';
var couch_db = 'mymetrics'

var hosts = [];  
hosts['192.168.0.1']  = "dc1-fw";
hosts['192.168.0.10'] = "dc1-metrics";
hosts['192.168.0.11'] = "dc1-server";

//-------------------end of config

var nano = require('nano');
nano = nano('http://' + couch_host + ':' + couch_port);


var net = require('net');
var carrier = require('carrier');

var client = new net.Socket();

client.connect(symux_port, symux_host, function() { 
    carrier.carry(client, function(line) {
        handle_line(line);
    });
    console.log('Connected to symux host: ' + symux_host + ' port ' + symux_port); 
});


function handle_line(line) {
    console.log('got one line: ' + line);
    var res = line.split(';');
    var host_name = hosts[res[0]];

    var docs = [];
    for (i = 1; i < (res.length-1); i++) { 
       docs.push( handle_metric( host_name, res[i].split(':') ) );
    }
    post_docs(docs);
}

function handle_metric(host_name, data){
    var metric = { };
//    console.log(data[0]);
//    metric['type'] = data[0];

    switch(data[0]) {
       case "cpu":
           metric['name']      = host_name + '.' + data[0];
           metric['type']      = data[0];
           metric['ts']        = Number(data[2]);
           metric['user']      = Number(data[3]);
           metric['nice']      = Number(data[4]);
           metric['system']    = Number(data[5]);
           metric['interrupt'] = Number(data[6]);
           metric['idle']      = Number(data[7]);
           break;

       case "df":
//    console.log(data[0]);
           break;

       case "load":
           metric['name']    = host_name + '.' + data[0];
           metric['type']    = data[0];
           metric['ts']      = Number(data[2]);
           metric['load1']   = Number(data[3]);
           metric['load5']   = Number(data[4]);
           metric['load15']  = Number(data[5]);
           break;

       case "if":
           metric['name']       = host_name + '.' + data[0] + '.' + data[1];
           metric['type']       = data[0];
           metric['ts']         = Number(data[2]);
           metric['ipackets']   = Number(data[3]);
           metric['opackets']   = Number(data[4]);
           metric['ibytes']     = Number(data[5]);
           metric['obytes']     = Number(data[6]);
           metric['imcasts']    = Number(data[7]);
           metric['omcasts']    = Number(data[8]);
           metric['ierrors']    = Number(data[9]);
           metric['oerrors']    = Number(data[10]);
           metric['collisions'] = Number(data[11]);
           metric['drops']      = Number(data[12]);
           break;

       case "io":
           metric['name']    = host_name + '.' + data[0] + '.' + data[1];
           metric['type']    = data[0];
           metric['ts']      = Number(data[2]);
           metric['rxfer']   = Number(data[3]);
           metric['wxfer']   = Number(data[4]);
           metric['seeks']   = Number(data[5]);
           metric['rbytes']  = Number(data[6]);
           metric['wbytes']  = Number(data[7]);
           break;

       case "mbuf":
           break;

       case "mem":
           metric['name']        = host_name + '.' + data[0];
           metric['type']        = data[0];
           metric['ts']          = Number(data[2]);
           metric['real_active'] = Number(data[3]);
           metric['real_total']  = Number(data[4]);
           metric['free']        = Number(data[5]);
           metric['swap_used']   = Number(data[6]);
           metric['swap_total']  = Number(data[7]);
           break;

       case "pf":
           break;
       case "pfq":
           break;

    }
//    console.log(metric);
    return metric;
}

//Look at changing the below to the way its done in statsd couch backend
//https://github.com/sysadminmike/couch-statsd-backend/blob/master/backends/couch.js#L118
//ie bulk up docs from multiple symux packets into one bulk send rather than a send per symux packet
//also look at setting doc _id in script like stats backend does rather than leaving it to couch

function post_docs(docs){
          //console.log('docs: ' + JSON.stringify(docs));
	  var db = nano.use(couch_db);
	  var bulk = {};
          bulk.docs = docs;
          db.bulk(bulk, '', function(err, ret){
	     if((err) || !ret){
	          console.log('err: ' + JSON.stringify(err));  //need to check though error and see if id collision or something else
	     }else{
		  console.log('added docs: ' +  ret.length + ' docs'); 
		  //console.log('docs: ' + JSON.stringify(ret));
	     }
	  });
};
