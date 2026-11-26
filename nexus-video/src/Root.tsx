import React from 'react';
import {Composition} from 'remotion';
import {SCENES, TOTAL_SECONDS, VIDEO} from './config/config';
import {Nexus, SceneById} from './Nexus';
import './lib/fonts';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Nexus"
      component={Nexus}
      durationInFrames={Math.round(TOTAL_SECONDS * VIDEO.fps)}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
    <Composition
      id="Nexus4K"
      component={Nexus}
      durationInFrames={Math.round(TOTAL_SECONDS * VIDEO.fps)}
      fps={VIDEO.fps}
      width={VIDEO.width * VIDEO.scale4K}
      height={VIDEO.height * VIDEO.scale4K}
    />
    {/* Every scene on its own – for previewing and editing in isolation */}
    {SCENES.map((s) => (
      <Composition
        key={s.id}
        id={`Scene-${s.id}`}
        component={SceneById}
        defaultProps={{id: s.id}}
        durationInFrames={Math.round(s.seconds * VIDEO.fps)}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
      />
    ))}
  </>
);
