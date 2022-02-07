function log(x) { console.log("worker :" + x); }

self.onmessage = function(e) {
    log(e);
    var source = e.data.source;
    var result = execute_text(source);
    self.postMessage(result);
}

function import_prop(prop) {
    return "const " + prop.toLowerCase() + " = Math." + prop;
}

function imports() {
    return Object.getOwnPropertyNames(Math).map(import_prop).join('; ');
}

function execute_text(source) {
    var f = imports() + "; return " + source + ";";
    log(f);
    return Function(f)();
}

