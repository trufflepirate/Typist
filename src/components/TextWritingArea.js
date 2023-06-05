// Thisreact compoment is top level and will manage the state of the thingy
import React, { useState } from "react";
import { ExperimentTypeSelector } from "./ExperimentTypeSelector";
import { OpenSubmitModal } from "./SubmitModal";
import { StateHandler } from "../StateHandler";
import ButtonWithLoadingSpinner from "./ButtonWithLoadingSpinner";

const stateHandler = new StateHandler()
const formatter = Intl.NumberFormat('en', { notation: 'compact' ,maximumSignificantDigits : 4})

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

// function OverlayComponent(props) {
//     const { component1, component2 } = props
//     return (
//         <div className="relative">
//             {component1}
//             <div className="absolute inset-0">{component2}</div>
//         </div>
//     )
// }



function TotalCompletionBlock(props) {
    const completedAMt = ((stateHandler.wordbywordStats.correct + stateHandler.previousTotal)*100/stateHandler.neededWordCount).toFixed(2)
    const val = `${completedAMt}%`
    const st = { "--value": `${completedAMt}`, "--size": "8rem", "--thickness": "0.75rem" }
    return (
        <div className="flex-none flex flex-col justify-center items-center mx-auto">
            <a className="text-2xl font-bold mb-2">Total Progress</a>
            <div className="radial-progress text-2xl font-bold" style={st}>
                <a className="translate-x-1">{val}</a>
                </div>
        </div>
    )
}

function LoadWordsButton(props) {
    const toolTipClass = "";
    const toolTipText = "";
    let buttonContent = null

    const isLoading = stateHandler.loadingWords;
    const notEnoughCompleted = stateHandler.targetWords.length>stateHandler.targetWordIndex && stateHandler.targetWords.length!=0;
    const pulsing = !notEnoughCompleted && !isLoading ? "animate-pulse" : ""
    const buttonDisabled = notEnoughCompleted? "btn-disabled" : ""
    const buttonCss = `btn btn-ghost outline outline-1 ${buttonDisabled} ${pulsing}`;
    const buttonCallback = stateHandler.requestForWords.bind(stateHandler);
    if (props.isInitial) {
        buttonContent = <div className="mx-2 text-3xl">{"Load Words!"}</div>;
        const props = {
            toolTipClass: toolTipClass,
            toolTipText: toolTipText,
            buttonCss: buttonCss,
            buttonCallback: buttonCallback,
            buttonText: buttonContent,
            isLoading: isLoading,
        }
        const returnButton  = <ButtonWithLoadingSpinner {...props}></ButtonWithLoadingSpinner>
        return returnButton
    } else {
        buttonContent = <div className="my-2 text-l">{"Load More Words!"}</div>;
        const props = {
            toolTipClass: toolTipClass,
            toolTipText: toolTipText,
            buttonCss: buttonCss,
            buttonCallback: buttonCallback,
            buttonText: buttonContent,
            isLoading: isLoading,
        }
        const returnButton  = <ButtonWithLoadingSpinner {...props}></ButtonWithLoadingSpinner>
        return returnButton
    }
}

function LoadMoreWordsBlock(props){
    const wordCount = stateHandler.targetWords? stateHandler.targetWords.length : 0
    return (
        <div className="flex flex-col justify-center items-center mx-2">
            <a className="text-xl font-bold mb-1">Words Loaded:</a>
            <div className="stat-value mb-2">{formatter.format(wordCount)}</div>
            <div className="stat-action"><LoadWordsButton /></div>
        </div>
    )
}

function LoadMoreWordsInitialBlock(props){
    return (
        <div className="container flex-1 max-w-full flex flex-col">

            <a className = "flex-1"></a>
            <div className = "flex-0 flex justify-center">
                <LoadWordsButton isInitial={true} />
            </div>
            <a className = "flex-1"></a>
            
        </div>
    )
}


function WbwStat(props) {
    return (
        <div className="stat p-1">
            <div className={`stat-title font-bold ${props.color}`}>{props.title}</div>
            <div className="stat-value m-0">{props.stat}</div>
            <div className={`stat-desc`}>{props.desc}</div>
        </div>
    )
}

function WbwStatsBlock(props) {
    const wordbywordStats = stateHandler.wordbywordStats

    const correctWords = wordbywordStats.correct
    const correctWordsDesc ="Error Free Smooth Typing"

    const wrongWords = wordbywordStats.wrong
    const wrongWordsDesc ="Wrong Chracters | Long Pauses"
    return (
        <div className="flex flex-row">
            <div className="flex-1 rotate-180 text-gray-500 text-center" style={{writingMode: 'vertical-rl'}}>
            ↓ This Session Only↓
            </div>
            <div className="flex-1 flex flex-col justify-between mx-2">
                <WbwStat title="Correct Words" color="text-green-500" stat={correctWords} desc={correctWordsDesc} />
                <WbwStat title="Error Words" color="text-amber-500" stat={wrongWords} desc={wrongWordsDesc} />
            </div>
        </div>

    )
}

function wbwInfoArea(props){
    const classname = `flex flex-col h-100 rounded my-2 mx-5 px-2 py-1 ring-2 ring-current`
    let sizes = `max-h-[25vh] min-h-[25vh]`
    return (
        <div className={`${classname} ${sizes}`}>
            <div className="flex flex-row justify-center">
                <LoadMoreWordsBlock/>
                <TotalCompletionBlock />
                <WbwStatsBlock />
            </div>
        </div>
    )
}

export class TextWritingArea extends React.Component {
    constructor(props) {
        super(props);
        this.stateHandler = stateHandler
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

    renderWordByWord(targetWords,targetWordIndex,activeWord, startidx){
        let res = new Array(targetWords.length)
        for (let i = startidx; i < targetWords.length; i++) {
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
        const mystate = stateHandler.getStateObj()
        const recording = stateHandler.getRecordingState() == "enabled" ? "Recording..." : ""
        const classname = `flex flex-col h-100 rounded mx-5 px-2 py-1 ring-2 ring-current`
        let sizes = `max-h-[80vh] min-h-[80vh]`
        const isHidden = stateHandler.calibrator.calibrationResults === null? "hidden":""
        
        const mouse_enter = (e) => { this.stateHandler.setRecordingState("enabled") }
        const mouse_leave = (e) => { this.stateHandler.setRecordingState("disabled") }


        let task_components
        let renderedwbwInfoArea
        if (mystate.experimentType == "copy"){
            const words = [...mystate.words].map((word) => WordBlock(word))
            const activeWord = ActiveWordBlock(mystate.activeWord)
            task_components = this.render_copy_task(words,activeWord)
        } else if (mystate.experimentType == "wordbyword"){
            const targetWords = mystate.targetWords
            const targetWordIndex = mystate.targetWordIndex
            const activeWord = mystate.activeWord
            const targetWordDisplayStartIndex = mystate.targetWordDisplayStartIndex
            if (targetWords.length == 0){
                task_components = <LoadMoreWordsInitialBlock/>
            } else {
            task_components = this.renderWordByWord(
                targetWords,targetWordIndex,
                activeWord,targetWordDisplayStartIndex
                )
            }
            renderedwbwInfoArea = wbwInfoArea()
            sizes = `max-h-[60vh] min-h-[60vh]`
        }
        return (
            <div>
                <div className={`${classname} ${sizes} ${isHidden}`} onMouseEnter={mouse_enter} onMouseLeave={mouse_leave}>
                    <div className="flex items-end">
                        <div className="flex-none mx-auto font-bold text-4xl mt-2">Writing Area</div>
                        <div className='flex-none mx-2 text-l text-red-500 animate-pulse'>{recording}</div>
                        <div className="flex-1"></div>
                        <div className="flex-none mt-1">
                            <ExperimentTypeSelector/>
                        </div>
                        <div className="flex-none">
                            <OpenSubmitModal></OpenSubmitModal>
                        </div>
                    </div>
                    {task_components}
                </div>
                {renderedwbwInfoArea}
            </div>
        );
    }
}