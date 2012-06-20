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
//                    --category        Category to add to the imported items
//                    --standard        Name of standard set being imported
//
//
// Example Usage:
//                    ./scripts/import.js --db=standards --standard=="Mathematics" --category="Common Core Standards" --input=D10003FB_manifest.json
//
// Notes:
//                    Command line expansion of ~ to home directory is not supported
//                    No duplicate checking is performed

// load libraries, define vars
var fs      = require('fs');
var argv    = require('optimist').argv;
var couchdb = require('couchdb-api');
var prompt  = require('prompt');

var couchHost = argv.host || 'localhost';
var couchPort = argv.port || 5984;
var standard  = argv.standard || null;
var category  = argv.category || null;
var options   = {};

if (standard === null) {
    console.log('Standard name was not specified');
    return 1;
}

if (category === null) {
    console.log('Category was not specified');
    return 1;
}

// set up login options, if supplied on command line
if( argv.user ) {
    options.user = argv.user;
}

if (argv.password ) {
    options.password = argv.password;
}

// connect to the database
var server       = couchdb.srv(couchHost, couchPort);
var standardsDb  = server.db(argv.db);
var categoriesDb = server.db('categories');

// recursive function to import nodes 
var importNodes = function importNodes(nodes, parent) {
    if (!nodes) return;

    nodes.forEach(function (node) {
	var doc, children;

	// first set up parent
	if( parent ) {
	    node.parent = parent.id;
	}
	else {
	    node.parent = null;
	}

	// don't store the children directly
	children = node.children;
	delete node.children;

	// only need to know whether or not they exist
	node.hasChildren = children && children.length > 0 ? true : false;

	// add the standard name
	node.standard = standard;

	doc = standardsDb.doc(node);

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
};

// function to check if a database exists
var dbExists = function (checkName, next) {
    server.allDbs(function( err, dbs ) {
	if (err) next(err);

	var exists = dbs.some(function(dbName) {
	    return dbName === checkName;
	});
	next(null, exists);
    });
};

// function to add category
var addCategory = function () {
    var doc = categoriesDb.doc({
	category: category,
	standard: standard
    });

    doc.save( function(err, result) {
	if(err) { console.log("Error saving category"); throw err; }
    });
}

// function to read data into the db
var startImport = function (standard, category) {
    dbExists('categories', function (err, exists) {

	if(exists) {
	    addCategory();
	}
	else {
	    categoriesDb.create( function( err, result ) {
		if(err) { console.log('Error creating categories DB'); throw err; }
		addCategory();
	    });
	}
    });

    dbExists(argv.db, function (err, exists) {
	if (exists) {
	    readAndImportJson();
	}
	else {
	    standardsDb.create( function( err, result ) {
		if(err) { console.log('Error creating standards DB'); throw err; }
		readAndImportJson();
	    });
	}
    });
};

// begin!
startImport();


