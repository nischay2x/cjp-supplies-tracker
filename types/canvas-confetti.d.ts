declare module "canvas-confetti" {
  type Options = {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    ticks?: number;
    scalar?: number;
    gravity?: number;
    origin?: { x?: number; y?: number };
    colors?: string[];
  };

  export default function confetti(options?: Options): Promise<null> | null;
}
