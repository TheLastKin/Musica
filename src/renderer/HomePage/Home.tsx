/* eslint-disable */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './home.scss';
import { TbLayoutSidebarLeftCollapse } from 'react-icons/tb';
import {
  RiPlayListAddLine,
} from 'react-icons/ri';
import StyledDropzone from 'renderer/components/StyledDropzone';
import { Media, Playlist, TimeStamp } from 'renderer/types/types';
import { isAudio } from 'renderer/constant/utils';
import SidePanel from 'renderer/components/SidePanel';
import MediaDisplay from 'renderer/components/MediaDisplay';
import PlaylistHeader from 'renderer/components/PlaylistHeader';
import PlaylistItems from 'renderer/components/PlaylistItems';
import { lightBlue, whiteSmoke } from 'renderer/constant/colors';
import MediaActionButtons from 'renderer/components/MediaActionButtons';
import ProgressBar from 'renderer/components/ProgressBar';
import UtiilityButtons from 'renderer/components/UtiilityButtons';
import Modal from 'renderer/components/Modal';

let isAudioBarFocused = false;
let isProgressBarFocused = false;
let audioOffsetX = 0;
let audioClientX = 0;
let progressClientX = 0;
let progressOffsetX = 0;
let audioValue = 0;
let progressValue = 0;
let turnOffAfterFinished: any = null;

const Home = () => {
  const [wifi, setWifi] = useState('localhost');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlist, setPlaylist] = useState<Playlist>({ name: '', medias: [] });
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Playlist>({
    name: '',
    medias: [],
  });
  const [playConfig, setPlayConfig] = useState({
    isShuffle: false,
    repeat: 'none',
    audioValue: 0.85,
    timer: Infinity,
  });
  const [isPlaying, setPlaying] = useState(false);
  const [isAddingTimeMark, setAddingTimeMark] = useState(false);
  const [isTiming, setTiming] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [media, setMedia] = useState<Media>();
  const [metadata, setMetadata] = useState<any>();
  const [hasLauched, setLauched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stampInfo, setStampInfo] = useState<TimeStamp>({
    atTime: 0,
    note: '',
  });
  const [timeStamps, setTimeStamps] = useState([]);

  const nextIndex = useMemo(
    () =>
      Math.max(
        shuffledPlaylist?.medias?.findIndex(
          (m: Media) => m.name === media?.name
        ) + 1,
        0
      ),
    [media, shuffledPlaylist]
  );
  const playlistRef = useRef<Playlist>({ name: '', medias: [] });
  const nextIndexRef = useRef<number>(0);
  const playlistsRef = useRef<Playlist[]>([]);
  const configRef = useRef<any>();
  const mediaPlayer = useRef<HTMLMediaElement | null>(null);
  playlistsRef.current = playlists;
  playlistRef.current = shuffledPlaylist;
  nextIndexRef.current = nextIndex;
  configRef.current = playConfig;

  useEffect(() => {
    mediaPlayer.current!! = document.getElementById('media-player') as HTMLMediaElement;
    getPlaylists();
    if (localStorage.getItem('user-config')) {
      const config = JSON.parse(localStorage.getItem('user-config') as string);
      setPlayConfig({ ...config, timer: Infinity });
      mediaPlayer.current!!.volume = config.audioValue;
      document.getElementById('audio-button')!.style.left = `${
        config.audioValue * 100
      }%`;
      document.getElementById('audio-fill')!.style.width = `${
        config.audioValue * 100
      }%`;
    }
    mediaPlayer.current!!.onfullscreenchange = onExitFullscreen as any;
    // mediaPlayer.current!!.addEventListener("fullscreenchange", onExitFullscreen)
    window.electron.onMediaMetadata((e: any, m: any) => setMetadata(m));
    window.electron.onRequestPlayNext((e: any) => {
      playNext(playlistRef.current, nextIndexRef.current, true);
    });
    window.electron.onRequestPlayPrevious((e: any) => {
      playNext(playlistRef.current, nextIndexRef.current - 2, true);
    });
    window.electron.onTogglePlay((e: any) => {
      if (mediaPlayer.current!!.paused) {
        mediaPlayer.current!!.play();
      } else {
        mediaPlayer.current!!.pause();
      }
    });
    window.electron.onDecreaseVolume((e: any) => {
      mediaPlayer.current!!.volume = Math.max(mediaPlayer.current!!.volume - 0.1, 0);
    });
    window.electron.onIncreaseVolume((e: any) => {
      mediaPlayer.current!!.volume = Math.min(mediaPlayer.current!!.volume + 0.1, 1);
    });
    window.electron.chooseMedia((e: any, index: number) => {
      playNext(playlistRef.current, index, true);
    });
    window.electron.changePlaylist((e: any, index: number) => {
      setPlaylist(playlistsRef.current[index]);
    });
    window.electron.seekTo((e: any, time: number) => {
      if (mediaPlayer.current!!) {
        mediaPlayer.current!!.currentTime = time;
      }
    });
    window.electron.changeTimer((e: any, type: string) => {
      if (type === 'increase') {
        if (configRef.current.timer === Infinity) {
          setPlayConfig({ ...configRef.current, timer: 1 });
        } else {
          setPlayConfig({
            ...configRef.current,
            timer: configRef.current.timer + 1,
          });
        }
      } else {
        setPlayConfig({ ...configRef.current, timer: Infinity });
      }
    });
    window.electron.requestTurnOff((e: any, state: string) => {
      if (configRef.current.timer === Infinity) {
        window.electron.turnOff(state);
      } else {
        turnOffAfterFinished = state;
      }
    });
    window.electron.requestTimeUpdate((e: any) => {
      window.electron.onTimeUpdate(mediaPlayer.current!!.currentTime);
    });
    window.electron.setWifiIp((e: any, ip: string) => {
      setWifi(ip);
    });
    navigator.mediaSession.setActionHandler('seekto', (data: any) => {
      if (mediaPlayer.current!!.src !== null) {
        mediaPlayer.current!!.currentTime = data.seekTime;
      }
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playNext(playlistRef.current, nextIndexRef.current);
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playNext(playlistRef.current, nextIndexRef.current - 1);
    });
    setLauched(true);
  }, []);

  useEffect(() => {
    if (hasLauched) {
      localStorage.setItem('user-config', JSON.stringify(playConfig));
    }
    window.electron.getConfig(playConfig);
  }, [playConfig]);

  useEffect(() => {
    if (
      playlist?.medias?.length > 0 &&
      playlist.name !== shuffledPlaylist.name
    ) {
      if (playConfig.isShuffle) {
        setShuffledPlaylist(shufflePlaylist(playlist));
      } else {
        setShuffledPlaylist(playlist);
      }
      if (
        playlist?.medias?.length > 0 &&
        playlist.name === shuffledPlaylist.name
      ) {
        setShuffledPlaylist({
          ...shuffledPlaylist,
          medias: shuffledPlaylist.medias.filter((m) =>
            playlist.medias.some((m2) => m.name === m2.name)
          ),
        });
      }
    }
  }, [playlist]);

  useEffect(() => {
    window.electron.getPlaylist(shuffledPlaylist);
    if (shuffledPlaylist?.medias?.length > 0 && !isPlaying) {
      playNext(shuffledPlaylist, 0);
    }
  }, [shuffledPlaylist]);

  useEffect(() => {
    prepareMediaPlayer();
    updateScrollPosition();
    getTimeStamps();
  }, [media]);

  useEffect(() => {
    const previewElement = document.getElementById(
      'preview-mp3'
    ) as HTMLImageElement;
    if (metadata && metadata.picture?.length > 0) {
      const blob = new Blob([metadata.picture[0].data]);
      previewElement.src = URL.createObjectURL(blob);
      previewElement.style.display = 'block';
    } else {
      previewElement.style.display = 'none';
    }
  }, [metadata]);

  const updateScrollPosition = () => {
    if (media && searchQuery.length === 0) {
      const index = shuffledPlaylist.medias
        .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .findIndex((m) => m.name === media.name);
      document.getElementsByClassName('media')[index].scrollIntoView();
    }
  };

  const onExitFullscreen = (target: HTMLMediaElement, ev: Event) => {
    (ev.target as HTMLVideoElement).controls = false;
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('drop-recognizer')!.style.display = 'flex';
  };

  const onMediaEnded = (e: React.SyntheticEvent) => {
    playNext(shuffledPlaylist, nextIndex);
  };

  const prepareMediaPlayer = async () => {
    if (mediaPlayer.current! && media && !isLoading) {
      setLoading(true);
      window.electron.getCurrentMedia(media);
      mediaPlayer.current!.removeAttribute('src');
      // mediaPlayer.current!.src = `http://${wifi}:4000/getStream/${nextIndex - 1}`;
      mediaPlayer.current!.src = `file://${playlistRef.current.medias[nextIndex-1].path}`
      mediaPlayer.current!.load();
      setLoading(false);
      if (playConfig.timer !== Infinity) {
        setPlayConfig({ ...playConfig, timer: playConfig.timer - 1 });
      }
    }
  };

  const getPlaylists = () => {
    if (localStorage.getItem('playlists')) {
      const pls = JSON.parse(localStorage.getItem('playlists') as string);
      setPlaylists(pls);
      window.electron.getPlaylists(pls);
    }
  };

  const playNext = (
    playlist: Playlist,
    index: number,
    forcePlayNext = false
  ) => {
    if (playlist.medias.length === 0 || isLoading || !mediaPlayer.current!) return;

    if (playConfig.timer === 0 && !forcePlayNext) {
      clearTimer();
      return;
    }

    if (playConfig.timer > 0 && forcePlayNext) {
      clearTimer();
    }

    if (isAddingTimeMark) {
      setPlaying(false);
      return;
    }

    if (playConfig.repeat === 'repeat-one' && !forcePlayNext) {
      mediaPlayer.current!.currentTime = 0;
      mediaPlayer.current!.play();
      return;
    }

    if (index < playlist.medias.length) {
      setMedia(playlist.medias[index]);
    } else if (playConfig.repeat === 'repeat') {
      setMedia(playlist.medias[0]);
    } else {
      setPlaying(false);
    }
  };

  const clearTimer = () => {
    setPlayConfig({ ...playConfig, timer: Infinity });
    setTiming(false);
    if (turnOffAfterFinished !== null) {
      window.electron.turnOff(turnOffAfterFinished);
      turnOffAfterFinished = null;
    }
  };

  const shufflePlaylist = (playlist: Playlist) => {
    let temp;
    let randomIndex1;
    let randomIndex2;
    const newPlaylist = playlist;
    for (let i = 0; i < playlist.medias.length; i++) {
      randomIndex1 =
        parseInt((Math.random() * 1000).toString()) % playlist.medias.length;
      randomIndex2 =
        parseInt((Math.random() * 1000).toString()) % playlist.medias.length;
      temp = newPlaylist.medias[randomIndex1];
      newPlaylist.medias[randomIndex1] = newPlaylist.medias[randomIndex2];
      newPlaylist.medias[randomIndex2] = temp;
    }
    return { ...newPlaylist };
  };

  const onFocusAudioBar = (e: React.MouseEvent) => {
    if (!mediaPlayer.current!) return;
    isAudioBarFocused = true;
    document.getElementById('audio-button-bg')!.className =
      'show-audio-button-bg';
    audioClientX = e.clientX;
    audioOffsetX = e.nativeEvent.offsetX - 5;
    mediaPlayer.current!.volume = e.nativeEvent.offsetX / 80;
  };

  const onBlurBar = (e: React.MouseEvent) => {
    if (!mediaPlayer.current!) return;
    if (isAudioBarFocused) {
      isAudioBarFocused = false;
      document.getElementById('audio-button-bg')!.className =
        'hide-audio-button-bg';
      setPlayConfig({ ...playConfig, audioValue: mediaPlayer.current!.volume });
    }
    if (isProgressBarFocused) {
      isProgressBarFocused = false;
      mediaPlayer.current!.play();
      setPlaying(true);
    }
  };

  const onDragButton = (e: React.MouseEvent) => {
    if (!mediaPlayer.current!) return;
    if (isAudioBarFocused) {
      audioValue = Math.max(
        Math.min(audioOffsetX + 5 + (e.clientX - audioClientX), 80),
        0
      );
      mediaPlayer.current!.volume = audioValue / 80;
    }
    if (isProgressBarFocused) {
      setCurrentTime(e);
    }
  };

  const setCurrentTime = (e: React.MouseEvent) => {
    if (!mediaPlayer.current!) return;
    progressValue = Math.max(
      Math.min(
        ((progressOffsetX + (e.clientX - progressClientX)) * 100) /
          document.getElementById('progress-bar')!.clientWidth,
        100
      ),
      0
    );
    mediaPlayer.current!.currentTime = (mediaPlayer.current!.duration * progressValue) / 100;
    window.electron.onTimeUpdate(mediaPlayer.current!.currentTime);
  };

  const onFocusProgressBar = (e: React.MouseEvent) => {
    if (!mediaPlayer.current!) return;
    if (media) {
      progressClientX = e.clientX;
      progressOffsetX = e.nativeEvent.offsetX;
      if (isAddingTimeMark) {
        const modal = document.getElementById('modal-container') as HTMLElement;
        modal.style.zIndex = '5';
        modal.style.opacity = '1';
        setTimeout(() => document.getElementById('ts-label-input')!.focus(), 1);
        progressValue = Math.max(
          Math.min(
            ((progressOffsetX + (e.clientX - progressClientX)) * 100) /
              document.getElementById('progress-bar')!.clientWidth,
            100
          ),
          0
        );
        setStampInfo({
          atTime: (mediaPlayer.current!.duration * progressValue) / 100,
          note: '',
        });
      } else {
        mediaPlayer.current!.pause();
        isProgressBarFocused = true;
        setCurrentTime(e);
        setPlaying(false);
      }
    }
  };

  const changeMedia = (newMedia: Media) => () => {
    setMedia(newMedia);
    setSearchQuery('');
  };

  const nextMedia = () =>
    playNext(
      shuffledPlaylist,
      nextIndex > playlist.medias.length - 1 ? 0 : nextIndex,
      true
    );

  const previousMedia = () =>
    playNext(
      shuffledPlaylist,
      nextIndex - 2 < 0 ? playlist.medias.length - 1 : nextIndex - 2,
      true
    );

  const changePlaylist = (playlist: Playlist) => () => setPlaylist(playlist);

  const isCurrentMedia = (mediaName: string) => {
    return media?.name === mediaName;
  };

  const toggleSidePanel = () => {
    const panel = document.getElementById('side-panel') as HTMLElement;
    const mainInfo = document.getElementById('main-info') as HTMLElement;
    if (panel.className === 'hide-side-panel') {
      panel.className = '';
      mainInfo.className = '';
    } else {
      panel.className = 'hide-side-panel';
      mainInfo.className = 'expand-main-info';
    }
  };

  const hideContextMenu = () => {
    document.getElementById('context-menu')!.style.display = 'none';
  };

  const clearPlaylist = () => {
    if (!mediaPlayer.current!) return;
    mediaPlayer.current!.pause();
    mediaPlayer.current!.removeAttribute('src');
    mediaPlayer.current!.load();
    setPlaylist({ name: '', medias: [] });
    setShuffledPlaylist({ name: '', medias: [] });
    setPlaying(false);
    setMedia(undefined);
  };

  const removePlaylist = (playlistName: string) => {
    if (playlist.name === playlistName) {
      clearPlaylist();
    }
    let newPlaylists: Playlist[] = JSON.parse(
      localStorage.getItem('playlists') as string
    );
    newPlaylists = playlists.filter((p) => p.name !== playlistName);
    localStorage.setItem('playlists', JSON.stringify(newPlaylists));
    setPlaylists(newPlaylists);
  };

  const removeMedia = (mediaName: string) => {
    let newPlaylists: Playlist[] = JSON.parse(
      localStorage.getItem('newPlaylists') as string
    ) as Playlist[];
    const newPlaylist = {
      ...playlist,
      medias: playlist.medias.filter((m) => m.name !== mediaName),
    };
    newPlaylists = newPlaylists.map((p) =>
      p.name === newPlaylist.name ? newPlaylist : p
    );
    localStorage.setItem('playlists', JSON.stringify(newPlaylists));
    setPlaylist(newPlaylist);
    setPlaylists(newPlaylists);
    setShuffledPlaylist({
      ...shuffledPlaylist,
      medias: shuffledPlaylist.medias.filter((m) =>
        newPlaylist.medias.some((m2) => m.name === m2.name)
      ),
    });
    if (media && media.name === mediaName) {
      nextMedia();
    }
  };

  const getTimeStamps = () => {
    if (media) {
      setTimeStamps(JSON.parse(localStorage.getItem(media.name) as string));
    }
  };

  const removeTimeStamp = (index: number) => {
    try {
      if (!media) throw new Error('No media found');
      let stamps = JSON.parse(localStorage.getItem(media.name) as string);
      stamps = stamps.filter((s: TimeStamp, i: number) => i !== index);
      localStorage.setItem(media.name, JSON.stringify(stamps));
      getTimeStamps();
    } catch (error) {
      console.error('Failed to remove timestamp:', error);
    }
  };

  const showContextMenu =
    (type: string, obj: Media | Playlist, index?: number) =>
    (e: React.MouseEvent) => {
      const contextMenu = document.getElementById(
        'context-menu'
      ) as HTMLElement;
      contextMenu.style.top = `${e.clientY}px`;
      contextMenu.style.left = `${e.clientX}px`;
      contextMenu.style.display = 'block';
      contextMenu.onclick = function () {
        if (type === 'playlist') {
          removePlaylist(obj.name);
        }
        if (type === 'media') {
          removeMedia(obj.name);
        }
        if (type === 'timestamp') {
          removeTimeStamp(index || 0);
        }
      };
    };

  return (
    <div id="container">
      <div id="body" onClick={hideContextMenu}>
        <RiPlayListAddLine id="new-playlist" fontSize={15} color={lightBlue} />
        <div id="context-menu">Remove</div>
        <SidePanel
          mediaPlayer={mediaPlayer.current}
          playlist={playlist}
          setPlaylist={setPlaylist}
          playlists={playlists}
          media={media}
          timeStamps={timeStamps}
          showContextMenu={showContextMenu}
        />
        <div id="main-info">
          <MediaDisplay
            media={media}
            metadata={metadata}
            onMediaEnded={onMediaEnded}
            setPlaying={setPlaying}
            wifi={wifi}
          />
          <div
            id="dropzone"
            className="playlist-container"
            onDragEnter={onDragEnter}
          >
            <PlaylistHeader
              shuffledPlaylist={shuffledPlaylist}
              playlist={playlist}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              setPlaylist={setPlaylist}
              setShuffledPlaylist={setShuffledPlaylist}
              getPlaylists={getPlaylists}
              clearPlaylist={clearPlaylist}
            />
            <StyledDropzone
              currentPlaylist={playlist}
              setPlaylist={setPlaylist}
              setPlaylists={setPlaylists}
            />
            <PlaylistItems
              medias={shuffledPlaylist.medias?.filter((m: Media) =>
                m.name.toLowerCase().includes(searchQuery.toLowerCase())
              )}
              isCurrentMedia={isCurrentMedia}
              changeMedia={changeMedia}
              nextMedia={nextMedia}
              showContextMenu={showContextMenu}
            />
          </div>
        </div>
      </div>
      <div className="footer" onMouseMove={onDragButton} onMouseUp={onBlurBar}>
        <div className="action-container">
          <MediaActionButtons
            media={media}
            mediaPlayer={mediaPlayer.current}
            nextMedia={nextMedia}
            previousMedia={previousMedia}
            isAddingTimeMark={isAddingTimeMark}
            isPlaying={isPlaying}
            isTiming={isTiming}
            setAddingTimeMark={setAddingTimeMark}
            setPlayConfig={setPlayConfig}
            setShuffledPlaylist={setShuffledPlaylist}
            setTiming={setTiming}
            onFocusAudioBar={onFocusAudioBar}
            playConfig={playConfig}
            playlist={shuffledPlaylist}
            shufflePlaylist={shufflePlaylist}
          />
          <ProgressBar
            timeStamps={timeStamps}
            media={media}
            mediaPlayer={mediaPlayer.current}
            onFocusProgressBar={onFocusProgressBar}
          />
        </div>
        <UtiilityButtons isAudio={isAudio(media)} mediaPlayer={mediaPlayer.current} />
        <TbLayoutSidebarLeftCollapse
          className="collapse-side-panel"
          fontSize={22}
          color={whiteSmoke}
          onClick={toggleSidePanel}
        />
      </div>
      <Modal
        media={media}
        isTiming={isTiming}
        isAddingTimeMark={isAddingTimeMark}
        playConfig={playConfig}
        setPlayConfig={setPlayConfig}
        stampInfo={stampInfo}
        setStampInfo={setStampInfo}
        getTimeStamps={getTimeStamps}
        setTiming={setTiming}
      />
    </div>
  );
};

export default Home;
