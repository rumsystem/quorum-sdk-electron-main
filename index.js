const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { app, ipcMain } = require('electron');
const getPort = require('get-port');
const watch = require('node-watch');
const ElectronStore = require('electron-store');
const log = require('electron-log');

const store = new ElectronStore({
  name: 'quorum_port_store',
});

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;
let quorumBaseDir = '';

const state = {
  process: null,
  port: 0,
  storagePath: '',
  logs: '',
  cert: '',

  get up() {
    return !!this.process;
  },
};

const actions = {
  status() {
    return {
      up: state.up,
      bootstraps: state.bootstraps,
      storagePath: state.storagePath,
      port: state.port,
      cert: state.cert,
      logs: state.logs,
    };
  },

  logs() {
    return {
      logs: state.logs,
    };
  },

  async up(param = {}) {
    try {
      if (state.up) {
        return this.status();
      }
      const {
        bootstraps = [
          '/ip4/94.23.17.189/tcp/10666/p2p/16Uiu2HAmGTcDnhj3KVQUwVx8SGLyKBXQwfAxNayJdEwfsnUYKK4u',
          '/ip4/132.145.109.63/tcp/10666/p2p/16Uiu2HAmTovb8kAJiYK8saskzz7cRQhb45NRK5AsbtdmYsLfD3RM',
        ],
        storagePath = path.join(quorumBaseDir, 'data'),
        password = '123123'
      } = param;

      const peerPort = await getPort({ port: store.get('peerPort') ?? 0 });
      const peerWsPort = await getPort({ port: store.get('peerWsPort') ?? 0 });
      const apiPort = await getPort({ port: store.get('apiPort') ?? 0 });
      store.set('peerPort', peerPort);
      store.set('apiPort', apiPort);

      const args = [
        '-peername',
        'peer',
        '-listen',
        `/ip4/0.0.0.0/tcp/${peerPort},/ip4/0.0.0.0/tcp/${peerWsPort}/ws`,
        '-apilisten',
        `:${apiPort}`,
        '-peer',
        bootstraps.join(','),
        '-configdir',
        `${storagePath}/peerConfig`,
        '-datadir',
        `${storagePath}/peerData`,
        '-keystoredir',
        `${storagePath}/keystore`,
        '-debug',
        'true',
      ];

      // ensure config dir
      await fs.promises.mkdir(path.join(quorumBaseDir, 'config')).catch((e) => {
        if (e.code === 'EEXIST') {
          return;
        }
        console.error(e);
      });

      state.type = param.type;
      state.logs = '';
      state.userInputCert = '';
      state.bootstraps = bootstraps;
      state.storagePath = storagePath;
      state.port = apiPort;

      console.log('spawn quorum: ');
      console.log(state);
      console.log(args);

      const quorumFileName = {
        linux: 'quorum_linux',
        darwin: 'quorum_darwin',
        win32: 'quorum_win.exe',
      };
      const cmd = path.join(
        quorumBaseDir,
        quorumFileName[process.platform],
      );

      const peerProcess = childProcess.spawn(cmd, args, {
        cwd: quorumBaseDir,
        env: { ...process.env, RUM_KSPASSWD: password },
      });

      peerProcess.on('error', (err) => {
        console.log(err);
        this.down();
        console.error(err);
      });

      state.process = peerProcess;

      const handleData = (data) => {
        state.logs += data;
        if (state.logs.length > 1.5 * 1024 ** 2) {
          state.logs = state.logs.slice(1.5 * 1024 ** 2 - state.logs.length);
        }
      };

      peerProcess.stdout.on('data', handleData);
      peerProcess.stderr.on('data', handleData);
      peerProcess.on('exit', () => {
        state.process = null;
      });

      return this.status();
    } catch (err) {
      log.error(err);
    }
  },

  down() {
    if (!state.up) {
      return this.status();
    }
    console.log('quorum down');
    state.process?.kill();
    state.process = null;
    return this.status();
  },
};

const init = async (options = {}) => {
  try {

    quorumBaseDir = path.join(
      options.nodeModulesParentPath || (isProduction ? process.resourcesPath : app.getAppPath()),
      options.quorumBinPath || (isProduction ? 'quorum_bin' : 'node_modules/quorum-sdk-electron-main/quorum_bin'),
    );

    const certDir = path.join(quorumBaseDir, 'certs');
    const certPath = path.join(quorumBaseDir, 'certs/server.crt');


    await fs.promises.mkdir(quorumBaseDir).catch((e) => {
      if (e.code === 'EEXIST') {
        return;
      }
      console.error(e);
    });


    await fs.promises.mkdir(certDir).catch((e) => {
      if (e.code === 'EEXIST') {
        return;
      }
      console.error(e);
    });



    const loadCert = async () => {
      try {
        const buf = await fs.promises.readFile(certPath);
        state.cert = buf.toString();
        console.log('load cert');
      } catch (e) {
        state.cert = '';
      }
    };

    watch(
      certDir,
      { recursive: true },
      loadCert,
    );
    loadCert();


    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      const serverCert = certificate.data.trim();
      const distCert = state.cert.trim();
      const certValid = distCert === serverCert;
      if (certValid) {
        event.preventDefault();
        callback(true);
        return;
      }
      callback(false);
    });

    ipcMain.on('quorum', async (event, arg) => {
      try {
        const result = await actions[arg.action](arg.param);
        event.sender.send('quorum', {
          id: arg.id,
          data: result,
          error: null,
        });
      } catch (err) {
        console.error(err);
        event.sender.send('quorum', {
          id: arg.id,
          data: null,
          error: err.message,
        });
      }
    });

  } catch (err) {
    log.error(err);
  }
};


module.exports = {
  state,
  init,
};
