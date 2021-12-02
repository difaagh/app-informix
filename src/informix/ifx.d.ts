import { open, close, query, prepareSync, execute } from "./ifx_lib";

export = class ifxnjs {
  static _: () => typeof ifxnjs;
  open = open;
  close = close;
  query = query;
};
