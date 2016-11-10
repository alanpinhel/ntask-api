import TinyEmitter from "tiny-emitter";
import Request from "browser-request";

class NTask extends TinyEmitter {
  constructor() {
    super();
    this.request = Request;
    this.URL = "http://ntask-api-alanpinhel.c9users.io";
  }
}
module.exports = NTask;