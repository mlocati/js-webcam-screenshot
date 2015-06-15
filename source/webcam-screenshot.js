/**
* @project js-webcam-screenshot <http://github-com/mlocati/js-webcam-screenshot>
* @author Michele Locati <mlocati@gmail.com>
* @license
*   in English: do what you want with this code, but don't sue me for problems
*   in Legal: MIT license (http://opensource.org/licenses/MIT)
*
* This code is based on https://github.com/codepo8/interaction-cam
* by Christian Heilmann
*/

/* jshint unused:vars, undef:true, browser:true */
/* global jQuery */

(function(w, $) {
'use strict';

var
  getUserMedia = w.navigator.getUserMedia || w.navigator.webkitGetUserMedia || w.navigator.mozGetUserMedia || w.navigator.msGetUserMedia || null,
  isSupported = (getUserMedia && w.FormData) ? true : false;

if(isSupported) {
  w.navigator._webcamScreenshotgetUserMedia = getUserMedia;
}

/** The namespace of js-webcam-screenshot.
* @global
* @namespace
*/
var WebcamScreenshot = {
  /** The current version of WebcamScreenshot.
  * @static
  * @constant
  * @default
  * @type {string}
  */
  VERSION: '0.1.0',
  /** The default name of the image field to be posted.
  * @static
  * @default
  * @type {string}
  */
  DEFAULT_POST_FIELDNAME: 'image',
  /** Returns <code>true</code> if the browser is supported, <code>false</code> otherwise.
  * @return {boolean} 
  */
  getIsSpported: function() {
    return isSupported;
  },
  /** Possible code values passed to the [<code>callback</code>]{@link WebcamScreenshot.goBeforePostCallback} of the [<code>go()</code> method]{@link WebcamScreenshot.go}.
  * @static
  * @readonly
  * @enum {number}
  */
  RC: {
    /** All good. */
    OK: 0,
    /** User cancelled. */
    USER_CANCELLED: 1,
    /** Browser is not supported. */
    UNSUPPORTED_BROWSER: 2,
    /** Error accessing the webcam. */
    CANT_ACCESS_WEBCAM: 3,
    /** Error thrown by the callback called just before posting data. */
    SAVE_CALLBACKERROR: 4,
    /** Error while posting the image. */
    SAVE_FAILED: 5,
    /** Missing or invalid popoverFor option. */
    MISSING_OPTION_POPOVERFOR: 5
  },
  /** Take a shot with the webcam.
  * @param {WebcamScreenshot.goOptions} [options] - Options.
  * @param {WebcamScreenshot.goCallback} [callback] - A function that will be called at the end.
  * @static
  */
  go: function(options, callback) {
    if(!callback) {
      callback = function() {};
    }
    if(!isSupported) {
      callback(WebcamScreenshot.RC.UNSUPPORTED_BROWSER, 'Browser is not supported.');
      return;
    }
    options = $.extend(true, {parent: w.document.body, width: 300, cancelText: 'Cancel', takeText: 'Take it', dialogFramework: '', dialogTitle: 'Screenshot from webcam'}, options || {});
    switch(options.dialogFramework) {
      case 'bs2':
      case 'bs3':
      case 'jQueryUI':
        break;
      case 'bs3popover':
        if ((!options.popoverFor instanceof $) || (options.popoverFor.length !== 1)) {
          callback(WebcamScreenshot.RC.MISSING_OPTION_POPOVERFOR, 'Missing or invalid popoverFor option.');
          return;
        }
        break;
      default:
        options.dialogFramework = '';
        break;
    }
    var
      video = w.document.createElement('video'),
      $shadow = null,
      $dialog = null,
      height = null,
      currentStream = null,
      resize = function() {
        if($shadow) {
          $shadow.css({width: $(w).width(), height: $(w).height()});
        }
        if($dialog && (options.dialogFramework === '') && (options.dialogFramework !== 'bs3popover')) {
          $dialog.css('left', ($(w).width() - options.width) / 2 + 'px');
        }
      },
      dispose = function() {
        $(w).off('resize', resize);
        if($shadow) {
          $shadow.remove();
          $shadow = null;
        }
        if($dialog) {
          switch(options.dialogFramework) {
            case 'bs2':
            case 'bs3':
              $dialog.modal('hide').remove();
              break;
            case 'jQueryUI':
              $dialog.dialog('destroy');
              break;
            case 'bs3popover':
              options.popoverFor.off('shown.bs.popover');
              options.popoverFor.off('hidden.bs.popover');
              options.popoverFor.popover('hide').popover('destroy');
              $dialog.remove();
              break;
            default:
              $dialog.remove();
              break;
          }
          $dialog = null;
        }
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
    var doCancel = function() {
      dispose();
      callback(WebcamScreenshot.RC.USER_CANCELLED, 'User cancelled.');
    };
    var doTake = function() {
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
        WebcamScreenshot.canvasToFormData(formData, options.postFieldname || WebcamScreenshot.DEFAULT_POST_FIELDNAME, canvas, options.postImageFormat);
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
        var ajaxData = {
            url: options.postTo,
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST'
        };
        if(options.postReturnDataType) {
          ajaxData.dataType = options.postReturnDataType;
        }
        $.ajax(ajaxData)
          .fail(function(jqXHR, textStatus, errorThrown) {
            w.alert(errorThrown);
          })
          .success(function(data) {
            dispose();
            callback(WebcamScreenshot.RC.OK, data);
          })
        ;
        return;
      }
      dispose();
      callback(WebcamScreenshot.RC.OK);
    };
    $shadow = $('<div class="webcamscreenshot-shadow" />');
    $(w).on('resize', resize);
    resize();
    $(options.parent).append($shadow);
    switch(options.dialogFramework) {
      case 'bs2':
        $dialog = $([
          '<div class="modal hide" role="dialog">',
            '<div class="modal-header">',
              '<button type="button" class="close">&times;</button>',
              '<h3></h3>',
            '</div>',
            '<div class="modal-body"></div>',
            '<div class="modal-footer"></div>',
          '</div>',
        ''].join(''));
        $dialog.find('button.close').on('click', function() { doCancel(); });
        $dialog.find('.modal-header h3').text(options.dialogTitle);
        $dialog.find('.modal-body').append(video);
        $dialog.find('.modal-footer')
          .append($('<button class="btn" />')
            .html(options.cancelText)
            .on('click', function() {
              doCancel();
            })
          )
          .append($('<button class="btn btn-primary" />')
            .html(options.takeText)
            .on('click', function() {
              doTake();
            })
          )
        ;
        $(options.parent).append($dialog);
        break;
      case 'bs3':
        $dialog = $([
          '<div class="modal">',
            '<div class="modal-dialog">',
              '<div class="modal-content">',
                '<div class="modal-header">',
                  '<button type="button" class="close">&times;</button>',
                  '<h4 class="modal-title"></h4>',
                '</div>',
                '<div class="modal-body"></div>',
                '<div class="modal-footer"></div>',
              '</div>',
            '</div>',
          '</div>',
        ''].join(''));
        $dialog.find('button.close').on('click', function() { doCancel(); });
        $dialog.find('.modal-title').text(options.dialogTitle);
        $dialog.find('.modal-body').append(video);
        $dialog.find('.modal-footer')
          .append($('<button type="button" class="btn btn-default" />')
            .html(options.cancelText)
            .on('click', function() {
              doCancel();
            })
          )
          .append($('<button type="button" class="btn btn-primary" />')
            .html(options.takeText)
            .on('click', function() {
              doTake();
            })
          )
        ;
        $(options.parent).append($dialog);
        break;
      case 'jQueryUI':
        $dialog = $('<div />');
        $dialog.append(video);
        $dialog.dialog({
          appendTo: options.parent,
          autoOpen: false,
          closeText: options.cancelText,
          modal: true,
          resizable: false,
          title: options.dialogTitle,
          width: options.width + 40,
          close: function() {
            dispose();
          },
          buttons: [
            {
              text: options.cancelText,
              click: function() {
                doCancel();
              }
            },
            {
              text: options.takeText,
              click: function() {
                doTake();
              }
            }
          ]
        });
        break;
      case 'bs3popover':
        $dialog = $('<div class="webcamscreenshot-dialog" />')
          .css({width: (options.width) + 'px'})
          .append(video)
          .append($('<div class="webcamscreenshot-buttons" />')
            .append($('<button />')
              .html(options.takeText)
              .on('click', function() {
                doTake();
              })
            )
            .append($('<button />')
              .html(options.cancelText)
              .on('click', function() {
                doCancel();
              })
            )
          )
        ;
        options.popoverFor.popover({
          title: options.dialogTitle,
          html: true,
          content: $dialog
        });
        options.popoverFor.on('shown.bs.popover', function() {
          var $po = $dialog.closest('.popover');
          $po.css('max-width', 'none');
          $po.find('.popover-title').css('white-space', 'nowrap');
          $po.find('.webcamscreenshot-buttons').css('white-space', 'nowrap');
        });
        options.popoverFor.off('hidden.bs.popover', function() {
          destroy();
        });
        break;
      default:
        $dialog = $('<div class="webcamscreenshot-dialog" />');
        $(options.parent).append($dialog);
        $dialog
          .append(video)
          .append($('<div class="webcamscreenshot-buttons" />')
            .append($('<button />')
              .html(options.takeText)
              .on('click', function() {
                doTake();
              })
            )
            .append($('<button />')
              .html(options.cancelText)
              .on('click', function() {
                doCancel();
              })
            )
          )
        ;
        break;
    }
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
        currentStream = stream;
        if(w.navigator.mozGetUserMedia) {
          video.mozSrcObject = currentStream;
        }
        else {
          var url = w.URL || w.webkitURL;
          video.src = (url && url.createObjectURL) ? url.createObjectURL(currentStream) : currentStream;
        }
        video.play();
        switch(options.dialogFramework) {
          case 'bs2':
          case 'bs3':
            $shadow.remove();
            $shadow = null;
            $dialog.modal('show');
            break;
          case 'jQueryUI':
            $shadow.remove();
            $shadow = null;
            $dialog.dialog('open');
            break;
          case 'bs3popover':
            $shadow.remove();
            $shadow = null;
            options.popoverFor.popover('show');
            break;
        }
      },
      function(err) {
        dispose();
        callback(WebcamScreenshot.RC.CANT_ACCESS_WEBCAM, err.message || err.name || err.toString());
      }
    );
  },
  /** Helper function to add the image represented in a <code>&lt;canvas&gt;</code> to a <code>FormData</code> instance for posting.
  * @param {FormData} formData - The <code>FormData</code> instance to add the image to.
  * @param {string} fieldName - The name of the field that will contain the image data.
  * @param {HTMLCanvasElement} canvas - A <code>&lt;canvas&gt;</code> DOM element.
  * @param {string} [imageFormat='png'] The format of the image (accepted values: <code>'jpg'</code>, <code>'png'</code>).
  */
  canvasToFormData: function(formData, fieldName, canvas, imageFormat) {
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
};


/** The options for [<code>go()</code> method]{@link WebcamScreenshot.go}
* @typedef {Object} WebcamScreenshot.goOptions
* @property {number} [width=300] - The width of the image to be taken (in pixels).
* @property {string} [cancelText='Cancel'] - The text (html is accepted) to show for the "Cancel" button.
* @property {string} [takeText='Take it'] - The text (html is accepted) to show for the "Take it" button.
* @property {HTMLElement} [parent=window.document.body] - The DOM node to which we'll append our DOM nodes.
* @property {HTMLCanvasElement|HTMLCanvasElement[]|jQuery} [canvas=null] - The &lt;canvas&gt; DOM node to which we'll render the taken shot (it can also be a jQuery object or an array of DOM nodes).
* @property {jQuery} [popoverFor=null] - The jQuery object to which the popover should be associated (required if dialogFramework is 'bs3popover').
* @property {string} [postTo] - If specified, we'll post the taken shot to this URL (as a form POST).
* @property {string} [postFieldname] - If postTo, this will be the name of the field containing the image (defaults to WebcamScreenshot.DEFAULT_POST_FIELDNAME).
* @property {string} [postImageFormat='png'] - The file format of the data to send (accepted values: <code>'jpg'</code>, <code>'png'</code>).
* @property {string} [postReturnDataType] - The type of data that you're expecting back from the server. For possible values see thee description of the <code>dataType</code> options of [<code>jQuery.ajax()</code>]{@link http://api.jquery.com/jquery.ajax/}. 
* @property {WebcamScreenshot.goBeforePostCallback} [onBeforePost] - A function that will be called before posting the image.
* @property {string} [dialogFramework] - The optional framework to use to show the dialog. Allowed values:
* <ul>
*   <li><code>'bs2'</code> for Bootstrap 2</li>
*   <li><code>'bs3'</code> for Bootstrap 3</li>
*   <li><code>'jQueryUI'</code> for jQuery UI</li>
*   <li><code>'bs3popover'</code> for Bootstrap3 Popover</li>
* </ul>
* @property {string} [dialogTitle='Screenshot from webcam'] - The title of the dialog (used only if <code>dialogFramework</code> is specified).
*/

/** This callback is called just before POSTing the image.
* @callback WebcamScreenshot.goBeforePostCallback
* @param {FormData} formData - The <code>FormData</code> instance that's going to be posted. Useful to add other values to the POST (example: <code>formData.append('myfield', 'myvalue');</code>).
*/

/** Callback called after the [<code>go()</code> method]{@link WebcamScreenshot.go} ends.
* @callback WebcamScreenshot.goCallback
* @param {WebcamScreenshot.RC} code - One of the <code>WebcamScreenshot.RC</code> values.
* @param {(string|Object)} [result] - This value may be:
* <ul>
*   <li>If <code>code</code> is not <code>WebcamScreenshot.RC.OK</code> &rarr; <code>result</code> will contain error description ({string}).</li>
*   <li>If <code>code</code> is <code>WebcamScreenshot.RC.OK</code>:
*    <ul>
*      <li>If the <code>postTo</code> option has been specified &rarr; <code>result</code> will contain the response from the server.</li>
*      <li>If the <code>postTo</code> optionw wasn't set &rarr; <code>result</code> will be <code>undefined</code>.</li>
*    </ul>
*  </li>
* </ul>
*/

w.WebcamScreenshot = WebcamScreenshot;
})(window, jQuery);
