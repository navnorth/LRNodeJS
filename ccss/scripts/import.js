#!/usr/bin/env node

// Script to take entries stored in a hierarchical structure
// and convert them to a collection of documents.  
//
// Assumptions: each node in the hierarchy is expected to have
//   and 'id' field, and to not have a 'parent' field.
//
// Command line args: --port/--host     set the port/host for the couchDB connection
//                    --user/--password optional args to set user/pw
//                    --db              database name to connect to. The DB will be created if it doesn't exist
//                    --input           JSON file to read in
// Example Usage:
//                    ./scripts/import.js --db=ccss --input=D10003FB_manifest.json 
//
// Notes:
//                    Command line expansion of ~ to home directory is not supported
//                    No duplicate checking is performed

// load libraries, define vars
var fs      = require('fs');
var argv    = require('optimist').argv;
var couchdb = require('couchdb-api');

var couchHost = argv.host || 'localhost';
var couchPort = argv.port || 5984;
var options   = {};

var client;
var db;

// recursive function to import nodes 
var importNodes = function importNodes(nodes, parent) {
    if (!nodes) return;

    nodes.forEach(function (node) {
	var doc, children;

	if( parent ) {
	    node.parent = parent.id;
	}
	else {
	    node.parent = null;
	}

	children = node.children;
	delete node.children;

	node.hasChildren = children && children.length > 0 ? true : false;

	doc = db.doc(node);

        doc.save( function(err, result) {
	    if(err) { console.log("Error saving doc " + node.id); throw err; }
	    importNodes(children, node);
	});
    });
};

// function to read the file and import the nodes
var readAndImportJson = function () {
    fs.readFile( argv.input, function (err, s) {
	if(err) { console.log("Error reading JSON file"); throw err; }
	importNodes(JSON.parse(s));
    });
}

// set up login options, if supplied on command line
if( argv.user ) {
    options.user = argv.user;
}

if (argv.password ) {
    options.password = argv.password;
}

// connect to the database
server = couchdb.srv(couchHost, couchPort);
db     = server.db(argv.db);

server.allDbs(function( err, dbs ) {
    var dbExists = dbs.some(function(dbName) {
	return dbName === argv.db;
    });

    if(dbExists) {
	readAndImportJson();
    }
    else {
	db.create( function( err, result ) {
	    if(err) { console.log('Error creating DB'); throw err; }
	    readAndImportJson();
	});
    }
});
