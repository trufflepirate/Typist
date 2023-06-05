import Vocabulary from "./Vocabulary";

// ["readable","grammertype","wordlength","phraselength","CEFR_level","min_level","corpusFrequency","rank"]
const COLNAMES = Vocabulary["columns"]
const ALLWORDS = Vocabulary["index"]
const NUMWORDS = Vocabulary["data"].length
const MINIMUM_INSTANCES_PER_WORD = 5
export {MINIMUM_INSTANCES_PER_WORD}

function dummyOldMap(){
    const m= new Map()
    const stuff = ["the","of","and","to"]
    for ( const i of stuff){
        m.set(i,4)
    }
    return m
}

function getCOLNAMEindex(cn) {
    return COLNAMES.findIndex((w)=>w===cn)
}

export function getVocabFromClasses(classes) {
    const vocab = Vocabulary.data
    const minLevelCOlidx = getCOLNAMEindex("min_level")
    const wordlenidx = getCOLNAMEindex("wordlength")
    console.log("wordlenidx",wordlenidx)
    const filteredVocab = vocab.filter((entry) => { 
        const isClass = classes.includes(entry[minLevelCOlidx])
        const isWordLen = entry[wordlenidx]>2
        return isWordLen && isClass
    })
    return filteredVocab.map((entry)=>entry[0])
}

function combineMap(old, incoming){
    const newMap = new Map(old)
    for(const i of incoming){
        const k = i[0]
        const v = i[1]
        if (newMap.has(k)){
            newMap.set(k,newMap.get(k)+v)
        }else{
            newMap.set(k,v)
        }
    }
    return newMap
}

export function selectRandomFromList(oldMapFromServer,sessionMap,incomingList, n){
    // oldcurrentCountMap is a map of word to count

    const currentCountMap  = combineMap(oldMapFromServer,sessionMap)
    for ( let i = 0; i < incomingList.length; i++) {
        if (!currentCountMap.has(incomingList[i])) {
            currentCountMap.set(incomingList[i], 0)
        }
    }
    const potentialEntries=Array.from(currentCountMap.entries()).filter((entry)=>entry[1]<MINIMUM_INSTANCES_PER_WORD)
    const newTargets = []
    if (potentialEntries.length===0){ return []}

    for (let i = 0; i < n; i++) {
        const datalen = potentialEntries.length
        const randomIndex = Math.floor(Math.random() * datalen)
        const currentWord = potentialEntries[randomIndex][0]
        const currentCount = potentialEntries[randomIndex][1]

        newTargets.push(currentWord)
        const newCount = currentCount + 1
        potentialEntries[randomIndex][1] = newCount
        if (newCount>=MINIMUM_INSTANCES_PER_WORD){
            potentialEntries.splice(randomIndex,1)
        }
        if (potentialEntries.length===0){
            break
        }

    }
    return newTargets

}
