import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import socket from '../ulti/socketio'; // Đảm bảo bạn có file socketio.js

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(true);
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const initializeSocket = async () => {
      await socket.initializeSocket();
    };

    initializeSocket();
    const requestCameraPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    requestCameraPermission();
  }, []);

  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  const captureAndSend = async () => {
    if (!isCameraReady) {
      console.log("Camera is not ready yet.");
      return;
    }
    try {
      const photoData = await cameraRef.current.takePictureAsync({ base64: false });
      console.log('Original image URI:', photoData.uri);

      // Nén ảnh
      const resizedImage = await ImageManipulator.manipulateAsync(
        photoData.uri,
        [{ resize: { width: 800, height: 600 } }], // Điều chỉnh kích thước
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG } // Nén chất lượng
      );

      // Chuyển đổi sang base64
      const compressedBase64Data = await fetch(resizedImage.uri)
        .then(res => res.blob())
        .then(blob => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.readAsDataURL(blob);
        }));
        console.log(compressedBase64Data.length)
      // Gửi dữ liệu đã nén qua socket
      if (socket) {
        socket.emit('request_camera', compressedBase64Data);
      }
    } catch (error) {
      console.error('Error capturing or resizing photo:', error);
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} onCameraReady={onCameraReady} />
      <Button title="Take Picture" onPress={captureAndSend} />
      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  error: {
    color: 'red',
  },
});

export default CameraScreen;
