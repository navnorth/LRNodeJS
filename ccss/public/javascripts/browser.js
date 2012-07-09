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

	    var button = $('<a>');
	    button.addClass('expando');
	    button.text('[ + ]');
	    button.data('id', id);

	    button.click(function (event) {
		action(event);
		
		button.text('[ - ]');
		button.off('click'); // remove old handler
		button.click(function(event) {
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

    var updateHashLocation = function (category, standard, grade) {
	var hashParts = [];

	if (category !== undefined) hashParts.push(category);
	if (standard !== undefined) hashParts.push(standard);
	if (grade    !== undefined) hashParts.push(grade);

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

		var category = hashParts[0];
		var standard = hashParts[1];
		var grade    = hashParts[2];

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
		}

		console.log(hashParts);
	    });

	    // fire the hashchange event in case bookmarked hash supplied
	    $(window).hashchange();

	},
	loadResources: function ($div, callback) {
	    $div.find('.resources').each( function (i, e) {
		var $resourceDiv = $(e);
		var id = $resourceDiv.data('id');

		$resourceDiv.find('.resource-count')
		    .text( 'loading...' );

		$.ajax(resourceServiceUrl, {
		    data: {discriminator: id},
		    success: function (resources) {
			var count = resources.documents.length;

			// remove element if no resources
			if (count === 0) {
			    $resourceDiv.find('.resource-count')
				.text( 'no resources found' );
			    return;
			}
			
			// get resource/s depending on how many
			var pluralText = count === 1 ? 'resource' : 'resources';
			
			$resourceDiv.children('.children').hide();
			
			// load resources and populate data / create expandos
			$resourceDiv.find('.resource-count')
			    .text( count + ' ' + pluralText );
			
			$.each( resources.documents, function(j, doc) {
			    var link = doc.result_data.resource;
			    var p = $('<p>');
			    var a = $('<a>');
			    a.attr('href', link);
			    a.text(link);
			    p.append(a);
			    $resourceDiv.find('.children').append(p);
			});
			
			createExpandos(
			    $resourceDiv.find('.expand-resource'),
			    function (event) {
				// initial click -> show the resources
				$resourceDiv.children('.children').show();
			    }
			);
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
