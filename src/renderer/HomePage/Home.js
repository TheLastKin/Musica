import React, { useEffect, useMemo, useRef, useState } from 'react';
import './home.scss';
import {
  IoPlaySkipBackCircleOutline,
  IoPlayCircleOutline,
  IoPlaySkipForwardCircleOutline,
  IoExpand,
  IoMusicalNote,
  IoShuffle,
  IoPauseCircleOutline,
} from 'react-icons/io5';
import { TbLayoutSidebarLeftCollapse } from 'react-icons/tb';
import {
  RiPlayListFill,
  RiRepeat2Line,
  RiRepeatOneFill,
  RiSearch2Line,
  RiCloseFill,
  RiPictureInPictureFill,
  RiPlayListAddLine,
} from 'react-icons/ri';
import { BsList, BsLayoutSidebar } from 'react-icons/bs';
import { VscClearAll } from 'react-icons/vsc';
import {
  MdAudiotrack,
  MdOutlineMusicVideo,
  MdBookmarkAdd,
  MdTimer
} from 'react-icons/md';
import { useDropzone } from 'react-dropzone';

const fh = (hours) => {
  if (hours < 10) {
    return `0${hours}`;
  }
  return hours;
};

const fm = (minutes) => {
  if (minutes < 10) {
    return `0${minutes}`;
  }
  return minutes;
};

const fs = (seconds) => {
  if (seconds < 10) {
    return `0${seconds}`;
  }
  return seconds;
};

const getDuration = (time) => {
  if (time !== 0 && !isNaN(time)) {
    const hours = parseInt(time / 3600);
    const minutes = parseInt((time - 3600 * hours) / 60);
    const seconds = parseInt(time) - 3600 * hours - minutes * 60;
    if (hours !== 0) {
      return `${fh(hours)}:${fm(minutes)}:${fs(seconds)}`;
    }
    return `${fm(minutes)}:${fs(seconds)}`;
  }
  return '00:00';
};

const lightBlue = '#a5c0db';

const whiteSmoke = 'whitesmoke';

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

const getMediaDuration = async (media) => {
  const videoNode = document.createElement('video');
  const promise = new Promise((resolve, reject) => {
    videoNode.addEventListener('loadedmetadata', () => {
      resolve(videoNode.duration);
    });
    videoNode.addEventListener('error', () => {
      reject(0);
    });
  });
  videoNode.src = URL.createObjectURL(media);
  return promise;
};

const getTotalDuration = (medias) => {
  let duration = 0;
  for (const media of medias) {
    duration += media.duration;
  }
  return getDuration(duration);
};

const StyledDropzone = ({
  currentPlaylist,
  setPlaylist = () => {},
  setPlaylists = () => {},
}) => {
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

  useEffect(() => {
    onReceivedDrop();
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

  const onReceivedDrop = async () => {
    if (acceptedFiles.length > 0) {
      document.getElementById('drop-recognizer').style.display = 'none';
      const newMedias = [];
      for (const media of acceptedFiles) {
        newMedias.push({
          name: media.name,
          path: media.path,
          duration: await getMediaDuration(media),
        });
      }
      const playlists = localStorage.getItem('playlists')
        ? JSON.parse(localStorage.getItem('playlists'))
        : [];
      if (currentPlaylist?.medias.length !== 0) {
        const newPlaylist = { ...currentPlaylist };
        for (const media of newMedias) {
          if (!newPlaylist.medias.some((m) => m.name === media.name)) {
            newPlaylist.medias.push(media);
          }
        }
        const newPlaylists = playlists.map((p) =>
          p.name === currentPlaylist.name ? newPlaylist : p
        );
        localStorage.setItem('playlists', JSON.stringify(newPlaylists));
        setPlaylists(newPlaylists);
        setPlaylist(newPlaylist);
      } else {
        const newPlaylist = {
          name: `Untitled-${playlists.length}`,
          medias: newMedias,
        };
        const newPlaylists = playlists.concat(newPlaylist);
        localStorage.setItem('playlists', JSON.stringify(newPlaylists));
        setPlaylists(newPlaylists);
        setPlaylist(newPlaylist);
      }
    }
  };

  const onDragLeave = (e) => {
    document.getElementById('drop-recognizer').style.display = 'none';
  };

  return (
    <div id="drop-recognizer" onDragLeave={onDragLeave}>
      <div {...getRootProps({ style })}>
        <input {...getInputProps()} />
        <p>Drag 'n' drop some files here, or click to select files</p>
      </div>
    </div>
  );
};

let isAudioBarFocused = false;
let isProgressBarFocused = false;
let audioOffsetX = 0;
let audioClientX = 0;
let progressClientX = 0;
let progressOffsetX = 0;
let audioValue = 0;
let progressValue = 0;
let turnOffAfterFinished = null;

const Home = () => {
  const [playlists, setPlaylists] = useState([]);
  const [playlist, setPlaylist] = useState({ name: '', medias: [] });
  const [shuffledPlaylist, setShuffledPlaylist] = useState({
    name: '',
    medias: [],
  });
  const [playConfig, setPlayConfig] = useState({
    isShuffle: false,
    repeat: 'none',
    audioValue: 0.85,
    timer: Infinity
  });
  const [isPlaying, setPlaying] = useState(false);
  const [isAddingTimeMark, setAddingTimeMark] = useState(false);
  const [isTiming, setTiming] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [media, setMedia] = useState();
  const [metadata, setMetadata] = useState();
  const [hasLauched, setLauched] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaPlayer, setMediaPlayer] = useState();
  const [stampInfo, setStampInfo] = useState({
    atTime: 0,
    label: '',
  });
  const [timeStamps, setTimeStamps] = useState([]);

  const nextIndex = useMemo(
    () =>
      Math.max(
        shuffledPlaylist?.medias?.findIndex((m) => m.name === media?.name) + 1,
        0
      ),
    [media, shuffledPlaylist]
  );
  const playlistRef = useRef();
  const nextIndexRef = useRef();
  const playlistsRef = useRef();
  const configRef = useRef();
  playlistsRef.current = playlists;
  playlistRef.current = shuffledPlaylist;
  nextIndexRef.current = nextIndex;
  configRef.current = playConfig;

  useEffect(() => {
    setMediaPlayer(document.getElementById('media-player'));
    getPlaylists();
    if (localStorage.getItem('user-config')) {
      const config = JSON.parse(localStorage.getItem('user-config'));
      console.log(config);
      setPlayConfig({ ...config, timer: Infinity });
      document.getElementById('media-player').volume = config.audioValue;
      document.getElementById('audio-button').style.left = `${
        config.audioValue * 100
      }%`;
      document.getElementById('audio-fill').style.width = `${
        config.audioValue * 100
      }%`;
    }
    document.getElementById('media-player').onwebkitfullscreenchange = onExitFullscreen;
    window.electron.onMediaMetadata((e, m) => setMetadata(m))
    window.electron.onRequestPlayNext((e) => {
      playNext(playlistRef.current, nextIndexRef.current, true);
    });
    window.electron.onRequestPlayPrevious((e) => {
      playNext(playlistRef.current, nextIndexRef.current - 2, true);
    });
    window.electron.onTogglePlay((e) => {
      const player = document.getElementById('media-player');
      if (player.paused) {
        player.play();
      } else {
        player.pause();
      }
    });
    window.electron.onDecreaseVolume((e) => {
      const media = document.getElementById('media-player');
      media.volume = Math.max(media.volume - 0.1, 0);
    });
    window.electron.onIncreaseVolume((e) => {
      const media = document.getElementById('media-player');
      media.volume = Math.min(media.volume + 0.1, 1);
    });
    window.electron.chooseMedia((e, index) => {
      playNext(playlistRef.current, index, true)
    })
    window.electron.changePlaylist((e, index) => {
      setPlaylist(playlistsRef.current[index])
    })
    window.electron.seekTo((e, time) => {
      const player = document.getElementById('media-player')
      if(player){
        player.currentTime = time
      }
    })
    window.electron.changeTimer((e, type) => {
      if(type === "increase"){
        if(configRef.current.timer === Infinity){
          setPlayConfig({...configRef.current, timer: 1 })
        }else{
          setPlayConfig({...configRef.current, timer: configRef.current.timer + 1 })
        }
      }else{
        setPlayConfig({...configRef.current, timer: Infinity})
      }
    })
    window.electron.requestTurnOff((e, state) => {
      if(configRef.current.timer === Infinity){
        window.electron.turnOff(state);
      }else{
        turnOffAfterFinished = state;
      }
    })
    window.electron.requestTimeUpdate((e) => {
      const player = document.getElementById("media-player");
      window.electron.onTimeUpdate(player.currentTime)
    })
    navigator.mediaSession.setActionHandler('seekto', (data) => {
      const player = document.getElementById('media-player');
      if (player.src !== null) {
        player.currentTime = data.seekTime;
      }
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      playNext(playlistRef.current, nextIndexRef.current)
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      playNext(playlistRef.current, nextIndexRef.current - 1)
    })
    setLauched(true);
  }, []);

  useEffect(() => {
    if (hasLauched) {
      localStorage.setItem('user-config', JSON.stringify(playConfig));
    }
    window.electron.getConfig(playConfig)
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
    window.electron.getPlaylist(shuffledPlaylist)
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
    if (metadata && metadata.picture?.length > 0) {
      const blob = new Blob([metadata.picture[0].data]);
      document.getElementById('preview-mp3').src = URL.createObjectURL(blob);
      document.getElementById('preview-mp3').style.display = 'block';
    } else {
      document.getElementById('preview-mp3').style.display = 'none';
    }
  }, [metadata]);

  const getTimeStamps = () => {
    if(media){
      setTimeStamps(JSON.parse(localStorage.getItem(media.name)))
    }
  }

  const updateScrollPosition = () => {
    if (media && searchQuery.length === 0) {
      const index = shuffledPlaylist.medias
        .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .findIndex((m) => m.name === media.name);
      document.getElementsByClassName('media')[index].scrollIntoView();
    }
  };

  const onExitFullscreen = (e) => {
    e.target.controls = false;
  };

  const onDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('drop-recognizer').style.display = 'flex';
  };

  const editPlaylistName = (e) => {
    if (playlist.name.length !== 0 && e.target.value !== '') {
      const playlists = JSON.parse(localStorage.getItem('playlists'));
      playlists[playlists.findIndex((p) => p.name === playlist.name)].name =
        e.target.value;
      localStorage.setItem('playlists', JSON.stringify(playlists));
      setShuffledPlaylist({ ...shuffledPlaylist, name: e.target.value });
      setPlaylist({ ...playlist, name: e.target.value });
      getPlaylists();
    }
  };

  const onEditingPlaylistName = (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      e.target.blur();
    }
  };

  const onMediaEnded = (e) => {
    playNext(shuffledPlaylist, nextIndex);
  };

  const onTimeUpdate = (e) => {
    document.getElementById('progress-button').style.left = `calc(${(e.target.currentTime * 100) / e.target.duration}% - 5px)`;
    document.getElementById('progress-fill').style.width = `${
      (e.target.currentTime * 100) / e.target.duration
    }%`;
    document.getElementById('progress-text').innerText = `${getDuration(
      e.target.currentTime
    )}/${getDuration(e.target.duration)}`;
  };

  const prepareMediaPlayer = async () => {
    if (media && !isLoading) {
      setLoading(true);
      window.electron.getCurrentMedia(media);
      mediaPlayer.removeAttribute("src");
      mediaPlayer.src = `http://192.168.1.5:3000/getStream/${nextIndex-1}`;
      mediaPlayer.load();
      setLoading(false);
      if(playConfig.timer !== Infinity ){
        setPlayConfig({ ...playConfig, timer: playConfig.timer - 1 })
      }
    }
  };

  const getPlaylists = () => {
    if (localStorage.getItem('playlists')) {
      const pls = JSON.parse(localStorage.getItem('playlists'));
      setPlaylists(pls);
      window.electron.getPlaylists(pls);
    }
  };

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
    if (!media) return;

    if (isPlaying) {
      mediaPlayer.pause();
    } else {
      mediaPlayer.play();
    }
  };

  const isAudio = (media) => {
    if (media && /mp3$/.test(media.path)) {
      return true;
    }
    return false;
  };

  const playNext = (playlist, index, forcePlayNext = false) => {
    if (playlist.medias.length === 0 || isLoading) return;

    if (playConfig.timer === 0 && !forcePlayNext){
      clearTimer()
      return;
    }

    if(playConfig.timer > 0 && forcePlayNext){
      clearTimer()
    }

    if(isAddingTimeMark){
      setPlaying(false);
      return;
    }

    if (playConfig.repeat === 'repeat-one' && !forcePlayNext) {
      mediaPlayer.currentTime = 0;
      mediaPlayer.play();
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
    if(turnOffAfterFinished !== null){
      window.electron.turnOff(turnOffAfterFinished);
      turnOffAfterFinished = null;
    }
  }

  const shufflePlaylist = (playlist) => {
    let temp;
    let randomIndex1;
    let randomIndex2;
    const newPlaylist = playlist;
    for (let i = 0; i < playlist.medias.length; i++) {
      randomIndex1 = parseInt(Math.random() * 1000) % playlist.medias.length;
      randomIndex2 = parseInt(Math.random() * 1000) % playlist.medias.length;
      temp = newPlaylist.medias[randomIndex1];
      newPlaylist.medias[randomIndex1] = newPlaylist.medias[randomIndex2];
      newPlaylist.medias[randomIndex2] = temp;
    }
    return { ...newPlaylist };
  };

  const toggleExpand = () => {
    const mainInfo = document.getElementById('main-info-head');
    if (mainInfo.className.includes('expand-main-info-head')) {
      mainInfo.className = '';
      document.getElementById('dropzone').style.height = '60%';
    } else {
      mainInfo.className = 'expand-main-info-head';
      document.getElementById('dropzone').style.height = '35%';
    }
  };

  const onFocusAudioBar = (e) => {
    isAudioBarFocused = true;
    document.getElementById('audio-button-bg').className =
      'show-audio-button-bg';
    audioClientX = e.clientX;
    audioOffsetX = e.nativeEvent.offsetX - 5;
    mediaPlayer.volume = e.nativeEvent.offsetX / 80;
  };

  const onBlurBar = (e) => {
    if (isAudioBarFocused) {
      isAudioBarFocused = false;
      document.getElementById('audio-button-bg').className =
        'hide-audio-button-bg';
      setPlayConfig({ ...playConfig, audioValue: mediaPlayer.volume });
    }
    if (isProgressBarFocused) {
      isProgressBarFocused = false;
      mediaPlayer.play();
      setPlaying(true);
    }
  };

  const onDragButton = (e) => {
    if (isAudioBarFocused) {
      audioValue = Math.max(
        Math.min(audioOffsetX + 5 + (e.clientX - audioClientX), 80),
        0
      );
      mediaPlayer.volume = audioValue / 80;
    }
    if (isProgressBarFocused) {
      setCurrentTime(e);
    }
  };

  const onVolumeChange = (e) => {
    const { volume } = e.target;
    document.getElementById('audio-button').style.left = `calc(${
      volume * 100
    }% - 5px)`;
    document.getElementById('audio-fill').style.width = `calc(${
      volume * 100
    }% - 5px)`;
  };

  const setCurrentTime = (e) => {
    progressValue = Math.max(
      Math.min(
        ((progressOffsetX + (e.clientX - progressClientX)) * 100) /
          document.getElementById('progress-bar').clientWidth,
        100
      ),
      0
    );
    mediaPlayer.currentTime = (mediaPlayer.duration * progressValue) / 100;
    window.electron.onTimeUpdate(mediaPlayer.currentTime)
  };

  const onFocusProgressBar = (e) => {
    if (media) {
      progressClientX = e.clientX;
      progressOffsetX = e.nativeEvent.offsetX;
      if (isAddingTimeMark) {
        const modal = document.getElementById("modal-container");
        modal.style.zIndex = 5;
        modal.style.opacity = 1;
        setTimeout(() => document.getElementById("ts-label-input").focus(), 1)
        progressValue = Math.max(
          Math.min(
            ((progressOffsetX + (e.clientX - progressClientX)) * 100) /
              document.getElementById('progress-bar').clientWidth,
            100
          ),
          0
        );
        setStampInfo({
          atTime: (mediaPlayer.duration * progressValue) / 100,
          label: ""
        });
      } else {
        mediaPlayer.pause();
        isProgressBarFocused = true;
        setCurrentTime(e);
        setPlaying(false);
      }
    }
  };

  const changeMedia = (newMedia) => () => {
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

  const getMediaName = (name) => {
    return name?.replace(/.mp3/, '').replace(/.mp4/, '');
  };

  const changePlaylist = (playlist) => () => setPlaylist(playlist);

  const isCurrentMedia = (mediaName) => {
    return media?.name === mediaName;
  };

  const clearPlaylist = () => {
    mediaPlayer.pause();
    mediaPlayer.removeAttribute('src');
    mediaPlayer.load();
    setPlaylist({ name: '', medias: [] });
    setShuffledPlaylist({ name: '', medias: [] });
    setPlaying(false);
    setMedia(null);
  };

  const showContextMenu = (type, data) => (e) => {
    const contextMenu = document.getElementById('context-menu');
    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.display = 'block';
    contextMenu.onclick = function (e) {
      if (type === "playlist") {
        removePlaylist(data.name);
      }
      if (type === "media") {
        removeMedia(data.name);
      }
      if (type === "timestamp"){
        removeTimeStamp(data.index);
      }
    };
  };

  const removePlaylist = (playlistName) => {
    if (playlist.name === playlistName) {
      clearPlaylist();
    }
    let playlists = JSON.parse(localStorage.getItem('playlists'));
    playlists = playlists.filter((p) => p.name !== playlistName);
    localStorage.setItem('playlists', JSON.stringify(playlists));
    setPlaylists(playlists);
  };

  const removeMedia = (mediaName) => {
    let playlists = JSON.parse(localStorage.getItem('playlists'));
    const newPlaylist = {
      ...playlist,
      medias: playlist.medias.filter((m) => m.name !== mediaName),
    };
    playlists = playlists.map((p) =>
      p.name === newPlaylist.name ? newPlaylist : p
    );
    localStorage.setItem('playlists', JSON.stringify(playlists));
    setPlaylist(newPlaylist);
    setPlaylists(playlists);
    setShuffledPlaylist({ ...shuffledPlaylist, medias: shuffledPlaylist.medias.filter(m => newPlaylist.medias.some(m2 => m.name === m2.name)) })
    if (media.name === mediaName) {
      nextMedia();
    }
  };

  const onPause = () => {
    window.electron.doAction(false);
    setPlaying(false);
  };

  const onPlay = () => {
    window.electron.doAction(true);
    setPlaying(true);
  };

  const onSearchingMedia = (e) => setSearchQuery(e.target.value);

  const requestFullScreen = () => {
    mediaPlayer.requestFullscreen().then(() => (mediaPlayer.controls = true));
  };

  const requestPIP = () => {
    mediaPlayer.requestPictureInPicture();
  };

  const toggleSidePanel = () => {
    const panel = document.getElementById('side-panel');
    const mainInfo = document.getElementById('main-info');
    if (panel.className === 'hide-side-panel') {
      panel.className = '';
      mainInfo.className = '';
    } else {
      panel.className = 'hide-side-panel';
      mainInfo.className = 'expand-main-info';
    }
  };

  const onMediaLoaded = (e) => {
    e.target.play();
  };

  const hideContextMenu = () => {
    document.getElementById('context-menu').style.display = 'none';
  };

  const showDurationPreview = (e) => {
    if (media) {
      const progressValue = Math.max(
        Math.min((e.nativeEvent.offsetX * 100) / e.target.clientWidth, 100),
        0
      );
      const node = document.getElementById('progress-preview');
      node.innerText = getDuration(
        ((mediaPlayer.duration * progressValue) / 100)
      );
      node.style.display = 'block';
      node.style.left = `${e.nativeEvent.offsetX + 5}px`;
    }
  };

  const toggleAddTimeMark = () => setAddingTimeMark(!isAddingTimeMark);

  const toggleTimer = () => {
    if(isTiming){
      setTiming(false);
      setPlayConfig({ ...playConfig, timer: Infinity });
    }else{
      setTiming(true);
      const modal = document.getElementById("modal-container");
      modal.style.opacity = 1;
      modal.style.zIndex = 5;
    }
  };

  const onProgressBarMouseLeave = (e) => {
    if (media) {
      const progressPreview = document.getElementById('progress-preview');
      progressPreview.style.display = 'none';
    }
  };

  const onInput = (e) => {
    if(isAddingTimeMark){
      setStampInfo({ ...stampInfo, label: e.target.value });
    }
  }

  const onSubmit = (e) => {
    if (e.key === 'Enter') {
      if(isAddingTimeMark && media && stampInfo.label.length > 0){
        saveStampInfo()
      }
      if(isTiming){
        try {
          setPlayConfig({ ...playConfig, timer: parseInt(e.target.value) })
          onBackdropClick(false)
        } catch (error) {
          setPlayConfig({ ...playConfig, timer: Infinity })
          onBackdropClick()
        }
      }
    }
  };

  const onBackdropClick = (isInfinity) => {
    const modal = document.getElementById('modal-container');
    modal.style.opacity = 0;
    setTimeout(() => {
      modal.style.zIndex = -1;
      document.getElementById("ts-label-input").value = "";
    }, 250);
    if(isTiming && isInfinity){
      setTiming(false)
    }
  };

  const saveStampInfo = () => {
    const stamps = JSON.parse(localStorage.getItem(media.name));
    if(Array.isArray(stamps)){
      stamps.push(stampInfo)
      localStorage.setItem(media.name, JSON.stringify(stamps))
    }else{
      localStorage.setItem(media.name, JSON.stringify([stampInfo]))
    }
    getTimeStamps()
    onBackdropClick()
  }

  const moveToTimeStamp = mark => () => {
    if(mark && media){
      mediaPlayer.currentTime = mark.atTime
    }
  }

  const getStampPosition = stamp => {
    const progressBarWidth = document.getElementById("progress-bar").clientWidth;
    return media ? progressBarWidth * (stamp.atTime / media.duration) : 0
  }

  const onMouseOverStamp = index => () => {
    const [body, bottom] = document.getElementsByClassName("stamp")[index].childNodes;
    body.style.backgroundColor = "#00eaff";
    bottom.style.borderLeft = "5px solid #00eaff";
  }

  const onMouseLeaveStamp = index => () => {
    const [body, bottom] = document.getElementsByClassName("stamp")[index].childNodes;
    body.style.backgroundColor = "yellow";
    bottom.style.borderLeft = "5px solid yellow";
  }

  const removeTimeStamp = index => {
    try {
      let stamps = JSON.parse(localStorage.getItem(media.name));
      stamps = stamps.filter((s, i) => i !== index)
      localStorage.setItem(media.name, JSON.stringify(stamps));
      getTimeStamps()
    } catch (error) {

    }
  }

  return (
    <div id="container">
      <div id="body" onClick={hideContextMenu}>
        <RiPlayListAddLine id="new-playlist" fontSize={15} color={lightBlue} />
        <div id="context-menu">Remove</div>
        <div id="side-panel">
          <ul className="playlist-list">
            {playlists.map((p) => (
              <li
                key={p.name}
                className="playlist-item"
                onClick={changePlaylist(p)}
                onContextMenu={showContextMenu('playlist', p)}
              >
                <div className="p-icon">
                  <RiPlayListFill fontSize={20} color={whiteSmoke} />
                </div>
                <div className="playlist-descriptions">
                  <div className="p-name">{p.name}</div>
                  <div className="p-inline">
                    <span className="p-total-media">
                      {p.medias.length} songs
                    </span>
                    <span className="dot" />
                    <span className="p-total-duration">
                      {getTotalDuration(p.medias)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="time-mark">
            <div className="ts-heading">Time Stamps</div>
              <ul className="ts-list">
                {Array.isArray(timeStamps) && timeStamps.map((m, i) => (
                  <li
                    key={i}
                    className="ts-item"
                    onClick={moveToTimeStamp(m)}
                    onMouseOver={onMouseOverStamp(i)}
                    onMouseLeave={onMouseLeaveStamp(i)}
                    onContextMenu={showContextMenu("timestamp", { index: i })}>
                    <div className="ts-label">{m.label}</div>
                    <div className="ts-at-time">{getDuration(m.atTime)}</div>
                  </li>
                ))}
              </ul>
          </div>
        </div>
        <div id="main-info">
          <div id="main-info-head">
            <div
              style={{ display: isAudio(media) ? 'flex' : 'none' }}
              className="info"
            >
              <div className="musical-note-container">
                <IoMusicalNote fontSize={30} color={whiteSmoke} />
                <img id="preview-mp3" />
              </div>
              <div className="descriptions">
                <div className="d-media-name">{getMediaName(media?.name)}</div>
                <div className="d-performer-name">
                  {Array.isArray(metadata?.artist) && metadata.artist[0]}
                </div>
                <div className="d-duration">{getDuration(media?.duration)}</div>
              </div>
            </div>
            <video
              style={{ display: isAudio(media) ? 'none' : 'block' }}
              id="media-player"
              src="http://192.168.1.5:3000/getStream"
              onEnded={onMediaEnded}
              onTimeUpdate={onTimeUpdate}
              onPlay={onPlay}
              onPause={onPause}
              onLoadedData={onMediaLoaded}
              onVolumeChange={onVolumeChange}
            />
          </div>
          <div
            id="dropzone"
            className="playlist-container"
            onDragEnter={onDragEnter}
          >
            <div className="playlist-name-container">
              <RiPlayListFill fontSize={20} color={whiteSmoke} />
              <div id="hidden-name">{playlist.name}</div>
              <input
                autoFocus={false}
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
                  color={whiteSmoke}
                />
              </div>
              <VscClearAll
                className="clear-playlist"
                fontSize={20}
                color={whiteSmoke}
                onClick={clearPlaylist}
              />
            </div>
            <StyledDropzone
              currentPlaylist={playlist}
              setPlaylist={setPlaylist}
              setPlaylists={setPlaylists}
            />
            <ul className="playlist">
              {shuffledPlaylist?.medias
                ?.filter((m) =>
                  m.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((media) => (
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
                        <MdAudiotrack fontSize={20} color={whiteSmoke} />
                      ) : (
                        <MdOutlineMusicVideo fontSize={20} color={whiteSmoke} />
                      )}
                    </div>
                    <div className="item-descriptions">
                      <div
                        style={{
                          color: isCurrentMedia(media.name)
                            ? lightBlue
                            : '#f8f8ff',
                        }}
                        className="i-media-name"
                        onClick={changeMedia(media)}
                      >
                        {getMediaName(media.name)}
                      </div>
                      <div className="i-duration">
                        {getDuration(media.duration)}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="footer" onMouseMove={onDragButton} onMouseUp={onBlurBar}>
        <div className="action-container">
          <div className="buttons">
            <div className='add-timer-container' onClick={toggleTimer}>
              {
                playConfig.timer !== Infinity ?
                  <span className="song-timer">{playConfig.timer}</span> :
                  <MdTimer
                    className="add-timer"
                    fontSize={15}
                    color={isTiming ? lightBlue : whiteSmoke}
                  />
              }
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
            <div className="audio-bar-container" onMouseDown={onFocusAudioBar}>
              <div className="audio-bar">
                <div id="audio-button">
                  <div id="audio-button-bg" />
                </div>
                <div id="audio-fill" />
              </div>
            </div>
          </div>
          <div className="progress-container" onMouseDown={onFocusProgressBar}>
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
            {Array.isArray(timeStamps) && timeStamps.map(ts => (
              <div style={{ position: "absolute", left: getStampPosition(ts) }} className="stamp">
                <div className="stamp-body"></div>
                <div className="stamp-bottom"></div>
              </div>
            ))}
          </div>
        </div>
        {!isAudio(media) && (
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
            <IoExpand
              className="fullscreen"
              fontSize={20}
              color={whiteSmoke}
              onClick={requestFullScreen}
            />
          </>
        )}
        <TbLayoutSidebarLeftCollapse
          className="collapse-side-panel"
          fontSize={22}
          color={whiteSmoke}
          onClick={toggleSidePanel}
        />
      </div>
      <div id="modal-container">
        <div className="modal-backdrop" onClick={onBackdropClick}/>
        <div className="modal">
          <div className="m-description">{isTiming ? "Stop after how many songs:" : `Set a time stamp at ${getDuration(stampInfo.atTime)}`}</div>
          <input
            type="text"
            name="ts-label"
            id="ts-label-input"
            onInput={onInput}
            onKeyDown={onSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
