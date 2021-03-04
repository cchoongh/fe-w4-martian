import { _ } from './util.js';

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
    }));
  }
}

const initMessagePopup = ($parent) => {
  const $messagePopup = _.genEl('DIV', { classNames: ['message-popup'] });
  const $message = _.genEl('DIV', { classNames: ['message'] });
  const $confirmBtn = _.genEl('BUTTON', { classNames: ['confirm-btn'], template: `확 인` });
  const $blurScreen = _.$('.blur-screen');

  const onClick = () => {
    $messagePopup.classList.remove('show');
    $message.innerHTML = '';
    $blurScreen.hidden = true;
  }

  $confirmBtn.addEventListener('click', onClick);
  $messagePopup.appendChild($message);
  $messagePopup.appendChild($confirmBtn);
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
    $receiveForm.value = "";
    $blurScreen.hidden = false;
  };

  $interpretBtn.addEventListener('click', onClick);
}

export const initTransmitBtn = ($transmitBtn, $transmitForm) => {
  
}