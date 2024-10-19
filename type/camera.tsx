import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import socket from '../ulti/socketio';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(true);
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureInterval, setCaptureInterval] = useState<NodeJS.Timeout | null>(null); // Định nghĩa kiểu rõ ràng

  useEffect(() => {
    socket.initializeSocket();

   
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const startCapturing = async () => {

    setIsCapturing(true);
    const interval = setInterval(async () => {
      if (cameraRef.current) {
        try {
          const photoData = await cameraRef.current.takePictureAsync({ base64: true });
          setPhoto(photoData);
          socket.emit('request_camera', photoData.base64);
        } catch (error) {
          console.error('Lỗi chụp ảnh:', error);
        }
      }
    }, 100); // 50ms giữa mỗi lần chụp (20 tấm/giây)

    setCaptureInterval(interval); // Lưu interval vào state
  };

  const onCameraReady = async () => {
    if (!isCapturing) {
      await startCapturing();
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
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default CameraScreen;
