var CRUMBS = (function () {

    // private
    var isFirstCrumb = true;

    // object
    var crumbs = {
	push: function ($query, c) {
	    var $crumb = $('<span>').addClass('crumb');
	    if(!isFirstCrumb) {
		$crumb.append(' &raquo; ');
	    }
	    $crumb.append(c);

	    $query.append($crumb);

	    isFirstCrumb = false;
	},
	clear: function ($query) {
	    $query.html('');
	    isFirstCrumb = true;
	}
    };

    return crumbs;
})();
