import { _ } from './util.js';
import MyPromise from './my-promise.js';

export const initPies = ($txrx) => {
  const $dividerContainer = $txrx.firstElementChild;
  const $hexContainer = $txrx.lastElementChild;

  return (pieCnt) => {
    $txrx.setAttribute('data-pie-count', pieCnt);

    for (let i = 0; i < pieCnt; i++) {
      $dividerContainer.appendChild(
        _.genEl('DIV', {
          classNames: [`divider-${i}`],
        })
      );
      $hexContainer.appendChild(
        _.genEl('DIV', {
          classNames: [`hex-${i}`],
          template: `${i.toString(16).toUpperCase()}`,
        })
      );
    }
  };
};

export const initArrowContainer = ($txrx) => {
  return (imgData) => {
    const $container = _.genEl('DIV', {
      classNames: [`arrow-cont`],
      template: `<div class="ring"></div>`,
    });

    $container.appendChild(
      _.genEl('IMG', {
        classNames: [`arrow`],
        attributes: { src: imgData.url, 'data-indicating': 0 },
      })
    );

    $txrx.appendChild($container);
  };
};

export const runTransceiver = ($txrx, { serverUrl, commInterval, blinkInterval, blinkCnt }) => {
  const $receiveForm = _.$('.form', $txrx.nextElementSibling);
  const $arrow = _.$('.arrow', $txrx);
  const $hexs = _.$('.hex-cont', $txrx).children;
  const pieCnt = $txrx.dataset.pieCount;

  const rotate = () => {
    let currHex = $arrow.dataset.indicating;
    let oldRotateClass;
    let newRotateClass;

    return (hex) => {
      const isClock =
        Math.abs(currHex - hex) < Math.abs(pieCnt - 1 - hex) + currHex;
      newRotateClass = `rotate-${isClock ? 'clock' : 'unclock'}-for-${hex}`;

      $arrow.dataset.indicating = currHex = hex;
      $arrow.classList.remove(oldRotateClass);
      $arrow.classList.add(newRotateClass);

      oldRotateClass = newRotateClass;
    };
  };
  const rotateTo = rotate();

  const blink = (codes, { onFulfilled }) => {
    const $currHex = $hexs[codes[0]];
    let cnt = 0;

    const setTimeoutBlink = () => {
      setTimeout(() => {
        if ($currHex.classList.contains('blink')) {
          $currHex.classList.remove('blink');
          cnt++;
        } else {
          $currHex.classList.add('blink');
        }

        if (cnt < blinkCnt) setTimeoutBlink();
        else onFulfilled(codes.length ? codes.slice(1) : null);
      }, blinkInterval);
    };

    setTimeoutBlink();
  };

  const run = () => {
    let intervalHandle;

    new MyPromise((resolve, reject) => {
      intervalHandle = setInterval(() => {
        fetch(serverUrl + 'charCode')
          .then((res) => res.text())
          .then((data) => {
            if (data) {
              clearInterval(intervalHandle);
              resolve([...data]);
            }
          });
      }, commInterval);
    })
      .then((data) => data.map((code) => parseInt(code, 16)))
      .then((codes) => {
        rotateTo(codes[0]);
        return new MyPromise((resolve, reject) => {
          $receiveForm.value += codes[0].toString(16).toUpperCase();
          blink(codes, { onFulfilled: resolve });
        });
      })
      .then((codes) => {
        if (codes.length === 0) return;

        rotateTo(codes[0]);
        return new MyPromise((resolve, reject) => {
          $receiveForm.value += codes[0].toString(16).toUpperCase();
          blink(codes, { onFulfilled: resolve });
        });
      })
      .catch(console.error)
      .finally(() => {
        $receiveForm.value += ' ';
        run();
      });
  };

  run();
};
