# minifyfromhtml

This little helper minifies scripts and css starting from an html file. I made it after asking this question on stackoverflow: https://stackoverflow.com/questions/50188269/minify-js-and-css-in-one-go-starting-from-html/

## Quickstart

```
npm i git+https://github.com/S2-/minifyfromhtml.git#semver:1.x
node node_modules\minifyfromhtml\minifyfromhtml.js --js=dist.js --css=dist.css < index.html
```
=>
```
css/mywidget.css -> dist.css
js/jquery.js -> dist.js
js/spectacularwidget.js -> dist.js
```
