var couchdb = require('couchdb-api');
var config  = require('config');

// couchdb db
var server       = couchdb.srv('localhost', 5984, false, true);
var standardsDb  = server.db('standards');

// views
var nodesView      = standardsDb.ddoc('nodes').view('parent-grade');
var categoriesView = standardsDb.ddoc('nodes').view('categories');
var standardsView  = standardsDb.ddoc('nodes').view('standards');

// route to display nodes hierarchically
//   set body.category + body.standard for standard's child nodes
//   OR body.parent for child nodes of parent 
//   cookies.grade-filter determines grade of nodes to load
//     defaults to K/Kindergarten
exports.nodes = function( request, response, next ) {
    var category = request.body.category           || null;
    var standard = request.body.standard           || null;
    var parent   = request.body.parent             || null;
    var grade    = request.cookies['grade-filter'] || 'K';

    if ((!category && !standard && !parent)
	|| (category && !standard)
	|| (!category && standard)) {
	return next(new Error('Must provide cateogry + standard or parent'));
    }

    if (category) category = unescape(category);
    if (standard) standard = unescape(standard);
    if (parent)   parent   = unescape(parent);
    
    var nodesParams = {
	include_docs: true
    };

    var nodesFinished = function(err, result) {
	console.log(result);
	if (err) return next(err);

	var docs = result.rows.map( function(n) { return n.value; } );

	var viewOptions = {};
	viewOptions.layout = false;
	viewOptions.locals = {};
	viewOptions.locals.nodes = docs;

	response.render('nodes.html', viewOptions);
    };

    var standardsParams;

    if (standard) {
	standardsParams = {
	    include_docs: true,
	    startkey: [ category, standard ],
	    endkey: [ category, standard ]
	};

	standardsView.query(standardsParams, function (err, result) {
	    console.log(standardsParams);
	    console.log(result);
	    nodesParams.startkey = nodesParams.endkey = [ result.rows[0].value, grade ];
	    nodesView.query(nodesParams, nodesFinished);
	});
    }
    else {
	console.log('parent: ' + parent);
	console.log('grade: ' + grade);
	nodesParams.startkey = nodesParams.endkey = [ parent, grade ];
	nodesView.query(nodesParams, nodesFinished);
    }
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
		resourceServiceUrl: config.resourceService.url,
		categories: result.rows.map( function(n) {
		    return { name: n.key, standards: n.value };
		})
	    }
	};

	response.render('browser.html', viewOptions);
    });    
};
