import { is_whitespace, is_space, is_paragraph, is_backspace, is_char, is_horizontalKey, is_letter, is_modifierKey, is_symbol } from './utilities'
import { KEYUP_EVENT, KEYDOWN_EVENT, EventKeyCodeToJSID } from './constants';
import { saveAs } from 'file-saver';
import JSZip from "jszip";
import UAParser from "ua-parser-js";

import { DUMMYCSV } from "./dummyData"


const CALBIRATION_KEY_REQUIRED_NUMBER = 100
const TIMEPAUSEBETWEENSTAGES_MS = 1000

export class Calibrator {
    constructor(uiUpdateFn) {
        this.stageState = "disabled" //disabled,stage1,stage2,stage3,stage_review
        this.calibrationLog = new Array();

        this.calibrationResults = null;
        this.updateUI_args = uiUpdateFn;
        this.waitTimerHandle = null;

        this.ArtificialEventTimers = []

        console.log("calibrator OK!")
        // console.log(this.updateUI_args)

    }

    killWaitTimer() {
        if (this.waitTimerHandle != null) {
            clearTimeout(this.waitTimerHandle)
            this.waitTimerHandle = null
        }
    }

    setWaitTimer() {
        this.killWaitTimer()
        this.waitTimerHandle = setTimeout(() => this.killWaitTimer(), TIMEPAUSEBETWEENSTAGES_MS)
    }

    isWaitTimer() {
        return !(this.waitTimerHandle === null)
    }


    killArtificalEventTimers() {
        if (this.ArtificialEventTimers.length != 0) {
            this.ArtificialEventTimers.forEach(timerhandle => clearTimeout(timerhandle))
        }
    }

    setArtificialEventTimer() {
        this.killArtificalEventTimers()
        this.killWaitTimer()
        const eventTimings = [...Array(100).keys()].map(x => x + 100)
        eventTimings.forEach((dly) => {
            this.setArtificialEventInner(dly)
        })
        console.log("events set")
    }

    setArtificialEventInner(delay) {
        const runMyEvent = () => {
            document.dispatchEvent(new KeyboardEvent("keydown", {
                key: "Simulated",
                keyCode: -1, // example values.
                code: "Simulated", // put everything you need in this object.
                which: -1,
            }));
        }
        const eventHandle = setTimeout(runMyEvent, delay)
        this.ArtificialEventTimers.push(eventHandle)
    }

    initCalibration() {

        const prevCalibration = this.getSavedCalibration()
        if (prevCalibration !== false) {
            this.calibrationResults = prevCalibration
            const participantDetails = {ParticipantId:prevCalibration.ParticipantId, KeyboardModel:prevCalibration.KeyboardModel}
            this.calibrationLog = new Array(100);
            this.stageState = "stage_review"
            this.updateUI_args("CalibrationUIStage", [this.stageState])
            this.updateUI_args("CalibrationUIParticipantDetails", [participantDetails])
        } else {
            this.calibrationResults = {};
            this.calibrationLog = new Array();
            this.stageState = "stage1"
            this.updateUI_args("CalibrationUIStage", [this.stageState])
            this.killWaitTimer()
        }
    }

    terminateCalibration() {
        this.calibrationResults = null;
        this.calibrationLog = new Array();
        this.stageState = "disabled"
        this.updateUI_args("CalibrationUIStage", [this.stageState])
        this.killWaitTimer()

    }

    calibrationHelper(log) {
        let tempResults = new Array()
        for (let i = 1; i < log.length; i++) {
            tempResults.push(log[i][3] - log[i - 1][3])
        }
        return tempResults.sort((a, b) => a - b)

    }

    handleCalibration(kpType, keyCode, key, timeStamp, e) {
        // all active words are valid. Push to Keylog
        if (this.isWaitTimer()) {
            e.preventDefault()
            return
        }

        if (this.stageState === "stage1") {
            if (keyCode != "Space") { return }
            e.preventDefault()
            this.calibrationLog.push([kpType, keyCode, key, timeStamp])
            this.updateUI_args("CalibrationUIProgressBar", [this.calibrationLog.length])
            if (this.calibrationLog.length === CALBIRATION_KEY_REQUIRED_NUMBER) {
                const results = this.calibrationHelper(this.calibrationLog)
                this.calibrationResults[this.stageState] = results
                this.calibrationLog = new Array()
                this.stageState = "stage2"
                this.setWaitTimer()
                this.updateUI_args("CalibrationUIProgressBar", [this.calibrationLog.length])
                this.updateUI_args("CalibrationUIStage", [this.stageState])
                console.log("Done Stage 1")
            }
        } else if (this.stageState === "stage2") {
            e.preventDefault()
            this.calibrationLog.push([kpType, keyCode, key, timeStamp])
            this.updateUI_args("CalibrationUIProgressBar", [this.calibrationLog.length])
            if (this.calibrationLog.length === CALBIRATION_KEY_REQUIRED_NUMBER) {
                const results = this.calibrationHelper(this.calibrationLog)
                this.calibrationResults[this.stageState] = results
                this.calibrationLog = new Array()
                this.stageState = "stage3"
                this.setArtificialEventTimer()
                this.updateUI_args("CalibrationUIProgressBar", [this.calibrationLog.length])
                this.updateUI_args("CalibrationUIStage", [this.stageState])
                console.log("Done Stage 2")

            }
        } else if (this.stageState === "stage3") {
            if (keyCode != "Simulated") { return }
            e.preventDefault()
            this.calibrationLog.push([kpType, keyCode, key, timeStamp])
            this.updateUI_args("CalibrationUIProgressBar", [this.calibrationLog.length])
            if (this.calibrationLog.length === CALBIRATION_KEY_REQUIRED_NUMBER) {
                const results = this.calibrationHelper(this.calibrationLog)
                this.calibrationResults[this.stageState] = results
                this.calibrationLog = new Array()
                this.stageState = "stage_review"
                this.updateUI_args("CalibrationUIProgressBar", [this.calibrationLog.length])
                this.updateUI_args("CalibrationUIStage", [this.stageState])
                console.log("Done Stage 3")
                this.calibrationCalculator()
            }
        }
    }

    calibrationResultHelper(resultArray) {
        // remove Zeros
        resultArray = resultArray.filter(ts => ts !== 0)

        //get Remaining Unique Values, count freq
        const resultsMap = new Map(resultArray.map(ts => [ts, 0]))
        resultArray.forEach(el => resultsMap.set(el, resultsMap.get(el) + 1))
        const resultsMapSorted = new Map([...resultsMap.entries()].sort((a, b) => b[1] - a[1]))

        let finalString = `TS   :freq\n`
        const test = [...resultsMapSorted.entries()].forEach(([k, v]) => {
            const stringToPrint = `${k.toFixed(1)}   :${v}\n`
            finalString += stringToPrint
        })


        return finalString

    }


    calibrationCalculator() {
        // Handling stage 1: Repeated Keypress
        const innerCalc = stageID => {
            const res = this.calibrationResults[stageID]
            const processed = this.calibrationResultHelper(res)
            const printable = `Results for ${stageID}:\n${processed}`
            console.log(printable)
        }
        const stages = ["stage1", "stage2", "stage3"]
        stages.forEach(stage => innerCalc(stage))
    }

    saveCalibration() {
        sessionStorage.setItem("calibration_data", JSON.stringify(this.calibrationResults))
        this.updateUI_args("CalibrationUIisCalibrated", [!(this.calibrationResults === null)])
    }

    getSavedCalibration() {
        const calib = sessionStorage.getItem("calibration_data")
        if (calib === null) { return false }
        else {
            return JSON.parse(calib)
        }
    }

    clearSavedCalibration() {
        sessionStorage.removeItem('calibration_data');
        console.log("clearing")
        this.initCalibration()
    }

}



export class StateHandler {

    constructor() {
        this.activeWord = null;
        this.words = new Array();
        this.keylog = new Array();
        this.recordingstate = "disabled"; //"enabled","disabled","calibration"
        this.experimentType = 'copy'
        this.UICallbacks = new Map();

        this.CALBIRATION_KEY_REQUIRED_NUMBER = CALBIRATION_KEY_REQUIRED_NUMBER
        this.calibrator = new Calibrator(this.updateUI_args.bind(this))

    }

    getStateObj() {
        const curr = (this.activeWord == null) ? "" : this.activeWord
        const state = {
            activeWord: curr,
            words: this.words
        }
        return state
    }

    updateExperimentType(type) {
        this.experimentType = type
        this.updateUITextBox()
    }

    init_listener(textboxUICallback) {
        const handle_Keypress = this.handle_Keypress.bind(this)
        document.addEventListener("keydown", handle_Keypress, true)
        document.addEventListener("keyup", handle_Keypress, true)
        this.UICallbacks.set("textbox", textboxUICallback)
    }

    unmount() {

    }

    updateUI(id) {
        this.UICallbacks.get(id)()
    }

    updateUI_args(id, args) {
        this.UICallbacks.get(id)(...args)
    }

    updateUITextBox() {
        this.UICallbacks.get("textbox")()
        // this.UICallbacks.forEach(UICallback=>UICallback(this.getStateObj()));
    }

    updateIU_ALL() {
        this.UICallbacks.forEach(e => e())
    }

    setRecordingState(state) {
        this.recordingstate = state
        this.updateUITextBox()
    }

    getRecordingState() { return this.recordingstate }


    is_last_letter_whitespace(word) {
        if (word == "")
            return false
        else {
            const lastLetter = [...word].pop()
            return lastLetter == "\n" || lastLetter == " " || lastLetter == "   "
        }
    }

    registerCallback(callbackID, callback) {
        this.UICallbacks.set(callbackID, callback)
    }

    handle_Keypress(e) {
        if (this.getRecordingState() === "enabled" || this.getRecordingState() === "disabled") {
            e.preventDefault()
        }
        e.stopPropagation()

        const kpType = e.type
        const keyCode = e.code
        const key = e.key
        const timeStamp = e.timeStamp

        console.log(keyCode,key,key.charCodeAt())

        if (this.recordingstate === "enabled") {
            return this.handleExperimentRecording(kpType, keyCode, key, timeStamp)
        } else if (this.recordingstate === "disabled") {
            return
        } else if (this.recordingstate === "calibration") {
            return this.calibrator.handleCalibration(kpType, keyCode, key, timeStamp, e)
        }
        // console.log(`Active word: ${this.activeWord}`)
        // console.log(this.words)
        // console.log(this.keylog)
    }


    handleExperimentRecording(kpType, keyCode, key, timeStamp) {
        // Handling Initial word
        if (this.activeWord == null) {
            this.handle_initialWordCase(kpType, keyCode, key, timeStamp)
        } else {
            // activeWord 
            this.handle_activeWordCase(kpType, keyCode, key, timeStamp)

        }
    }

    handle_initialWordCase(kpType, keyCode, key, timeStamp) {
        if (kpType == KEYDOWN_EVENT) {
            if (is_char(keyCode)) {
                this.activeWord = key
                this.keylog.push([kpType, keyCode, key, timeStamp])
                this.updateUITextBox()
            }
        } else {
            // keyup before first keydown?
            // console.log(this.words)
            console.log("weird state")
        }
    }

    handle_activeWordCase(kpType, keyCode, key, timeStamp) {
        // all active words are valid. Push to Keylog
        this.keylog.push([kpType, keyCode, key, timeStamp])
        if (kpType == KEYDOWN_EVENT) {

            // handling scrolling
            const element = document.getElementById('activeWord_0');
            if (element) {
                // 👇 Will scroll smoothly to the top of the next section
                element.scrollIntoView();
            }

            if (is_char(keyCode)) {
                if (this.is_last_letter_whitespace(this.activeWord)) {
                    // new Word
                    this.words.push(this.activeWord)
                    this.activeWord = key
                    this.updateUITextBox()
                } else {
                    // continue Current word
                    this.activeWord += key
                    this.updateUITextBox()
                }
            } else if (is_space(keyCode)) {
                // continue Current word
                this.activeWord += key
                this.updateUITextBox()
            } else if (is_paragraph(keyCode)) {
                // continue Current word
                this.words.push(this.activeWord)
                this.activeWord = "\n"
                this.updateUITextBox()
            } else if (is_backspace(keyCode)) {
                if (this.activeWord.length == 0) {
                    // Backspacing into previous word
                    if (this.words.length == 0) {
                        // no more words. set to null
                        this.activeWord = null
                        this.updateUITextBox()
                        return 
                    }
                    this.activeWord = this.words.pop()
                    this.activeWord = this.activeWord.slice(0, this.activeWord.length - 1)
                    this.updateUITextBox()
                } else {
                    this.activeWord = this.activeWord.slice(0, this.activeWord.length - 1)
                    this.updateUITextBox()
                }
            }
        } else {
            // we dont need to update the ui here
            // Nothing visual happens when a key is lifted
        }
    }

    initCalibrationRecording() {
        this.recordingstate = "calibration";
        this.calibrator.initCalibration()
    }
    get_initCalibrationRecording() {
        const r = this.initCalibrationRecording.bind(this)
        return r
    }


    endCalibrationRecording() {

    }
    dumpHelper(code) {
        switch (code) {
            case "Backspace":
                return 8
            default:
                return code.charCodeAt()
        }
    }

    saveFiletoDesktop(blob, params) {
        saveAs(blob, `unikey_${params["pid"]}_${params["expType"]}_${params["timestamp_now"]}.zip`);
    }


    dumpLogToFile(callback, target) {
        let baseString = ""
        this.keylog.forEach(entry => {
            // [kpType,keyCode,key,timeStamp]
            const addString = `${entry[0]},${entry[1]},${this.dumpHelper(entry[2])},${entry[3]}\n`
            baseString += addString
        });
        const zipper = new JSZip()
        const parsy = new UAParser()
        const hwinfo = parsy.getResult()
        // console.log(hwinfo)
        const myblob = new Blob([baseString], { type: "text/plain;charset=utf-8" });
        zipper.file("data.csv", myblob)
        zipper.file("config.json", JSON.stringify(this.calibrator.calibrationResults))
        zipper.file("hardware.json", JSON.stringify(hwinfo))

        const params = {
            "pid": this.calibrator.calibrationResults["ParticipantId"],
            "expType": this.experimentType,
            "timestamp_now": Date.now()
        }
        if (target == "desktop") {
            zipper.generateAsync({ type: "blob" })
                .then((blob) => {
                    callback(blob, params)
                });
        } else {
            zipper.generateAsync({
                type: "base64",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            })
                .then((blob) => {
                    callback(blob, params)
                });
        }

    }



}