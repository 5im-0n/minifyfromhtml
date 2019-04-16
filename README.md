# minifyfromhtml

This little helper minifies scripts and css starting from an html file.

## What it is

I am making a `js` widget, like a map, or a calendar field or something. This is the `index.html` I use while developing the widget:

```
<!DOCTYPE html>
<html lang="en">
<head>
	<title>example page</title>

	<script src="somelib.js"></script>
	<script src="someotherlib.js"></script>
	<script src="awesomelib.js"></script>
	<script src="spectacularlib.js"></script>
	<script src="app.js"></script>


	<link rel="stylesheet" type="text/css" href="some.css" />
	<link rel="stylesheet" type="text/css" href="app.css" />
</head>
<body>
	<div id="widget"></div>
	
	<script>
		myapp(document.getElementById('widget'));
	</script>
</body>
</html>
```

I am not using a framework like angular or react. I am coding along in `app.js`, and add libraries as I need them to `index.html`.

Then comes a time I want to distribute my widget to the world. To do that, I would like to

 - minify all referenced js files in index.html
 - minify all css files

so that users of my widget can just include `widget.js` and `widget.css` and be good to go.

Is there something I can use that does that for me **with minimal hassle**? Something like

```
$ magictool index.html
- nice html you have. let me parse that and see what I need to do...
- oh, you have somelib.js. let me minify that for you and put it in dist.js
- oh, you have someotherlib.js. let me minify that for you and put it in dist.js
- oh, you have awesomelib.js. let me minify that for you and put it in dist.js
- oh, you have spectacularlib.js. let me minify that for you and put it in dist.js
- oh, you have app.js. let me minify that for you and put it in dist.js
- oh, you have some.css. let me minify that for you and put it in dist.css
- oh, you have app.css. let me minify that for you and put it in dist.css
! dist.js and dist.css created!
```
that reads `index.html` and creates a `dist.js` and `dist.css`.

the magictool is **minifyfromhtml**.

## Quickstart

```
npm i -g minifyfromhtml
minifyfromhtml --js=dist.js --css=dist.css < index.html
```
=>
```
some.css -> dist.css
app.css -> dist.css
somelib.js -> dist.js
someotherlib.js -> dist.js
awesomelib.js -> dist.js
spectacularlib.js -> dist.js
app.js -> dist.js
```
