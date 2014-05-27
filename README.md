js-webcam-screenshot
====================

Capture screenshort from webcam via JavaScript

## Features ##

js-webcam-screenshot can capture a screenshot directly from within the browser.
The image can then be rendered on a `<canvas>` and/or can be posted as a normal file upload.

js-webcam-screenshot can use dialogs from various frameworks (bootstrap 2, bootstrap 3 or jQUery UI), but it also has support for a basic dialog without dependencies.

## Examples ##

To render the screenshop to a `<canvas>`:

```html
<html>
	<head>
		<script src="//code.jquery.com/jquery-1.11.1.min.js"></script>
		<script src="js/webcam-screenshot.js"></script>
		<script>
			$(document).ready(function() {
				WebcamScreenshot.go({
					width: 300,
					canvas: $('#destination'),
				});
			});
		</script>
	</head>
	<body>
		<canvas id="destination"></canvas>
	</body>
</html>
```

Here's a sample Javascript code that posts the image to an URL:

```javascript
WebcamScreenshot.go(
	{
		width: 500,
		postTo: 'http://www.example.com/your/page',
		postFieldname: 'webcam_shot',
		postImageFormat: 'jpg',
		onBeforePost: function(formData) {
			// Here we can add custom fields to be posted
			formData.append('myfield', 'myvalue');
		} 
	},
	function(code, result) {
		if(code === WebcamScreenshot.RC.OK) {
			alert('Image sent. Result from server:\n' + result);
		}
		else {
			alert('Error!\n' + result);
		} 
	}
);
```

Take a look at the [documentation](http://mlocati.github.io/js-webcam-screenshot/docs/) for the list of [supported options](http://mlocati.github.io/js-webcam-screenshot/docs/WebcamScreenshot.html#goOptions) of [WebcamScreenshot.go](http://mlocati.github.io/js-webcam-screenshot/docs/WebcamScreenshot.html#go).


There's also a [working demo](http://mlocati.github.io/js-webcam-screenshot/) you can look at.