


function setUI(){
    box = document.querySelector('#textbox');
    
}

window.onload = function () {
    // TODO:: Do your initialization job

    // add eventListener for tizenhwkey
    document.addEventListener('tizenhwkey', function(e) {
        if(e.keyName == "back")
	try {
	    tizen.application.getCurrentApplication().exit();
	} catch (ignore) {
	}
    });

    // Sample code
    var textbox = document.querySelector('.contents');
    textbox.addEventListener("click", function(){
    	box = document.querySelector('#textbox');
    	box.innerHTML = box.innerHTML == "Basic" ? "Sample" : "Basic";
    	console.log("I was oressed")
    });
    
    console.log("hello");
    
    var sensors = tizen.sensorservice.getAvailableSensors();
    console.log('Available sensor: ' + sensors.toString());
    
    
    checkMIMETYPES();
    
};
