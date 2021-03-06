import '../scss/style.scss';
// import variables from '../scss/_export.scss'; -> not working..
import { _ } from './util.js';
import * as Transceiver from './transceiver.js';
import * as Form from './form.js';

const SERVER = 'http://localhost:3000/';

const COMMUNICATION_INTERVAL = 1000;
const BLINK_INTERVAL = 200;
const BLINK_CNT = 4;
const PIE_CNT = 16;

document.addEventListener('DOMContentLoaded', () => {
  fetch(SERVER + 'json/contents.json')
    .then(res => res.json())
    .then(json => {
      const $txrx = _.$('.txrx');
      const $receiveContainer = _.$('.receive-cont');
      const $transmitContainer = _.$('.transmit-cont');

      Transceiver.initPies($txrx)(PIE_CNT);
      Transceiver.initArrowContainer($txrx)(json.arrowImg);

      Form.initFormContainer($receiveContainer)({
        title: '송수신정보', 
        btnContent: '해석하기',
        btnClass: 'interpret-btn',
      });
      Form.initFormContainer($transmitContainer)({
        title: '발신정보입력',
        btnContent: '지구로 보내기',
        btnClass: 'transmit-btn',
      });

      Form.initInterpretBtn($receiveContainer);
      const getTransmitBtnState = Form.initTransmitBtn($transmitContainer, $txrx);

      Transceiver.runTransceiver($txrx, {
        url: SERVER,
        commInterval: COMMUNICATION_INTERVAL,
        blinkInterval: BLINK_INTERVAL,
        blinkCnt: BLINK_CNT,
        transmitBtnState: getTransmitBtnState,
      });
    });
});