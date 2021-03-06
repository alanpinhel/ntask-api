(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Browser Request
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// UMD HEADER START 
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like enviroments that support module.exports,
        // like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.returnExports = factory();
  }
}(this, function () {
// UMD HEADER END

var XHR = XMLHttpRequest
if (!XHR) throw new Error('missing XMLHttpRequest')
request.log = {
  'trace': noop, 'debug': noop, 'info': noop, 'warn': noop, 'error': noop
}

var DEFAULT_TIMEOUT = 3 * 60 * 1000 // 3 minutes

//
// request
//

function request(options, callback) {
  // The entry-point to the API: prep the options object and pass the real work to run_xhr.
  if(typeof callback !== 'function')
    throw new Error('Bad callback given: ' + callback)

  if(!options)
    throw new Error('No options given')

  var options_onResponse = options.onResponse; // Save this for later.

  if(typeof options === 'string')
    options = {'uri':options};
  else
    options = JSON.parse(JSON.stringify(options)); // Use a duplicate for mutating.

  options.onResponse = options_onResponse // And put it back.

  if (options.verbose) request.log = getLogger();

  if(options.url) {
    options.uri = options.url;
    delete options.url;
  }

  if(!options.uri && options.uri !== "")
    throw new Error("options.uri is a required argument");

  if(typeof options.uri != "string")
    throw new Error("options.uri must be a string");

  var unsupported_options = ['proxy', '_redirectsFollowed', 'maxRedirects', 'followRedirect']
  for (var i = 0; i < unsupported_options.length; i++)
    if(options[ unsupported_options[i] ])
      throw new Error("options." + unsupported_options[i] + " is not supported")

  options.callback = callback
  options.method = options.method || 'GET';
  options.headers = options.headers || {};
  options.body    = options.body || null
  options.timeout = options.timeout || request.DEFAULT_TIMEOUT

  if(options.headers.host)
    throw new Error("Options.headers.host is not supported");

  if(options.json) {
    options.headers.accept = options.headers.accept || 'application/json'
    if(options.method !== 'GET')
      options.headers['content-type'] = 'application/json'

    if(typeof options.json !== 'boolean')
      options.body = JSON.stringify(options.json)
    else if(typeof options.body !== 'string')
      options.body = JSON.stringify(options.body)
  }
  
  //BEGIN QS Hack
  var serialize = function(obj) {
    var str = [];
    for(var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }
  
  if(options.qs){
    var qs = (typeof options.qs == 'string')? options.qs : serialize(options.qs);
    if(options.uri.indexOf('?') !== -1){ //no get params
        options.uri = options.uri+'&'+qs;
    }else{ //existing get params
        options.uri = options.uri+'?'+qs;
    }
  }
  //END QS Hack
  
  //BEGIN FORM Hack
  var multipart = function(obj) {
    //todo: support file type (useful?)
    var result = {};
    result.boundry = '-------------------------------'+Math.floor(Math.random()*1000000000);
    var lines = [];
    for(var p in obj){
        if (obj.hasOwnProperty(p)) {
            lines.push(
                '--'+result.boundry+"\n"+
                'Content-Disposition: form-data; name="'+p+'"'+"\n"+
                "\n"+
                obj[p]+"\n"
            );
        }
    }
    lines.push( '--'+result.boundry+'--' );
    result.body = lines.join('');
    result.length = result.body.length;
    result.type = 'multipart/form-data; boundary='+result.boundry;
    return result;
  }
  
  if(options.form){
    if(typeof options.form == 'string') throw('form name unsupported');
    if(options.method === 'POST'){
        var encoding = (options.encoding || 'application/x-www-form-urlencoded').toLowerCase();
        options.headers['content-type'] = encoding;
        switch(encoding){
            case 'application/x-www-form-urlencoded':
                options.body = serialize(options.form).replace(/%20/g, "+");
                break;
            case 'multipart/form-data':
                var multi = multipart(options.form);
                //options.headers['content-length'] = multi.length;
                options.body = multi.body;
                options.headers['content-type'] = multi.type;
                break;
            default : throw new Error('unsupported encoding:'+encoding);
        }
    }
  }
  //END FORM Hack

  // If onResponse is boolean true, call back immediately when the response is known,
  // not when the full request is complete.
  options.onResponse = options.onResponse || noop
  if(options.onResponse === true) {
    options.onResponse = callback
    options.callback = noop
  }

  // XXX Browsers do not like this.
  //if(options.body)
  //  options.headers['content-length'] = options.body.length;

  // HTTP basic authentication
  if(!options.headers.authorization && options.auth)
    options.headers.authorization = 'Basic ' + b64_enc(options.auth.username + ':' + options.auth.password);

  return run_xhr(options)
}

var req_seq = 0
function run_xhr(options) {
  var xhr = new XHR
    , timed_out = false
    , is_cors = is_crossDomain(options.uri)
    , supports_cors = ('withCredentials' in xhr)

  req_seq += 1
  xhr.seq_id = req_seq
  xhr.id = req_seq + ': ' + options.method + ' ' + options.uri
  xhr._id = xhr.id // I know I will type "_id" from habit all the time.

  if(is_cors && !supports_cors) {
    var cors_err = new Error('Browser does not support cross-origin request: ' + options.uri)
    cors_err.cors = 'unsupported'
    return options.callback(cors_err, xhr)
  }

  xhr.timeoutTimer = setTimeout(too_late, options.timeout)
  function too_late() {
    timed_out = true
    var er = new Error('ETIMEDOUT')
    er.code = 'ETIMEDOUT'
    er.duration = options.timeout

    request.log.error('Timeout', { 'id':xhr._id, 'milliseconds':options.timeout })
    return options.callback(er, xhr)
  }

  // Some states can be skipped over, so remember what is still incomplete.
  var did = {'response':false, 'loading':false, 'end':false}

  xhr.onreadystatechange = on_state_change
  xhr.open(options.method, options.uri, true) // asynchronous
  if(is_cors)
    xhr.withCredentials = !! options.withCredentials
  xhr.send(options.body)
  return xhr

  function on_state_change(event) {
    if(timed_out)
      return request.log.debug('Ignoring timed out state change', {'state':xhr.readyState, 'id':xhr.id})

    request.log.debug('State change', {'state':xhr.readyState, 'id':xhr.id, 'timed_out':timed_out})

    if(xhr.readyState === XHR.OPENED) {
      request.log.debug('Request started', {'id':xhr.id})
      for (var key in options.headers)
        xhr.setRequestHeader(key, options.headers[key])
    }

    else if(xhr.readyState === XHR.HEADERS_RECEIVED)
      on_response()

    else if(xhr.readyState === XHR.LOADING) {
      on_response()
      on_loading()
    }

    else if(xhr.readyState === XHR.DONE) {
      on_response()
      on_loading()
      on_end()
    }
  }

  function on_response() {
    if(did.response)
      return

    did.response = true
    request.log.debug('Got response', {'id':xhr.id, 'status':xhr.status})
    clearTimeout(xhr.timeoutTimer)
    xhr.statusCode = xhr.status // Node request compatibility

    // Detect failed CORS requests.
    if(is_cors && xhr.statusCode == 0) {
      var cors_err = new Error('CORS request rejected: ' + options.uri)
      cors_err.cors = 'rejected'

      // Do not process this request further.
      did.loading = true
      did.end = true

      return options.callback(cors_err, xhr)
    }

    options.onResponse(null, xhr)
  }

  function on_loading() {
    if(did.loading)
      return

    did.loading = true
    request.log.debug('Response body loading', {'id':xhr.id})
    // TODO: Maybe simulate "data" events by watching xhr.responseText
  }

  function on_end() {
    if(did.end)
      return

    did.end = true
    request.log.debug('Request done', {'id':xhr.id})

    xhr.body = xhr.responseText
    if(options.json) {
      try        { xhr.body = JSON.parse(xhr.responseText) }
      catch (er) { return options.callback(er, xhr)        }
    }

    options.callback(null, xhr, xhr.body)
  }

} // request

request.withCredentials = false;
request.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;

//
// defaults
//

request.defaults = function(options, requester) {
  var def = function (method) {
    var d = function (params, callback) {
      if(typeof params === 'string')
        params = {'uri': params};
      else {
        params = JSON.parse(JSON.stringify(params));
      }
      for (var i in options) {
        if (params[i] === undefined) params[i] = options[i]
      }
      return method(params, callback)
    }
    return d
  }
  var de = def(request)
  de.get = def(request.get)
  de.post = def(request.post)
  de.put = def(request.put)
  de.head = def(request.head)
  return de
}

//
// HTTP method shortcuts
//

var shortcuts = [ 'get', 'put', 'post', 'head' ];
shortcuts.forEach(function(shortcut) {
  var method = shortcut.toUpperCase();
  var func   = shortcut.toLowerCase();

  request[func] = function(opts) {
    if(typeof opts === 'string')
      opts = {'method':method, 'uri':opts};
    else {
      opts = JSON.parse(JSON.stringify(opts));
      opts.method = method;
    }

    var args = [opts].concat(Array.prototype.slice.apply(arguments, [1]));
    return request.apply(this, args);
  }
})

//
// CouchDB shortcut
//

request.couch = function(options, callback) {
  if(typeof options === 'string')
    options = {'uri':options}

  // Just use the request API to do JSON.
  options.json = true
  if(options.body)
    options.json = options.body
  delete options.body

  callback = callback || noop

  var xhr = request(options, couch_handler)
  return xhr

  function couch_handler(er, resp, body) {
    if(er)
      return callback(er, resp, body)

    if((resp.statusCode < 200 || resp.statusCode > 299) && body.error) {
      // The body is a Couch JSON object indicating the error.
      er = new Error('CouchDB error: ' + (body.error.reason || body.error.error))
      for (var key in body)
        er[key] = body[key]
      return callback(er, resp, body);
    }

    return callback(er, resp, body);
  }
}

//
// Utility
//

function noop() {}

function getLogger() {
  var logger = {}
    , levels = ['trace', 'debug', 'info', 'warn', 'error']
    , level, i

  for(i = 0; i < levels.length; i++) {
    level = levels[i]

    logger[level] = noop
    if(typeof console !== 'undefined' && console && console[level])
      logger[level] = formatted(console, level)
  }

  return logger
}

function formatted(obj, method) {
  return formatted_logger

  function formatted_logger(str, context) {
    if(typeof context === 'object')
      str += ' ' + JSON.stringify(context)

    return obj[method].call(obj, str)
  }
}

// Return whether a URL is a cross-domain request.
function is_crossDomain(url) {
  var rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/

  // jQuery #8138, IE may throw an exception when accessing
  // a field from window.location if document.domain has been set
  var ajaxLocation
  try { ajaxLocation = location.href }
  catch (e) {
    // Use the href attribute of an A element since IE will modify it given document.location
    ajaxLocation = document.createElement( "a" );
    ajaxLocation.href = "";
    ajaxLocation = ajaxLocation.href;
  }

  var ajaxLocParts = rurl.exec(ajaxLocation.toLowerCase()) || []
    , parts = rurl.exec(url.toLowerCase() )

  var result = !!(
    parts &&
    (  parts[1] != ajaxLocParts[1]
    || parts[2] != ajaxLocParts[2]
    || (parts[3] || (parts[1] === "http:" ? 80 : 443)) != (ajaxLocParts[3] || (ajaxLocParts[1] === "http:" ? 80 : 443))
    )
  )

  //console.debug('is_crossDomain('+url+') -> ' + result)
  return result
}

// MIT License from http://phpjs.org/functions/base64_encode:358
function b64_enc (data) {
    // Encodes string using MIME base64 algorithm
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0, ac = 0, enc="", tmp_arr = [];

    if (!data) {
        return data;
    }

    // assume utf8 data
    // data = this.utf8_encode(data+'');

    do { // pack three octets into four hexets
        o1 = data.charCodeAt(i++);
        o2 = data.charCodeAt(i++);
        o3 = data.charCodeAt(i++);

        bits = o1<<16 | o2<<8 | o3;

        h1 = bits>>18 & 0x3f;
        h2 = bits>>12 & 0x3f;
        h3 = bits>>6 & 0x3f;
        h4 = bits & 0x3f;

        // use hexets to index into b64, and append result to encoded string
        tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);

    enc = tmp_arr.join('');

    switch (data.length % 3) {
        case 1:
            enc = enc.slice(0, -2) + '==';
        break;
        case 2:
            enc = enc.slice(0, -1) + '=';
        break;
    }

    return enc;
}
    return request;
//UMD FOOTER START
}));
//UMD FOOTER END

},{}],2:[function(require,module,exports){
function E () {
  // Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

E.prototype = {
  on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    };

    listener._ = callback
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

module.exports = E;

},{}],3:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tarefas = require("./components/tarefas.js");

var _tarefas2 = _interopRequireDefault(_tarefas);

var _tarefaForm = require("./components/tarefaForm.js");

var _tarefaForm2 = _interopRequireDefault(_tarefaForm);

var _usuario = require("./components/usuario.js");

var _usuario2 = _interopRequireDefault(_usuario);

var _entrar = require("./components/entrar.js");

var _entrar2 = _interopRequireDefault(_entrar);

var _cadastrar = require("./components/cadastrar.js");

var _cadastrar2 = _interopRequireDefault(_cadastrar);

var _menu = require("./components/menu.js");

var _menu2 = _interopRequireDefault(_menu);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var App = function () {
  function App(body, footer) {
    _classCallCheck(this, App);

    this.entrar = new _entrar2.default(body);
    this.cadastrar = new _cadastrar2.default(body);
    this.tarefas = new _tarefas2.default(body);
    this.tarefaForm = new _tarefaForm2.default(body);
    this.usuario = new _usuario2.default(body);
    this.menu = new _menu2.default(footer);
  }

  _createClass(App, [{
    key: "init",
    value: function init() {
      this.entrar.render();
      this.addEventListener();
    }
  }, {
    key: "addEventListener",
    value: function addEventListener() {
      this.entrarEvents();
      this.cadastrarEvents();
      this.tarefasEvents();
      this.tarefaFormEvents();
      this.usuarioEvents();
      this.menuEvents();
    }
  }, {
    key: "entrarEvents",
    value: function entrarEvents() {
      var _this = this;

      this.entrar.on("error", function () {
        alert("Erro de autenticação");
      });
      this.entrar.on("entrar", function (token) {
        localStorage.setItem("token", "JWT " + token);
        _this.menu.render("tarefas");
        _this.tarefas.render();
      });
      this.entrar.on("cadastrar", function () {
        _this.cadastrar.render();
      });
    }
  }, {
    key: "cadastrarEvents",
    value: function cadastrarEvents() {
      var _this2 = this;

      this.cadastrar.on("error", function () {
        alert("Erro no cadastro");
      });
      this.cadastrar.on("cadastrar", function (usuario) {
        alert(usuario.nome + " voc\xEA foi cadastrado com sucesso!");
        _this2.entrar.render();
      });
    }
  }, {
    key: "tarefasEvents",
    value: function tarefasEvents() {
      var _this3 = this;

      this.tarefas.on("error", function () {
        alert("Erro ao listar tarefas");
      });
      this.tarefas.on("remove-error", function () {
        alert("Erro ao excluir");
      });
      this.tarefas.on("update-error", function () {
        alert("Erro ao atualizar");
      });
      this.tarefas.on("remove", function () {
        _this3.tarefas.render();
      });
      this.tarefas.on("update", function () {
        _this3.tarefas.render();
      });
    }
  }, {
    key: "tarefaFormEvents",
    value: function tarefaFormEvents() {
      var _this4 = this;

      this.tarefaForm.on("error", function () {
        alert("Erro ao cadastrar tarefa");
      });
      this.tarefaForm.on("submit", function () {
        _this4.menu.render("tarefas");
        _this4.tarefas.render();
      });
    }
  }, {
    key: "usuarioEvents",
    value: function usuarioEvents() {
      var _this5 = this;

      this.usuario.on("error", function () {
        alert("Erro carregar usuário");
      });
      this.usuario.on("remove-error", function () {
        alert("Erro ao excluir conta");
      });
      this.usuario.on("remove-conta", function () {
        alert("Que pena! Sua conta foi excluída.");
        localStorage.clear();
        _this5.menu.clear();
        _this5.entrar.render();
      });
    }
  }, {
    key: "menuEvents",
    value: function menuEvents() {
      var _this6 = this;

      this.menu.on("click", function (path) {
        _this6.menu.render(path);
        _this6[path].render();
      });
      this.menu.on("sair", function () {
        localStorage.clear();
        _this6.menu.clear();
        _this6.entrar.render();
      });
    }
  }]);

  return App;
}();

module.exports = App;

},{"./components/cadastrar.js":4,"./components/entrar.js":5,"./components/menu.js":6,"./components/tarefaForm.js":7,"./components/tarefas.js":8,"./components/usuario.js":9}],4:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ntask = require("../ntask.js");

var _ntask2 = _interopRequireDefault(_ntask);

var _cadastrar = require("../templates/cadastrar.js");

var _cadastrar2 = _interopRequireDefault(_cadastrar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Cadastrar = function (_NTask) {
  _inherits(Cadastrar, _NTask);

  function Cadastrar(body) {
    _classCallCheck(this, Cadastrar);

    var _this = _possibleConstructorReturn(this, (Cadastrar.__proto__ || Object.getPrototypeOf(Cadastrar)).call(this));

    _this.body = body;
    return _this;
  }

  _createClass(Cadastrar, [{
    key: "render",
    value: function render() {
      this.body.innerHTML = _cadastrar2.default.render();
      this.body.querySelector("[data-nome]").focus();
      this.addEventListener();
    }
  }, {
    key: "addEventListener",
    value: function addEventListener() {
      this.formSubmit();
    }
  }, {
    key: "formSubmit",
    value: function formSubmit() {
      var _this2 = this;

      var form = this.body.querySelector("form");

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var nome = e.target.querySelector("[data-nome]");
        var email = e.target.querySelector("[data-email]");
        var senha = e.target.querySelector("[data-senha]");
        var opcoes = {
          method: "POST",
          url: _this2.URL + "/usuarios",
          json: true,
          body: {
            nome: nome.value,
            email: email.value,
            senha: senha.value
          }
        };
        _this2.request(opcoes, function (err, res, data) {
          if (err || res.status === 412) {
            _this2.emit("error", err);
          } else {
            _this2.emit("cadastrar", data);
          }
        });
      });
    }
  }]);

  return Cadastrar;
}(_ntask2.default);

module.exports = Cadastrar;

},{"../ntask.js":10,"../templates/cadastrar.js":11}],5:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ntask = require("../ntask.js");

var _ntask2 = _interopRequireDefault(_ntask);

var _entrar = require("../templates/entrar.js");

var _entrar2 = _interopRequireDefault(_entrar);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Entrar = function (_NTask) {
  _inherits(Entrar, _NTask);

  function Entrar(body) {
    _classCallCheck(this, Entrar);

    var _this = _possibleConstructorReturn(this, (Entrar.__proto__ || Object.getPrototypeOf(Entrar)).call(this));

    _this.body = body;
    return _this;
  }

  _createClass(Entrar, [{
    key: "render",
    value: function render() {
      this.body.innerHTML = _entrar2.default.render();
      this.body.querySelector("[data-email").focus();
      this.addEventListener();
    }
  }, {
    key: "addEventListener",
    value: function addEventListener() {
      this.formSubmit();
      this.cadastrarClick();
    }
  }, {
    key: "formSubmit",
    value: function formSubmit() {
      var _this2 = this;

      var form = this.body.querySelector("form");

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var email = e.target.querySelector("[data-email]");
        var senha = e.target.querySelector("[data-senha]");
        var opcoes = {
          method: "POST",
          url: _this2.URL + "/token",
          json: true,
          body: {
            email: email.value,
            senha: senha.value
          }
        };

        _this2.request(opcoes, function (err, res, data) {
          if (err || res.status === 401) {
            _this2.emit("error", err);
          } else {
            _this2.emit("entrar", data.token);
          }
        });
      });
    }
  }, {
    key: "cadastrarClick",
    value: function cadastrarClick() {
      var _this3 = this;

      var cadastrar = this.body.querySelector("[data-cadastrar]");

      cadastrar.addEventListener("click", function (e) {
        e.preventDefault();
        _this3.emit("cadastrar");
      });
    }
  }]);

  return Entrar;
}(_ntask2.default);

module.exports = Entrar;

},{"../ntask.js":10,"../templates/entrar.js":12}],6:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ntask = require("../ntask.js");

var _ntask2 = _interopRequireDefault(_ntask);

var _footer = require("../templates/footer.js");

var _footer2 = _interopRequireDefault(_footer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Menu = function (_NTask) {
  _inherits(Menu, _NTask);

  function Menu(body) {
    _classCallCheck(this, Menu);

    var _this = _possibleConstructorReturn(this, (Menu.__proto__ || Object.getPrototypeOf(Menu)).call(this));

    _this.body = body;
    return _this;
  }

  _createClass(Menu, [{
    key: "render",
    value: function render(path) {
      this.body.innerHTML = _footer2.default.render(path);
      this.addEventListener();
    }
  }, {
    key: "clear",
    value: function clear() {
      this.body.innerHTML = "";
    }
  }, {
    key: "addEventListener",
    value: function addEventListener() {
      this.pathsClick();
      this.logoutClick();
    }
  }, {
    key: "pathsClick",
    value: function pathsClick() {
      var _this2 = this;

      var links = this.body.querySelectorAll("[data-path]");

      for (var i = 0, max = links.length; i < max; i++) {
        links[i].addEventListener("click", function (e) {
          e.preventDefault();
          var link = e.target.parentElement;
          var path = link.getAttribute("data-path");
          _this2.emit("click", path);
        });
      }
    }
  }, {
    key: "logoutClick",
    value: function logoutClick() {
      var _this3 = this;

      var link = this.body.querySelector("[data-sair]");
      link.addEventListener("click", function (e) {
        e.preventDefault();
        _this3.emit("sair");
      });
    }
  }]);

  return Menu;
}(_ntask2.default);

module.exports = Menu;

},{"../ntask.js":10,"../templates/footer.js":13}],7:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ntask = require("../ntask.js");

var _ntask2 = _interopRequireDefault(_ntask);

var _tarefaForm = require("../templates/tarefaForm.js");

var _tarefaForm2 = _interopRequireDefault(_tarefaForm);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TarefaForm = function (_NTask) {
  _inherits(TarefaForm, _NTask);

  function TarefaForm(body) {
    _classCallCheck(this, TarefaForm);

    var _this = _possibleConstructorReturn(this, (TarefaForm.__proto__ || Object.getPrototypeOf(TarefaForm)).call(this));

    _this.body = body;
    return _this;
  }

  _createClass(TarefaForm, [{
    key: "render",
    value: function render() {
      this.body.innerHTML = _tarefaForm2.default.render();
      this.body.querySelector("[data-tarefa]").focus();
      this.addEventListener();
    }
  }, {
    key: "addEventListener",
    value: function addEventListener() {
      this.formSubmit();
    }
  }, {
    key: "formSubmit",
    value: function formSubmit() {
      var _this2 = this;

      var form = this.body.querySelector("form");

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        var tarefa = e.target.querySelector("[data-tarefa]");
        var opcoes = {
          method: "POST",
          url: _this2.URL + "/tarefas",
          json: true,
          headers: {
            authorization: localStorage.getItem("token")
          },
          body: {
            titulo: tarefa.value
          }
        };
        _this2.request(opcoes, function (err, res, data) {
          if (err || res.status === 412) {
            _this2.emit("error");
          } else {
            _this2.emit("submit");
          }
        });
      });
    }
  }]);

  return TarefaForm;
}(_ntask2.default);

module.exports = TarefaForm;

},{"../ntask.js":10,"../templates/tarefaForm.js":14}],8:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ntask = require("../ntask.js");

var _ntask2 = _interopRequireDefault(_ntask);

var _tarefas = require("../templates/tarefas.js");

var _tarefas2 = _interopRequireDefault(_tarefas);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Tarefas = function (_NTask) {
  _inherits(Tarefas, _NTask);

  function Tarefas(body) {
    _classCallCheck(this, Tarefas);

    var _this = _possibleConstructorReturn(this, (Tarefas.__proto__ || Object.getPrototypeOf(Tarefas)).call(this));

    _this.body = body;
    return _this;
  }

  _createClass(Tarefas, [{
    key: "render",
    value: function render() {
      this.renderTarefaList();
    }
  }, {
    key: "addEventListener",
    value: function addEventListener() {
      this.tarefaFeitoCheckbox();
      this.tarefaRemoveClick();
    }
  }, {
    key: "renderTarefaList",
    value: function renderTarefaList() {
      var _this2 = this;

      var opcoes = {
        method: "GET",
        url: this.URL + "/tarefas",
        json: true,
        headers: {
          authorization: localStorage.getItem("token")
        }
      };

      this.request(opcoes, function (err, res, data) {
        if (err) {
          _this2.emit("error", err);
        } else {
          _this2.body.innerHTML = _tarefas2.default.render(data);
          _this2.addEventListener();
        }
      });
    }
  }, {
    key: "tarefaFeitoCheckbox",
    value: function tarefaFeitoCheckbox() {
      var _this3 = this;

      var feitos = this.body.querySelectorAll("[data-feito]");

      for (var i = 0, max = feitos.length; i < max; i++) {
        feitos[i].addEventListener("click", function (e) {
          e.preventDefault();

          var _id = e.target.getAttribute("data-tarefa-_id");
          var feito = e.target.getAttribute("data-tarefa-feito");
          var opcoes = {
            method: "PUT",
            url: _this3.URL + "/tarefas/" + _id,
            headers: {
              authorization: localStorage.getItem("token"),
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              feito: !feito
            })
          };
          _this3.request(opcoes, function (err, res, data) {
            if (err || res.status === 412) {
              _this3.emit("update-error", err);
            } else {
              _this3.emit("update");
            }
          });
        });
      }
    }
  }, {
    key: "tarefaRemoveClick",
    value: function tarefaRemoveClick() {
      var _this4 = this;

      var remover = this.body.querySelectorAll("[data-remove]");

      for (var i = 0, max = remover.length; i < max; i++) {
        remover[i].addEventListener("click", function (e) {
          e.preventDefault();
          if (confirm("Deseja excluir está tarefa?")) {
            var _id = e.target.getAttribute("data-tarefa-_id");
            var opcoes = {
              method: "DELETE",
              url: _this4.URL + "/tarefas/" + _id,
              headers: {
                authorization: localStorage.getItem("token")
              }
            };
            _this4.request(opcoes, function (err, res, data) {
              if (err || res.status === 412) {
                _this4.emit("remove-error", err);
              } else {
                _this4.emit("remove");
              }
            });
          }
        });
      }
    }
  }]);

  return Tarefas;
}(_ntask2.default);

module.exports = Tarefas;

},{"../ntask.js":10,"../templates/tarefas.js":15}],9:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _ntask = require("../ntask.js");

var _ntask2 = _interopRequireDefault(_ntask);

var _usuario = require("../templates/usuario.js");

var _usuario2 = _interopRequireDefault(_usuario);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Usuario = function (_NTask) {
  _inherits(Usuario, _NTask);

  function Usuario(body) {
    _classCallCheck(this, Usuario);

    var _this = _possibleConstructorReturn(this, (Usuario.__proto__ || Object.getPrototypeOf(Usuario)).call(this));

    _this.body = body;
    return _this;
  }

  _createClass(Usuario, [{
    key: "render",
    value: function render() {
      this.renderUsuarioDados();
    }
  }, {
    key: "addEventListener",
    value: function addEventListener() {
      this.usuarioCancelarClick();
    }
  }, {
    key: "renderUsuarioDados",
    value: function renderUsuarioDados() {
      var _this2 = this;

      var opcoes = {
        method: "GET",
        url: this.URL + "/usuario",
        json: true,
        headers: {
          authorization: localStorage.getItem("token")
        }
      };
      this.request(opcoes, function (err, res, data) {
        if (err || res.status === 412) {
          _this2.emit("error", err);
        } else {
          _this2.body.innerHTML = _usuario2.default.render(data);
          _this2.addEventListener();
        }
      });
    }
  }, {
    key: "usuarioCancelarClick",
    value: function usuarioCancelarClick() {
      var _this3 = this;

      var button = this.body.querySelector("[data-remove-conta]");

      button.addEventListener("click", function (e) {
        e.preventDefault();
        if (confirm("Tem certeza que deseja excluír sua conta?")) {
          var opcoes = {
            method: "DELETE",
            url: _this3.URL + "/usuario",
            headers: {
              authorization: localStorage.getItem("token")
            }
          };
          _this3.request(opcoes, function (err, res, data) {
            if (err || res.status === 412) {
              _this3.emit("remove-error", err);
            } else {
              _this3.emit("remove-conta");
            }
          });
        }
      });
    }
  }]);

  return Usuario;
}(_ntask2.default);

module.exports = Usuario;

},{"../ntask.js":10,"../templates/usuario.js":16}],10:[function(require,module,exports){
"use strict";

var _tinyEmitter = require("tiny-emitter");

var _tinyEmitter2 = _interopRequireDefault(_tinyEmitter);

var _browserRequest = require("browser-request");

var _browserRequest2 = _interopRequireDefault(_browserRequest);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NTask = function (_TinyEmitter) {
  _inherits(NTask, _TinyEmitter);

  function NTask() {
    _classCallCheck(this, NTask);

    var _this = _possibleConstructorReturn(this, (NTask.__proto__ || Object.getPrototypeOf(NTask)).call(this));

    _this.request = _browserRequest2.default;
    _this.URL = "http://ntask-api-alanpinhel.c9users.io";
    return _this;
  }

  return NTask;
}(_tinyEmitter2.default);

module.exports = NTask;

},{"browser-request":1,"tiny-emitter":2}],11:[function(require,module,exports){
"use strict";

exports.render = function () {
  return "<form>\n    <div class=\"list\">\n      <label class=\"item item-input item-stacked-label\">\n        <span class=\"input-label\">Nome</span>\n        <input type=\"text\" data-nome>\n      </label>\n      <label class=\"item item-input item-stacked-label\">\n        <span class=\"input-label\">E-mail</span>\n        <input type=\"text\" data-email>\n      </label>\n      <label class=\"item item-input item-stacked-label\">\n        <span class=\"input-label\">Senha</span>\n        <input type=\"password\" data-senha>\n      </label>\n    </div>\n    <div class=\"padding\">\n      <button class=\"button button-positive button-block\">\n        <i class=\"ion-thumbsup\"></i> Cadastrar\n      </button>\n    </div>\n  </form>";
};

},{}],12:[function(require,module,exports){
"use strict";

exports.render = function () {
  return "<form>\n    <div class=\"list\">\n      <label class=\"item item-input item-stacked-label\">\n        <span class=\"input-label\">E-mail</span>\n        <input type=\"text\" data-email>\n      </label>\n      <label class=\"item item-input item-stacked-label\">\n        <span class=\"input-label\">Senha</span>\n        <input type=\"password\" data-senha>\n      </label>\n    </div>\n    <div class=\"padding\">\n      <button class=\"button button-positive button-block\">\n        <i class=\"ion-home\"></i> Entrar\n      </button>\n    </div>\n  </form>\n  <div class=\"padding\">\n    <button class=\"button button-block\" data-cadastrar>\n      <i class=\"ion-person-add\"></i> Cadastrar\n    </button>\n  </div>";
};

},{}],13:[function(require,module,exports){
"use strict";

exports.render = function (path) {
  var eTarefas = path === "tarefas" ? "active" : "";
  var eTarefaForm = path === "tarefaForm" ? "active" : "";
  var eUsuario = path === "usuario" ? "active" : "";

  return "<div class=\"tabs-stripped tabs-color-calm\">\n    <div class=\"tabs\">\n      <a data-path=\"tarefas\" class=\"tab-item " + eTarefas + "\">\n        <i class=\"icon ion-home\"></i>\n      </a>\n      <a data-path=\"tarefaForm\" class=\"tab-item " + eTarefaForm + "\">\n        <i class=\"icon ion-compose\"></i>\n      </a>\n      <a data-path=\"usuario\" class=\"tab-item " + eUsuario + "\">\n        <i class=\"icon ion-person\"></i>\n      </a>\n      <a data-sair class=\"tab-item\">\n        <i class=\"icon ion-android-exit\"></i>\n      </a>\n    </div>\n  </div>";
};

},{}],14:[function(require,module,exports){
"use strict";

exports.render = function () {
  return "<form>\n    <div class=\"list\">\n      <label class=\"item item-input item-stacked-label\">\n        <span class=\"input-label\">Tarefa</span>\n        <input type=\"text\" data-tarefa>\n      </label>\n    </div>\n    <div class=\"padding\">\n      <button class=\"button button-positive button-block\">\n        <i class=\"ion-compose\"></i> Salvar\n      </button>\n    </div>\n  </form>";
};

},{}],15:[function(require,module,exports){
"use strict";

var renderTarefas = function renderTarefas(tarefas) {
  return tarefas.map(function (tarefa) {
    var feito = tarefa.feito ? "ios-checkmark" : "ios-circle-outline";

    return "<li class=\"item item-icon-left item-button-right\">\n      <i class=\"icon ion-" + feito + "\" data-feito data-tarefa-feito=\"" + (tarefa.feito ? 'feito' : '') + "\" data-tarefa-_id=\"" + tarefa._id + "\"></i> " + tarefa.titulo + "\n      <button data-remove data-tarefa-_id=\"" + tarefa._id + "\" class=\"button button-assertive\">\n        <i class=\"ion-trash-a\"></i>\n      </button>\n    </li>";
  }).join("");
};

exports.render = function (tarefas) {
  if (tarefas && tarefas.length) {
    return "<ul class=\"list\">" + renderTarefas(tarefas) + "</ul>";
  }
  return "<h4 class=\"text-center\">Nenhuma tarefa ainda</h4>";
};

},{}],16:[function(require,module,exports){
"use strict";

exports.render = function (usuario) {
  return "<div>\n    <label class=\"item item-input item-stacked-label\">\n      <span class=\"input-label\">Nome</span>\n      <small class=\"dark\">" + usuario.nome + "</small>\n    </label>\n    <label class=\"item item-input item-stacked-label\">\n      <span class=\"input-label\">E-mail</span>\n      <small class=\"dark\">" + usuario.email + "</smal>\n    </label>\n  </div>\n  <div class=\"padding\">\n    <button data-remove-conta class=\"button button-assertive button-block\">\n      <i class=\"ion-trash-a\"></i> Excluir conta\n    </button>\n  </div>";
};

},{}],17:[function(require,module,exports){
"use strict";

var _app = require("./app.js");

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

window.onload = function () {
  var main = document.querySelector("main");
  var footer = document.querySelector("footer");

  new _app2.default(main, footer).init();
};

},{"./app.js":3}]},{},[17]);
