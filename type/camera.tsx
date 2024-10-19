import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button, View, Text, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera'; // Sử dụng Camera từ expo-camera
import socket from '../ulti/socketio';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(true); // Trạng thái quyền truy cập camera
  const [cameraOpen, setCameraOpen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    // Kết nối tới Socket.IO server
    socket.initializeSocket();

   // Request quyền truy cập camera

  }, []);

  useEffect(() => {
    // Yêu cầu quyền truy cập camera
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync(); // Sử dụng Camera
      setHasPermission(status === 'granted');
    })();
  }, []);

  const openCamera = useCallback(() => {
    setCameraOpen(true); // Đặt trạng thái camera mở
  }, []);

  const onCameraReady = useCallback(() => {
    setIsCameraReady(true); // Camera đã sẵn sàng để sử dụng
    startCapturing(); // Bắt đầu chụp khi camera sẵn sàng
  }, []);

  const startCapturing = useCallback(() => {
    if (isCameraReady && !isCapturing) {
      setIsCapturing(true);
      let captureInterval = setInterval(async () => {
        if (cameraRef.current) {
          try {
            const photo = await cameraRef.current.takePictureAsync({ base64: true }); // Chụp ảnh từ Camera
            const imageData = photo.base64;
            socket.emit('send_image', imageData);
            console.log('Image sent:', imageData); // Log ảnh được gửi
          } catch (error) {
            console.error('Error capturing image:', error);
            clearInterval(captureInterval); // Dừng chụp nếu xảy ra lỗi
          }
        }
      }, 50); // Chụp 20 tấm mỗi giây (1000ms/20 = 50ms giữa mỗi lần chụp)
    }
  }, [isCameraReady, isCapturing]);

  if (hasPermission === null) {
    return <View />;
  }

  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      {cameraOpen ? (
        <Camera 
          style={styles.camera} 
          ref={cameraRef} 
          onCameraReady={onCameraReady} // Chờ camera sẵn sàng
        />
      ) : (
        <Button title="Open Camera" onPress={openCamera} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
});

export default React.memo(CameraScreen);
