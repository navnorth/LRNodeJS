var BROWSER = (function () {

    // private fields

    var resourceServiceUrl = 'http://localhost/extract/standards-alignment-related/resource-by-discriminator'; // default value

    var $screen;

    var state = {
	category: undefined,
	standard: undefined,
	grade: $.cookie('grade-filter') || 'K',
	nodes: []
    };

    // private event handlers

    var categoryClick = function (event) {
	state.category = $(event.target).data('category');
	state.standard = null;
	state.nodes    = null;
	updateHashLocation();
	return false;
    };

    var standardClick = function (event) {
	state.standard = $(event.target).data('standard');
	state.category = $(event.target).data('category')
	    || $(event.target).closest('.category').data('category');
	state.nodes    = null;
	updateHashLocation();	
	return false;
    };

    var gradeChange = function (event) {
	var target = $(event.target);
	state.standard = $target.data('standard');
	state.category = $target.data('category')
	    || $(event.target).closest('.category').data('category');
	state.grade = $target.val();

	$.cookie('grade-filter', grade);

	updateHashLocation();
	return false;
    };

    var childClick = function (event) {
	var $target    = $(event.target);
	var $ancestors = $target.parents('.node');
	var $container = $target.closest('.node');
	var parentId   = $container.data('id');
	var newNodes   = [];
	
	// handle toggle and button
	if( $target.text() === '[ + ]' ) $target.text('[ - ]');
	else $target.text('[ + ]');
	    
	$container.children('.children').toggle();

	// walk up the DOM and find IDs of all nodes in hierarchy
	$ancestors.each( function (i, e) {
	    newNodes.push($(e).data('id'));
	});
	
	state.nodes = newNodes;
	updateHashLocation();

	return false;
    };

    // private methods

    var updateHashLocation = function () {
	var hashParts = [];

	if (state.category) {
	    hashParts.push(state.category);
	    if (state.standard) {
		hashParts.push(state.standard);
		if (state.grade) {
		    hashParts.push(state.grade);
		    if (state.nodes) {
			hashParts = hashParts.concat(state.nodes);
		    }
		}
	    }
	}

	location.hash = hashParts.join('/');
    };

    var createCategoryLink = function (category) {
	var link = $('<a/>').addClass('category-link')
	    .data('category', category)
	    .text(category)
	    .attr('href', '#');

	return link;
    };

    var createStandardLink = function (category, standard) {
	var link = $('<a/>').addClass('standard-link')
	    .data('category', category)
	    .data('standard', standard)
	    .text(standard)
	    .attr('href', '#');

	return link;
    };

    var createGradeLink = function (category, standard) {
	var gradeFilterClone = $('#grade-filter-master').clone();
	var grade = $.cookie('grade-filter') || 'K';

	var link = gradeFilterClone.removeAttr('id');

	link.find('.grade-link').data('category', category);
	link.find('.grade-link').data('standard', standard);
	link.find('.grade-link').val(grade);
	link.show();

	return link;
    };

    var loadResources = function ($div, callback) {
	$div.find('.resources').each( function (i, e) {
	    var $resourceDiv  = $(e);
	    var $resourceLink = $resourceDiv.find('.resource-count');
	    
	    var id = $resourceLink.data('id');
	    
	    $resourceLink.text( 'loading...' );
	    
	    $.ajax(resourceServiceUrl, {
		data: {discriminator: id},
		success: function (resources) {
		    var count = resources.documents.length;
		    
		    // remove element if no resources
		    if (count === 0) {
			$resourceLink.text( 'no resources found' );
			return;
		    }
		    
		    // get resource/s depending on how many
		    var pluralText = count === 1 ? 'resource' : 'resources';
		    
		    var div = $('<div/>');
		    $('<h2 />').text('Resources').appendTo(div);
		    
		    $.each( resources.documents, function(i, doc) {
			var link = doc.result_data.resource;
			var a = $('<a/>').attr('href', link).text(link)
			    .attr('target', '_blank');
			var p = $('<p/>');
			p.append(a);
			div.append(p);
		    });
		    
		    var $newResourceLink = $('<a/>')
			.attr('href', '#').text( count + ' ' + pluralText );
		    
		    $newResourceLink.click( function (event) {
			$.modal(div);
			return false;
		    });
		    
		    $resourceLink.replaceWith($newResourceLink);
		}
	    }); 
	});
    };

    var loadNodes = function ($query, data, callback) {
	var nodesUrl = '/nodes/';
	var $div = $('<div/>').addClass('children');
	$div.load(nodesUrl, data, function () {
	    loadResources($div);
	    $query.append($div);
	    if (callback) callback();
	});
    };
	       
    // singleton
    var browser = {
	setResourceServiceUrl: function (url) {
	    resourceServiceUrl = url;
	},
	start: function ($screenIn) { // $screen is where stuff will be loaded
	    $screen = $screenIn;

	    // set up category, standard, and grade events
	    $(document).on( 'click',  '.category-link', categoryClick );
	    $(document).on( 'click',  '.standard-link', standardClick );
	    $(document).on( 'change', '.grade-link',    gradeChange );
	    $(document).on( 'click',  '.expand-node',   childClick );

	    // load the list of all categories and standards
	    $screen.load('/standards/');
	    
	    $(window).hashchange( function () {
		var hashParts = unescape(location.hash).split('/');

		var category = hashParts.shift();
		var standard = hashParts.shift();
		var grade    = hashParts.shift();
		var nodes    = hashParts; // only nodes are left over, if any

		// remove leading #
		if (category) category = category.substring(1);

		// set grade in case of bookmark
		if (grade) $.cookie('grade-filter', grade);

		state.category = category;
		state.standard = standard;
		state.grade    = $.cookie('grade-filter') || 'K';
		state.nodes    = nodes;

		var categoryUrl = '/standards/';

		if (state.category) categoryUrl += escape(state.category);

		var childrenToLoad = [];

		// returns function to descend into the node path provided
		// moves to next node after each is finished loading
		var recursiveDescent = function recursiveDescent (nodes) {
		    return function () {
			var node      = nodes.shift();
			var $target   = $("[data-id='" + node + "']");
			var $children = $target.parent().children('.children');
			var parent    = { parent: node };
			if(nodes.length > 1) {
			    loadNodes($children, parent, recursiveDescent(nodes));
			}
		    };
	        };

		// load the display
		if (!state.category) {
		    $screen.load(categoryUrl, function () {
			CRUMBS.clear($('#crumbs'));
		    });
		}
		else if (!state.standard) {
		    $screen.load(categoryUrl, function () {
			CRUMBS.clear($('#crumbs'));
			CRUMBS.push($('#crumbs'), createCategoryLink(state.category));
		    });
		}
		else {
		    // clear, then add the crumbs to the trail
		    CRUMBS.clear($('#crumbs'));
		    CRUMBS.push($('#crumbs'), createCategoryLink(state.category));
		    CRUMBS.push($('#crumbs'), createStandardLink(state.category, state.standard));
		    CRUMBS.push($('#crumbs'), createGradeLink(state.category, state.standard, state.grade));

		    // find out what part of the node tree needs to be loaded
		    nodes.forEach( function (node) {
			var $target = $("[data-id='" + node + "']").find('.children');
			if (!$target.length) childrenToLoad.push(node);
		    });

		    if (childrenToLoad.length > 0) {
			loadNodes($screen,
				  { parent: childrenToLoad.shift() }, 
				  recursiveDescent(childrenToLoad)
				 );
		    }
		    else {
			$screen.html('');
			loadNodes($screen,
				  { category: category, standard: standard }
				 );
		    }
		}
	    });

	    // fire the hashchange event in case bookmarked hash supplied
	    $(window).hashchange();
	}
    };

    return browser;

})();
