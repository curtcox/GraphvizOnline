(function (document) {

  function log(x) { console.log(x); }

  //http://stackoverflow.com/a/10372280/398634
  window.URL = window.URL || window.webkitURL;
  var el_stetus = document.getElementById("status"),
    t_stetus = -1,
    reviewer = document.getElementById("review"),
    editor = ace.edit("editor"),
    lastHD = -1,
    worker = null,
    errorEl = document.querySelector("#error");

  function show_status(text, hide) {
    log(text);
    hide = hide || 0;
    clearTimeout(t_stetus);
    el_stetus.innerHTML = text;
    if (hide) {
      t_stetus = setTimeout(function () {
        el_stetus.innerHTML = "";
      }, hide);
    }
  }

  function removeClass(name) { reviewer.classList.remove(name); }
  function editorSession()   { return editor.getSession(); }

  function show_error(e) {
    show_status("error", 500);
    removeClass("working");
    reviewer.classList.add("error");

    var message = e;
    while (errorEl.firstChild) {
      errorEl.removeChild(errorEl.firstChild);
    }
    errorEl.appendChild(document.createTextNode(message));
  }

  function updateState() {
    var content = encodeURIComponent(editor.getSession().getDocument().getValue());
    history.pushState({"content": content}, "", "#" + content)
  }

  function setWorking() {
    reviewer.classList.add("working");
    removeClass("error");
  }

  function setDone() {
    show_status("done", 500);
    removeClass("working");
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
    if (typeof e.data.error !== "undefined") {
      var event = new CustomEvent("error", {"detail": new Error(e.data.error.message)});
      worker.dispatchEvent(event);
      return
    }
    setDone();
    updateOutput(e.data);
  }

  function renderGraph() {
    setWorking();
    freshWorker();
    worker.addEventListener("message", function (e) { on_WorkerMessage(e);  }, false);
    worker.addEventListener('error',   function (e) { show_error(e.detail); }, false);

    show_status("rendering...");
    var params = {
      "source": editor.getSession().getDocument().getValue(),
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

    if (!result) {
      return;
    }

    clearStatus();

    var text = document.createElement("div");
    text.id = "text";
    text.appendChild(document.createTextNode(result));
    reviewer.appendChild(text);

    updateState();
  }

  editorSession().setMode("ace/mode/javascript");
  editorSession().on("change", function () {
    clearTimeout(lastHD);
    lastHD = setTimeout(renderGraph, 200);
  });

  window.onpopstate = function(event) {
    if (event.state != null && event.state.content != undefined) {
      editorSession().setValue(decodeURIComponent(event.state.content));
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
  const params = new URLSearchParams(location.search.substring(1));
  log(params);

})(document);
