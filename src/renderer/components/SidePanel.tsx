import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../HomePage/home.scss';
import { Media, Playlist, TimeStamp } from 'renderer/types/types';
import { RiPlayListFill } from 'react-icons/ri';
import { getDuration, getTotalDuration } from 'renderer/constant/utils';

type SidePanelProps = {
  mediaPlayer: HTMLMediaElement | null;
  playlist: Playlist;
  setPlaylist: React.Dispatch<React.SetStateAction<Playlist>>;
  playlists: Playlist[];
  media: Media | undefined;
  timeStamps: TimeStamp[];
  showContextMenu: (type: string, playlist: Playlist, index: number) => (e: React.MouseEvent) => void
};

const SidePanel = ({
  mediaPlayer,
  playlist,
  setPlaylist,
  playlists,
  media,
  timeStamps,
  showContextMenu
}: SidePanelProps) => {

  const handleKeyActivate = (e: React.KeyboardEvent, cb: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cb();
    }
  };

    const moveToTimeStamp = (mark: TimeStamp) => () => {
    if(mark && media && mediaPlayer){
      mediaPlayer.currentTime = mark.atTime
    }
  }

    const onMouseOverStamp = (index: number) => () => {
      const [body, bottom] = document.getElementsByClassName("stamp")[index].childNodes;
      (body as HTMLElement).style.backgroundColor = "#00eaff";
      (bottom as HTMLElement).style.borderLeft = "5px solid #00eaff";
    }
  
    const onMouseLeaveStamp = (index: number) => () => {
      const [body, bottom] = document.getElementsByClassName("stamp")[index].childNodes;
      (body as HTMLElement).style.backgroundColor = "yellow";
      (bottom as HTMLElement).style.borderLeft = "5px solid yellow";
    }

  return (
    <div id="side-panel">
      <ul className="playlist-list">
        {playlists.map((p: Playlist, index: number) => (
          <li key={p.name}>
            <div
              role="button"
              tabIndex={0}
              className="playlist-item"
              onClick={(e) => setPlaylist(p)}
              onContextMenu={showContextMenu('playlist', p, index)}
              onKeyDown={(e) => handleKeyActivate(e, () => setPlaylist(p))}
            >
              <div className="p-icon">
                <RiPlayListFill fontSize={20} color="whitesmoke" />
              </div>
              <div className="playlist-descriptions">
                <div className="p-name">{p.name}</div>
                <div className="p-inline">
                  <span className="p-total-media">{p.medias.length} songs</span>
                  <span className="dot" />
                  <span className="p-total-duration">
                    {getTotalDuration(p.medias)}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="time-mark">
        <div className="ts-heading">Time Stamps</div>
        <ul className="ts-list">
          {Array.isArray(timeStamps) &&
            timeStamps.map((m: TimeStamp, i) => (
              <li key={m.note} className="ts-item">
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={moveToTimeStamp(m)}
                  onFocus={onMouseOverStamp(i)}
                  onMouseLeave={onMouseLeaveStamp(i)}
                  onContextMenu={showContextMenu('timestamp', playlist, i)}
                  onKeyDown={(e) => handleKeyActivate(e, () => moveToTimeStamp(m)())}
                >
                  <div className="ts-label">{m.note}</div>
                  <div className="ts-at-time">{getDuration(m.atTime)}</div>
                </span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default SidePanel;
