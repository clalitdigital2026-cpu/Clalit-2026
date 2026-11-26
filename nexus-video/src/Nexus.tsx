import React from 'react';
import {AbsoluteFill, Audio, Sequence, Series, staticFile, useVideoConfig} from 'remotion';
import {ASSETS, SCENES, SceneId, sceneStart} from './config/config';
import {Finish} from './components/Finish';
import {S1Pulse} from './scenes/S1Pulse';
import {S2Events} from './scenes/S2Events';
import {S3Challenge} from './scenes/S3Challenge';
import {S4Reveal} from './scenes/S4Reveal';
import {S5Architecture} from './scenes/S5Architecture';
import {S6EventDriven} from './scenes/S6EventDriven';
import {S7Benefits} from './scenes/S7Benefits';
import {S8GameChanger} from './scenes/S8GameChanger';
import {S9Signature} from './scenes/S9Signature';

const SCENE_COMPONENTS: Record<SceneId, React.FC> = {
  pulse: S1Pulse,
  events: S2Events,
  challenge: S3Challenge,
  reveal: S4Reveal,
  architecture: S5Architecture,
  eventDriven: S6EventDriven,
  benefits: S7Benefits,
  gameChanger: S8GameChanger,
  signature: S9Signature,
};

export const SceneById: React.FC<{id: SceneId}> = ({id}) => {
  const C = SCENE_COMPONENTS[id];
  return (
    <AbsoluteFill style={{background: '#020814'}}>
      {C ? <C /> : null}
      <Finish />
    </AbsoluteFill>
  );
};

export const Nexus: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#020814'}}>
      <Series>
        {SCENES.map((s) => {
          const C = SCENE_COMPONENTS[s.id];
          return (
            <Series.Sequence key={s.id} durationInFrames={Math.round(s.seconds * fps)} name={s.id}>
              {C ? <C /> : null}
            </Series.Sequence>
          );
        })}
      </Series>
      <Finish />
      {ASSETS.music && <Audio src={staticFile(ASSETS.music)} volume={ASSETS.musicVolume} />}
      {ASSETS.voiceover && (
        <Sequence from={Math.round(sceneStart('pulse') * fps)}>
          <Audio src={staticFile(ASSETS.voiceover)} volume={ASSETS.voiceoverVolume} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
