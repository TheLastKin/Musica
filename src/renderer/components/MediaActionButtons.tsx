/* eslint-disable no-nested-ternary */
import React from 'react';
import {
  IoPauseCircleOutline,
  IoPlayCircleOutline,
  IoPlaySkipBackCircleOutline,
  IoPlaySkipForwardCircleOutline,
  IoShuffle,
} from 'react-icons/io5';
import { MdBookmarkAdd, MdTimer } from 'react-icons/md';
import { RiRepeat2Line, RiRepeatOneFill } from 'react-icons/ri';
import { lightBlue, whiteSmoke } from 'renderer/constant/colors';
import { Media, Playlist } from 'renderer/types/types';
import AudioBar from './AudioBar';

type MediaActionButtonsProps = {
  playConfig: any;
  playlist: Playlist;
  mediaPlayer: HTMLMediaElement | null;
  media: Media | undefined;
  isPlaying: boolean;
  isTiming: boolean;
  setTiming: React.Dispatch<React.SetStateAction<boolean>>;
  isAddingTimeMark: boolean;
  setAddingTimeMark: React.Dispatch<React.SetStateAction<boolean>>;
  setPlayConfig: React.Dispatch<React.SetStateAction<any>>;
  setShuffledPlaylist: React.Dispatch<React.SetStateAction<Playlist>>;
  shufflePlaylist: (playlist: Playlist) => Playlist;
  onFocusAudioBar: (e: React.MouseEvent) => void;
  nextMedia: () => void;
  previousMedia: () => void;
};

const MediaActionButtons = ({
  media,
  mediaPlayer,
  playConfig,
  setPlayConfig,
  playlist,
  setShuffledPlaylist,
  shufflePlaylist,
  isPlaying,
  isTiming,
  setTiming,
  isAddingTimeMark,
  setAddingTimeMark,
  onFocusAudioBar,
  nextMedia,
  previousMedia,
}: MediaActionButtonsProps) => {
  const toggleRepeat = () => {
    if (playConfig.repeat === 'none') {
      setPlayConfig({ ...playConfig, repeat: 'repeat' });
    } else if (playConfig.repeat === 'repeat') {
      setPlayConfig({ ...playConfig, repeat: 'repeat-one' });
    } else {
      setPlayConfig({ ...playConfig, repeat: 'none' });
    }
  };

  const toggleShuffle = () => {
    if (playConfig.isShuffle) {
      setPlayConfig({ ...playConfig, isShuffle: false });
      setShuffledPlaylist(playlist);
    } else {
      setPlayConfig({ ...playConfig, isShuffle: true });
      setShuffledPlaylist(shufflePlaylist(playlist));
    }
  };

  const togglePlay = () => {
    if (!media || !mediaPlayer) return;

    if (isPlaying) {
      mediaPlayer.pause();
    } else {
      mediaPlayer.play();
    }
  };

  const toggleAddTimeMark = () => setAddingTimeMark(!isAddingTimeMark);

  const toggleTimer = () => {
    if (isTiming) {
      setTiming(false);
      setPlayConfig({ ...playConfig, timer: Infinity });
    } else {
      setTiming(true);
      const modal = document.getElementById('modal-container') as HTMLElement;
      modal.style.opacity = '1';
      modal.style.zIndex = '5';
    }
  };

  return (
    <div className="buttons">
      <div
        role="button"
        tabIndex={-3}
        className="add-timer-container"
        onClick={toggleTimer}
        onKeyDown={toggleTimer}
      >
        {playConfig.timer !== Infinity ? (
          <span className="song-timer">{playConfig.timer}</span>
        ) : (
          <MdTimer
            className="add-timer"
            fontSize={15}
            color={isTiming ? lightBlue : whiteSmoke}
          />
        )}
      </div>
      <MdBookmarkAdd
        className="add-time-mark"
        fontSize={15}
        color={isAddingTimeMark ? lightBlue : whiteSmoke}
        onClick={toggleAddTimeMark}
      />
      {playConfig.repeat === 'repeat' ? (
        <RiRepeat2Line
          className="repeat"
          fontSize={15}
          color={lightBlue}
          onClick={toggleRepeat}
        />
      ) : playConfig.repeat === 'repeat-one' ? (
        <RiRepeatOneFill
          className="repeat"
          fontSize={15}
          color={lightBlue}
          onClick={toggleRepeat}
        />
      ) : (
        <RiRepeat2Line
          className="repeat"
          fontSize={15}
          color={whiteSmoke}
          onClick={toggleRepeat}
        />
      )}
      <IoShuffle
        className="shuffle"
        fontSize={20}
        color={playConfig.isShuffle ? lightBlue : whiteSmoke}
        onClick={toggleShuffle}
      />
      <IoPlaySkipBackCircleOutline
        className="backward"
        fontSize={30}
        color={whiteSmoke}
        onClick={previousMedia}
      />
      {isPlaying ? (
        <IoPauseCircleOutline
          className="play"
          fontSize={40}
          color={lightBlue}
          onClick={togglePlay}
        />
      ) : (
        <IoPlayCircleOutline
          className="play"
          fontSize={40}
          color={whiteSmoke}
          onClick={togglePlay}
        />
      )}
      <IoPlaySkipForwardCircleOutline
        className="forward"
        fontSize={30}
        color={whiteSmoke}
        onClick={nextMedia}
      />
      <AudioBar onFocusAudioBar={onFocusAudioBar} />
    </div>
  );
};

export default MediaActionButtons;
