var argv = require('minimist')(process.argv.slice(2));
var jsdom = require("jsdom");
var {JSDOM} = jsdom;

var usage = `usage:
	minifyfromhtml < <input file>
`;

var inputFile = argv.i;

if (argv.h) {
	console.log(usage);
}

//read stdin
var html = '';
process.stdin.resume();
process.stdin.setEncoding('utf-8');
process.stdin.on('data', function(buf) {
	html += buf;
});
process.stdin.on('end', function() {
	var dom = new JSDOM(html);
	var getScripts = function(dom) {
		var scripts = [];

		var document = dom.window.document;
		var scriptTags = document.getElementsByTagName('script');
		var i = scriptTags.length;
		while (i--) {
			var src = scriptTags[i].getAttribute('src');
			if (src) {
				scripts.push(src);
			}
		}
		return scripts;
	}

	console.log(getScripts(dom));
});
