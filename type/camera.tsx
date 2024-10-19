import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import socket from '../ulti/socketio';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(true);
  const cameraRef = useRef(null);
  const [counter, setCounter] = useState(0);
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

  const startCapturing = () => {
    setIsCapturing(true);
    const interval = setInterval(async () => { 
      setCounter(prevCounter => prevCounter + 1);
  
      if (cameraRef.current) {
        try {
          const photoData = await cameraRef.current.takePictureAsync({ base64: true });
          socket.emit('request_camera', photoData.base64);
        } catch (error) {
          console.error('Lỗi chụp ảnh:', error);
        }
      }
    }, 100); // 10 tấm/giây
  
    return () => clearInterval(interval); // Dọn dẹp interval khi không còn cần thiết
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