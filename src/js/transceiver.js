import { _ } from './util.js';
import MyPromise from './my-promise.js';
import { initInterpretBtn } from './form.js';

export const initPies = ($txrx) => {
  const $dividerContainer = _.$('.divider-cont', $txrx);
  const $hexContainer = _.$('.hex-cont', $txrx);

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

const IDLE = 0;
const RECEIVE = 1;
const RECEIVE_COMPLETE = 2;
const TRANSMIT = 3;
const TRANSMIT_COMPLETE = 4;
let txrxState = IDLE; // tmp

const LF = 'A';

// tmp
const UNREADY = 0;
const READY = 1;
let pieCnt;
let $hexs;
let blinkInterval;

const rotate = ($arrow) => {
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

      if (cnt < 4) setTimeoutBlink();
      else onFulfilled(codes.length ? codes.slice(1) : null);
    }, 200);
  };

  setTimeoutBlink();
};


export const runTransceiver = ($txrx, { url, commInterval, blinkInterval, blinkCnt, transmitBtnState }) => {
  const $receiveContainer = _.$('.receive-cont', $txrx);
  const $receiveForm = _.$('.form', $receiveContainer);
  const $interpretBtn = _.$('.interpret-btn', $receiveContainer);
  const $transmitContainer = _.$('.transmit-cont', $txrx);
  const $transmitForm = _.$('.form', $transmitContainer);
  const $transmitBtn = _.$('.transmit-btn', $transmitContainer);
  const $arrow = _.$('.arrow', $txrx);
  $hexs = _.$('.hex-cont', $txrx).children;
  pieCnt = $txrx.dataset.pieCount;
  const rotateTo = rotate($arrow);

  const fetchCodeInterval = (onFulfilled, onRejected) => {
    let intervalHandle;

    intervalHandle = setInterval(() => {
      if (txrxState === IDLE && transmitBtnState() === READY)
        $transmitBtn.disabled = false;

      if (txrxState === TRANSMIT) {
        clearInterval(intervalHandle);

        new MyPromise((resolve, reject) => waitTransmitEnd(resolve))
          .then(() => onRejected());
      }

      fetch(url + 'charCode')
        .then((res) => res.text())
        .then((data) => {
          if (data) {
            if (data === LF) {
              clearInterval(intervalHandle);
              onRejected('end');
              return;
            }

            if (!$transmitBtn.disabled)
              $transmitBtn.disabled = true;

            clearInterval(intervalHandle);
            onFulfilled([...data]);
          }
        });
    }, commInterval);
  }

  // const waitInterpretEnd = (onFulfilled) => {
  //   let intervalHandle;

  //   intervalHandle = setInterval(() => {
  //     if (!$interpretBtn.disabled)
  //       return;
      
  //     clearInterval(intervalHandle);
  //     txrxState = IDLE;
  //     onFulfilled();
  //   }, 100);
  // }

  const waitTransmitEnd = (onFulfilled) => {
    let intervalHandle;

    intervalHandle = setInterval(() => {
      if (txrxState === TRANSMIT)
        return;
      
      clearInterval(intervalHandle);
      txrxState = TRANSMIT_COMPLETE;
      onFulfilled();
    }, 100);
  }

  const run = () => {
    new MyPromise((resolve, reject) => fetchCodeInterval(resolve, reject))
      .then(data => {
        txrxState = RECEIVE;
        return data.map((code) => parseInt(code, 16))
      },data => {
        if (data === 'end') txrxState = RECEIVE_COMPLETE;
        return;
      })
      .then((codes) => { // [6, 1]
        rotateTo(codes[0]);
        return new MyPromise((resolve, reject) => {
          $receiveForm.value += codes[0].toString(16).toUpperCase();
          blink(codes, { onFulfilled: resolve });
        });
      })
      .then((codes) => { // [1] , empty
        if (codes.length === 0) return;

        rotateTo(codes[0]);
        return new MyPromise((resolve, reject) => {
          $receiveForm.value += codes[0].toString(16).toUpperCase();
          blink(codes, { onFulfilled: resolve });
        });
      })
      .catch(console.error)
      .finally(() => {
          new MyPromise((resolve, reject) => {
            if (txrxState === RECEIVE_COMPLETE) $interpretBtn.disabled = false;
            resolve();
          })
          .then(() => {
            if ($receiveForm.value.length) $receiveForm.value += ' ';
            txrxState = IDLE;
            run();
          });
      });
  };

  run();
};

// tmp
const $txrx = _.$('.txrx');
const commInterval = 1000;

export const transmit = ({ url, message, transmitEndCallback }) => {
  const $arrow = _.$('.arrow', $txrx);
  const rotateTo = rotate($arrow);
  txrxState = TRANSMIT;
  message = message.split(' ');
  message.push(LF);

  /*
    setTimeout(() => {
    fetch(url + 'charCodes', { method: POST })
      .then(res => {
        if (res.ok) resolve();
        else reject();
      });
  }, 500);
  */

  // let intervalHandle;

  const run = () => {
    new MyPromise((resolve, reject) => {
      const codes = message.shift();
      if (codes === LF) reject();
      else resolve(codes);
    })
      .then(codes => {
        rotateTo(codes[0]);
        return new MyPromise((resolve, reject) => {
          blink(codes, { onFulfilled: resolve });
        });
      })
      .then(codes => {
        if (codes.length === 0) return;

        rotateTo(codes[0]);
        return new MyPromise((resolve, reject) => {
          blink(codes, { onFulfilled: resolve });
        });
      })
      .catch(console.error)
      .finally(() => {
        if (message.length)
          setTimeout(() => run(), 1000);
        else {
          fetch('http://' + url + '/charCodes', {
            method: 'POST',
            body: message.join(),
          })
            .finally(() => {
              txrxState = IDLE;
              transmitEndCallback();
            });
        }
      });
  }

  run();
}