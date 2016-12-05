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

function assert(statement, debugprint) {
    if (!statement) {
        writeToDiv('FAILURE: ' + debugprint, 1);
    } else {
        writeToDiv('success');
    };
};

var getFileData=function(callback) {
	var formFile = document.getElementById("metadatafile");
    var file = formFile.files[0];
    var ret={};
    ret.name=file.name;
    ret.size=file.size;
    var reader = new FileReader();
    
    reader.onload = function(callback) {
    	ret.content=this.result;
    	callback(ret);
    };
    reader.readAsText(file);
};

// since the lib is async I wrote the functions in the order
// they are executed to give a bit of an overview
function sendMetadataFile() {
	
	var fileData=getFileData(function(fileData){
		var basedir = '/webdav/';
		var file = fileData.name;
		
		client.PUT(basedir + file, fileData.content, wrapContinueHandler(201));
	});
};

function wrapContinueHandler(expected_status) {
    var wrapped = function(status, statusstr, content) {
        writeToDiv('status: ' + status + ' (' + statusstr + ')');
        if (content) {
            writeToDiv('content: ' + content);
        };
        
        // multistatus request
        if (content && status == 207) {

        	var parser, doc = null;
        	if (window.DOMParser) {
        	  parser = new DOMParser();
        	  doc = parser.parseFromString(string.deentitize(content), "application/xml");
       	    } else {  // Internet Explorer :-)
       	    	doc = new ActiveXObject("Microsoft.XMLDOM");
       	    	doc.loadXML(content);
       	    }

            writeToDiv('Files found:');
            
        	// list files
        	for (i = 0; i< doc.getElementsByTagName("response").length; i++) {
        		// property wrapper for IE (property "text") + Rest (property "textcontent")
        		// alternative: use jquery for wrapping
        		writeToDiv(doc.getElementsByTagName("response")[i].firstChild.textContent || doc.getElementsByTagName("response")[i].firstChild.text);
        	}
        };
        
        writeToDiv('Expected status: ' + expected_status);
        
        if (status == expected_status) {
            writeToDiv('OK');
        } else {
            writeToDiv('FAILED', true);
        };
        writeToDiv('--------------------');
    };
    
    return wrapped;
};