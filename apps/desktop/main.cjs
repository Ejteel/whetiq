const path = require('node:path');
const { app, BrowserWindow, ipcMain } = require('electron');

let runtime;

async function createRuntime() {
  const api = await import(path.resolve(__dirname, '../../packages/api/dist/index.js'));
  const storage = await import(path.resolve(__dirname, '../../packages/storage/dist/index.js'));

  const dbPath = path.join(app.getPath('userData'), 'mvp.sqlite');
  const repository = new storage.SQLiteRepository(dbPath);
  const keychain = new api.OSKeychainClient();
  const providerAccountService = new api.ProviderAccountService(repository, keychain);

  // Bootstrap from env vars for local dev convenience.
  if (process.env.OPENAI_API_KEY) {
    await providerAccountService.connectProvider('openai', process.env.OPENAI_API_KEY);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    await providerAccountService.connectProvider('anthropic', process.env.ANTHROPIC_API_KEY);
  }
  if (process.env.GEMINI_API_KEY) {
    await providerAccountService.connectProvider('gemini', process.env.GEMINI_API_KEY);
  }

  const chatService = new api.ChatService(repository, async (provider) => {
    const accounts = await repository.listProviderAccounts();
    const account = accounts.find((item) => item.provider === provider);
    if (!account) {
      return undefined;
    }
    return providerAccountService.resolveApiKey(account);
  });

  return { chatService };
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const url = process.env.ELECTRON_START_URL || 'http://localhost:3001';
  win.loadURL(url);
}

app.whenReady().then(async () => {
  runtime = await createRuntime();

  ipcMain.handle('chat:send', async (_event, input) => {
    const stream = runtime.chatService.sendMessage(input);
    const chunks = [];
    let final = null;

    for await (const part of stream) {
      if (typeof part === 'string') {
        chunks.push(part);
      } else {
        final = part;
      }
    }

    return {
      text: chunks.join(''),
      final
    };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
