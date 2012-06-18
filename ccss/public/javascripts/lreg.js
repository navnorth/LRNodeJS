var LREG = (function () {

    // private
    var categoryClick = function () {};
    var standardClick = function () {};

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
	loadNodes: function (query, data) {
	    console.log('query: ');
	    console.log(query);
	    console.log('data:  ');
	    console.log(data);

	    var nodesUrl = '/nodes/';

	    query.load(nodesUrl, data, function () {
		query.find('.expand-node').click(function (e) {
		    var children = $(e.target).parent().children(".children");
		    var parent   = $(e.target).data('id');

		    var childData = {
			standard: data.standard,
			parent: parent
		    };
	          
		    lreg.loadNodes(children, childData);
		    
		    $(e.target).val(" - ");
		    $(e.target).off('click'); // remove handler
		    $(e.target).click(function(e2) {
			if( $(e.target).val() === " + " ) {
			    $(e.target).val(" - ");
			}
			else {
			    $(e.target).val(" + ");
			}

			children.toggle();
		    });
		});
	    });
	}
    };

    return lreg;

})();
