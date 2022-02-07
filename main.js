(function (document) {

  function log(x) { console.log(x); }

  //http://stackoverflow.com/a/10372280/398634
  window.URL = window.URL || window.webkitURL;
  var reviewer = document.getElementById("review"),
    editor = ace.edit("editor"),
    lastHD = -1,
    worker = null;

  function removeClass(name) { reviewer.classList.remove(name); }
  function editorSession()   { return editor.getSession(); }

  function updateState() {
    var content = encodeURI(editorSession().getDocument().getValue());
    history.pushState({"content": content}, "", "#" + content)
  }

  function setWorking() {
    reviewer.classList.add("working");
    removeClass("error");
  }

  function clearStatus() {
    removeClass("working");
    removeClass("error");
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
    clearStatus();
    updateOutput(e.data);
  }

  function renderGraph() {
    setWorking();
    freshWorker();
    worker.addEventListener("message", function (e) { on_WorkerMessage(e);  }, false);
    const params = {
      "source": editorSession().getDocument().getValue(),
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

  function updateOutput(result) {
    log("updateOutput");
    log(result);
    removeSelector("#text");
    removeSelector("a");

    clearStatus();

    var text = document.createElement("div");
    text.id = "text";
    text.appendChild(document.createTextNode(result));
    reviewer.appendChild(text);

    updateState();
  }

  function setEditorState(uri) {
    editorSession().setValue(decodeURI(uri));
  }

  editorSession().setMode("ace/mode/javascript");
  editorSession().on("change", function () {
    clearTimeout(lastHD);
    lastHD = setTimeout(renderGraph, 200);
  });

  window.onpopstate = function(event) {
    if (event.state != null && event.state.content != undefined) {
      setEditorState(event.state.content);
    }
  };

  // Since apparently HTMLCollection does not implement the oh so convenient array functions
  HTMLOptionsCollection.prototype.indexOf = function(name) {
    for (let i = 0; i < this.length; i++) {
      if (this[i].value == name) {
        return i;
      }
    }

    return -1;
  };

  /* come from sharing */
  setEditorState(location.hash.substring(1));
  renderGraph();
})(document);
