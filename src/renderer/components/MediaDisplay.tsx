import React from 'react';
import { IoMusicalNote } from 'react-icons/io5';
import { getDuration, getMediaName, isAudio } from 'renderer/constant/utils';
import { Media } from 'renderer/types/types';

type MediaDisplayProps = {
  media: Media | undefined;
  metadata: any;
  onMediaEnded: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  setPlaying: (playing: boolean) => void;
  wifi: string;
};

const MediaDisplay = ({
  media,
  metadata,
  onMediaEnded,
  setPlaying,
  wifi = ''
}: MediaDisplayProps) => {
  const onPause = () => {
    window.electron.doAction(false);
    setPlaying(false);
  };

  const onPlay = () => {
    window.electron.doAction(true);
    setPlaying(true);
  };
  const onTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const mplayer = e.target as HTMLVideoElement;
    document.getElementById('progress-button')!.style.left = `calc(${
      (mplayer.currentTime * 100) / mplayer.duration
    }% - 5px)`;
    document.getElementById('progress-fill')!.style.width = `${
      (mplayer.currentTime * 100) / mplayer.duration
    }%`;
    document.getElementById('progress-text')!.innerText = `${getDuration(
      mplayer.currentTime
    )}/${getDuration(mplayer.duration)}`;
  };
  const onMediaLoaded = (e: React.SyntheticEvent<HTMLMediaElement>) => {
    (e.target as HTMLMediaElement).play();
  };

  const onVolumeChange = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const { volume } = e.target as HTMLVideoElement;
    document.getElementById('audio-button')!.style.left = `calc(${
      volume * 100
    }% - 5px)`;
    document.getElementById('audio-fill')!.style.width = `calc(${
      volume * 100
    }% - 5px)`;
  };

  return (
    <div id="main-info-head">
      <div
        style={{ display: isAudio(media) ? 'flex' : 'none' }}
        className="info"
      >
        <div className="musical-note-container">
          <IoMusicalNote fontSize={30} color="whitesmoke" />
          <img id="preview-mp3" alt="" />
        </div>
        <div className="descriptions">
          <div className="d-media-name">{getMediaName(media?.name || '')}</div>
          <div className="d-performer-name">
            {Array.isArray(metadata?.artist) && metadata.artist[0]}
          </div>
          <div className="d-duration">{getDuration(media?.duration || 0)}</div>
        </div>
      </div>
      <video
        style={{ display: isAudio(media) ? 'none' : 'block' }}
        id="media-player"
        // src={`http://${wifi}:4000/getStream`}
        onEnded={onMediaEnded}
        onTimeUpdate={onTimeUpdate}
        onPlay={onPlay}
        onPause={onPause}
        onLoadedData={onMediaLoaded}
        onVolumeChange={onVolumeChange}
      >
        <track id="media-track" kind="captions" />
      </video>
    </div>
  );
};

export default MediaDisplay;
