let _uid = 0;
let _listener = null;

export function _setListener(fn) {
  _listener = fn;
}

function dispatch(message, type) {
  if (typeof message !== "string" && typeof message !== "number") return;
  _listener?.({ id: ++_uid, message: String(message), type });
}

export const toast = (msg) => dispatch(msg, "default");
toast.success = (msg) => dispatch(msg, "success");
toast.error   = (msg) => dispatch(msg, "error");
toast.info    = (msg) => dispatch(msg, "info");
toast.warning = (msg) => dispatch(msg, "warning");
toast.warn    = (msg) => dispatch(msg, "warning");
