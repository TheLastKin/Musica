import React from 'react';
import { RiCloseFill, RiPlayListFill, RiSearch2Line } from 'react-icons/ri';
import { VscClearAll } from 'react-icons/vsc';
import { Playlist } from 'renderer/types/types';

type PlaylistHeaderProps = {
  playlist: Playlist;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  setShuffledPlaylist: React.Dispatch<React.SetStateAction<Playlist>>;
  setPlaylist: React.Dispatch<React.SetStateAction<Playlist>>;
  getPlaylists: () => void;
  shuffledPlaylist: Playlist;
  clearPlaylist: () => void;
};

const PlaylistHeader = ({
  playlist,
  shuffledPlaylist,
  searchQuery,
  setSearchQuery,
  setPlaylist,
  setShuffledPlaylist,
  getPlaylists,
  clearPlaylist
}: PlaylistHeaderProps) => {
  const onSearchingMedia = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchQuery(e.target.value);
  const onEditingPlaylistName = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      (e.target as HTMLInputElement).blur();
    }
  };
  const editPlaylistName = (e: React.FocusEvent<HTMLInputElement>) => {
    if (playlist.name.length !== 0 && e.target.value !== '') {
      const playlists = JSON.parse(localStorage.getItem('playlists') as string);
      playlists[
        playlists.findIndex((p: Playlist) => p.name === playlist.name)
      ].name = e.target.value;
      localStorage.setItem('playlists', JSON.stringify(playlists));
      setShuffledPlaylist({ ...shuffledPlaylist, name: e.target.value });
      setPlaylist({ ...playlist, name: e.target.value });
      getPlaylists();
    }
  };

  return (
    <div className="playlist-name-container">
      <RiPlayListFill fontSize={20} color="whitesmoke" /> ``
      <div id="hidden-name">{playlist.name}</div>
      <input
        // autoFocus={false}
        type="text"
        id="playlist-name"
        defaultValue={playlist.name}
        onKeyUp={onEditingPlaylistName}
        onBlur={editPlaylistName}
      />
      <div id="search-container">
        <input
          type="text"
          id="search-media"
          value={searchQuery}
          onChange={onSearchingMedia}
        />
        <RiCloseFill
          style={{ display: searchQuery.length > 0 ? 'flex' : 'none' }}
          id="clear-search"
          fontSize={15}
          color="#d3d3d3"
          onClick={() => setSearchQuery('')}
        />
        <RiSearch2Line
          className="search-icon"
          fontSize={15}
          color="whitesmoke"
        />
      </div>
      <VscClearAll
        className="clear-playlist"
        fontSize={20}
        color="whitesmoke"
        onClick={clearPlaylist}
      />
    </div>
  );
};

export default PlaylistHeader;
