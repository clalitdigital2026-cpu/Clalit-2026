import {useCurrentFrame, useVideoConfig} from 'remotion';
import {FX, sceneStart, SceneId} from '../config/config';

/** Scene-local time in seconds (frame based → deterministic). */
export const useSceneTime = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (frame / fps) * FX.speed;
};

/** Convert an absolute cue (seconds in the film) into scene-local seconds. */
export const cueIn = (id: SceneId) => {
  const s = sceneStart(id);
  return (abs: number) => abs - s;
};
