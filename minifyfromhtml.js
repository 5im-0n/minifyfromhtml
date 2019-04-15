let argv = require('minimist')(process.argv.slice(2));
let fs = require('fs');
let path = require('path');
let jsdom = require('jsdom');
let JSDOM = jsdom.JSDOM;
let minify = require('minify');

let usage = `usage:
	minifyfromhtml --js=<output js file> --css=<output css file> --exclude=<exclude files> < <input file>

	the minification process uses minify under the hood.
	http://coderaiser.github.io/minify/

	example:
	minifyfromhtml --js=dist/mywidget.min.js --css=dist/mywidget.min.css --exclude=js/jquery.js < example/index.html
`;

if (argv.h) {
	console.log(usage);
	return;
}

if (!argv.js || !argv.css) {
	console.log(usage);
	return;
}

function streamToString(stream) {
	const chunks = []
	return new Promise((resolve, reject) => {
		stream.on('data', chunk => chunks.push(chunk))
		stream.on('error', reject)
		stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
	})
}


var excludeFiles = argv.exclude || [];
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

	//remove exluded
	excludeFiles.forEach(i => {
		var index = scripts.indexOf(i);
		if (index !== -1) {
			scripts.splice(index, 1);
		}
	});

	let processedScripts = {};
	for (let i = 0; i < scripts.length; i++) {
		let script = scripts[i];

		minify(script, 'stream')
		.then(function(data) {
			processedScripts[script] = data;

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

	//remove exluded
	excludeFiles.forEach(i => {
		var index = styles.indexOf(i);
		if (index !== -1) {
			styles.splice(index, 1);
		}
	});

	let processedStyles = {};
	fs.writeFileSync(argv.css, '');
	for (let i = 0; i < styles.length; i++) {
		let style = styles[i];

		if (excludeFiles.indexOf(style) > -1) {
			console.log(style + ' excluded');
			continue;
		}

		minify(style, 'stream')
		.then(function(data) {
			processedStyles[style] = data;

			if (Object.keys(processedStyles).length === styles.length) {
				//write styles

				//clear out dist file
				fs.writeFileSync(argv.css, '');

				//write files
				for (let i = 0; i < styles.length; i++) {
					const style = styles[i];

					console.log(style + ' -> ' + argv.css);
					fs.appendFileSync(argv.css, processedStyles[style] + '\n');
				}
			}
		});
	}
});
