
var fileName;

function handleFiles(files) {
    // Check for the various File API support.
    if (window.FileReader) {
        // FileReader are supported.
        getAsText(files[0]);
		fileName=files[0];
    } else {
        alert('FileReader are not supported in this browser.');
    }
  }

  function getAsText(fileToRead) {
    var reader = new FileReader();
    // Read file into memory as UTF-8      
    reader.readAsText(fileToRead);
    // Handle errors load
    reader.onload = loadHandler;
    reader.onerror = errorHandler;
  }

  function loadHandler(event) {
    var csv = event.target.result;
    processData(csv,fileName);
  }

  function processData(csv,fileName) {
      var allTextLines = csv.split(/\r\n|\n/);
      var lines = [];
      for (var i=0; i<allTextLines.length; i++) {
          var data = allTextLines[i].split(';');
              var tarr = [];
              for (var j=0; j<data.length; j++) {
                  tarr.push(data[j]);
              }
              lines.push(tarr);
      }
    addHtm(lines,fileName);
  }

  function addHtm(data,fileName) {
				var dir = fileName.split("_");
				var dirName = dir[1].split(".");
				
				for (var i=1; i<data.length; i++){
					var cols = data[i];
					var colSize = cols.length;
					for (var j=1;j<cols.length;j++){
						if(j==1){
							var strRow = "<tr>"
							strRow += "<td>" + cols[j] + "</td>";
							}
						else if(j==colSize-1){
								strRow += "<td>" + cols[j] + "</td>"
								strRow += "<td><a href='/login?selectedUser="+ cols[1] + "&userDirectory=" + dirName[0]+ "'>Login</a></td>";
								strRow +="</tr>";
								$('#userTable').append(strRow);
							}
						else
							{
								strRow += "<td>" + cols[j] + "</td>";
							}
					}
				}
			}
  
  function errorHandler(evt) {
    if(evt.target.error.name == "NotReadableError") {
        alert("Canno't read file !");
    }
  }