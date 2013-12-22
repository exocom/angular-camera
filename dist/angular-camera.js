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
					videoQuality: '@',
					imageFormat: '@'
				},
				link: function (scope, element, attrs) {
					var imageFormats = {
						jpeg: 'image/jpeg',
						jpg: 'image/jpeg',
						gif: 'image/gif',
						webp: 'image/jpeg'
					};

					// TODO : Allow user to pass a resolution constraint - by default use NONE
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

					scope.$on('$destroy', scope.stop);

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
						if (scope.stream) {

							// Force the canvas to be the size of the video stream, actual video size does not matter!

							var video = scope.video[0];
							scope.canvas.css({width: video.videoWidth, height: video.videoHeight});
							scope.canvas[0].width = video.videoWidth;
							scope.canvas[0].height = video.videoHeight;

							// Do this every time we take a picture so that the entire video is captured
							var context = scope.canvas[0].getContext('2d');
							context.drawImage(scope.video[0], 0, 0);

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