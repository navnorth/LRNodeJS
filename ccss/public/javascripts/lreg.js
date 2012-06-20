var LREG = (function () {

    // private fields
    var categoryClick = function () {};
    var standardClick = function () {};

    // private methods
    var createExpandos = function ($selector, action) {
	$selector.each( function(i,element) {

	    var id = $(element).data('id');

	    var button = $('<input type="button">');
	    button.addClass('expando');
	    button.val(' + ');
	    button.data('id', id);

	    button.click(function (event) {
		action(event);
		
		button.val(' - ');
		button.off('click'); // remove old handler
		button.click(function(event) {
		    // no need to load twice so just switch symbol and toggle
		    if( button.val() === ' + ' ) {
			button.val(' - ');
		    }
		    else {
			button.val(' + ');
		    }
		    
		    button.parent().children('.children').toggle();
		});
	    });

	    $(element).replaceWith(button);
	});
    };

    // singleton
    var lreg = {
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
	loadNodes: function ($query, data) {
	    var nodesUrl = '/nodes/';
	    var $div = $('<div>');

	    $div.load(nodesUrl, data, function () {
		createExpandos($div.find('.expand-node'), function (event) {
		    var children = $(event.target).parent().children('.children');
		    var parent   = $(event.target).data('id');

		    var childData = {
			standard: data.standard,
			parent: parent
		    };

		    var $resourcesDiv = children.children('.resources');
		    var id = $resourcesDiv.data('id');

		    // check if there are any resources
		    $.ajax('/related/', {
			data: {id: id},
			success: function (resources) {
			    // remove element if no resources
			    if (resources.length === 0) {
				$resourcesDiv.remove();
				return;
			    }

			    // get resource/s depending on how many
			    var pluralText = resources.length === 1 ? 'resource' : 'resources';

			    $resourcesDiv.children('.children').hide();
			    
			    // load resources and populate data / create expandos
			    $resourcesDiv.find('.resource-count')
				.text( resources.length + ' ' + pluralText );
			    
			    $.each( resources, function(j, resource) {
				var p = $('<p>');
				var a = $('<a>');
				a.attr('href', resource);
				a.text(resource);
				p.append(a);
				$resourcesDiv.find('.children').append(p);
			    });
			    
			    createExpandos(
				$resourcesDiv.find('.expand-resource'),
				function (event) {
				    // initial click -> show the resources
				    $(event.target).parent().children('.children').show();
				}
			    );
			}
		    });

		    lreg.loadNodes(children, childData);
		});
		
		$query.append($div);
	    });
	}
    };

    return lreg;

})();
