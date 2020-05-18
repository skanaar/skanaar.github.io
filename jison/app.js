
function throttle(delay, action) {
  var paused = false
  var triggered = false
  function onReleaseThrottle() {
    if (triggered) action()
    paused = false
  }
  return function (){
    if (!paused) {
      action()
      paused = true
      setTimeout(onReleaseThrottle, delay)
    } else {
      triggered = true
    }
  }
}

function App(editor, elements) {
  var isGrammarValid = false
  var parser, parser2;
  
  setTimeout(run, 0);

  elements.parse_btn.addEventListener('click', run);
  editor.on('change', throttle(1000, run));
  elements.source.addEventListener('input', throttle(1000, run));
  // $("#examples").change(function(ev) {
  //   var file = this.options[this.selectedIndex].value;
  //   $(document.body).addClass("loading");
  //   $.get("/jison/examples/"+file, function (data) {
  //     editor.setValue(data);
  //     $(document.body).removeClass("loading");
  //   });
  // });
  
  editor.setValue(localStorage['jison.grammar'] || '');
  editor.on('change', function () {
    localStorage['jison.grammar'] = editor.getValue()
  })

  source.value = localStorage['jison.source'] || '';
  source.addEventListener('input', function () {
    localStorage['jison.source'] = source.value
  })

  function printOut(str) {
    elements.output.innerText += str;
  }

  function run() {
    elements.output.classList.remove("good");
    elements.output.classList.remove("bad");
    elements.output.innerText = '';
    processGrammar()
    if (isGrammarValid) runParser()
  }

  function processGrammar () {
    isGrammarValid = false;
    var grammar = editor.getValue();
    try {
      var cfg = bnf.parse(grammar);
    } catch (e) {
      printOut("Oops. Make sure your grammar is in the correct format.\n"+e);
      elements.message.innerText = "⚠️ Failed to parse grammar";
      elements.message.classList.add('warning');
      return;
    }

    if (cfg.moduleInclude) {
      // put the %{ ... %} preamble in the global scope
      eval.call(window, cfg.moduleInclude)
    }
    Jison.print = function () {};
    parser = Jison.Generator(cfg, {type: 'lalr'});

    if (parser.conflicts) {
      printOut('Conflicts encountered:\n');
      elements.message.innerText = "⚠️ Conflicts encountered (" + parser.conflicts + ")";
      elements.message.classList.add('warning');
    }

    parser.resolutions.forEach(function (res) {
      var r = res[2];
      if (!r.bydefault) return;
      printOut(`${r.msg}\n(${r.s}, ${r.r}) -> ${r.action}\n`);
    });

    parser2 = parser.createParser();
    isGrammarValid = parser.conflicts == 0;
  }

  function runParser () {
    if (!isGrammarValid) return;
    if (!parser) processGrammar();
    var source = elements.source.value;
    try {
      printOut(stringify(parser2.parse(source), {maxLength:100}));
      elements.message.innerText = "Success";
      elements.message.classList.remove('warning');
    } catch(e) {
      printOut(e.message || e);
      elements.message.innerText = "⚠️ Failed to parse test source";
      elements.message.classList.add('warning');
    }
  }
}
