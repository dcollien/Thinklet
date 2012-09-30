var ChildProcess, Micronucleus,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
  __slice = Array.prototype.slice;

ChildProcess = require('child_process');

Micronucleus = (function(_super) {

  __extends(Micronucleus, _super);

  function Micronucleus(upload_filename) {
    var _this = this;
    this.status = 'setup';
    this.process = ChildProcess.spawn('micronucleus', [upload_filename]);
    this.process.stdout.setEncoding('ascii');
    this.input_buffer = '';
    this.process.stdout.on('data', function(string) {
      var message, remainder, _ref, _results;
      _this.input_buffer += string;
      _results = [];
      while (_this.input_buffer.indexOf("\n") >= 0) {
        _ref = _this.input_buffer.split("\n", 2), message = _ref[0], remainder = 2 <= _ref.length ? __slice.call(_ref, 1) : [];
        _this.input_buffer = remainder.join("\n");
        _results.push(_this.parse_message(message));
      }
      return _results;
    });
  }

  Micronucleus.prototype.parse_message = function(message) {
    this.status = message.match(/Please plug the device/i) ? (this.progress = 0.0, 'waiting') : message.match(/Device is found/) ? (this.progress = 0.1, 'connecting') : message.match(/Erasing/) ? (this.progress = 0.33, 'erasing') : message.match(/Starting to upload/) ? (this.progress = 0.66, 'uploading') : message.match(/Starting the user app/) ? (this.progress = 0.9, 'executing') : message.match(/Micronucleus done\./) ? (this.progress = 1.0, 'finished') : void 0;
    this.emit('progress', this.progress, this.status, this);
    if (this.status != null) return this.emit(this.status);
  };

  Micronucleus.prototype.abort = function() {
    this.process.kill('SIGINT');
    this.status = 'finished';
    return this.progress = 1.0;
  };

  return Micronucleus;

})(require('events').EventEmitter);
