import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import {
  Dimensions,
  LogBox,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Camera, PermissionResponse } from "expo-camera";
import * as tf from "@tensorflow/tfjs";
import { useEffect, useRef, useState } from "react";
import Canvas from "react-native-canvas";
import { CanvasRenderingContext2D } from "react-native-canvas";
import { drawRect } from "./utils";

const TensorCamera = cameraWithTensors(Camera);
const { width, height } = Dimensions.get("window");

LogBox.ignoreAllLogs(true);
export default function App() {
  // const [model, setModel] = useState<cocoSsd.ObjectDetection>();
  let context = useRef<CanvasRenderingContext2D>();
  let canvas = useRef<Canvas>();

  let textureDims =
    Platform.OS == "ios"
      ? { width: 1080, height: 1920 }
      : { width, height };

  const [model, setModel] = useState<tf.GraphModel | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<PermissionResponse>();
  const [images, setImages] = useState<IterableIterator<tf.Tensor3D>>();

  const detect = async (net: tf.GraphModel) => {
    if (!images) return;
    const nextImageTenor = images.next().value;
    if (!nextImageTenor) return;

    // // Get Video Properties
    // const video = webcamRef.current.video;
    // const videoWidth = webcamRef.current.video.videoWidth;
    // const videoHeight = webcamRef.current.video.videoHeight;

    // // Set video width
    // webcamRef.current.video.width = videoWidth;
    // webcamRef.current.video.height = videoHeight;

    // // Set canvas height and width
    // canvasRef.current.width = videoWidth;
    // canvasRef.current.height = videoHeight;

    // 4. TODO - Make Detections
    // const img = tf.browser.fromPixels(nextImageTenor);
    const resized = tf.image.resizeBilinear(nextImageTenor, [640, 480]);
    const casted = resized.cast("int32");
    const expanded = casted.expandDims(0);
    const obj = (await net.executeAsync(expanded)) as any;

    // console.log("obj: ", obj);

    // const sth = await obj[0].data()
    // const other = await obj[1].data()
    // console.log('sth: ', sth);
    // console.log('other: ', other);

    const boxes = await obj[4].array();
    const classes = await obj[5].array();
    const scores = await obj[6].array();

    // console.log('boxes: ', boxes);
    // console.log('classes: ', classes);
    // console.log('scores: ', scores);

    // Draw mesh
    const ctx = context.current;

    // 5. TODO - Update drawing utility
    // drawSomething(obj, ctx)
    requestAnimationFrame(() => {
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
        drawRect(
          boxes[0],
          classes[0],
          scores[0],
          0.8,
          width,
          height,
          ctx
        );
      }
    });


    tf.dispose(nextImageTenor);
    tf.dispose(resized);
    tf.dispose(casted);
    tf.dispose(expanded);
    tf.dispose(obj);
  };

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermissionsAsync();
      setPermissionStatus(status);
      await tf.ready();

      console.log("tensporflow is ready");
      console.log("the backend being used: ", tf.getBackend());

      // 3. TODO - Load network
      const model = await tf.loadGraphModel(
        "https://livelong.s3.au-syd.cloud-object-storage.appdomain.cloud/model.json"
      );
      console.log("model is loaded");
      setModel(model);
    })();
  }, []);

  useEffect(() => {
    if (
      model &&
      images &&
      permissionStatus &&
      permissionStatus.status === "granted"
    ) {
      // recursively call detect
      (async function loop() {
        const t0 = performance.now();
        detect(model);
        const t1 = performance.now();
        // console.log("detection took: ", t1 - t0);
        setTimeout(loop, 16.7);
      })();
      console.log("weve got the model and the images");
    }
  }, [model, images]);

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
        resizeHeight={800}
        resizeWidth={400}
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
