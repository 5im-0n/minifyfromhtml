let argv = require('minimist')(process.argv.slice(2));
let fs = require('fs');
let path = require('path');
let Terser = require('terser');
let CleanCSS = require('clean-css');
let jsdom = require('jsdom');
let JSDOM = jsdom.JSDOM;

process.on('unhandledRejection', up => { throw up; });

let usage = `usage:
	minifyfromhtml --js=<output js file> --css=<output css file> --exclude=<exclude files> < <input file>

	the minification process uses minify under the hood.
	http://coderaiser.github.io/minify/

	example:
	minifyfromhtml --js=dist/mywidget.min.js --css=dist/mywidget.min.css --exclude=js/jquery.js < example/index.html
`;

if (argv.h) {
	console.log(usage);
	process.exit(0);
}

if (!argv.js && !argv.css) {
	console.log(usage);
	process.exit(0);
}

let excludeFiles = argv.exclude || [];
if (typeof(excludeFiles) === 'string') {
	excludeFiles = [excludeFiles];
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
};


readStdin(async function(html) {
	let dom = new JSDOM(html);
	let getTagAttrs = function(dom, tag, attr, filter) {
		let elements = [];

		let document = dom.window.document;
		let elementTags = document.getElementsByTagName(tag);
		let i = elementTags.length;
		for (let i = 0; i < elementTags.length; i++) {
			if (!filter ||
				(filter && elementTags[i].getAttribute(Object.keys(filter)[0]) === filter[Object.keys(filter)[0]])) {
				let src = elementTags[i].getAttribute(attr);
				if (src) {
					elements.push(src);
				}
			}
		}
		return elements;
	};

	let processJs = async function(things, outFile) {
		let terserOptions = {
			output: {
				comments: false
			},
			sourceMap: {
				includeSources: true,
				url: path.basename(outFile) + '.map'
			}
		};

		//remove exluded
		excludeFiles.forEach(i => {
			let index = things.indexOf(i);
			if (index !== -1) {
				things.splice(index, 1);
			}
		});

		let code = {};
		for (let i = 0; i < things.length; i++) {
			let thing = things[i];
			code[thing] = fs.readFileSync(thing, 'utf8');
			console.log(thing + ' -> ' + outFile);
		}

		let datap = await Terser.minify(code, terserOptions);
		if (datap.error) {
			console.log('Minify error, falling back to concatenation:', datap.error.message);
			let raw = '';
			for (let thing of things) {
				raw += fs.readFileSync(thing, 'utf8') + '\n';
			}
			fs.writeFileSync(outFile, raw);
		} else {
			fs.writeFileSync(outFile, datap.code);
			if (datap.map) {
				fs.writeFileSync(outFile + '.map', datap.map);
			}
		}
	};

	let processCss = function(things, outFile) {
		fs.writeFileSync(outFile, '');
		for (let i = 0; i < things.length; i++) {
			let thing = things[i];
			console.log(thing + ' -> ' + outFile);
			let minified = new CleanCSS().minify(fs.readFileSync(thing, 'utf8'));
			fs.appendFileSync(outFile, minified.styles);
		}
	};

	if (argv.js) {
		processJs(getTagAttrs(dom, 'script', 'src'), argv.js);
	}

	if (argv.css) {
		processCss(getTagAttrs(dom, 'link', 'href', {rel: 'stylesheet'}), argv.css);
	}
});
