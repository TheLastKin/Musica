/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo } from 'react'
import { useDropzone } from 'react-dropzone';
import { Media, Playlist } from 'renderer/types/types';
import { getMediaDuration } from '../constant/utils';

type StyledDropzoneProps = {
    currentPlaylist: Playlist,
    setPlaylist: React.Dispatch<React.SetStateAction<Playlist>>,
    setPlaylists: React.Dispatch<React.SetStateAction<Playlist[]>>,
}

const baseStyle = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '3px dashed #72a4d4',
  backgroundColor: '#adcae649',
  borderRadius: '12px',
};

const focusedStyle = {
  borderColor: '#2196f3',
};

const acceptStyle = {
  borderColor: '#00e676',
};

const rejectStyle = {
  borderColor: '#ff1744',
};

const StyledDropzone = ({
  currentPlaylist,
  setPlaylist = () => {},
  setPlaylists = () => {},
}: StyledDropzoneProps) => {
  const {
    getRootProps,
    getInputProps,
    acceptedFiles,
    isFocused,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    accept: { 'audio/*': ['.mp3'], 'video/*': ['.mp4'] },
    multiple: true,
  });

  const onReceivedDrop = async () => {
    if (acceptedFiles.length > 0) {
      document.getElementById('drop-recognizer')!.style.display = 'none';
      const newMedias: Media[] = await Promise.all(
        acceptedFiles.map(async (file) => ({
        name: file.name,
        path: file.path ?? '',
        duration: await getMediaDuration(file as Blob) || 0,
        }as Media))
    );
      const playlists = localStorage.getItem('playlists')
        ? JSON.parse(localStorage.getItem('playlists') as string)
        : [];
      if (currentPlaylist?.medias.length !== 0) {
        const newPlaylist = { ...currentPlaylist };
        await Promise.all(
            newMedias.map(async (media) => {
                if (!newPlaylist.medias.some((m: Media) => m.name === media.name)) {
                    newPlaylist.medias.push(media);
                }
            }
        ));
        const newPlaylists = playlists.map((p: Playlist) =>
          p.name === currentPlaylist.name ? newPlaylist : p
        );
        localStorage.setItem('playlists', JSON.stringify(newPlaylists));
        setPlaylists(newPlaylists);
        setPlaylist(newPlaylist);
      } else {
        const newPlaylist: Playlist = {
          name: `Untitled-${playlists.length}`,
          medias: newMedias
        };
        const newPlaylists = playlists.concat(newPlaylist);
        localStorage.setItem('playlists', JSON.stringify(newPlaylists));
        setPlaylists(newPlaylists);
        setPlaylist(newPlaylist);
      }
    }
  };

  useEffect(() => {
    onReceivedDrop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptedFiles]);

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  const onDragLeave = (e: any) => {
    document.getElementById('drop-recognizer')!.style.display = 'none';
  };

  const rootProps = getRootProps({ style });
  const inputProps = getInputProps();

  return (
    <div id="drop-recognizer" onDragLeave={onDragLeave}>
      <div {...rootProps}>
        <input {...inputProps} />
        <p>Drag & drop some files here, or click to select files</p>
      </div>
    </div>
  );
};

export default StyledDropzone