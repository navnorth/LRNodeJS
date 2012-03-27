var couchdb = require('couchdb-api');

var server = couchdb.srv('localhost', 5984, false, true); // falses are for useSSH and useCache
var db     = server.db('ccss_math');

exports.nodes = function( request, response ) {
    // parent is the parent ID of the nodes to load -- null signifies root nodes
    var parent = request.query["parent"] || null;
    var query  = { include_docs: true };
    var map;

    if(parent) {
	// have to send string since closure does not survive transmission
	map = "function(doc) { if( doc.parent === '" + parent + "' ) { emit( doc.id, doc ) } }";
    }
    else {
	map = function(doc) { if( doc.parent === null) { emit( doc.id, doc ) } };
    } 

    db.tempView(map, null, query, function (err, docs) {
	if (err) { console.log("Error querying couchDB."); throw err; }

    	var viewOptions = {
	    locals: {
		nodes: docs.rows.map( function(n) { return n.value } )
	    }
	};

    	response.render('nodes.html', viewOptions);
    });
};

exports.index = function( request, response ) {
    response.render('index.html');
};