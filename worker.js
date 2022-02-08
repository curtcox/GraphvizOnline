function log(x) { console.log("worker :" + x); }

self.onmessage = function(e) {
    log(e);
    const lines = e.data.source;
    const result = execute_lines(lines);
    self.postMessage(result);
}

function execute_lines(lines) {
    var results = [];
    var text = "";
    
    for (i = 0; i < lines.length; i++) {
        text = text + lines[i] + "\n";
        results[i] = execute_text(text);
    }

    return results;
}

function import_prop(prop) {
    return "const " + prop.toLowerCase() + " = Math." + prop;
}

function imports() {
    return Object.getOwnPropertyNames(Math).map(import_prop).join('; ');
}

function execute_text(text) {
    const f = imports() + "; return " + text + ";";
    log(f);
    return Function(f)()
}

