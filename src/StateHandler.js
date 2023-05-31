import { is_whitespace, is_space, is_paragraph, is_backspace, is_char, is_horizontalKey, is_letter, is_modifierKey, is_symbol } from './utilities'
import { KEYUP_EVENT, KEYDOWN_EVENT, EventKeyCodeToJSID } from './constants';
import { saveAs } from 'file-saver';
import JSZip from "jszip";
import UAParser from "ua-parser-js";
import { DUMMYCSV, DUMMYLIST } from "./dummyData"

const MIN_TIME_BETWEEN_KEYPRESS_MS = 200
const CALBIRATION_KEY_REQUIRED_NUMBER = 100
const TIMEPAUSEBETWEENSTAGES_MS = 1000
const DUMMY_WORDLIST = DUMMYLIST




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
    // Class Level Constants
    CALBIRATION_KEY_REQUIRED_NUMBER = CALBIRATION_KEY_REQUIRED_NUMBER

    // Singleton
    static _instance = new this();
    
    constructor() {
        // enforce singleton
        if (StateHandler._instance) {
            return this.constructor._instance
        }

        
        console.log("Performing StateManager Setup!")
        // Lifecycle
        this.isStarted = false;

        // Shared states
        this.activeWord = null;
        this.keylog = new Array();

        // Copy task States
        this.words = new Array();

        // wordByWordTask States
        this.targetWords = new Array();
        // TODO: This is temp
        this.targetWords = this.generateTargetWords([],DUMMY_WORDLIST)
        this.targetWordIndex = 0;
        this.wordRecordCounts = new Map();
        this.wordRecordData= new Map();
        this.wordRecordBuffer = new Array();
        this.init_word_by_word(this.targetWords)

        this.recordingstate = "disabled"; //"enabled","disabled","calibration"
        this.experimentType = 'copy'
        this.UICallbacks = new Map();

        this.calibrator = new Calibrator(this.updateUI_args.bind(this))

    }

    // ***************** 
    // LifeCycle Methods
    // ***************** 

    init_listener() {
        if (this.isStarted == false) {
            this.isStarted = true
            const handle_Keypress = this.handle_Keypress.bind(this)
            document.addEventListener("keydown", handle_Keypress, true)
            document.addEventListener("keyup", handle_Keypress, true)
        }
    }

    setUiCallBack(id, callback) {
        // this.UICallbacks.set("textbox", textboxUICallback)
        this.UICallbacks.set(id, callback)
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
        this.UICallbacks.get("textbox_general")()
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

        // console.log(keyCode,key,key.charCodeAt())

        if (this.recordingstate === "enabled") {
            if (this.experimentType === "copy"){
                return this.handleExperimentRecordingCopyTask(kpType, keyCode, key, timeStamp)
            } else if (this.experimentType === "wordbyword"){
                return this.handleExperimentRecordingWordByWord(kpType, keyCode, key, timeStamp)
            } else {
                return 
            }
        } else if (this.recordingstate === "disabled") {
            return
        } else if (this.recordingstate === "calibration") {
            return this.calibrator.handleCalibration(kpType, keyCode, key, timeStamp, e)
        }
        // console.log(`Active word: ${this.activeWord}`)
        // console.log(this.words)
        // console.log(this.keylog)
    }



    // *****************
    // Generic State Management / Acccess Methods + Utility Methods
    // *****************

    getStateObj() {
        const expType = this.experimentType
        if (expType === "copy") {
            return this.getStateObj_copy()
        } else if (expType === "wordbyword") {
            return this.getStateObj_wordByWord()
        }
    }

    updateExperimentType(type) {
        // console.log(`update ${type}`)
        this.experimentType = type
        console.log(`Set Experiment Type to: ${this.experimentType}`)
        this.updateUITextBox()
    }

    is_last_letter_whitespace(word) {
        if (word == "")
            return false
        else {
            const lastLetter = [...word].pop()
            return lastLetter == "\n" || lastLetter == " " || lastLetter == "   "
        }
    }



    // *********************
    // ---WORDBYWORD TASK---
    // *********************

    startNewWord_wbw() {
        this.activeWord = ""
        this.wordRecordBuffer = new Array()
        // this.wordRecordBuffer
    }

    processFinishedWord_wbw() {
        // does word exist in wordRecordCounts
        // const wordExists = this.wordRecordCounts.has(this.activeWord.toLowerCase())
        const currentWord = this.activeWord.toLowerCase().trim()
        const currentBufferData = [...this.wordRecordBuffer]
        const currentTarget = this.targetWords[this.targetWordIndex][0]

        const isTargetWord = this.checkIsTargetWord(currentWord,currentBufferData,currentTarget)
        const isWithinTiming = this.checkWithinTiming(currentWord,currentBufferData,currentTarget)
        // const isWithinTiming = true

        const isContainError = this.checkIfContainsError(currentWord,currentBufferData,currentTarget)
        
        if (isTargetWord && isWithinTiming && !isContainError){
            // add the data and update the count, update finished word status
            this.wordRecordCounts.set(currentWord, this.wordRecordCounts.get(currentWord) + 1)
            this.wordRecordData.get(currentWord).push(currentBufferData)
            this.targetWords[this.targetWordIndex][1] = "recorded"
            this.targetWordIndex+=1
            console.log(`Word: ${currentWord} added to record.`)

        } else {
            // do not add data, do not update the count, do not progress
            console.log(`Word: ${currentWord} not added to record. Reasons: match:${isTargetWord} timing:${isWithinTiming} notError:${!isContainError}`)
            this.targetWords[this.targetWordIndex][1] = "notrecorded"
            this.targetWordIndex+=1
        }

        // Reset Word State, update UI
        this.startNewWord_wbw()
    }

    checkIsTargetWord(currentWord,currentBufferData,currentTarget){
        return currentWord.toLowerCase() == currentTarget.toLowerCase()
    }
    
    checkWithinTiming(currentWord,currentBufferData,currentTarget){
        let first_entry = null
        let last_entry = null


        for (let i=0;i<currentBufferData.length;i++){
            // [kpType, keyCode, key, timeStamp]
            if (first_entry == null) {  
                if (currentBufferData[i][0] == KEYDOWN_EVENT && currentBufferData[i][2] == currentWord[0]){
                    first_entry = currentBufferData[i]
                }
            } else {
                if (currentBufferData[i][0] == KEYDOWN_EVENT && currentBufferData[i][2] == currentWord[currentWord.length-1]){
                    last_entry = currentBufferData[i]
                }
            }
        }


        if (first_entry == null || last_entry == null){
            return false
        }
        if (last_entry[3] - first_entry[3] > (MIN_TIME_BETWEEN_KEYPRESS_MS*currentWord.length)){
            return false
        }
        return true
    }

    checkIfContainsError(currentWord, currentBufferData, currentTarget) {
        for (let i = 0; i < currentBufferData.length; i++) {
            if (currentBufferData[i][0] == KEYDOWN_EVENT) {
                if (is_backspace(currentBufferData[i][1])) {
                    return true
                }
            }
        }
        return false
    }

    handleExperimentRecordingWordByWord(kpType, keyCode, key, timeStamp) {
        // Handling Initial word
        // console.log(this.activeWord)
        // console.log(this.targetWords[this.targetWordIndex])
        // console.log(this.targetWordIndex)
        // console.log(this.wordRecordCounts)
        // console.log(this.wordRecordData)
        // console.log(this.wordRecordBuffer)

        if (this.activeWord == null) {
            this.handle_initialWordCaseWordByWord(kpType, keyCode, key, timeStamp)
        } else {
            // activeWord
            this.handle_activeWordCaseWordByWord(kpType, keyCode, key, timeStamp)
        }
    }

    handle_initialWordCaseWordByWord(kpType, keyCode, key, timeStamp) {
        if (kpType == KEYDOWN_EVENT) {
            if (is_char(keyCode)) {
                this.activeWord = key
                this.keylog.push([kpType, keyCode, key, timeStamp])
                this.wordRecordBuffer.push([kpType, keyCode, key, timeStamp])
                this.updateUITextBox()
            }
        } else {
            console.log("weird state")
        }
    }

    handle_activeWordCaseWordByWord(kpType, keyCode, key, timeStamp) {
        // all active words are valid. Push to Keylog
        this.keylog.push([kpType, keyCode, key, timeStamp])
        if (kpType == KEYDOWN_EVENT) {
            if (is_char(keyCode)) {
                if (this.is_last_letter_whitespace(this.activeWord)) {
                    // new Word
                    // this.processFinishedWord_wbw()
                    // this.activeWord = key

                    this.activeWord += key
                    this.wordRecordBuffer.push([kpType, keyCode, key, timeStamp])
                    this.updateUITextBox()
                } else {
                    // continue Current word
                    this.activeWord += key
                    this.wordRecordBuffer.push([kpType, keyCode, key, timeStamp])
                    // trigger early termination IF the word is the target word
                    if (this.activeWord.toLowerCase() == this.targetWords[this.targetWordIndex][0].toLowerCase()) {
                        this.processFinishedWord_wbw()
                    }
                    this.updateUITextBox()
                }
            } else if (is_space(keyCode)) {
                if (this.activeWord.length == 0) {
                    // new word. ignore space
                }
                // trigger early termination IF the word is the target word
                else if (this.activeWord.toLowerCase() == this.targetWords[this.targetWordIndex][0].toLowerCase()) {
                    this.activeWord += key
                    this.wordRecordBuffer.push([kpType, keyCode, key, timeStamp])
                    this.processFinishedWord_wbw()
                } else {
                    // continue Current word
                    this.activeWord += key
                    this.wordRecordBuffer.push([kpType, keyCode, key, timeStamp])
                }
                this.updateUITextBox()
            } else if (is_paragraph(keyCode)) {
                // same behavior as space
                this.activeWord += key
                this.wordRecordBuffer.push([kpType, keyCode, key, timeStamp])
                this.updateUITextBox()
            } else if (is_backspace(keyCode)) {
                if (this.activeWord.length == 0) {
                    // Do Nothing to active words
                    this.wordRecordBuffer.push([kpType, keyCode, key, timeStamp])
                    this.updateUITextBox()
                } else {
                    this.activeWord = this.activeWord.slice(0, this.activeWord.length - 1)
                    this.wordRecordBuffer.push([kpType, keyCode, key, timeStamp])
                    this.updateUITextBox()
                }
            }
        } else {
            // we dont need to update the ui here
            // Nothing visual happens when a key is lifted
        }
    }

    init_word_by_word(targetWords) {
        for (let i = 0; i < targetWords.length; i++) {
            this.wordRecordCounts.set(targetWords[i][0], 0)
            this.wordRecordData.set(targetWords[i][0], new Array())
        }
    }

    generateTargetWords(initialList, additions){
        let intermediate = []
        for(let i = 0; i < additions.length; i++){
            intermediate.push([additions[i],"pending"])
        }
        return initialList.concat(intermediate)
    }

    getStateObj_wordByWord() {
        const curr = (this.activeWord == null) ? "" : this.activeWord
        const state = {
            activeWord: curr,
            targetWords: this.targetWords,
            targetWordIndex: this.targetWordIndex,
            experimentType : this.experimentType
        }
        return state
    }

    
    // ***************
    // ---COPY TASK---
    // ***************

    handleExperimentRecordingCopyTask(kpType, keyCode, key, timeStamp) {
        // Handling Initial word
        if (this.activeWord == null) {
            this.handle_initialWordCaseCopyTask(kpType, keyCode, key, timeStamp)
        } else {
            // activeWord 
            this.handle_activeWordCaseCopyTask(kpType, keyCode, key, timeStamp)

        }
    }

    handle_initialWordCaseCopyTask(kpType, keyCode, key, timeStamp) {
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

    handle_activeWordCaseCopyTask(kpType, keyCode, key, timeStamp) {
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

    getStateObj_copy() {
        const curr = (this.activeWord == null) ? "" : this.activeWord
        const state = {
            activeWord: curr,
            words: this.words,
            experimentType: this.experimentType
        }
        return state
    }



    // *****************
    // ---Calibration---
    // *****************

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


    // ******************
    // STATE SAVING UTILS
    // ******************

    saveFiletoDesktop(blob, params) {
        saveAs(blob, `unikey_${params["pid"]}_${params["expType"]}_${params["timestamp_now"]}.zip`);
    }

    dumpHelper(code) {
        return  code === "Backspace" ? 8 : code.charCodeAt()
    }

    logToString(){
        let baseString = ""
        this.keylog.forEach(entry => {
            // [kpType,keyCode,key,timeStamp]
            const addString = `${entry[0]},${entry[1]},${this.dumpHelper(entry[2])},${entry[3]}\n`
            baseString += addString
        });
        return baseString
    }

    serialiseExperimentData(taskType){
        if (taskType == "copy"){
            return {}
        } else if (taskType === "wordbyword"){
            console.log(this.wordRecordData)
            const wordByWordData = JSON.stringify(Object.fromEntries(this.wordRecordData) )
            const wordRecordCounts = JSON.stringify(Object.fromEntries(this.wordRecordCounts))
            return {
                "wordData.json": wordByWordData,
                "wordCounts.json": wordRecordCounts
            }
        } else {
            throw new Error("Invalid Task Type")
        }
    }


    dumpLogToFile(callback, target, taskType) {

        console.log(`Saving File for ${taskType} Task | ${target} target`)

        // setup
        const zipper = new JSZip()
        const parsy = new UAParser()

        // Config and calibration Data
        const hwinfo = parsy.getResult()
        const calibrationData = this.calibrator.calibrationResults

        // Experiment Data
        const experimentLog = this.logToString(taskType)
        const experimentSpecificData = this.serialiseExperimentData(taskType)
        console.log(experimentSpecificData)
        
        // serialising and compression
        const myblob = new Blob([experimentLog], { type: "text/plain;charset=utf-8" });
        zipper.file("data.csv", myblob)
        zipper.file("config.json", JSON.stringify(calibrationData))
        zipper.file("hardware.json", JSON.stringify(hwinfo))
        
        for (const d in experimentSpecificData){
            console.log(d)
            zipper.file(d,experimentSpecificData[d])
        }


        // Labelling and Naming
        const particpantID = this.calibrator.calibrationResults["ParticipantId"]
        const email = this.calibrator.calibrationResults["Email"]
        const experimentType = this.experimentType
        const timestamp_now = Date.now()
        const params = {
            "pid": particpantID,
            "expType": experimentType,
            "timestamp_now": timestamp_now
        }

        // processing for save Target
        if (target == "desktop") {
            zipper.generateAsync({ type: "blob" })
                .then((result) => {
                    callback(result, params)
                });
        } else {
            zipper.generateAsync({
                type: "base64",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                }
            })
                .then((result) => {
                    callback(result, params)
                });
        }

    }
}

// const GLOBAL_STATE_HANDLER_HANDLE = new StateHandler()
