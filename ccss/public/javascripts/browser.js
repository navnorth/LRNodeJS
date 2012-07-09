var BROWSER = (function () {

    // private fields
    var categoryClick = function () {};
    var standardClick = function () {};

    var resourceServiceUrl = 'http://localhost/extract/standards-alignment-related/resource-by-discriminator'; // default value

    // private methods
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

    // singleton
    var browser = {
	setResourceServiceUrl: function (url) {
	    resourceServiceUrl = url;
	},
	start: function ($screen) { // $screen is where stuff will be loaded
	    // load the list of all categories and standards
	    $screen.load('/standards/', function () {
		// set up category clicks
		$('li.category a').click( categoryClick );
		
		// set up standard set clicks
		$('li.standard a').click( standardClick );
	    });
	},
	setCategoryClick: function(handler) {
	    categoryClick = handler;
	},
	setStandardClick: function (handler) {
	    standardClick = handler;
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