let argv = require('minimist')(process.argv.slice(2));
let fs = require('fs');
let path = require('path');
let jsdom = require('jsdom');
let JSDOM = jsdom.JSDOM;
let babel = require("babel-core");
let CleanCSS = require('clean-css');

let usage = `usage:
	minifyfromhtml --js=<output js file> --css=<output css file> --exclude=<exclude files> < <input file>

	the minification process uses babel under the hood, so you can modify
	the minification with a .babelrc file.
	https://babeljs.io/

	the css minification process uses clean-css. to modify the default settings,
	create a file named .cleancssrc and put the json configuration in that file.
	https://github.com/jakubpawlowicz/clean-css

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

		let css = fs.readFileSync(style);
		let cleanCssOptions = '';

		let readConfig = function(configfilepath) {
			try {
				return JSON.parse(fs.readFileSync(configfilepath + '/.cleancssrc'));
			} catch (e) {
				if (configfilepath != __dirname) {
					configfilepath = path.resolve(path.normalize(configfilepath + '/../'));
					return readConfig(configfilepath);
				} else {
					return {};
				}
			}
		}
		cleanCssOptions = readConfig(path.resolve('./'));

		console.log(style + ' -> ' + argv.css);
		fs.appendFileSync(argv.css, (new CleanCSS(cleanCssOptions).minify(css)).styles + '\n');
	}
});
