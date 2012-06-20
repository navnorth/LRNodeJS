var express = require('express');
var mustache = require('mustache');

var tmpl = { // template functions to render with mustache
    compile: function (source, options) {
        if (typeof source == 'string') {
            return function(options) {
                options.locals = options.locals || {};
                options.partials = options.partials || {};

                if (options.body) // for express.js > v1.0
                    options.partials.body = options.body;

                return mustache.to_html(
                    source, options.locals, options.partials);
            };
        } else {
            return source;
        }
    },
    render: function (template, options) {
        template = this.compile(template, options);
        return template(options);
    }
};

var routes = require('./routes');
var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'mustache');
    app.set('view options', { layout: true });
    app.register('.html', tmpl);
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

// routes

app.get('/standards/:category?', routes.standards);
app.get('/browser', routes.browser);
app.post('/nodes/', routes.nodes);

// start

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
    app.listen(1337);
});

app.configure('production', function(){
    app.use(express.errorHandler());
    app.listen(8012);
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
