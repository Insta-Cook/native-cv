import { CanvasRenderingContext2D } from "react-native-canvas";

// // Define our labelmap
// const labelMap: { [key: number]: { name: string; color: string } } = {
//   1: { name: "apple", color: "red" },
//   2: { name: "orange", color: "yellow" },
//   3: { name: "banana", color: "lime" },
// };

const classes: {[key: string]: number} = {
  apple: 1,
  asparagus: 2,
  avocado: 3,
  banana: 4,
  bazlama: 5,
  beans: 6,
  beef: 7,
  blueberries: 8,
  bread: 9,
  broccoli: 10,
  butter: 11,
  carrot: 12,
  cauliflower: 13,
  cheese: 14,
  chicken: 15,
  chicken_breast: 16,
  chickpeas: 17,
  chocolate: 18,
  "chocolate chips": 19,
  corn: 20,
  cream: 21,
  "cream cheese": 22,
  cucumber: 23,
  dates: 24,
  dill: 25,
  eggplant: 26,
  eggs: 27,
  flour: 28,
  ginger: 29,
  goat_cheese: 30,
  grapes: 31,
  "green bell pepper": 32,
  "green chilies": 33,
  green_beans: 34,
  ground_beef: 35,
  ham: 36,
  heavy_cream: 37,
  jalapeno: 38,
  jam: 39,
  juice: 40,
  kaju: 41,
  kefir: 42,
  kiwi: 43,
  lavas: 44,
  lemon: 45,
  lettuce: 46,
  lime: 47,
  mango: 48,
  milk: 49,
  "mineral water": 50,
  mint: 51,
  mushrooms: 52,
  olives: 53,
  onion: 54,
  orange: 55,
  parsley: 56,
  peach: 57,
  peas: 58,
  pickle: 59,
  pickles: 60,
  pineapple: 61,
  potato: 62,
  radish: 63,
  "red bell pepper": 64,
  "red cabbage": 65,
  "red grapes": 66,
  "red onion": 67,
  salami: 68,
  sauce: 69,
  sausage: 70,
  shrimp: 71,
  spinach: 72,
  "spring onion": 73,
  strawberries: 74,
  sugar: 75,
  sweet_potato: 76,
  tangerine: 77,
  tomato: 78,
  "tomato paste": 79,
  watermelon: 80,
  "yellow bell pepper": 81,
  yoghurt: 82,
  zucchini: 83,
};


// get all keys from the classes object
const keys = Object.keys(classes);
const labelMap2: { [key: number]: { name: string; color: string } } = {};

// loop through the keys
for (let i = 0; i < keys.length; i++) {
  // get the key
  const key = keys[i];
  // get the value
  const value = classes[key];

  labelMap2[value] = {
    name: key,
    color: "red",
  };
}



// Define a drawing function
export const drawRect = (
  boxes: number[][],
  classes: string[],
  scores: number[],
  threshold: number,
  imgWidth: number,
  imgHeight: number,
  ctx: CanvasRenderingContext2D
) => {
  console.log('\n\n\n\n\n');
  const drawn = [];
  // clear the rect
  ctx.clearRect(0, 0, imgWidth, imgHeight);
  for (let i = 0; i <= boxes.length; i++) {
    if (boxes[i] && classes[i]) {
      // Extract variables
      const [y, x, height, width] = boxes[i];

      console.log('classes[i]', classes[i]);

      // check if intersects with any previously drawn box
      // let intersects = false;
      // for (let j = 0; j < drawn.length; j++) {
      //   const box1 = {x: x, y: y, w: width, h: height};
      //   console.log('box1: ', box1);
      //   const box2 = drawn[j];
      //   if (checkOverlapping(box1, box2, 0.5)) {
      //     intersects = true;
      //     break;
      //   }
      // }

      // if it intersects, skip it
      // if (intersects) {
      //   console.log('skipping');
      //   continue;
      // }

      drawn.push({x, y, w: width, h: height});

      // console.log('class id before rounding: ', classes[i]);
      // console.log('class id after rounding: ', Math.round(classes[i]));

      // const text = Math.round(classes[i]);

      // Set styling
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 10;
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";

      // DRAW!!
      ctx.beginPath();
      ctx.fillText(
        classes[i] + " - ", // + Math.round(scores[i] * 100) / 100,
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
