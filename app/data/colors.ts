interface ColorFunctionArgs {
  min?: number;
  alpha?: number;
}

type RgbaColor = `rgba(${number}, ${number}, ${number}, ${number})`;

export type Gradient =
  `linear-gradient(${number}deg, ${RgbaColor}, ${RgbaColor})`;

const randomColor = ({ min = 0, alpha = 1 }: ColorFunctionArgs): RgbaColor =>
  `rgba(${min + Math.floor(Math.random() * (255 - min))}, ${
    min + Math.floor(Math.random() * (255 - min))
  }, ${min + Math.floor(Math.random() * (255 - min))}, ${alpha})`;

export const randomGradient = ({
  min = 0,
  alpha = 1,
}: ColorFunctionArgs): Gradient => {
  const minColorEnd = Math.floor(Math.random() * 240);
  return `linear-gradient(${
    20 + Math.floor(Math.random() * 140)
  }deg, ${randomColor({
    min,
    alpha,
  })}, ${randomColor({ min: minColorEnd, alpha })})`;
};
