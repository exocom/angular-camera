'use strict';

angular.module('omr.directives', [])
  .directive 'ngCamera', ($timeout, $sce) ->
    template: '/bower_components/angular-camera/dist/angular-camera.html'
    replace: true
    restrict: 'E'
    scope:
      type: '@'
      captureCallback: '&capture'
      captureMessage: '='
      isOn: '='
      videoQuality: "@"
      imageFormat: '@'
    link: (scope, element, attrs) ->
      imageFormats:
        jpeg: 'image/jpeg'
        jpg: 'image/jpeg'
        gif: 'image/gif'
        webp: 'image/webp'

      resolutionConstraints:
        qvga:
          video:
            mandatory:
              maxWidth: 320
              maxHeight: 180
        vga:
          video:
            mandatory:
              maxWidth: 640
              maxHeight: 360
        hd:
          video:
            mandatory:
              minWidth: 1280
              minHeight: 720
        default:
          video: true

      scope.canvas = element.find('canvas')
      scope.video = element.find('video')

      scope.camerOn = false

      # Remap common references
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia
      window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL

      scope.$on('$destroy', () ->
        scope.stop()
      )

      scope.stop = () ->
        scope.video.src = null
        scope.cameraOn = false
        scope.errorLoadingCamera = false
        if scope.stream and typeof scope.stream.stop == 'function'
          scope.stream.stop()
          return
        else
          scope.stream = null
          return

      scope.start = ->
        scope.stop()
        constraints = if scope.videoQuality and resolutionConstraints.hasOwnProperty(scope.videoQuality.toLowerCase()) then resolutionConstraints[scope.videoQuality.toLowerCase()] else resolutionConstraints.default
        navigator.getUserMedia(
          constraints
        , (stream) ->
          scope.$apply ->
            scope.stream = stream
            scope.cameraOn = true
            scope.videoStream = $sce.trustAsResourceUrl(window.URL.createObjectURL(stream))
            return
        , (error) ->
          scope.$apply ->
            scope.cameraOn = false
            scope.errorLoadingCamera = true
            scope.videoStream = null
      )

      scope.takePicture = ->
        if scope.stream
          video = scope.video[0]

        return

      scope.$watch 'cameraOn', (newVal, oldVal) ->
        if typeof scope.isOn != 'undefined'
          scope.isOn = newVal
          return