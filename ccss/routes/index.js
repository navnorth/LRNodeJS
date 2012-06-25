var couchdb = require('couchdb-api');

// couchdb db
var server       = couchdb.srv('localhost', 5984, false, true);
var standardsDb  = server.db('standards');
var categoriesDb = server.db('categories');
var resourcesDb  = server.db('resource_data');

// views
var nodesView     = standardsDb.ddoc('nodes').view('standard-grade-parent');
var standardsView = standardsDb.ddoc('nodes').view('standards');

var categoriesView = categoriesDb.ddoc('categories').view('categories');

var resourcesView = resourcesDb.ddoc('standards-alignment-related')
                   .view('resource-by-discriminator');

// route to display nodes hierarchically
//   body.standard is the set the nodes belong to
//   body.parent is the parent ID of the nodes to load
//     null signifies to load the root nodes
//   cookies.grade-filter determines grade of nodes to load
//     defaults to K/Kindergarten
exports.nodes = function( request, response, next ) {
    var standard = request.body.standard           || null;
    var parent   = request.body.parent             || null;
    var grade    = request.cookies['grade-filter'] || 'K';

    if (standard === null) return next(new Error('No standard declared'));

    standard = unescape(standard);
    if( parent ) parent = unescape(parent);

    var query = {
	include_docs: true,
	startkey: [ standard, grade, parent ],
	endkey:   [ standard, grade, parent ]
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
		categories: result.rows.map( function(n) {
		    return { name: n.key, standards: n.value };
		})
	    }
	};

	response.render('browser.html', viewOptions);
    });    
};
