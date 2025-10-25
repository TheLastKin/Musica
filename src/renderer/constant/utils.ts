import { Media } from 'renderer/types/types';

const fh = (hours: number) => {
  if (hours < 10) {
    return `0${hours}`;
  }
  return hours;
};

const fm = (minutes: number) => {
  if (minutes < 10) {
    return `0${minutes}`;
  }
  return minutes;
};

const fs = (seconds: number) => {
  if (seconds < 10) {
    return `0${seconds}`;
  }
  return seconds;
};

const getDuration = (time: number) => {
  if (time !== 0 && !isNaN(time)) {
    const hours = parseInt((time / 3600).toString());
    const minutes = parseInt(((time - hours * 3600) / 60).toString());
    const seconds = parseInt(time.toString()) - 3600 * hours - minutes * 60;
    if (hours !== 0) {
      return `${fh(hours)}:${fm(minutes)}:${fs(seconds)}`;
    }
    return `${fm(minutes)}:${fs(seconds)}`;
  }
  return '00:00';
};

const getTotalDuration = (medias: Media[]) => {
  let duration = 0;
  for (const media of medias) {
    duration += media.duration;
  }
  return getDuration(duration);
};

const getMediaDuration = async (media: Blob | MediaSource) => {
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

const isAudio = (media: Media | undefined) => {
  if (media && /\.(mp3|wav|ogg|flac|m4a)$/i.test(media.path)) {
    return true;
  }
  return false;
};

const getMediaName = (name: string) => {
  return name?.replace(/.mp3/, '').replace(/.mp4/, '');
};

export { getTotalDuration, getMediaDuration, getDuration, isAudio, getMediaName };
