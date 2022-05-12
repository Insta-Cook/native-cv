import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import {
  Dimensions,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Camera, CameraCapturedPicture } from "expo-camera";
import * as tf from "@tensorflow/tfjs";
import { useEffect, useRef, useState } from "react";
import Canvas from "react-native-canvas";
import { CanvasRenderingContext2D } from "react-native-canvas";
import { drawRect } from "./utils";
import axios from "axios";
import RNFetchBlob from 'rn-fetch-blob';

const TensorCamera = cameraWithTensors(Camera);
let { width, height } = Dimensions.get("window");


export default function App() {
  // const [model, setModel] = useState<cocoSsd.ObjectDetection>();
  let context = useRef<CanvasRenderingContext2D>();
  let canvas = useRef<Canvas>();
  const [camera, setCamera] = useState<Camera>();
  const [cameraPermission, setCameraPermission] = useState<boolean>(false);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [images, setImages] = useState<IterableIterator<tf.Tensor3D>>();
  const [tfReady, setTfReady] = useState(false);

  let textureDims =
    Platform.OS == "ios"
      ? { width: 1080, height: 1920 }
      : { width, height };

  const permisionFunction = async () => {
    // here is how you can get the camera permission
    const cameraPermission = await Camera.requestCameraPermissionsAsync();

    setCameraPermission(cameraPermission.granted);
    if (
      cameraPermission.status !== 'granted'
    ) {
      alert('Permission for camera access needed.');
    }
  };

  const initTF = async () => {
    await tf.ready();
    setTfReady(true);
  }

  useEffect(() => {
    permisionFunction();
    initTF();
  }, []);

  useEffect(() => {
    if ( tfReady && images && cameraPermission ) {
      // recursively call detect
      (async function loop() {
        const t0 = performance.now();
        await detect();
        const t1 = performance.now();
        // console.log("detection took: ", t1 - t0);
        setTimeout(loop, 0);
      })();
    }
  }, [cameraPermission, images, tfReady]);

  const getDetections = async (tensor: number[][][], shape: number[]) => {
    // console.log('sending the blob: ', JSON.stringify(array));
    return new Promise(async (resolve, reject) => {
      // const formData = new FormData();
      // formData.append('tensor', json, 'tensor.k');
      // formData.append('shape', JSON.stringify(shape));

      // let avatar = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]) // Buffer data of image file

      // let formData = new FormData()
      // formData.append('avatar', avatar)

      // console.log('postiiing');
      // RNFetchBlob.fetch(
      //   'POST',
      //   'http://192.168.1.106:3001/predict/tensor',
      //   {
      //     'Content-Type': 'multipart/form-data',    
      //   },
      //   [{name: 'file', filename: 'picture.png', data: 'hahahahahhahahahahahhahahah'}],
      // ).then((res) => {
      //   resolve(res.data);
      // }).catch((err) => {
      //   reject(err);
      // });


      // axios({
      //   method: 'post',
      //   url: 'http://192.168.1.106:3001/predict/tensor',
      //   data: 'blob',
      //   // transformRequest: (d) => d,
      //   headers: {
      //     'Content-Type': blob && blob.type,
      //   }
      // }).then((res) => {
      //   resolve(res.data);
      // }).catch((err) => {
      //   reject(err);
      // });

      // Post via axios or other transport method
      // axios.post('http://192.168.1.106:3001/predict/tensor', formData, {
      //   // transformRequest: (d) => d,
      //   headers: {
      //     "Content-Type": "multipart/form-data",
      //   },
      // }).then((res) => {
      //   resolve(res.data);
      // }).catch((err) => {
      //   reject(err);
      // });

      // Post via axios or other transport method
      axios.post('http://88.251.29.169:80/predict/tensor', {
        payload: {shape: shape, tensor: tensor},
      }, ).then((res) => {
        resolve(res.data);
      }).catch((err) => {
        reject(err);
      });
    });
  };

  const detect = async () => {
    if (!images) return;
    const nextImageTenor = images.next().value;
    if (!nextImageTenor) return;

    // console.log('the tensor: ', nextImageTenor);
    console.log('getting the data');
    const shape = nextImageTenor.shape;
    console.log('the shape: ', shape);

    const array = await nextImageTenor.array();
    // var buffer = Buffer.from(json);
    // console.log('the json: ', json.substring(json.length - 100, json.length));
    console.log('got the array');
    console.log('the json lenght: ', array.length);

    const t0 = performance.now();
    const detections: {
      boxes: number[][],
      inferenceTime: number,
      names: string[],
    } = (await getDetections(array, shape).then((detections) => {
      return detections;
    }).catch(err => {
      console.error('AXIOS ERROR: ', JSON.stringify(err, null, 2));
    }) as any);

    console.log('the detections: ', detections);

    const t1 = performance.now();
    console.log('detection took: ', t1 - t0);
    console.log('fps: ', 1000 / (t1 - t0));
    // send request to server with image

    // Draw mesh
    const ctx = context.current;

    // 5. TODO - Update drawing utility
    // drawSomething(obj, ctx)
    requestAnimationFrame(() => {
      if (ctx) {
        ctx.clearRect(0, 0, width, height);


        ctx.lineWidth = 2;
        ctx.strokeStyle="#FF0000";
        ctx.strokeRect(0, 0, width, height);//for white background

        const scores: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        drawRect(detections.boxes, detections.names, scores, 0.4, width, height, ctx); 

        // drawRect(
        //   boxes[0],
        //   classes[0],
        //   scores[0],
        //   0.7,
        //   width,
        //   height,
        //   ctx
        // );
      }
    });

    tf.dispose(nextImageTenor);
  };

  function handleCameraReady(images: IterableIterator<tf.Tensor3D>) {
    console.log("setting camera stuff: ", images);
    setImages(images);
  }

  async function handleCanvasReady(cvs: Canvas) {
    if (cvs) {
      cvs.width = width;
      cvs.height = height;
      context.current = cvs.getContext("2d");
      canvas.current = cvs;
    }
  }

  return (
    <View style={styles.container}>
      <TensorCamera
        style={styles.camera}
        type={Camera.Constants.Type.back}
        cameraTextureHeight={textureDims.height}
        cameraTextureWidth={textureDims.width}
        resizeHeight={300}
        resizeWidth={300}
        resizeDepth={3}
        onReady={handleCameraReady}
        autorender={true}
        useCustomShadersToResize={false}
      />
      <Canvas style={styles.canvas} ref={handleCanvasReady} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  canvas: {
    position: "absolute",
    zIndex: 100000,
    width: "100%",
    height: "100%",
  },
});
