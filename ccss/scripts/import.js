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
//                    ./scripts/import.js --db=standards --standard=='Mathematics' --category='Common Core Standards' --input=D10003FB_manifest.json
//
// Notes:
//                    Command line expansion of ~ to home directory is not supported
//                    No duplicate checking is performed

// load libraries, define vars
var fs      = require('fs');
var argv    = require('optimist').argv;
var couchdb = require('couchdb-api');
var prompt  = require('prompt');

var couchHost  = argv.host || 'localhost';
var couchPort  = argv.port || 5984;
var standard   = argv.standard || null;
var category   = argv.category || null;
var options    = {};

// TODO don't import cat + standard combo if already rpesent (or overwrite)

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

// recursive function to import nodes 
var importNodes = function importNodes(nodes, parent) {
    if (!nodes) return;

    nodes.forEach(function (node) {
	var doc, children;

	// first set up parent
	node.parent = parent;
	
	// don't store the children directly
	children = node.children;
	delete node.children;

	// only need to know whether or not they exist
	node.hasChildren = children && children.length > 0 ? true : false;

	doc = standardsDb.doc(node);

        doc.save( function(err, result) {
	    console.log(result);
	    if(err) { console.log('Error saving doc ' + node.id); throw new Error(err); }
	    importNodes(children, result.id);
	});
    });
};

// function to read the file and import the nodes
var readAndImportJson = function (err, standardId) {
    if(err) throw new Error(err);

    fs.readFile( argv.input, function (err, s) {
	if(err) { console.log('Error reading JSON file'); throw new Error(err); }
	importNodes(JSON.parse(s), standardId);
    });
};

// function to check if a database exists
var dbExists = function (checkName, callback) {
    server.allDbs(function( err, dbs ) {
	if (err) callback(err);

	var exists = dbs.some(function(dbName) {
	    return dbName === checkName;
	});
	callback(null, exists);
    });
};

// function to add category
var addCategoryAndStandard = function (callback) {
    // TODO don't create cat if present
    var categoryDoc = standardsDb.doc({
	category: true,
	id: category,
	hasChildren: true
    });

    categoryDoc.save( function(err, result) {
	if(err) { console.log('Error saving category'); return callback(err); }


	console.log(result);

	var standardDoc = standardsDb.doc({
	    standard: true,
	    id: standard,
	    categoryName: category,
	    hasChildren: true,
	    parent: result.id
	});

	standardDoc.save( function(err, result) {
	    if(err) { console.log('Error saving standard'); return callback(err); }
	    callback(null, result.id);
	});
    });
}

// function to read data into the db
var startImport = function (standard, category) {
    dbExists(argv.db, function (err, exists) {
	if (exists) {
	    addCategoryAndStandard(readAndImportJson);
	}
	else {
	    standardsDb.create( function( err, result ) {
		if(err) { console.log('Error creating standards DB'); throw new Error(err); }
		addCategoryAndStandard(readAndImportJson);
	    });
	}
    });
};

// begin!
startImport();
