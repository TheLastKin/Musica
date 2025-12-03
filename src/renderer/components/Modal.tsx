/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React from 'react';
import { getDuration } from 'renderer/constant/utils';
import { Media, TimeStamp } from 'renderer/types/types';

type ModalProps = {
  isTiming: boolean;
  stampInfo: TimeStamp;
  media: Media | undefined;
  isAddingTimeMark: boolean;
  playConfig: any;
  setPlayConfig: React.Dispatch<React.SetStateAction<any>>;
  getTimeStamps: () => void;
  setTiming: React.Dispatch<React.SetStateAction<boolean>>;
  setStampInfo: React.Dispatch<React.SetStateAction<TimeStamp>>;
};

const Modal = ({
  isTiming,
  stampInfo,
  media,
  isAddingTimeMark = false,
  playConfig,
  setPlayConfig,
  setStampInfo,
  getTimeStamps,
  setTiming
}: ModalProps) => {
  const onBackdropClick = (isInfinity = true) => {
    const modal = document.getElementById('modal-container') as HTMLElement;
    modal.style.opacity = '0';
    setTimeout(() => {
      modal.style.zIndex = '-1';
      (document.getElementById('ts-label-input') as HTMLInputElement).value =
        '';
    }, 250);
    if (isTiming && isInfinity) {
      setTiming(false);
    }
  };
  const saveStampInfo = () => {
    if (!media) return;
    const stamps = JSON.parse(localStorage.getItem(media.name) as string);
    if (Array.isArray(stamps)) {
      stamps.push(stampInfo);
      localStorage.setItem(media.name, JSON.stringify(stamps));
    } else {
      localStorage.setItem(media.name, JSON.stringify([stampInfo]));
    }
    getTimeStamps();
    onBackdropClick();
  };
  const onSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isAddingTimeMark && media && stampInfo.note.length > 0) {
        saveStampInfo();
      }
      if (isTiming) {
        try {
          setPlayConfig({
            ...playConfig,
            timer: parseInt((e.target as HTMLInputElement).value, 10),
          });
          onBackdropClick(false);
        } catch (error) {
          setPlayConfig({ ...playConfig, timer: Infinity });
          onBackdropClick(false);
        }
      }
    }
  };
    const onInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isAddingTimeMark) {
      setStampInfo({
        ...stampInfo,
        note: (e.target as HTMLInputElement).value,
      });
    }
  };
  return (
    <div id="modal-container">
      <div
        className="modal-backdrop"
        onClick={() => onBackdropClick()}
      />
      <div className="modal">
        <div className="m-description">
          {isTiming
            ? 'Stop after how many songs:'
            : `Set a time stamp at ${getDuration(stampInfo.atTime)}`}
        </div>
        <input
          type="text"
          name="ts-label"
          id="ts-label-input"
          onInput={onInput}
          onKeyDown={onSubmit}
        />
      </div>
    </div>
  );
};

export default Modal;
