var client = new davlib.DavClient();
client.initialize('geometadata.dpi.inpe.br', 80, 'http', 'webdav', 'T3rr4brasili5');


function writeToDiv(line, emphasize) {
    var div = document.getElementById('msgdiv');
    var textnode = document.createTextNode(line);
    var newdiv = document.createElement('div');
    newdiv.appendChild(textnode);
    if (emphasize) {
        newdiv.style.color = 'red';
    } else {
        newdiv.style.color = 'blue';
    };
    div.appendChild(newdiv);
};

var getFileData=function(fileProp) {
    var reader = new FileReader();
    
    reader.onload = function() {
    	fileProp.content=this.result;
    	fileProp.callback(fileProp);
    };
    reader.readAsText(fileProp.file);
};

var getFileProperties=function(callback) {
	var formFile = document.getElementById("metadatafile");
    var file = formFile.files[0];
    var ret={};
    ret.name=file.name;
    ret.size=file.size;
    ret.file=file;
    return ret;
};

var fileExists=function(file, success, fail) {
	var basedir = '/webdav/';
	var fileName = file.name;
	client.GET(basedir + fileName, wrapHandler(200, success, fail));
};

var updatecsw=function() {
	var url="http://geometadata.dpi.inpe.br/cgi-bin/updatecsw.py";
	var xmlhttp;
	if (window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
	} else {
		// code for older browsers
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			eval(this.responseText);
			if(response.status) {
				writeToDiv('CSW was updated.');
			}else{
				writeToDiv('CSW update fail.',true);
			}
		}
	};
	xmlhttp.open("GET", url, true);
	xmlhttp.send();
};

// since the lib is async I wrote the functions in the order
// they are executed to give a bit of an overview
function sendMetadataFile() {
	
	var div = document.getElementById('msgdiv');
	div.innerHTML="";// clean messages
	
	var fileProp=getFileProperties();
	fileProp.remoteDir='/webdav/';
	var sendFile=function() {
		fileProp.callback=function(fileData) {
			var file = fileData.remoteDir + fileData.name;
			client.PUT(file, fileData.content, wrapHandler(201, function(){writeToDiv('File was sent.');updatecsw();}, function(){writeToDiv('Fail on send the file.',true);}));
		};
		getFileData(fileProp);
	};
	
	var removeFile=function() {
		if(confirm('This file was exists. Do you overwrite it?')) {
			var file = fileProp.remoteDir + fileProp.name;
			client.DELETE(file, wrapHandler(204, sendFile, function(){writeToDiv('Fail on remove old file.',true);}));
		}
	};
	
	fileExists(fileProp,
			removeFile/*file exists, removing the file if confirm are yes*/,
			sendFile/*file do not exists, sending the file*/
	);
};

function wrapHandler(expected_status, success_fn, fail_fn) {
    var wrapped = function(status, statusstr, content) {
    	if (status == expected_status) {
    		success_fn();
        } else {
            fail_fn();
        };
    };
    return wrapped;
};