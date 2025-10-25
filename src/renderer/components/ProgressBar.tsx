import React from 'react';
import { getDuration } from 'renderer/constant/utils';
import { Media, TimeStamp } from 'renderer/types/types';

type ProgressBarProps = {
  timeStamps: TimeStamp[] | undefined;
  media: Media | undefined;
  mediaPlayer: HTMLMediaElement | null;
  onFocusProgressBar: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

const ProgressBar = ({
  timeStamps,
  media,
  mediaPlayer,
  onFocusProgressBar,
}: ProgressBarProps) => {
  const getStampPosition = (stamp: TimeStamp) => {
    const progressBarWidth =
      document.getElementById('progress-bar')!.clientWidth;
    return media ? progressBarWidth * (stamp.atTime / media.duration) : 0;
  };
  const showDurationPreview = (e: React.MouseEvent<HTMLElement>) => {
    if (media && mediaPlayer) {
      const progressValue = Math.max(
        Math.min(
          (e.nativeEvent.offsetX * 100) / (e.target as HTMLElement).clientWidth,
          100
        ),
        0
      );
      const node = document.getElementById('progress-preview') as HTMLElement;
      node.innerText = getDuration(
        (mediaPlayer.duration * progressValue) / 100
      );
      node.style.display = 'block';
      node.style.left = `${e.nativeEvent.offsetX + 5}px`;
    }
  };
  const onProgressBarMouseLeave = (e: React.MouseEvent) => {
    if (media) {
      const progressPreview = document.getElementById(
        'progress-preview'
      ) as HTMLElement;
      progressPreview.style.display = 'none';
    }
  };
  return (
    <div
      role="button"
      tabIndex={-4}
      className="progress-container"
      onMouseDown={onFocusProgressBar}
    >
      <div
        id="progress-bar"
        onMouseMove={showDurationPreview}
        onMouseLeave={onProgressBarMouseLeave}
      >
        <div id="progress-button">
          <div id="progress-text" />
          <div id="diamond" />
        </div>
        <div id="progress-fill" />
        <div id="progress-preview" />
      </div>
      {Array.isArray(timeStamps) &&
        timeStamps.map((ts) => (
          <div
            style={{ position: 'absolute', left: getStampPosition(ts) }}
            className="stamp"
          >
            <div className="stamp-body" />
            <div className="stamp-bottom" />
          </div>
        ))}
    </div>
  );
};

export default ProgressBar;
