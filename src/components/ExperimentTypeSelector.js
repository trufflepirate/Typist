import React from "react";

function generateExperimentTypeList(stateHandler) {
    const options = ["copy", "wordbyword"];
    return options.map((el) => <li key = {el} ><a onClick={() => stateHandler.updateExperimentType(el)}>{el}</a></li>);
}
export function ExperimentTypeSelector(props) {
    const stateHandler = props.StateHandler;
    return <div className="dropdown dropdown-end">
        <label tabIndex={0} className="btn text-sm px-2">Experiment Type:{stateHandler.experimentType}</label>
        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            {generateExperimentTypeList(stateHandler)}
        </ul>
    </div>
}
