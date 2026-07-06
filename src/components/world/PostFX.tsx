import {
  DepthOfField,
  EffectComposer,
  Noise,
  SMAA,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

type Props = {
  /** Disables the composer (reduced motion / low-power). */
  disabled?: boolean;
};

/**
 * NOCTURNE post-processing — R26 stripped down for 60fps perf non-negotiable.
 * Was 7 effects in R25 (SMAA + DoF + HueSat + Bright/Contrast +
 * ChromaticAberration + Vignette + Noise); Grant flagged the stack was
 * killing framerate. Cut to 4 essentials: crisp AA + real depth + cinematic
 * frame + film grain. Grade now lives in scene lighting, not post.
 *
 * Also: ONE EffectComposer only. Any other route with its own composer
 * would double the render cost.
 */
export default function PostFX({ disabled }: Props) {
  if (disabled) return null;
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <DepthOfField
        focusDistance={0.02}
        focalLength={0.06}
        bokehScale={2.0}
      />
      <Vignette
        offset={0.28}
        darkness={0.65}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={0.055}
        premultiply
        blendFunction={BlendFunction.ADD}
      />
    </EffectComposer>
  );
}
