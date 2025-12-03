import React from 'react';

type AudioBarProps = {
  onFocusAudioBar: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

const AudioBar = ({ onFocusAudioBar }: AudioBarProps) => {
  return (
    <div
      role="button"
      tabIndex={-2}
      className="audio-bar-container"
      onMouseDown={onFocusAudioBar}
    >
      <div className="audio-bar">
        <div id="audio-button">
          <div id="audio-button-bg" />
        </div>
        <div id="audio-fill" />
      </div>
    </div>
  );
};

export default AudioBar;
