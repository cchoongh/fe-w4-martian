import { _ } from './util.js';
import { transmit } from './transceiver.js';

export const initFormContainer = ($formCont) => {
  return ({ title, btnContent, btnClass }) => {
    $formCont.appendChild(_.genEl('DIV', {
      classNames: ['title'],
      template: `${title}`,
    }));
    $formCont.appendChild(_.genEl('INPUT', {
      classNames: ['form'],
    }));
    $formCont.appendChild(_.genEl('BUTTON', {
      classNames: [btnClass],
      template: `${btnContent}`,
      attributes: { disabled: 'disabled' }
    }));
  }
}

const initMessagePopup = ($parent, { cancel, confirmCallback, cancelCallback } = { cancel: false }) => {
  const $messagePopup = _.genEl('DIV', { classNames: ['message-popup'] });
  const $message = _.genEl('DIV', { classNames: ['message'] });
  const $confirmBtn = _.genEl('BUTTON', { classNames: ['confirm-btn'], template: `확 인` });
  const $blurScreen = _.$('.blur-screen');

  const onClickConfirm = () => {
    $messagePopup.classList.remove('show');
    $message.innerHTML = '';
    $blurScreen.hidden = true;
    confirmCallback?.();
  }

  $confirmBtn.addEventListener('click', onClickConfirm);
  $messagePopup.appendChild($message);
  $messagePopup.appendChild($confirmBtn);

  if (cancel) {
    const onClickCancel = () => {
      $messagePopup.classList.remove('show');
      $blurScreen.hidden = true;
      cancelCallback?.();
    }

    const $cancelBtn = _.genEl('BUTTON', { classNames: ['cancel-btn'], template: `취 소` });
    $cancelBtn.addEventListener('click', onClickCancel);
    $messagePopup.appendChild($cancelBtn);
  }

  $parent.appendChild($messagePopup);

  return (message) => {
    $message.innerHTML = message;
    $messagePopup.classList.add('show');
  };
}

export const initInterpretBtn = ($receiveContainer) => {
  const $interpretBtn = _.$('.interpret-btn', $receiveContainer);
  const $receiveForm = _.$('.form', $receiveContainer);
  const $blurScreen = _.$('.blur-screen');

  const popupMessage = initMessagePopup($receiveContainer);

  const interpret = (codes) => String.fromCharCode(...codes.split(' ').map(code => parseInt(code, 16)));

  const onClick = () => {
    popupMessage(interpret($receiveForm.value));
    $interpretBtn.disabled = true;
    $receiveForm.value = "";
    $blurScreen.hidden = false;
  };

  $interpretBtn.addEventListener('click', onClick);
}

// tmp
const UNREADY = 0;
const READY = 1;

export const initTransmitBtn = ($transmitContainer) => {
  const $transmitBtn = _.$('.transmit-btn', $transmitContainer);
  const $transmitForm = _.$('.form', $transmitContainer);
  const $blurScreen = _.$('.blur-screen');
  let state = UNREADY;

  const code = (message) => [...message].map(char => char.charCodeAt(0).toString(16).toUpperCase()).join(' ');

  const confirmCallback = () => {
    $transmitBtn.disabled = true;
    transmit({
      url: window.location.host,
      message: code($transmitForm.value),
      transmitEndCallback: () => {
        state = UNREADY;
        $transmitForm.value = '';
      }
    });
  };

  const popupMessage = initMessagePopup($transmitContainer, {
    confirmCallback,
    cancel: true,
    // cancelCallback: () => {},
  });



  $transmitForm.addEventListener('input', () => {
    if (!$transmitForm.value) {
      state = UNREADY;
      $transmitBtn.disabled = true;
    } else {
      state = READY;
    }
  });

  $transmitBtn.addEventListener('click', () => {
    popupMessage(code($transmitForm.value));
    $blurScreen.hidden = false;
  });

  return () => state;
}