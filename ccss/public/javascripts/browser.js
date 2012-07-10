var BROWSER = (function () {

    // private fields

    var resourceServiceUrl = 'http://localhost/extract/standards-alignment-related/resource-by-discriminator'; // default value

    var $screen;

    // private methods

    var categoryClick = function (event) {
	var category = $(event.target).data('category');
	updateHashLocation(category);
	return false;
    };

    var standardClick = function (event) {
	var standard = $(event.target).data('standard');
	var category = $(event.target).data('category')
	    || $(event.target).closest('.category').data('category');
	updateHashLocation(category, standard);
	return false;
    };

    var gradeChange = function (event) {
	var grade = $(event.target).val();
	var standard = $(event.target).data('standard');
	var category = $(event.target).data('category')
	    || $(event.target).closest('.category').data('category');

	$.cookie('grade-filter', grade);

	updateHashLocation(category, standard, grade);
	return false;
    };

    var createExpandos = function ($selector, action) {
	$selector.each( function(i,element) {

	    var id = $(element).data('id');

	    var button = $('<a>').addClass('expando').text('[ + ]').data('id', id);

	    button.click(function (event) {
		action(event);
		
		// remove old handler and toggle click
		button.text('[ - ]').off('click').click(function(event) {
		    // no need to load twice so just switch symbol and toggle
		    if( button.text() === '[ + ]' ) {
			button.text('[ - ]');
		    }
		    else {
			button.text('[ + ]');
		    }
		    
		    button.parent().children('.children').toggle();
		});
	    });

	    $(element).replaceWith(button);
	});
    };

    var updateHashLocation = function (category, standard, grade, nodes) {
	var hashParts = [];

	if (category !== undefined) hashParts.push(category);
	if (standard !== undefined) hashParts.push(standard);
	if (grade    !== undefined) hashParts.push(grade);

	if (nodes !== undefined) {
	    hashParts = hashParts.concat(nodes);
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

	link.find('.grade-link').data('category', category)
	link.find('.grade-link').data('standard', standard)
	link.find('.grade-link').val(grade)
	link.show();

	return link;
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

	    // load the list of all categories and standards
	    $screen.load('/standards/');
	    
	    $(window).hashchange( function () {
		var hashParts = unescape(location.hash).split('/');

		var category = hashParts.shift();
		var standard = hashParts.shift();
		var grade    = hashParts.shift();
		var nodes    = hashParts; // nodes are only left over

		// remove leading #
		if (category !== undefined) category = category.substring(1);

		// set grade in case of bookmark
		if (grade !== undefined) $.cookie('grade-filter', grade);

		// load the display
		var categoryUrl = '/standards/' + escape(category);

		if (category !== undefined && standard === undefined) {
		    $screen.load(categoryUrl, function () {
			CRUMBS.clear($('#crumbs'));
			CRUMBS.push($('#crumbs'), createCategoryLink(category));
		    });
		}
		else {
		    // clear, then add the crumbs to the trail
		    CRUMBS.clear($('#crumbs'));
		    CRUMBS.push($('#crumbs'), createCategoryLink(category));
		    CRUMBS.push($('#crumbs'), createStandardLink(category, standard));
		    CRUMBS.push($('#crumbs'), createGradeLink(category, standard, grade));

		    // finally, load the nodes
		    $screen.html('');
		    browser.loadNodes($screen, { standard: escape(standard) });
		    
		    if (nodes.length > 0) {
			nodes.forEach( function (node) {
			    console.log(node);
			    // TODO simulate click / load ndoes with callback
			});
		    }
		}
	    });

	    // fire the hashchange event in case bookmarked hash supplied
	    $(window).hashchange();

	},
	loadResources: function ($div, callback) {
	    $div.find('.resources').each( function (i, e) {
		var $resourceDiv  = $(e);
		var $resourceLink = $resourceDiv.find('.resource-count');

		var id = $resourceLink.data('id');

		$resourceLink.text( 'loading...' );

		$.ajax(resourceServiceUrl, {
		    data: {discriminator: id},
//		    crossDomain: true,
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
			div.append($('<h2 />').text('Resources'));

			$.each( resources.documents, function(j, doc) {
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
	},
	loadNodes: function ($query, data) {
	    var nodesUrl = '/nodes/';
	    var $div = $('<div>');

	    $div.load(nodesUrl, data, function () {
		browser.loadResources( $div );

		createExpandos($div.find('.expand-node'), function (event) {
		    var children = $(event.target).parent().children('.children');
		    var parent   = $(event.target).data('id');

		    var childData = {
			standard: data.standard,
			parent: parent
		    };

		    browser.loadNodes(children, childData);
		});
		
		$query.html($div);
	    });
	}
    };

    return browser;

})();
