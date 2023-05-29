import React, { useState } from "react";
import { CalibrationButton } from "./CalibrationModal";
import { StateHandler } from "../StateHandler";
const stateHandler = new StateHandler();


const _INTRO_MODAL_ID = "intro-modal-1"


function fadeInAnimate(ft, delay) {
  if (delay === 0) {
    return `animate-[welcome_${ft}s_ease-in-out_1]`
  }
  return `animate-[welcome_${ft}s_ease-in-out_${delay}s_1_both]`
}

function InitialIntroduction(props) {
  const calibrated = props.calibrated;
  const hidden = props.hidden?"":"hidden"
  const navbar = CalibrationButton(calibrated, "notNavbar")

  const line1 = `animate-[welcome_2s_ease-in-out_1]`
  const line2 = `animate-[welcome_2s_ease-in-out_2s_1_both]`
  const line3 = `animate-[welcome_2s_ease-in-out_4s_1_both]`
  const line4 = `animate-[welcome_2s_ease-in-out_6s_1_both]`
  const line5 = `animate-[welcome_2s_ease-in-out_8s_1_both]`
  return (
    <div className={hidden}>
    <div className={line1}>
      <h4 className="text-center uppercase underline font-extrabold text-4xl">Project Unikey</h4>
      <h4 className="text-center uppercase font-extrabold text-9xl mx-5">WELCOME</h4>
    </div>
    <h4 className={`${line2} text-center text-2xl mt-4`}>Thank you for participating in our experiment!</h4>
    <h4 className={`${line3} text-center text-2xl mt-2`}>Your data goes a long way in helping us in developing better cyber-physical systems.</h4>

    <h4 className={`${line4} font-bold text-center text-4xl mt-6 mb-2`}>Let's start with some calibration</h4>
    <h4 className={`${line5} text-center italic text-xl`}>click this icon for calibration</h4>
    <div className={line5}>
      {navbar}
    </div>
    </div>
  )
}
export default function IntroductionModal(props) {
  const [introductionStage, setIntroductionStage] = useState("initial"); //initial,postcalibration
  const calibrated = props.calibrated;
  const open = calibrated ? "" : "modal-open"
  const isHidden = introductionStage==="initial"
  return (
    <div>
      <div className={`modal flex flex-col backdrop-blur-3xl ${open}`}>
      <InitialIntroduction 
      calibrated = {props.calibrated} 
      hidden={isHidden}></InitialIntroduction>
      </div>
    </div>
  );
}
