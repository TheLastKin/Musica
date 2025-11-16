/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from 'react';
import { FaWifi } from 'react-icons/fa';
import { TbLayoutSidebarLeftCollapse } from 'react-icons/tb';
import { green, whiteSmoke } from 'renderer/constant/colors';

type ExtraInfosType = {
  wifi: string;
  mediaName: string;
  isProjecting: boolean;
};

const ExtraInfos = ({ mediaName, wifi, isProjecting }: ExtraInfosType) => {
  const [showIPAddress, setShowIPAddress] = useState(false);
  const toggleShowIPAddress = () => setShowIPAddress(!showIPAddress);

  const getTextWidth = (text: string) => {
    // Create a temporary canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;

    // Set the font style
    context.font = `14px sans-serif`;

    // Measure the text
    const metrics = context.measureText(text);

    return metrics.width + 20;
  };

  const textWidth = useMemo(() => getTextWidth(mediaName), [mediaName]);

  const animate = () => {
    const appInfo = document.querySelector('.app-info') as HTMLElement;
    const nameRoll = document.querySelector('.name-roll') as HTMLElement;
    const name1 = document.querySelector(
      '.name-roll span:nth-child(1)'
    ) as HTMLElement;
    const name2 = document.querySelector(
      '.name-roll span:nth-child(2)'
    ) as HTMLElement;
    if (isProjecting) {
      appInfo.classList.add('app-info-hide');
      nameRoll.classList.add('name-roll-show');
      resetTextPosition(name1, '0px');
      resetTextPosition(name2, `${textWidth}px`);
      setTimeout(() => {
        name1.style.transition = `left ${Math.min(
          12,
          textWidth / 50
        )}s linear 0.8s`;
        name2.style.transition = `left ${Math.min(
          12 * 2,
          (textWidth * 2) / 50
        )}s linear 0.8s`;
        name1.style.left = `-${textWidth}px`;
        name2.style.left = `-${textWidth}px`;
        name1.ontransitionend = () => onAnimationEnd(name1);
        name2.ontransitionend = () => onAnimationEnd(name2);
      }, 200);
    } else {
      appInfo.classList.remove('app-info-hide');
      nameRoll.classList.remove('name-roll-show');
      resetTextPosition(name1, '0px');
      resetTextPosition(name2, `${textWidth}px`);
    }
  };

  const resetTextPosition = (target: HTMLElement, left: string) => {
    target.style.transition = '';
    target.style.left = left;
    target.ontransitionend = null;
  };

  const onAnimationEnd = (target: HTMLElement) => {
    resetTextPosition(target, `${textWidth}px`);
    setTimeout(() => {
      target.style.transition = `left ${Math.min(
        12 * 2,
        (textWidth * 2) / 50
      )}s linear`;
      target.style.left = `-${textWidth}px`;
      target.ontransitionend = () => onAnimationEnd(target);
    }, 100);
  };

  useEffect(() => {
    animate();
  }, [isProjecting, mediaName]);

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

  return (
    <div className="extra-infos">
      <div className="name-roll">
        <span style={{ width: `${textWidth}px` }}>{mediaName}</span>
        <span
          style={{
            width: `${textWidth}px`,
            left: `${isProjecting ? textWidth * -1 : textWidth}px`,
            transition: `left ${
              isProjecting ? Math.max(32 * 2, (textWidth * 2) / 24) : 0
            }s linear`,
          }}
        >
          {mediaName}
        </span>
      </div>
      <div className="app-info">
        <TbLayoutSidebarLeftCollapse
          className="collapse-side-panel"
          fontSize={20}
          color={whiteSmoke}
          onClick={toggleSidePanel}
        />
        {showIPAddress ? (
          <span
            className="hosting-ip"
            onClick={toggleShowIPAddress}
            role="button"
            onKeyDown={() => {}}
            tabIndex={-5}
          >
            {wifi}
          </span>
        ) : (
          <FaWifi
            className="hosting-ip"
            fontSize={18}
            color={green}
            onClick={toggleShowIPAddress}
          />
        )}
      </div>
    </div>
  );
};

export default ExtraInfos;
