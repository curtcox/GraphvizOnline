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
        const line = without_comment(lines[i]);
        results[i] = execute_line(assignments,with_prior_results(line,results));
        if (assignment(line)) {
            assignments = assignments + '\n' + expanded_line(line);
        }
    }
    return results;
}

function without_comment(line) {
    if (line.includes('//')) {
        return line.split('//')[0];
    }
    return line;
}

function assignment(line) {
    return line.includes('=');
}

function function_assignment(line) {
    if (!assignment(line)) {
        return false;
    }
    const left_side = line.split('=')[0];
    return left_side.includes('(') && left_side.includes(')');
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

function expanded_line(line) {
    return function_assignment(line) ? expanded_function_assignment(line) : line;
}

function function_name(line)   { return line.split('(')[0]; }
function function_params(line) { return line.split('(')[1].split(')')[0]; }
function function_body(line)   { return line.split('=')[1]; }

//       sqr(x) = x * x
// const sqr = function(x) { return x * x }
function expanded_function_assignment(line) {
    const   name = function_name(line);
    const params = function_params(line);
    const   body = function_body(line);
    return 'const ' + name + ' = function(' + params + ')' + '{ return ' + body + '; }';
}

function line_to_execute(assignments,line) {
    return imports() + ";" + assignments + "; return " + expanded_line(line) + ";";
}

function execute_line(assignments,line) {
    if (line.trim()==='') {
        return '';
    }
    if (function_assignment(line)) {
        return function_name(line);
    }
    const f = line_to_execute(assignments,line);
    log(f);
    try {
        return Function(f)()
    } catch (e) {
        console.error(e);
        return e;
    }
}