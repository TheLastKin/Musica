/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { BsLayoutSidebar } from 'react-icons/bs';
import { IoExpand } from 'react-icons/io5';
import { RiPictureInPictureFill } from 'react-icons/ri';
import { green, whiteSmoke } from 'renderer/constant/colors';

type UtiilityButtonsProps = {
  isAudio: boolean;
  mediaPlayer: HTMLMediaElement | null;
  isProjecting: boolean;
  toggleProjectAsWallpaper: () => void;
};

const UtiilityButtons = ({
  isAudio,
  mediaPlayer,
  isProjecting,
  toggleProjectAsWallpaper,
}: UtiilityButtonsProps) => {
  // const requestFullScreen = () => {
  //   mediaPlayer?.requestFullscreen().then(() => {
  //     mediaPlayer.controls = true;
  //     return true;
  //   });
  // };

  const requestPIP = () => {
    if (!mediaPlayer) return;
    (mediaPlayer as HTMLVideoElement).requestPictureInPicture();
  };
  const toggleExpand = () => {
    const mainInfo = document.getElementById('main-info-head') as HTMLElement;
    const dropzone = document.getElementById('dropzone') as HTMLElement;
    if (mainInfo.className.includes('expand-main-info-head')) {
      mainInfo.className = '';
      dropzone.style.height = '60%';
    } else {
      mainInfo.className = 'expand-main-info-head';
      dropzone.style.height = '35%';
    }
  };

  return (
    <div
      className="utility-buttons"
      style={{ display: isAudio ? 'none' : 'inline' }}
    >
      {!isProjecting && (
        <>
          <RiPictureInPictureFill
            className="p-i-p"
            fontSize={20}
            color={whiteSmoke}
            onClick={requestPIP}
          />
          <BsLayoutSidebar
            className="expand"
            fontSize={18}
            color={whiteSmoke}
            onClick={toggleExpand}
          />
        </>
      )}
      <IoExpand
        className="fullscreen"
        fontSize={20}
        color={isProjecting ? green : whiteSmoke}
        onClick={toggleProjectAsWallpaper}
      />
    </div>
  );
};

export default UtiilityButtons;
