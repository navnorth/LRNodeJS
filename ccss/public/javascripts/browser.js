// Copyright 2012 Navigation North Learning Solutions LLC
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License.  You may obtain a copy
// of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
// License for the specific language governing permissions and limitations under
// the License.

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
	var category = $(event.target).data('category');
	updateState(category);
	updateHashLocation();
	return false;
    };

    var standardClick = function (event) {
	var standard = $(event.target).data('standard');
	var category = $(event.target).data('category')
	    || $(event.target).closest('.category').data('category');
	updateState(category, standard);
	updateHashLocation();	
	return false;
    };

    var gradeChange = function (event) {
	var $target = $(event.target);
	var standard = $target.data('standard');
	var category = $target.data('category')
	    || $(event.target).closest('.category').data('category');
	var grade = $target.val();

	updateState(category, standard, grade);
        updateNodes([]);
	updateHashLocation();
	return false;
    };

    var childClick = function (event) {
	var $target    = $(event.target);
	var $ancestors = $target.parents('.node');
	var $container = $target.closest('.node');
	var parentId   = $container.data('id');
	var nodes      = [];
	
	// handle toggle and button
	var closed = $target.text() === '[ + ]' ? true : false;

	$container.children('.children').toggle();

	if(closed) {
	    $target.text('[ - ]'); 

	    // walk up the DOM and find IDs of all nodes in hierarchy
	    $ancestors.each( function (i, e) {
		nodes.unshift($(e).data('id'));
	    });

	    updateNodes(nodes);
	    updateHashLocation();
	}
	else {
	    $target.text('[ + ]');
	}
	return false;
    };

    // private methods

    var updateState = function (category, standard, grade) {
	state.category = category;
	state.standard = standard;
        if (grade) {
	    state.grade = grade;
	    $.cookie('grade-filter', grade);
	}
    };

    var updateNodes = function (nodes) {
	state.nodes = nodes;
    };

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

    // returns function to descend into the node path provided
    // moves to next node after each is finished loading
    var recursiveDescent = function recursiveDescent (nodes) {
	return function () {
	    var node      = nodes.shift();
	    var $target   = $(document).find("[data-id='" + node + "']");
	    if($target.length) {
		$target.children('.expand-node').text('[ - ]');
		loadNodes($target, { parent: node }, recursiveDescent(nodes));
	    }
	};
    };

    var loadResources = function ($div, callback) {
	$div.find('.resources').each( function (i, e) {
	    var $resourceDiv  = $(e);
	    var $resourceLink = $resourceDiv.find('.resource-count');
	    
	    var id = $resourceLink.data('id');
	    
	    $resourceLink.text( 'loading...' );
	    
	    $.ajax(resourceServiceUrl, {
		data: {discriminator: id},
                dataType: 'json',
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
	    $screen.load('/standards/', function () {
		$(window).hashchange( function () {
		    var hashParts = unescape(location.hash).split('/');
		    
		    var category = hashParts.shift();
		    var standard = hashParts.shift();
		    var grade    = hashParts.shift();
		    var nodes    = hashParts; // only nodes are left over, if any
		    
		    var categoryUrl = '/standards/';
		    
		    var childrenToLoad = [];
		    var first;
		    
		    // remove leading # and set Url
		    if (category) {
			category     = category.substring(1);
			categoryUrl += escape(category);
		    }
		    
		    updateState(category, standard, grade);
		    updateNodes(nodes);
		    
		    // load the display
		    if (!state.category) {
			$screen.load(categoryUrl, function () {
			    CRUMBS.clear($('#crumbs'));
			});
			return;
		    }
		    
		    if (!state.standard) {
			$screen.load(categoryUrl, function () {
			    CRUMBS.clear($('#crumbs'));
			    CRUMBS.push($('#crumbs'), createCategoryLink(state.category));
			});
			return;
		    }
		    
		    var screenLoaded = $screen.find('.node').length > 0 ? true : false;
		    var callback;
		    var $loadLocation;
		    var discriminator;
		    
		    // clear, then add the crumbs to the trail
		    CRUMBS.clear($('#crumbs'));
		    CRUMBS.push($('#crumbs'), createCategoryLink(state.category));
		    CRUMBS.push($('#crumbs'), createStandardLink(state.category, state.standard));
		    CRUMBS.push($('#crumbs'), createGradeLink(state.category, state.standard, state.grade));
		    
		    // either load screen, no nodes open
		    // or screen loaded, open nodes
		    // or load screen, then open nodes
		    if (!screenLoaded || !state.nodes || state.nodes.length === 0) {
			$loadLocation = $screen;
			$screen.html('');
			discriminator = { category: category, standard: standard };
	            }
		    
		    // find out what part of the node tree needs to be loaded
		    nodes.forEach( function (node) {
			var $target = $("[data-id='" + node + "']").find('.children');
			if (!$target.length) childrenToLoad.push(node);
		    });
		    
		    if (state.nodes && state.nodes.length > 0) {
			callback = recursiveDescent(childrenToLoad);
		    }
		    
		    if (screenLoaded && state.nodes && state.nodes.length > 0) {
			first = childrenToLoad.shift();		    
			$loadLocation = $("[data-id='" + first + "']");
			discriminator = { parent: first };
			callback = recursiveDescent(childrenToLoad);
		    }
		    
		    loadNodes($loadLocation, discriminator, callback);
		});
		
		// fire the hashchange event in case bookmarked hash supplied
		$(window).hashchange();
	    });
	}
    };

    return browser;

})();
