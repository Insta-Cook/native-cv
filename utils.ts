import { CanvasRenderingContext2D } from "react-native-canvas";

// Define our labelmap
const labelMap: {[key: number]: {name: string, color: string}} = {
  1: { name: "ThumbsUp", color: "red" },
  2: { name: "ThumbsDown", color: "yellow" },
  3: { name: "ThankYou", color: "lime" },
  4: { name: "LiveLong", color: "blue" },
};

// Define a drawing function
export const drawRect = (
  boxes: number[][],
  classes: number[],
  scores: number[],
  threshold: number,
  imgWidth: number,
  imgHeight: number,
  ctx: CanvasRenderingContext2D
) => {
  for (let i = 0; i <= boxes.length; i++) {
    if (boxes[i] && classes[i] && scores[i] > threshold) {
      // Extract variables
      const [y, x, height, width] = boxes[i];
      const text = classes[i] as number;

      // Set styling
      ctx.strokeStyle = labelMap[text]["color"];
      ctx.lineWidth = 10;
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";

      // DRAW!!
      ctx.beginPath();
    //   console.log('drawing: ', x, y, width, height);
    //   console.log('class: ', text);
      ctx.fillText(
        labelMap[text]["name"] + " - " + Math.round(scores[i] * 100) / 100,
        x * imgWidth,
        y * imgHeight - 10
      );
      ctx.rect(
        x * imgWidth,
        y * imgHeight,
        (width * imgWidth) / 2,
        (height * imgHeight) / 2
      );
      ctx.stroke();
    }
  }
};
