interface ColorFunctionArgs {
  min?: number;
  alpha?: number;
}

const randomColor = ({ min = 0, alpha = 1 }: ColorFunctionArgs): string =>
  `rgba(${min + Math.floor(Math.random() * (255 - min))}, ${
    min + Math.floor(Math.random() * (255 - min))
  }, ${min + Math.floor(Math.random() * (255 - min))}, ${alpha})`;

export const randomGradient = ({
  min = 0,
  alpha = 1,
}: ColorFunctionArgs): string => {
  const minColorEnd = Math.floor(Math.random() * 240);
  return `linear-gradient(${
    20 + Math.floor(Math.random() * 140)
  }deg, ${randomColor({
    min,
    alpha,
  })}, ${randomColor({ min: minColorEnd, alpha })})`;
};
