import handler from './api/index.js';

const req = {
  method: 'GET',
  query: { _path: 'v1/materias' },
  headers: {},
  ip: '127.0.0.1',
  socket: { remoteAddress: '127.0.0.1' }
};

const res = {
  status: function(code) { this.statusCode = code; return this; },
  json: function(data) { console.log('STATUS:', this.statusCode, 'DATA:', data); return this; },
  setHeader: function() {},
  end: function() {}
};

handler(req, res).catch(console.error);
