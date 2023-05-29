import React, { useState } from "react";
import SubmitModal, { OpenSubmitModal } from "./SubmitModal";
import { CalibrationModal, CalibrationButton, _CALIBRATION_MODAL_ID } from "./CalibrationModal";
import IntroductionModal from "./IntroductionModal";
import Instructions, {InstructionsButton} from "./Instructions";
import { StateHandler } from "../StateHandler";

const stateHandler = new StateHandler()
const initialMiscState = {
  showInstructions:false,
}


function MysteryButton(){
  return (
    <div className="flex-none scale-100 hidden">
    <button className="btn btn-square btn-ghost">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
    </button>
  </div>
  )
}

function MysteryButton2() {
  return (
    <div className="flex-none scale-100 hidden">
      <button className="btn btn-square btn-ghost">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
      </button>
    </div>
  )
}

function Title() {
  return (
    <div className="flex-1">
      <div className="card-title normal-case text-4xl mx-3 ">Unikey</div>
    </div>
  )
}

export default function NavigationBar() {
  const [calibrated, setCalibrated] = useState(false);
  const [miscState, setMiscState] = useState(initialMiscState)
  stateHandler.registerCallback("CalibrationUIisCalibrated", setCalibrated)

  //calibration setting
  return (
    <div className="navbar bg-base-100 flex flex-col">
      <IntroductionModal calibrated={calibrated} />
      <CalibrationModal />
      <SubmitModal />
      <div className="w-full">
        <MysteryButton />
        <Title />
        <InstructionsButton miscState={miscState} setMiscState={setMiscState}></InstructionsButton>
        <CalibrationButton calibrated={calibrated} target="navbar"></CalibrationButton>
        <MysteryButton2 />
      </div>
      <Instructions miscState={miscState}></Instructions>
    </div>
  )
}

