var couchdb = require('couchdb-api');
var config  = require('config');

// couchdb db
var server       = couchdb.srv('localhost', 5984, false, true);
var standardsDb  = server.db('standards');

// views
var nodesView      = standardsDb.ddoc('nodes').view('parent-grade');
var categoriesView = standardsDb.ddoc('nodes').view('categories');

// route to display nodes hierarchically
//   body.standard is the set the nodes belong to
//   body.parent is the parent ID of the nodes to load
//   cookies.grade-filter determines grade of nodes to load
//     defaults to K/Kindergarten
exports.nodes = function( request, response, next ) {
    var parent   = request.body.parent             || null;
    var grade    = request.cookies['grade-filter'] || 'K';

    if (parent === null) return next(new Error('No parent given'));

    parent = unescape(parent);
    console.log('parent: ' + parent);
    
    var query = {
	include_docs: true,
	startkey: [ parent, grade ],
	endkey:   [ parent, grade ]
    };

    nodesView.query(query, function(err, result) {
	if (err) return next(err);

	var docs = result.rows.map( function(n) { return n.value; } );

	var viewOptions = {};
	viewOptions.layout = false;
	viewOptions.locals = {};
	viewOptions.locals.nodes = docs;

	response.render('nodes.html', viewOptions);
    });
};

// route for displaying categorized standards
//   pass params.category to filter by category
exports.standards = function( request, response, next ) {
    var category = request.params.category || null; // optional

    var query = { group: true };

    if (category !== null) {
	query.startkey = category;
	query.endkey = category;
    }

    categoriesView.query(query, function(err, result) {
	if (err) return next(err);

	var viewOptions = {
	    layout: false,
	    locals: {
		categories: result.rows.map( function(n) {
		    console.log(n);
		    return { name: n.key, standards: n.value };
		})
	    }
	};

	response.render('standards.html', viewOptions);
    });
};

// main route for browser UI
exports.browser = function( request, response, next ) {
    var query = { group: true };

    categoriesView.query(query, function(err, result) {
	if (err) return next(err);

	var viewOptions = {
	    locals: {
		resourceServiceUrl: config.resourceService.url,
		categories: result.rows.map( function(n) {
		    return { name: n.key, standards: n.value };
		})
	    }
	};

	response.render('browser.html', viewOptions);
    });    
};
