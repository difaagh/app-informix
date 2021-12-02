const ifx = require("ifxnjs");

function ifxnjs() {
  ifxnjs.prototype.open = ifx.open;
  ifxnjs.prototype.close = ifx.close;
  ifxnjs.prototype.query = ifx.query;
  ifxnjs.prototype.prepareSync = ifx.prepareSync;
  ifxnjs.prototype.execute = ifx.execute;
}
module.exports = ifxnjs;
