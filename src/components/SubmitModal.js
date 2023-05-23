import React, { useState } from "react";
// import { DUMMYCSV } from "../dummyData"
// import { success } from "daisyui/src/colors";

export const _SUBMIT_MODAL_ID = "submit-modal-1"

// const SUBMIT_URL = `https://script.google.com/macros/s/AKfycbzh53bDCNk8WW3i7DEq0OoaX0NmpJkqDCgPKUhA4gQhRQbYVapMx21ymw3YNB-Pe8Y/exec`;
const SUBMIT_URL = `localhost`;


// const VERIFICATION_URL = `https://script.google.com/macros/s/AKfycbzh53bDCNk8WW3i7DEq0OoaX0NmpJkqDCgPKUhA4gQhRQbYVapMx21ymw3YNB-Pe8Y/exec`
const VERIFICATION_URL = `localhost`




async function put(params, base_64_blob) {
  const fname = `unikey_${params["pid"]}_${params["expType"]}_${params["timestamp_now"]}.zip`
  try {
    const res = await fetch(SUBMIT_URL, {
      redirect: 'follow',
      method: "POST",
      body: JSON.stringify({
        pid: fname,
        d: base_64_blob,
      }),
      headers: {
        "Content-Type": "text/plain",
      },
    });

    const textResult = await res.text()
    return textResult === "ok"
  } catch (e) {
    console.log(e)
    return false
  }
}

function submitButtonContent(submitState) {
  switch (submitState) {
    case "preSubmit":
      return "submit"
    case "Failed":
      return "Failed!"
    case "Passed":
      return "Success!"
    case "inProgress":
      return spinner()
  }
}

function buttonSubmitClassName(submitState) {
  const baseClass = `btn flex-1 my-2`
  switch (submitState) {
    case "preSubmit":
      return `${baseClass}`
    case "Failed":
      return `${baseClass} no-animation btn-error`
    case "Passed":
      return `${baseClass} no-animation btn-success`
    case "inProgress":
      return `${baseClass}`
  }
}

function spinner() {
  return <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
}

function contingency(submitState, stateHandler) {
  function handleDownload() {

    stateHandler.dumpLogToFile(stateHandler.saveFiletoDesktop, "desktop")
  }

  const mailto = `mailto:theunikeyproject@gmail.com?&subject=UnikeyProject Data Submission&body=Please attach the downloaded data!`
  const hidden = submitState === "Failed" ? "" : "hidden"
  return <div className={`transition-all mt-5 ${hidden}`}>
    <h2 className={`font-bold text-4xl flex-auto `}>Oh no!</h2>
    <h1> It seems like we had trouble collecting your data! 😔</h1>
    <h1> But it's okay, we have a backup plan! Please help us by downloading your data and sending it to <a className="link link-accent font-bold underline" href={mailto}>theunikeyproject@gmail.com</a>.</h1>
    <div className="flex flex-col content-center mb-2">
      <button className={"btn btn-info flex-1 my-2"} onClick={handleDownload}>Download</button>
    </div>
  </div>

}


export function OpenSubmitModal(props) {
  return (
    <div>

      <label htmlFor={_SUBMIT_MODAL_ID} className="btn btn-ghost p-2">
        <div className="flex items-center">
          <h1 className="text text-center align-middle mr-2">Submit Results</h1>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
      </label>
    </div>

  )
}


export default function SubmitModal(props) {
  const stateHandler = props.StateHandler
  const [submitState, setSubmit] = useState("preSubmit");
  // useEffect(()=>{console.log(submitState)})

  async function uploadResults(base_64_blob, params) {
    const put_res = await put(params, base_64_blob);
    if (!put_res) {
      setSubmit("Failed")
    } else {
      setSubmit("Passed")
    }
  }

  function handleSubmit(e) {
    if (submitState === "preSubmit") {
      setSubmit("inProgress")
      stateHandler.dumpLogToFile(uploadResults)
    } else {
      return
    }
  }


  const buttonSubmitContent = submitButtonContent(submitState)

  const thankyouHidden = submitState === "Passed" ? "" : "hidden"
  const buttonExitDisabled = submitState === "preSubmit" ? "" : "btn-disabled"
  const buttonExitClassName = `btn btn-sm btn-circle absolute right-2 top-2 ${buttonExitDisabled}`

  return (
    <div>
      <input type="checkbox" id={_SUBMIT_MODAL_ID} className="modal-toggle" />
      <div className="modal">
        <div className="modal-box h-11/12 max-w-xl absolute top-20">
          <span className="flex content-center mb-2">
            <h3 className="font-bold text-4xl flex-auto">Last Few Steps...</h3>
            <label htmlFor={_SUBMIT_MODAL_ID} className={buttonExitClassName}>✕</label>
          </span>
          <div className="flex flex-col content-center mb-2">
            <h1>Thank you for your participation! We hope you've had a great time.</h1>
            <h1>Please submit your data by hitting the submit button below</h1>
            <button className={buttonSubmitClassName(submitState)} onClick={handleSubmit}>{buttonSubmitContent}</button>
            {contingency(submitState, stateHandler)}
            <div >
              <h1 className={`font-bold text-center text-2xl mt-5 ${thankyouHidden}`}>Thank you! That's all from us!</h1>
              <h1 className={`font-bold italic text-center text-l mt-1 ${thankyouHidden}`}> You may now close this tab</h1>
            </div>
          </div>
        </div>
      </div>
    </div>

  )
}