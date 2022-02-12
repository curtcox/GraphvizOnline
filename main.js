// Connects everything. editor <-> URL editor -> worker -> reviewer 
(function (document) {

  function log(x) { console.log(x); }

  //http://stackoverflow.com/a/10372280/398634
  window.URL = window.URL || window.webkitURL;
  var reviewer = document.getElementById("review"),
    editor = ace.edit("editor"),
    lastHD = -1,
    worker = null;

  function editorSession()   { return editor.getSession(); }

  function encodeStateURI(text) {
    return encodeURI(text.replaceAll('\n',';').replaceAll(' ','_'));
  }

  function decodeStateURI(uri) {
    return decodeURI(uri.replaceAll(';','\n').replaceAll('_',' '));
  }

  function updateState() {
    var content = encodeStateURI(getEditorState());
    history.pushState({"content": content}, "", "#" + content)
  }

  function getEditorState() {
    return editorSession().getDocument().getValue();
  }

  function setEditorState(uri) {
    editorSession().setValue(decodeStateURI(uri));
  }

  function freshWorker() {
    if (worker) {
        worker.terminate();
    }

    worker = new Worker("worker.js");
  }

  function on_WorkerMessage(e) {
    log("on_WorkerMessage");
    log(e);
    updateOutput(e.data);
  }

  function calculateResults() {
    freshWorker();
    worker.addEventListener("message", function (e) { on_WorkerMessage(e);  }, false);
    const params = {
      "source": getEditorState().split(/\r?\n/),
      "id": new Date().toJSON(),
    };
    log(params);
    worker.postMessage(params);
  }

  function removeSelector(name) {
    var selector = reviewer.querySelector(name);
    if (selector) {
      reviewer.removeChild(selector);
    }
  }

  function removeExistingOutput() {
    removeSelector("#text");
    removeSelector("a");
  }

  function addNewOutput(result) {
    const text = document.createElement("div");
    text.id = "text";
    const lines = formatResultLines(result);
    text.appendChild(document.createTextNode(lines));
    reviewer.appendChild(text);
  }

  function formatResultLines(result) {
    return result.map(function(line,index) {
      return "#" + (index + 1) + " " + line;
    }).join("\n");
  }

  function updateOutput(result) {
    log("updateOutput");
    log(result);
    removeExistingOutput();
    addNewOutput(result);
    updateState();
  }

  editorSession().setMode("ace/mode/javascript");
  editorSession().setUseWorker(false);
  editorSession().on("change", function () {
    clearTimeout(lastHD);
    lastHD = setTimeout(calculateResults, 100);
  });

  window.onpopstate = function(event) {
    if (event.state != null && event.state.content != undefined) {
      setEditorState(event.state.content);
    }
  };

  /* come from sharing */
  setEditorState(location.hash.substring(1));
  calculateResults();
})(document);
