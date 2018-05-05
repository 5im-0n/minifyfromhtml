# minifyfromhtml

This little helper minifies scripts and css starting from an html file. I made it after asking this question on stackoverflow: https://stackoverflow.com/questions/50188269/minify-js-and-css-in-one-go-starting-from-html/

It takes an input html file, parses it, and outputs all included javascript and css files minified to a file you specify:
```
minifyfromhtml --js=<output js file> --css=<output css file> < <input file>
```

example:
```
minifyfromhtml --js=dist/mywidget.min.js --css=dist/mywidget.min.css < example/index.html
```
