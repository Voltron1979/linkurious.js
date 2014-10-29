;(function(undefined) {
  'use strict';

  /**
   * Sigma Renderer Image Utility
   * ================================
   *
   * The aim of this plugin is to enable users to retrieve a static image
   * of the graph being rendered.
   *
   * Author: Martin de la Taille (martindelataille)
   * Thanks to: Guillaume Plique (Yomguithereal)
   * Version: 0.0.1
   */

  if (typeof sigma === 'undefined')
    throw 'sigma.renderers.image: sigma not in scope.';

  // Constants
  var mainCanvas = null,
    mainCanvasContext = null;

  var CONTEXTS = ['scene', 'edges', 'nodes', 'labels'],
      TYPES = {
        png: 'image/png',
        jpg: 'image/jpeg',
        gif: 'image/gif',
        tiff: 'image/tiff'
      };

  // Utilities
  function download(dataUrl, extension, filename) {

    // Anchor
    var anchor = document.createElement('a');
    anchor.setAttribute('href', dataUrl);
    anchor.setAttribute('download', filename || 'graph.' + extension);

    // Click event
    var event = document.createEvent('MouseEvent');
    event.initMouseEvent('click', true, false, window, 0, 0, 0 ,0, 0,
      false, false, false, false, 0, null);

    anchor.dispatchEvent(event);
    anchor.remove();
  }

  function calculateAspectRatioFit(srcWidth, srcHeight, maxSize) {
      var ratio = Math.min(maxSize / srcWidth, maxSize / srcHeight);
      return { width: srcWidth*ratio, height: srcHeight*ratio };
   }

  // Main function
  function image() {

    var self = this,
        webgl = this instanceof sigma.renderers.webgl,
        doneContexts = [];

    console.log(webgl)
    // Creating a false canvas where we'll merge main canvas
      mainCanvas = document.createElement('canvas');
      mainCanvasContext = mainCanvas.getContext('2d');
      var sized = false;

    // Iterating through context
    CONTEXTS.forEach(function(name) {
      if (!self.contexts[name])
        return;

      var canvas = self.domElements[name] || self.domElements['scene'],
        context = self.contexts[name];

      if (~doneContexts.indexOf(context))
        return;

      if (!sized) {
        mainCanvas.width = webgl && context instanceof WebGLRenderingContext ?
         canvas.width / 2 :
         canvas.width;
        mainCanvas.height = webgl && context instanceof WebGLRenderingContext ?
          canvas.height / 2 :
          canvas.height;
        sized = true;
      }

      if (context instanceof WebGLRenderingContext)
        mainCanvasContext.drawImage(canvas, 0, 0, canvas.width / 2, canvas.height / 2);
      else
        mainCanvasContext.drawImage(canvas, 0, 0);

      doneContexts.push(context);
    });

    // Cleaning
    var doneContexts = [];
  }

  // Generate image function
 function generateImage (params) {
    params = params || {};

    if(!params.size)
      params.size = window.innerWidth;

    if (params.format && !(params.format in TYPES))
      throw Error('sigma.renderers.image: unsupported format "' +
                  params.format + '".');

    var self = this,
        webgl = this instanceof sigma.renderers.webgl,
        doneContexts = [];

    // Creating a false canvas
      var merged = document.createElement('canvas'),
          mergedContext= merged.getContext('2d'),
          sized = false;

    // Iterating through context
    CONTEXTS.forEach(function(name) {
      if (!self.contexts[name])
        return;

      if (params.labels === false && name === 'labels')
        return;

      var canvas = self.domElements[name] || self.domElements['scene'],
        context = self.contexts[name];

      if (~doneContexts.indexOf(context))
        return;

      if (!sized) {
        // Keep ratio
        if(!params.zoom) {
          var width = mainCanvas.width,
            height = mainCanvas.height;
        } else {
          var width = canvas.width,
            height = canvas.height;
        }

        var ratio = calculateAspectRatioFit(width, height, params.size)

        merged.width= ratio.width;
        merged.height = ratio.height;

        if (!context instanceof WebGLRenderingContext) {
          merged.width *= 2;
          merged.height *=2;
        }

        sized = true;

        // background color
        if (params.background) {
          mergedContext.rect(0, 0, merged.width, merged.height);
          mergedContext.fillStyle = params.background;
          mergedContext.fill();
        }
      }

      if(params.zoom)
        mergedContext.drawImage(canvas, 0, 0, merged.width, merged.height);
      else
        mergedContext.drawImage(mainCanvas, 0, 0, merged.width, merged.height);

      doneContexts.push(context);
    });

    var dataUrl = merged.toDataURL(TYPES[params.format || 'png']);

    if(params.download)
      download(
        dataUrl,
        params.format || 'png',
        params.filename
      );

    // Cleaning
    mergedContext = null;
    merged  = null;
    doneContexts = [];

    return dataUrl;
  }

  // Extending canvas and webl renderers
  sigma.renderers.canvas.prototype.image = image;
  sigma.renderers.canvas.prototype.generateImage = generateImage;

  sigma.renderers.webgl.prototype.image = image;
  sigma.renderers.webgl.prototype.generateImage = generateImage;

}).call(this);