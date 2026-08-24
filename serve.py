#!/usr/bin/env python3
"""Local dev server. Not part of the site — GitHub Pages never runs this.

Plain `python3 -m http.server` sends Last-Modified, so the browser 304s your
edits and you refresh into a stale page. This sends no-store instead.

    ./serve.py [port]        # default 8731
"""
import sys
from functools import partial
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Quieter: only surface failures, not every 200 for every asset.
        if args and str(args[1]).startswith(("4", "5")):
            sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8731
    handler = partial(NoCacheHandler, directory=".")
    # localhost only — not exposed to anything else on your network.
    server = HTTPServer(("127.0.0.1", port), handler)
    print("Serving %s at http://localhost:%d  (ctrl-c to stop)" % (server.server_name, port))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nstopped")
