import { StatusBar } from "expo-status-bar";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import {
  Dimensions,
  LogBox,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Camera } from "expo-camera";
import * as cocoSsd from "./model/index";
import * as tf from "@tensorflow/tfjs";
import { useEffect, useRef, useState } from "react";
import Canvas from "react-native-canvas";
import { CanvasRenderingContext2D } from "react-native-canvas";
// import { Camera, useCameraDevices, useFrameProcessor } from "react-native-vision-camera";

const TensorCamera = cameraWithTensors(Camera);
const { width, height } = Dimensions.get("window");
const subscriber: any = [];
let theModel: cocoSsd.ObjectDetection | null = null;
let counter = 0;

LogBox.ignoreAllLogs(true);
export default function App() {
  const [model, setModel] = useState<cocoSsd.ObjectDetection>();
  let context = useRef<CanvasRenderingContext2D>();
  let canvas = useRef<Canvas>();

  let textureDims =
    Platform.OS == "ios"
      ? { width: 1080, height: 1920 }
      : { width: 1200, height: 1200 };

  function handleCameraStream(images: any, updatePreview: any, gl:any) {
    console.log("creating the loop");
    const loop = async () => {
      // console.log("in the loop");
      const nextImageTenor = images.next().value;

      if (!theModel || !nextImageTenor) {
        if (!theModel) console.log('no model');
        if (!nextImageTenor) console.log('no image');

        return;
        // throw new Error("Model or image not loaded");
      }

      // console.log('the model is here', theModel);
      // console.log('next image is here', nextImageTenor);

      if (counter % 30 == 0) {
        setImmediate(() => {
          if (!theModel) return;

          theModel
            .detect(nextImageTenor)
            .then((predictions) => {
              // console.log('predictions', predictions);
              drawRect(predictions, nextImageTenor);
            })
            .catch((err) => {
              console.log(err);
            }).finally(() => {
              nextImageTenor.dispose();
            });
        })
      }

      counter++;
      requestAnimationFrame(loop);
    };

    console.log('subscribing to the model');
    subscriber.push(loop);
    loop();
    
    const renderCamera = async () => {
      // if autorender is false you need the following two lines.
      updatePreview();
      gl.endFrameEXP();
      
      requestAnimationFrame(renderCamera);
    }
    renderCamera();
  }
  
  function drawRect(
    predictions: cocoSsd.DetectedObject[],
    nextImageTenor: any
  ) {
    if (!context.current || !canvas.current) {
      return;
    }

    // Match the size of the camera preview
    const scaleWidth = width / nextImageTenor.shape[1];
    const scaleHeight = height / nextImageTenor.shape[0];

    const flipHorizontal = Platform.OS !== "ios";

    // We will clear the preview prediction
    context.current.clearRect(0, 0, width, height);

    // Draw a rectangle for each prediction
    for (const prediction of predictions) {
      const [x, y, w, h] = prediction.bbox;

      // Scale the coordinates based on the ration calculated
      const boundingBoxX = flipHorizontal
        ? canvas.current.width - x * scaleWidth - w * scaleWidth
        : x * scaleWidth;
      const boundingBoxY = y * scaleHeight;

      // Draw a rectangle
      context.current.strokeRect(
        boundingBoxX,
        boundingBoxY,
        w * scaleWidth,
        h * scaleHeight
      );

      // Draw a label
      context.current.strokeText(
        prediction.class,
        boundingBoxX - 5,
        boundingBoxY - 5
      );
    }
  }

  async function handleCanvas(cvs: Canvas) {
    if (cvs) {
      cvs.width = width;
      cvs.height = height;
      const ctx: CanvasRenderingContext2D = cvs.getContext("2d");
      ctx.strokeStyle = "#ff0000";
      ctx.fillStyle = "#ff0000";
      ctx.lineWidth = 3;

      context.current = ctx;
      canvas.current = cvs;
    }
  }

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermissionsAsync();
      // tf.setBackend('cpu');
      console.log('setting tensorflow');
      await tf.ready();
      console.log('tensporflow is ready');
      console.log('the backend being used: ', tf.getBackend ());
      const model = await cocoSsd.load();
      console.log('Model is ready');
      setModel(model);
      theModel = model;
      setTimeout(() => {
        console.log('calling the subscriber');
        subscriber[0]();
      }, 2000);
    })();
  }, []);

  // const devices = useCameraDevices()
  // const device = devices.back

  // const frameProcessor = useFrameProcessor((frame) => {
  //   'worklet'
  //   // const isHotdog = detectIsHotdog(frame)
  //   // console.log(isHotdog ? "Hotdog!" : "Not Hotdog.")
  //   console.log('frameProcessor');
  // }, [])

  return (
    <View style={styles.container}>
      {/* {
        device && (
          <Camera
            style={styles.camera}
            isActive={true}
            device={device}
            frameProcessor={frameProcessor}
          />
        )
      } */}

      <TensorCamera
        style={styles.camera}
        type={Camera.Constants.Type.back}
        cameraTextureHeight={textureDims.height}
        cameraTextureWidth={textureDims.width}
        resizeHeight={textureDims.height/4}
        resizeWidth={textureDims.width/4}
        resizeDepth={3}
        onReady={handleCameraStream}
        autorender={false}
        useCustomShadersToResize={false}
      />
      <Canvas style={styles.canvas} ref={handleCanvas} />
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
