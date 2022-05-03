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
