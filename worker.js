// The worker performs all of the calculation and returns the results or errors.

function log(x) { console.log("worker :" + x); }

self.onmessage = function(e) {
    log(e);
    const lines = e.data.source;
    const result = execute_lines(lines);
    self.postMessage(result);
}

function execute_lines(lines) {
    var results = [];
    var assignments = '';
    for (i = 0; i < lines.length; i++) {
        const line = lines[i];
        results[i] = execute_line(assignments,with_prior_results(line,results));
        if (assignment(line)) {
            assignments = assignments + '\n' + line;
        }
    }
    return results;
}

function assignment(line) {
    return line.includes('=');
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

function execute_line(assignments,line) {
    const f = imports() + ";" + assignments + "; return " + line + ";";
    log(f);
    try {
        return Function(f)()
    } catch (e) {
        console.error(e);
        return e;
    }
}

