// Thisreact compoment is top level and will manage the state of the thingy
import React, { useState } from "react";
import { EventKeyCodeToJSID } from "../constants";
import { ExperimentTypeSelector } from "./ExperimentTypeSelector";
import { OpenSubmitModal } from "./SubmitModal";
let dummyid = 0


function Carot() {
    return < a className="flex-none text-4xl animate-pulse">|</a>
}

function WordBlock(word) {
    const wordToDisplay = word
    if (wordToDisplay=="\n"){
        return <a className="flex-1 max-w-fit select-none mx-0 text-3xl whitespace-pre-wrap break-words">{wordToDisplay}</a>
    }
    return <a className="flex-none max-w-fit select-none mx-0 text-3xl whitespace-pre-wrap break-words">{wordToDisplay}</a>
    // return (
    // <div className="flex-none indicator">
    //     <span className="indicator-item badge badge-secondary"></span>
    //     <pre className="flex-none border-primary rounded-sm  select-none bg-base-100 text-4xl font-sans">{wordToDisplay}</pre>
    // </div>
    // )
}

function ActiveWordBlock(word) {
    const wordToDisplay = word
    if (wordToDisplay=="\n"){
        return <a id="activeWord_0" className="flex-1 max-w-fit select-none mx-0 text-3xl whitespace-pre-wrap break-words">{wordToDisplay}</a>     
    }
    return <a id="activeWord_0" className="flex-none max-w-fit select-none mx-0 text-3xl whitespace-pre-wrap break-words">{wordToDisplay}</a>
}


function ActiveWordBlock_wordbyword(word, target) {
    word = word
    let before = []
    let lastCorrectIDX = -1
    let wrongflag = false
    for (let i = 0; i < word.length; i++) {
        let activeChar = word[i] == " " ? "▒" : word[i]
        if (i < target.length) {
            if (!wrongflag){
                if (word[i] == target[i]) {
                    before.push(<span className="text-green-500">{activeChar}</span>)
                    lastCorrectIDX = i
                } else {
                    before.push(<span className="text-red-500">{activeChar}</span>)
                    wrongflag=true
                }
            } else {
                before.push(<span className="text-red-500">{activeChar}</span>)
            }
        } else {
            before.push(<span className="text-red-500">{activeChar}</span>)
        }
    }

    // before.push(<Carot />)\
    if (word.length == 0){
        lastCorrectIDX = -1
    }
    if (target.length > lastCorrectIDX) {
        for (let i = lastCorrectIDX+1; i < target.length; i++) {
            before.push(<span>{target[i]}</span>)
        }
    }

    if (target.length >= word.length) {
        before.push(<span>{" "}</span>)
    } else if (word[-1] !== " ") {
        before.push(<span>{" "}</span>)
    }
    return <a id="activeWord_0" className="flex-none max-w-fit select-none mx-0 text-3xl whitespace-pre-wrap break-words">{before}</a>
}

function WordBlock_wordbyword(word, status){
    const wordToDisplay = word.trim() + ' '

    if (status == "pending") {
        return <a className="flex-none max-w-fit select-none mx-0 text-3xl whitespace-pre-wrap break-words opacity-50">{wordToDisplay}</a>
    } else if (status == "recorded") {
        return <a className="flex-none max-w-fit select-none mx-0 text-3xl whitespace-pre-wrap break-words text-green-500">{wordToDisplay}</a>
    } else if (status == "notrecorded") {
        return <a className="flex-none max-w-fit select-none mx-0 text-3xl whitespace-pre-wrap break-words text-amber-500">{wordToDisplay}</a>
    }
}


function DumpFileButton(props) {
    const dumpfn = props.dumpfn
    return <button className="btn btn-square btn-ghost mx-auto scale-125" onClick={dumpfn}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
    </button>
}

function RecordingBlip(props) {
    const txt = props.recording ? "recording..." : ""
    return
}


export class TextWritingArea extends React.Component {
    constructor(props) {
        super(props);
        this.stateHandler = props.StateHandler
        // this.state = this.stateHandler.getStateObj()
    }


    getStateUpdateCallback() {
        return (newstate) => (this.setState(newstate))
    }


    componentDidMount() {
        this.stateHandler.init_listener()
        this.stateHandler.setUiCallBack('textbox_general',() => this.forceUpdate())
    }

    componentWillUnmount() {
        this.stateHandler.unmount()
    }

    render_copy_task(words,activeWord){
        return(
            <div className="container max-w-fit overflow-y-auto scroll-auto">
                <div className=" mx-1 py-2 items-center">
                    {words}{activeWord}<Carot />
                </div>
            </div>
        )
    }

    renderWordByWord(targetWords,targetWordIndex, activeWord){
        let res = new Array(targetWords.length)
        for (let i = 0; i < targetWords.length; i++) {
            if (i == targetWordIndex) {
                res.push(ActiveWordBlock_wordbyword(activeWord,targetWords[i][0]))
            } else if  (i<targetWordIndex) {
                res.push( WordBlock_wordbyword(targetWords[i][0],targetWords[i][1]))
            } else {
                res.push(WordBlock_wordbyword(targetWords[i][0], targetWords[i][1]))
            }
        }
        const rendered = (
            <div className="container max-w-fit overflow-y-auto scroll-auto">
                <div className=" mx-1 py-2 items-center">
                    {res}
                </div>
            </div>
        )
        return rendered
    }

    render() {
        // let wordstring = ""
        const mystate = this.stateHandler.getStateObj()
        const recording = this.stateHandler.getRecordingState() == "enabled" ? "Recording..." : ""
        // const words= [...mystate.words].concat([mystate.activeWord]).map((word) => WordBlock(word))
        
        let task_object
        // console.log(mystate)
        if (mystate.experimentType == "copy"){
            const words = [...mystate.words].map((word) => WordBlock(word))
            const activeWord = ActiveWordBlock(mystate.activeWord)
            task_object = this.render_copy_task(words,activeWord)
        } else if (mystate.experimentType == "wordbyword"){
            const targetWords = mystate.targetWords
            const targetWordIndex = mystate.targetWordIndex
            const activeWord = mystate.activeWord
            task_object = this.renderWordByWord(targetWords,targetWordIndex, activeWord)
        }

        return (
            <div className={`flex flex-col h-100 rounded mx-5 px-2 py-1 ring-2 ring-current max-h-[80vh] min-h-[80vh] ${this.stateHandler.calibrator.calibrationResults === null? "hidden":""}`} onMouseEnter={(e) => { this.stateHandler.setRecordingState("enabled") }} onMouseLeave={(e) => this.stateHandler.setRecordingState("disabled")}>
                <div className="flex items-end">
                    <div className="flex-none mx-auto font-bold text-4xl mt-2">Writing Area</div>
                    <div className='flex-none mx-2 text-l text-red-500 animate-pulse'>{recording}</div>
                    <div className="flex-1"></div>
                    <div className="flex-none mt-1">
                        <ExperimentTypeSelector StateHandler={this.stateHandler}/>
                    </div>
                    <div className="flex-none">
                        <OpenSubmitModal></OpenSubmitModal>
                    </div>
                    <div className="flex-none hidden">
                        <DumpFileButton dumpfn={() => this.stateHandler.dumpLogToFile(this.stateHandler.saveFiletoDesktop, "desktop")}></DumpFileButton>
                    </div>
                </div>
                {task_object}
            </div>
        );
    }
}