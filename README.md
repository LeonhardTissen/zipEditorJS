# Highly WIP

### With this library
- You can give users a way to edit .zip files from within their browser
- .zip software or image editing software is not required by the user

### How it works
- On your page, you can call a window that opens the zip Editor
- .zips created can be read and used by the host or exported for the user

### How to implement into your own site

#### In your header
```html
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js"></script>
  <script type="text/javascript" src="zipEditor.js"></script>
  <link rel="stylesheet" type="text/css" href="zipEditor.css">
</head>
```
#### In JavaScript
```js
zipEditorInit();
```

<p align="center">
	<img src="https://s.warze.org/paddingleft3.png" style="display: inline-block;"><a href="https://twitter.warze.org" style="text-decoration: none;"><img src="https://s.warze.org/x3.png" alt="Leonhard Tissen on X/Twitter" style="display: inline-block;"/></a><a href="https://youtube.warze.org" style="text-decoration: none;"><img src="https://s.warze.org/youtube3.png" alt="Leonhard Tissen on YouTube" style="display: inline-block;"/></a><a href="https://linkedin.warze.org" style="text-decoration: none;"><img src="https://s.warze.org/linkedin3.png" alt="Leonhard Tissen on LinkedIn" style="display: inline-block;"/></a><a href="https://github.warze.org" style="text-decoration: none;"><img src="https://s.warze.org/github3.png" alt="Leonhard Tissen on GitHub" style="display: inline-block;"/></a><a href="https://gitlab.warze.org" style="text-decoration: none;"><img src="https://s.warze.org/gitlab3.png" alt="Leonhard Tissen on GitLab" style="display: inline-block;"/></a><img src="https://s.warze.org/paddingright2.png">
</p>
