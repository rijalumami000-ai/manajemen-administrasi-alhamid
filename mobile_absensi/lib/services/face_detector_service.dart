import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'dart:ui';

class FaceDetectorService {
  late FaceDetector _faceDetector;

  FaceDetectorService() {
    _faceDetector = FaceDetector(
      options: FaceDetectorOptions(
        enableContours: true,
        enableClassification: true,
        performanceMode: FaceDetectorMode.accurate,
      ),
    );
  }

  FaceDetector get faceDetector => _faceDetector;

  // Mendeteksi wajah dari gambar kamera
  Future<List<Face>> getFacesFromImage(CameraImage image, CameraDescription camera) async {
    final WriteBuffer allBytes = WriteBuffer();
    for (final Plane plane in image.planes) {
      allBytes.putUint8List(plane.bytes);
    }
    final bytes = allBytes.done().buffer.asUint8List();

    final Size imageSize = Size(image.width.toDouble(), image.height.toDouble());
    final InputImageRotation imageRotation = _rotationIntToEnum(camera.sensorOrientation);
    final InputImageFormat inputImageFormat = _formatIntToEnum(image.format.raw);

    final inputImageData = InputImageMetadata(
      size: imageSize,
      rotation: imageRotation,
      format: inputImageFormat,
      bytesPerRow: image.planes[0].bytesPerRow,
    );

    final inputImage = InputImage.fromBytes(
      bytes: bytes,
      metadata: inputImageData,
    );

    return await _faceDetector.processImage(inputImage);
  }

  InputImageRotation _rotationIntToEnum(int rotation) {
    switch (rotation) {
      case 90:
        return InputImageRotation.rotation90deg;
      case 180:
        return InputImageRotation.rotation180deg;
      case 270:
        return InputImageRotation.rotation270deg;
      default:
        return InputImageRotation.rotation0deg;
    }
  }

  InputImageFormat _formatIntToEnum(int format) {
    // Penyesuaian format gambar untuk Android/iOS
    return InputImageFormat.nv21;
  }

  void dispose() {
    _faceDetector.close();
  }
}
