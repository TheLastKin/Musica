import { Media } from 'renderer/types/types';
import "regenerator-runtime/runtime";

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
  if (time !== 0 && typeof(time) === "number") {
    const hours = parseInt((time / 3600).toString(), 10);
    const minutes = parseInt(((time - hours * 3600) / 60).toString(), 10);
    const seconds = parseInt(time.toString(), 10) - 3600 * hours - minutes * 60;
    if (hours !== 0) {
      return `${fh(hours)}:${fm(minutes)}:${fs(seconds)}`;
    }
    return `${fm(minutes)}:${fs(seconds)}`;
  }
  return '00:00';
};

const getTotalDuration = (medias: Media[]) => {
  let duration = 0;
  medias.forEach((media) => {
    duration += media.duration;
  });
  return getDuration(duration);
};

const getMediaDuration = async (media: Blob | MediaSource) => {
  const videoNode = document.createElement('video');
  const promise = new Promise((resolve, reject) => {
    videoNode.addEventListener('loadedmetadata', () => {
      resolve(videoNode.duration);
    });
    videoNode.addEventListener('error', (err) => {
      reject(new Error(`Failed to load media duration: ${err}`));
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
