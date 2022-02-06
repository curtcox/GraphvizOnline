self.onmessage = function(e) {
    console.log("worker ");
    console.log(e);
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
    console.log(f);
    return Function(f)();
}

