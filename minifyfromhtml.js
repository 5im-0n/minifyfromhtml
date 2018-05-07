let argv = require('minimist')(process.argv.slice(2));
var fs = require('fs');
let jsdom = require('jsdom');
let JSDOM = jsdom.JSDOM;
let babel = require("babel-core");
let CleanCSS = require('clean-css');

let usage = `usage:
	minifyfromhtml --js=<output js file> --css=<output css file> < <input file>

	the minification process uses babel under the hood, so you can modify
	the minification with a .babelrc file.
	https://babeljs.io/

	the css minification process uses clean-css, so you can modify
	the minification with
	https://github.com/jakubpawlowicz/clean-css

	example:
	minifyfromhtml --js=dist/mywidget.min.js --css=dist/mywidget.min.css < example/index.html
`;

let outputDir = argv.o;

if (argv.h) {
	console.log(usage);
	return;
}

if (!argv.js || !argv.css) {
	console.log(usage);
	return;
}

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

	//process scripts
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

			if (Object.keys(processedScripts).length === scripts.length) {
				//write scripts

				//clear out dist file
				fs.writeFileSync(argv.js, '');

				//write files
				for (let i = 0; i < scripts.length; i++) {
					const script = scripts[i];

					console.log(script + ' -> ' + argv.js);
					fs.appendFileSync(argv.js, processedScripts[script] + '\n');
				}
			}
		});
	}

	//process css
	let styles = getTagAttrs(dom, 'link', 'href');
	let processedStyles = {};
	fs.writeFileSync(argv.css, '');
	for (let i = 0; i < styles.length; i++) {
		let style = styles[i];

		let css = fs.readFileSync(style);
		let cleanCssOptions = {
			level: {
				1: {
					specialComments: false,
					rebase: false
				}
			}
		};

		console.log(style + ' -> ' + argv.css);
		fs.appendFileSync(argv.css, (new CleanCSS(cleanCssOptions).minify(css)).styles + '\n');
	}
});
