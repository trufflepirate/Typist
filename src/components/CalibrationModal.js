import React, { useState } from "react";

import { StateHandler } from "../StateHandler";
import {PUT_verifyEmail} from "../endpointRequests";


const stateHandler = new StateHandler()

export const _CALIBRATION_MODAL_ID = "calibration-modal-1";

export function CalibrationButton(props) {
  const calibrated = props.calibrated
  const target = props.target;
  const scaling = target === "navbar" ? "" : "w-40 h-40"
  const margins = target === "navbar" ? "w-6 h-6" : "m-3"
  const ghost = target === "navbar" ? "btn-square btn-ghost" : "btn-square btn-ghost"
  const justify = target === "navbar" ? "flex-none" : "flex justify-center"
  const calibrationButtonUI = calibrated ? `btn ${ghost} ${scaling} stroke-green-400` : `btn ${ghost} ${scaling} stroke-red-400 animate-pulse`
  return <div className={justify}>
    <label htmlFor={_CALIBRATION_MODAL_ID} className={calibrationButtonUI} onClick={stateHandler.get_initCalibrationRecording()}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="inherit" className={margins}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    </label>
  </div>;
}


function ProgressBarUI(props) {
  const maxCalib = props.maxCalib;
  const calibrationPercent = props.calibrationPercent;
  const percentageTxt = `${Math.round(calibrationPercent / maxCalib * 100)}%`;
  return (
    <div className="flex items-center">
      <span className="flex-auto">
        <progress className="progress progress-primary" value={calibrationPercent} max="100"></progress>
      </span>
      <span className="flex-none px-5 self-center">
        <div className="stat-value text-xl w-10">{percentageTxt}</div>
      </span>
    </div>
  );
}


function ParticipantDetails(props) {
  const pInput = props.pInput
  const callbacks = props.inputCallbacks
  const isDisabledDueToReady = props.inputState ? false:true;
  const isDisabledDueToVerification = props.verificationState == "inprogress";
  const isDisabled = isDisabledDueToReady || isDisabledDueToVerification;

  const pID = pInput.ParticipantId === ""? "Type here":pInput.ParticipantId
  const kID = pInput.KeyboardModel === ""? "Type here":pInput.KeyboardModel

  return (
    <div>
      <div className="form-control w-full">
        <label className="input-group input-group-vertical mt-5">
          <span >Participant ID</span>
          <input type="text" placeholder={pID} className={"input input-bordered"} onChange={callbacks.idCallback} disabled={isDisabled} />
        </label>
        <label className="input-group input-group-vertical mt-5">
          <span >Keyboard / Laptop Model</span>
          <input type="text" placeholder={kID} className={"input input-bordered"} onChange={callbacks.keyboardCallback} disabled={isDisabled} />
        </label>
      </div>
    </div>
  );
}

function CloseModalButton(props){
  const verificationState = props.verificationState
  const setVerification = props.setVerification

  const callbackForModalClose = props.callback
  const done_css = props.done_css
  

  async function verifyOnClick() {
    if (verificationState === "idle" ){
      setVerification("inprogress")
      const verificationResult = await PUT_verifyEmail({"email":"rootfourtytwo@gmail.com","pid":"sean"})
      console.log(verificationResult)
      const verificationResult2 = 1

      if (verificationResult2==null) {
        console.log("verificationFailed")
      }
      setVerification("idle")
      
      callbackForModalClose()
      document.getElementById(_CALIBRATION_MODAL_ID).checked = false;
    } else if (verificationState === "inprogress") {
      console.log("ignoring")
    }
    return 
  } 

  // const verifyButton
  return (
    <div className="modal-action justify-center">
      <label className={done_css} onClick={verifyOnClick}>
        {`${verificationState}`}
        </label>
    </div>
  )
}


export function CalibrationModal() {
  const [calibrationPercent, setPercent] = useState(0);
  const [stage, setStage] = useState("disabled");

  const initial_inputState = { ParticipantId: "", KeyboardModel: "" }
  const [verificationState, setVerification] = useState("idle");
  const [pInput, setpInput] = useState(initial_inputState);

  const inputCallbacks = {
    idCallback: (e) => {
      stateHandler.calibrator.calibrationResults["ParticipantId"] = e.target.value;
      const new_state = { ...pInput, ...{ ParticipantId: e.target.value, } }
      setpInput(new_state);
      // console.log(pInput === initial_inputState)
    },
    keyboardCallback: (e) => {
      // console.log(e)
      stateHandler.calibrator.calibrationResults["KeyboardModel"] = e.target.value;
      const new_state = { ...pInput, ...{ KeyboardModel: e.target.value, } }
      setpInput(new_state);
      // console.log(pInput == initial_inputState)
    },
  }
  const are_user_inputs_filled = (inputs) => {
    for (const [key, value] of Object.entries(inputs)) {
      if (value.length == 0) { return false }
    }
    return true
  }

  const done_css = (!(stage === "stage_review") || (!are_user_inputs_filled(pInput))) ? "btn btn-disabled scale-150" : "btn scale-150";
  const inputState = (stage === "stage_review");

  const stage1Helper = () => {
    switch (stage) {
      case "disabled":
        return { "percent": 0, "css": "opacity-25" };
      case "stage1":
        return { "percent": calibrationPercent, "css": "opacity-100" };
      default:
        return { "percent": 100, "css": "opacity-25" };
    }
  };
  const stage2Helper = () => {
    switch (stage) {
      case "disabled":
      case "stage1":
        return { "percent": 0, "css": "opacity-25" };
      case "stage2":
        return { "percent": calibrationPercent, "css": "opacity-100" };
      default:
        return { "percent": 100, "css": "opacity-25" };
    }
  };
  const stage3Helper = () => {
    switch (stage) {
      case "disabled":
      case "stage1":
      case "stage2":
        return { "percent": 0, "css": "opacity-25" };
      case "stage3":
        return { "percent": calibrationPercent, "css": "opacity-100" };
      default:
        return { "percent": 100, "css": "opacity-25" };
    }
  };
  const stageReviewHelper = () => {
    switch (stage) {
      case "disabled":
      case "stage1":
      case "stage2":
      case "stage3":
        return { "percent": 0, "css": "opacity-25" };
      default:
        return { "percent": 100, "css": "opacity-100" };
    }
  };

  const stage1state = stage1Helper();
  const stage2state = stage2Helper();
  const stage3state = stage3Helper();
  const stageReviewState = stageReviewHelper();

  stateHandler.registerCallback("CalibrationUIProgressBar", setPercent);
  stateHandler.registerCallback("CalibrationUIStage", setStage);
  stateHandler.registerCallback("CalibrationUIParticipantDetails", setpInput);

  const callbackForModalClose = () => {
    stateHandler.calibrator.saveCalibration();
    stateHandler.updateUITextBox();
  };
  const callbackForClearConfig = () => {
    stateHandler.calibrator.clearSavedCalibration();
  };


  return (
    <div>
      <input type="checkbox" id={_CALIBRATION_MODAL_ID} className="modal-toggle" />
      <div className="modal backdrop-blur-3xl">
        <div className="modal-box h-11/12 max-w-xl absolute top-20">
          <span className="flex content-center">
            <h3 className="font-bold text-4xl flex-auto">Calibration!</h3>
            <div>
              <button className="btn h-fit min-h-fit px-0" onClick={callbackForClearConfig}>
                <a className="text-s px-2">Reset</a>
                <svg className="inline-block w-6 h-6 stroke-current my-1 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                </svg>
              </button>
            </div>
          </span>
          <div className={`transition-all ${stage1state["css"]}`}>
            <p className={'py-2 text-xl'}>Please press and hold <kbd className="kbd kbd-m">Spacebar</kbd> until the bar is filled!</p>
            <ProgressBarUI calibrationPercent={stage1state["percent"]} maxCalib={stateHandler.CALBIRATION_KEY_REQUIRED_NUMBER} />
          </div>
          <div className={`transition-all ${stage2state["css"]}`}>
            <p className="py-2 text-xl">Please press <a className="font-bold">random keys</a> as fast as possible until the bar is filled!</p>
            <ProgressBarUI calibrationPercent={stage2state["percent"]} maxCalib={stateHandler.CALBIRATION_KEY_REQUIRED_NUMBER} />
          </div>
          <div className={`transition-all ${stage3state["css"]}`}>
            <p className="py-2 text-xl">Please wait until bar is filled!</p>
            <ProgressBarUI calibrationPercent={stage3state["percent"]} maxCalib={stateHandler.CALBIRATION_KEY_REQUIRED_NUMBER} />
          </div>
          <div className={`transition-all ${stageReviewState["css"]}`}>
            <ParticipantDetails inputCallbacks={inputCallbacks} inputState={inputState} pInput={pInput} verificationState = {verificationState}></ParticipantDetails>
          </div>
          <CloseModalButton callback={callbackForModalClose} done_css={ done_css} verificationState={verificationState} setVerification = {setVerification}/>
        </div>
      </div>
    </div>
  );
}
