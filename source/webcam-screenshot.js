/**
* @project js-webcam-screenshot <http://github-com/mlocati/js-webcam-screenshot>
* @author Michele Locati <mlocati@gmail.com>
* @license
* 	in English: do what you want with this code, but don't sue me for problems
* 	in Legal: MIT license (http://opensource.org/licenses/MIT)
*
* This code is based on https://github.com/codepo8/interaction-cam
* by Christian Heilmann
*/

/* jshint unused:vars, undef:true, browser:true */
/* global jQuery */

(function(w, $) {
'use strict';
var getUserMedia = w.navigator.getUserMedia || w.navigator.webkitGetUserMedia || w.navigator.mozGetUserMedia || w.navigator.msGetUserMedia || null;
if(getUserMedia) {
	w.navigator._webcamScreenshotgetUserMedia = getUserMedia;
}
var isSupported = (getUserMedia && w.FormData) ? true : false;

function canvasToFormData(formData, fieldName, canvas, imageFormat) {
	var mimeType, filename;
	switch(imageFormat) {
		case 'jpg':
			mimeType = 'image/jpeg';
			filename = 'image.jpg';
			break;
		case 'png':
			/* falls through */
		default:
			mimeType = 'image/png';
			filename = 'image.png';
			break;
	}
	var done = function(blob) {
		formData.append(fieldName, blob, filename);
	};
	var i, L;
	for(L = ['getAsFile', 'getAsBlob', 'webkitGetAsFile', 'webkitGetAsBlob', 'mozGetAsFile', 'mozGetAsBlob', 'msGetAsFile', 'msGetAsBlob'], i = 0; i < L.length; i++) {
		if(canvas[L[i]]) {
			done(canvas[L[i]](filename));
			return;
		}
	}
	var chunks = canvas.toDataURL(mimeType).split(',');
	var binaryString;
	if (chunks[0].indexOf('base64') >= 0) {
		binaryString = w.atob(chunks[1]);
	}
	else {
		binaryString = w.unescape(chunks[1]);
	}
	var length = binaryString.length;
	if(w.Blob) {
		var array = new Array(length);
		for(i = 0; i < length; i++) {
			array[i] = binaryString.charCodeAt(i);
		}
		done(new w.Blob([new w.Uint8Array(array)], {type: mimeType}));
	}
	else {
		var arrayBuffer = new w.ArrayBuffer(length), byteArray = new w.Uint8Array(arrayBuffer);
		for (i = 0; i < length; i++) {
			byteArray[i] = binaryString.charCodeAt(i);
		}
		var bb = new w.BlobBuilder();
		bb.append(arrayBuffer);
		done(bb.getBlob(mimeType));
	}
}

/** Take a shot with the webcam.
* @global
* @alias window.WebcamScreenshot
* @param {WebcamScreenshotOptions} [options] - Options.
* @param {WebcamScreenshotCallback} [callback] - A function that will be called on end.
*/
function WebcamScreenshot(options, callback) {
	if(!callback) {
		callback = function() {};
	}
	if(!isSupported) {
		callback(WebcamScreenshot.RC.UNSUPPORTED_BROWSER, 'Browser is not supported');
		return;
	}
	options = $.extend(true, {parent: w.document.body, width: 300, cancelText: 'Cancel', takeText: 'Take it'}, options || {});
	var
		video = w.document.createElement('video'),
		$buttons,
		$divShadow = $('<div class="webcamscreenshot-shadow" />'),
		$divDialog = $('<div class="webcamscreenshot-dialog" />'),
		height = null,
		currentStream = null,
		resize = function() {
			$divShadow.css({width: $(w).width(), height: $(w).height()});
			$divDialog.css('left', ($(w).width() - options.width) / 2 + 'px');
		},
		dispose = function() {
			$(w).off('resize', resize);
			$divDialog.remove();
			$divShadow.remove();
			if(currentStream) {
				try {
					currentStream.stop();
				}
				catch(e) {
				}
				currentStream = null;
			}
		}
	;
	$(w).on('resize', resize);
	resize();
	$divDialog
		.append(video)
		.append($buttons = $('<div class="webcamscreenshot-buttons" />'))
	;
	$(options.parent).append($divShadow);
	video.addEventListener(
		'canplay',
		function(e) {
			height = Math.ceil(options.width * video.videoHeight / video.videoWidth);
			video.setAttribute('width', options.width);
			video.setAttribute('height', height);
		},
		false
	);
	w.navigator._webcamScreenshotgetUserMedia(
		{
			video: true,
			audio: false
		},
		function(stream) {
			$(options.parent).append($divDialog);
			currentStream = stream;
			if(w.navigator.mozGetUserMedia) {
				video.mozSrcObject = currentStream;
			}
			else {
				var url = w.URL || w.webkitURL;
				video.src = (url && url.createObjectURL) ? url.createObjectURL(currentStream) : currentStream;
			}
			video.play();
			$buttons
				.append($('<button />')
					.html(options.takeText)
					.on('click', function() {
						var i;
						if(options.canvas) {
							var canvasList = [];
							if(options.canvas instanceof $) {
								canvasList = options.canvas;
							}
							else if (options.canvas instanceof Array) {
								canvasList = options.canvas;
							}
							else {
								canvasList = [options.canvas];
							}
							for(i = 0; i < canvasList.length; i++) {
								canvasList[i].setAttribute('width', options.width);
								canvasList[i].setAttribute('height', height);
								canvasList[i].getContext('2d').drawImage(video, 0, 0, options.width, height);
							}
						}
						if(options.postTo) {
							var canvas = w.document.createElement('canvas'), formData = new w.FormData();
							canvas.setAttribute('width', options.width);
							canvas.setAttribute('height', height);
							canvas.getContext('2d').drawImage(video, 0, 0, options.width, height);
							canvasToFormData(formData, options.postFieldname || WebcamScreenshot.DEFAULT_POST_FIELDNAME, canvas, options.postImageFormat);
							if(options.onBeforePost) {
								try {
									options.onBeforePost(formData);
								}
								catch(err) {
									dispose();
									callback(WebcamScreenshot.RC.SAVE_CALLBACKERROR, err.message || err.name || err.toString());
									return;
								}
							}
							$.ajax({
							    url: options.postTo,
							    data: formData,
							    cache: false,
							    contentType: false,
							    processData: false,
							    type: 'POST'
							})
							.fail(function(jqXHR, textStatus, errorThrown) {
								w.alert(errorThrown);
							})
							.success(function(data) {
								dispose();
								callback(WebcamScreenshot.RC.OK);
							});
							return;
						}
						dispose();
						callback(WebcamScreenshot.RC.OK);
					})
				)
				.append($('<button />')
					.html(options.cancelText)
					.on('click', function() {
						dispose();
						callback(WebcamScreenshot.RC.USER_CANCELLED, 'User cancelled');
					})
				)
			;
		},
		function(err) {
			dispose();
			callback(WebcamScreenshot.RC.CANT_ACCESS_WEBCAM, err.message || err.name || err.toString());
		}
	);
}
/**
* @global
* @alias WebcamScreenshot.getIsSpported
*/
WebcamScreenshot.getIsSpported = function() {
	return isSupported;
};
/**
* @global
* @alias WebcamScreenshot.VERSION
*/
WebcamScreenshot.VERSION = '0.1.0';
/**
* @global
* @alias WebcamScreenshot.DEFAULT_POST_FIELDNAME
*/
WebcamScreenshot.DEFAULT_POST_FIELDNAME = 'image';
/**
* Possible code values of main callback.
* @readonly
* @enum {number}
* @global
* @alias WebcamScreenshot.RC
*/
WebcamScreenshot.RC = {
	/** All good */
	OK: 0,
	/** User cancelled */
	USER_CANCELLED: 1,
	/** Browser is not supported */
	UNSUPPORTED_BROWSER: 2,
	/** Error accessing the webcam */
	CANT_ACCESS_WEBCAM: 3,
	/** Error thrown by the callback called just before posting data */
	SAVE_CALLBACKERROR: 4,
	/** Error while posting the image */
	SAVE_FAILED: 5
};

/** The options for WebcamScreenshot.
* A number, or a string containing a number.
* @typedef {Object} WebcamScreenshotOptions
* @property {number} [width=300] - The width of the image to be taken.
* @property {string} [cancelText='Cancel'] - The text (html is accepted) to show for the "Cancel" button.
* @property {string} [takeText='Take it'] - The text (html is accepted) to show for the "Take it" button.
* @property {Object} [parent=window.document.body] - The DOM node to which we'll append our DOM nodes.
* @property {Object|jQuery|Array.Object} [canvas=null] - The &lt;canvas&gt; DOM node to which we'll render the taken shot (it can also be a jQuery object or an array of DOM nodes).
* @property {string} [postTo] - If specified, we'll post the taken shot to this URL (as a form POST).
* @property {string} [postFieldname] - If postTo, this will be the name of the field containing the image (defaults to WebcamScreenshot.DEFAULT_POST_FIELDNAME).
* @property {string} [postImageFormat='png'] - The file format of the data to send. Accepted values: 'png', 'jpg' 
* @property {WebcamScreenshotBeforePostCallback} [onBeforePost] - A function that will be called before posting the image
*/

/** This callback is called just before POSTing the image.
* @callback WebcamScreenshotBeforePostCallback
* @param {FormData} formData - The FormData instance that's going to be posted. Useful to add other values to the POST (example: formData.append('myfield', 'myvalue))
*/

/** This callback is called after WebcamScreenshot finishes.
* @callback WebcamScreenshotCallback
* @param {number} code - One of the WebcamScreenshot.RC values.
* @param {string} [errorDescription] - The error description (if code is not WebcamScreenshot.RC.OK).
*/

w.WebcamScreenshot = WebcamScreenshot;
})(window, jQuery);
