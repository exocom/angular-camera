(function () {
	'use strict';
	angular.module('omr.directives', []).directive('ngCamera', [
		'$timeout',
		'$sce',
		function ($timeout, $sce) {
			return {
				templateUrl: '/bower_components/angular-camera/dist/angular-camera.html',
				replace: true,
				restrict: 'E',
				scope: {
					type: '@',  // photo or video
					captureCallback: '&capture',
					captureMessage: '=',
					isOn: '=',
					videoQuality: '=',
					imageFormat: '=',
					width: '=',
					height: '=',
					keepAspect: '='
				},
				link: function (scope, element, attrs) {
					var imageFormats = {
						jpeg: 'image/jpeg',
						jpg: 'image/jpeg',
						gif: 'image/gif',
						webp: 'image/webp'
					};

					var resolutionConstraints = {
						qvga: {
							video: {
								mandatory: {
									maxWidth: 320,
									maxHeight: 180
								}
							}
						},
						vga: {
							video: {
								mandatory: {
									maxWidth: 640,
									maxHeight: 360
								}
							}
						},
						hd: {
							video: {
								mandatory: {
									minWidth: 1280,
									minHeight: 720
								}
							}
						},
						default: {
							video: true
						}
					};

					// Store the canvas and the video elements for use in methods!
					scope.canvas = element.find('canvas');
					scope.video = element.find('video');

					scope.cameraOn = false; // The camera has not been approved by the user

					navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
					window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

					scope.$on('$destroy',function(){
						scope.stop();
					});

					scope.stop = function () {
						if (scope.stream && typeof scope.stream.stop === 'function') {
							scope.stream.stop();
						} else {
							scope.stream = null;
						}
						scope.video.src = null; // Just in case, let's manually set the video src
						scope.cameraOn = false;
						scope.errorLoadingCamera = false;
					};

					scope.start = function () {
						scope.stop();

						// Allow the user to specify the video constraints
						var constraints;
						if(scope.videoQuality && resolutionConstraints.hasOwnProperty(scope.videoQuality.toLowerCase())){
							constraints = resolutionConstraints[scope.videoQuality.toLowerCase()];
						} else {
							constraints = resolutionConstraints.default;
						}
						navigator.getUserMedia(constraints, function (stream) {
							return scope.$apply(function () {
								scope.stream = stream;
								scope.cameraOn = true;
								scope.videoStream = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream));
							});

						}, function (error) {
							scope.$apply(function () {
								scope.cameraOn = false;
								scope.errorLoadingCamera = true;
								scope.videoStream = null;
							});
						});
					};

					scope.takePicture = function () {
						var w,h;

						function setDimensions(){
							w = video.videoWidth;
							h = video.videoHeight;
						}

						function wh(){
							w = aspectRatio * scope.height;
							h = scope.height;
						}
						function hw(){
							h = scope.width / aspectRatio;
							w = scope.width;
						}

						if (scope.stream) {
							var video = scope.video[0];
							setDimensions();
							var aspectRatio = w / h;

							// Determine how to skew the image
							// Set defaults for width and height to be 100% of the stream

							if(scope.width || scope.height){
								if(scope.keepAspect){
									// They want to keep the aspect ratio SO width and height are desired width or desired height

									// Figure out if we should set the height or width
									if(scope.width && scope.height){ // Need to adjust based on best guess
										if(w >=h ) {
											hw();
											if( h > scope.height) {
												setDimensions();
												wh();
											}
										} else {
											wh();
											if( w > scope.width){
												setDimensions();
												hw();
											}
										}
									} else if (scope.width){
										hw();
									} else if (scope.height){
										wh();
									}
								} else if(scope.width && scope.height) {
									// They want to force the image to the specified size, ie they don't care about aspect ration
									w = scope.width;
									h = scope.height;
								}
							}

							// Set the canvas to the desired size of the output image
							scope.canvas.css({width: w, height: h});
							scope.canvas[0].width = w;
							scope.canvas[0].height = h;

							// Do this every time we take a picture so that the entire video is captured
							var context = scope.canvas[0].getContext('2d');
							context.drawImage(scope.video[0], 0, 0, w, h);

							// call the callback and pass the image as picture
							var format;
							if(scope.imageFormat && imageFormats.hasOwnProperty(scope.imageFormat.toLowerCase())){
								format = imageFormats[scope.imageFormat.toLowerCase()];
							} else {
								format = imageFormats.jpeg;
							}
							scope.captureCallback({picture: scope.canvas[0].toDataURL(format)});
						}
					};
					scope.$watch('cameraOn', function (newVal) {
						if (typeof scope.isOn !== 'undefined') {
							scope.isOn = newVal;
						}
					});
				}
			};
		}
	]);
}.call(this));