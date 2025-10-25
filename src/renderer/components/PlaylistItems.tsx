import React from 'react';
import { MdAudiotrack, MdOutlineMusicVideo } from 'react-icons/md';
import { getDuration, getMediaName, isAudio } from 'renderer/constant/utils';
import { Media, Playlist } from 'renderer/types/types';

type PlaylistItemsProps = {
  medias: Media[];
  isCurrentMedia: (mediaName: string) => boolean;
  changeMedia: (media: Media) => () => void;
  showContextMenu: (type: string, media: Media) => (e: React.MouseEvent) => void;
  nextMedia: () => void;
};

const PlaylistItems = ({ medias, isCurrentMedia, changeMedia, nextMedia, showContextMenu }: PlaylistItemsProps) => {
  return (
    <ul className="playlist">
      {medias
        .map((media: Media) => (
          <li
            key={media.name}
            style={{
              backgroundColor: isCurrentMedia(media.name)
                ? '#384249'
                : '#2c3840',
            }}
            className="media"
            onContextMenu={showContextMenu('media', media)}
          >
            <div className="i-media-type">
              {isAudio(media) ? (
                <MdAudiotrack fontSize={20} color="whitesmoke" />
              ) : (
                <MdOutlineMusicVideo fontSize={20} color="whitesmoke" />
              )}
            </div>
            <div className="item-descriptions">
              <div
                role='button'
                tabIndex={0}
                style={{
                  color: isCurrentMedia(media.name) ? '#a5c0db' : '#f8f8ff',
                }}
                className="i-media-name"
                onClick={changeMedia(media)}
                onKeyDown={nextMedia}
              >
                {getMediaName(media.name)}
              </div>
              <div className="i-duration">{getDuration(media.duration)}</div>
            </div>
          </li>
        ))}
    </ul>
  );
};

export default PlaylistItems;
