var CRUMBS = (function () {

    // object
    var crumbs = {
	push: function ($query, c) {
	    // TODO only append > if not first
	    var $crumb = $('<span>').addClass('crumb').append(' &gt; ').append(c);
	    $query.append($crumb);
	},
	pop: function ($query) {
	    $query.find('.crumb').last().detach();
	},
	clear: function ($query) {
	    $query.html('');
	}
    };

    return crumbs;
})();

