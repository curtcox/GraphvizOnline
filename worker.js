function log(x) { console.log("worker :" + x); }

self.onmessage = function(e) {
    log(e);
    const lines = e.data.source;
    const result = execute_lines(lines);
    self.postMessage(result);
}

function execute_lines(lines) {
    var results = [];
    for (i = 0; i < lines.length; i++) {
        results[i] = execute_text(with_prior_results(lines[i],results));
    }

    return results;
}

function with_prior_results(text,results) {
    for (i = 0; i < results.length; i++) {
        const resultName = '#' + (i+1);
        const resultValue = results[i];
        text = text.replaceAll(resultName,resultValue);
    }
    return text;
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
    try {
        return Function(f)()
    } catch (e) {
        console.error(e);
    }
}

