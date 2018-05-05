let argv = require('minimist')(process.argv.slice(2));
let jsdom = require('jsdom');
let JSDOM = jsdom.JSDOM;
let babel = require("babel-core");

let usage = `usage:
	minifyfromhtml -o <output dir> < <input file>

	the minification process uses babel under the hood, so you can modify
	the minification with a .babelrc file.

	example:
	minifyfromhtml -o dist < example/index.html
`;

let inputFile = argv.i;

if (argv.h) {
	console.log(usage);
}

let execute = function(command, callback) {
	exec(command, function(error, stdout, stderr) {
		callback(stdout);
	});
};

let readStdin = function(cb) {
	let stdin = '';
	process.stdin.resume();
	process.stdin.setEncoding('utf-8');
	process.stdin.on('data', function(buf) {
		stdin += buf;
	});
	process.stdin.on('end', function() {
		cb(stdin);
	});
}

readStdin(function(html) {
	let dom = new JSDOM(html);
	let getTagAttrs = function(dom, tag, attr) {
		let scripts = [];

		let document = dom.window.document;
		let scriptTags = document.getElementsByTagName(tag);
		let i = scriptTags.length;
		for (let i = 0; i < scriptTags.length; i++) {
			let src = scriptTags[i].getAttribute(attr);
			if (src) {
				scripts.push(src);
			}
		}
		return scripts;
	}

	let scripts = getTagAttrs(dom, 'script', 'src');
	let processedScripts = {};
	for (let i = 0; i < scripts.length; i++) {
		let script = scripts[i];

		babel.transformFile(script, {}, function(err, result) {
			if (err) {
				console.error(err);
				return;
			}
			processedScripts[script] = result.code;
		});
	}

	console.log(getTagAttrs(dom, 'link', 'href'));
});
