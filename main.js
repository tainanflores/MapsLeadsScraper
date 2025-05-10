const { app, BrowserWindow, ipcMain } = require('electron');
const { Notification } = require('electron')
const puppeteer = require('puppeteer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const runScraper = require('./scraper.js'); // Importa o script puppeteerScript.js
const { Console, log } = require('console');

const firebase = require('firebase');

require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Inicializar o Firebase com as credenciais
firebase.initializeApp(firebaseConfig);

// Cria ou abre o banco de dados
const dbPath = path.join('./db', 'my_database.db');
const db = new sqlite3.Database(dbPath);

// Cria a tabela se não existir
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS buscas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      busca TEXT NOT NULL,
      user TEXT,
      situacao TEXT DEFAULT 'PROCESSANDO',
      data_hora_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_hora_final DATETIME DEFAULT ''
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS resultados (
      id INTEGER PRIMARY KEY,
      buscas_id
      busca TEXT NOT NULL,
      nome TEXT,
      categoria TEXT,
      avaliacao TEXT,
      endereco TEXT,
      website TEXT,
      telefone TEXT            
    );
  `);
});

let mainWindow;

// Função para criar a janela de login
function createLoginWindow() {
  const loginWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
    },
  });

  loginWindow.loadFile('login.html');
  var userLogged = false;

  // Quando o login for bem-sucedido, abre a janela principal
  ipcMain.on('login-successful', () => {
    userLogged = true;
    loginWindow.close();
  });

  loginWindow.on('close', () => {
    if (!userLogged) {
      app.quit();
    }
  });

}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 720,
    minWidth: 1000,
    webPreferences: {
      nodeIntegration: false, // Desabilitar nodeIntegration
      contextIsolation: true, // Isolar o contexto de execução
      preload: path.join(__dirname, 'preload.js'), // Carregar o arquivo preload.js
    },
  });

  mainWindow.loadFile('index.html');
  // Open the DevTools (opcional)
  mainWindow.webContents.openDevTools();
}

function showNotification(title, body) {
  new Notification({ title: title, body: body }).show()
}

function reload(title) {
  const page = mainWindow.title;
  if (page === title) {
    mainWindow.webContents.reload()
  }
}

// Insere a busca iniciada na db, tabela buscas
function insertBusca(buscaCompleta) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO buscas (busca) VALUES (?)', [buscaCompleta], function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}
// Insere as informações na tabela 'resultados'
function insertResultado(buscaId, buscaCompleta, result) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO resultados (buscas_id, busca, nome, categoria, avaliacao, endereco, website, telefone, link_maps) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)',
      [buscaId, buscaCompleta, result.nome, result.categoria, result.avaliacao, result.endereco, result.website, result.telefone, result.link], function (err) {
        if (err) {
          reject(err);
          console.error('Erro ao salvar as informações:', err);
        } else {
          resolve();
          console.log('Informações salvas com sucesso!');
        }
      });
  });
}
// Atualiza as informações na tabela 'buscas'
function updateBusca(buscaId, buscaCompleta) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE buscas SET situacao = 'FINALIZADO' , data_hora_final = CURRENT_TIMESTAMP WHERE id = ? ;", [buscaId], function (err) {
      if (err) {
        reject(err);
        console.error('Erro ao atualizar a busca:', err);
      } else {
        resolve();
        console.log('Busca atualizada com sucesso!');
      }
    });
  });
}
// Deleta a busca na tabela 'buscas'
function deleteBusca(buscaId, buscaCompleta) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM buscas WHERE id = ? ;", [buscaId], function (err) {
      if (err) {
        reject(err);
        console.error('Erro ao excluir a busca:', err);
        return;
      } else {
        resolve();
        console.log('Busca excluída com sucesso!');
        reload('Facilita Leads');
        showNotification('BUSCA EXCLUÍDA', 'A busca "' + buscaCompleta + '" foi excluída com sucesso',);
      }
    });
    db.run("DELETE FROM resultados WHERE buscas_id = ? ;", [buscaId], function (err) {
      if (err) {
        reject(err);
        console.error('Erro ao excluir resultados da Busca:', err);
      } else {
        resolve();
        console.log('Resultados da Busca excluídos com sucesso!');
      }
    });

  });
}

async function resultados(buscaCompleta, buscaId) {

  // Executa o scraper para obter as informações
  const scrapedData = await runScraper(buscaCompleta);

  // Verifica se o scraping foi bem sucedido
  if (scrapedData) {

    for (const result of scrapedData) {
      const { nome, categoria, avaliacao, endereco, website, telefone, link } = result;

      // Insere as informações na tabela 'resultados'
      await insertResultado(buscaId, buscaCompleta, result);
    }

    // Atualiza as informações na tabela 'buscas'
    await updateBusca(buscaId);

    reload('Facilita Leads');
    showNotification('Busca "' + buscaCompleta + '" finalizada', 'Clique em minhas buscas para conferir os resultados');

  } else {
    console.log('Scraping não foi bem sucedido.');
    showNotification('Falha em processar a Busca "' + buscaCompleta + '"', 'Não foi possível retornar resultados, por favor clique em excluir e tente novamente');
  }
}

function getBuscas() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM buscas ORDER BY data_hora_inicio DESC', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// function getLeads() {
//   return new Promise((resolve, reject) => {
//     db.all('SELECT * FROM resultados ORDER BY id ASC', (err, rows) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(rows);
//       }
//     });
//   });
// }

let modalWindow;

app.whenReady().then(() => {
  // Criar a janela de login primeiro
  createLoginWindow();

  // Handle the "open-modal" event from the renderer process
  ipcMain.on('open-modal', (event, url) => {
    if (modalWindow) {
      // If the modal window is already open, just load the new URL
      modalWindow.webContents.loadURL(url);
    } else {
      // If the modal window is not open, create a new one
      modalWindow = new BrowserWindow({
        parent: mainWindow, // Set the parent window
        modal: true, // Make it a modal window
        show: false, // Initially hide the window
        width: 800,
        height: 600,
        webPreferences: {
          nodeIntegration: true
        }
      });

      // Load the modal.html file
      modalWindow.loadURL(url);

      // Handle when the modal window is ready to show
      modalWindow.once('ready-to-show', () => {
        modalWindow.show();
      });

      // Handle when the modal window is closed
      modalWindow.on('closed', () => {
        modalWindow = null;
      });
    }
  });

  // Envia as buscas para o contexto de renderização (script.js)
  getBuscas().then((buscas) => {
    mainWindow.webContents.send('buscas-salvas', buscas);
  });

  // Envia os leads para o contexto de renderização (script.js)
  // getLeads().then((leads) => {
  //   mainWindow.webContents.send('leads-salvos', leads);
  // });

  getBuscas().then((buscas) => {
    if (buscas && buscas.length > 0) {
      mainWindow.webContents.send('ultima-busca-salvas', buscas);
      console.log('A última busca é do id: ' + buscas[0].id);
      if (buscas[0].situacao === "FINALIZADO") {
        console.log('1');
      } else {
        console.log('2');
      }
    } else {
      console.log('A tabela está vazia. Nenhuma busca encontrada.');
    }
  });


  //buscaFinalizada();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createLoginWindow();
  });

})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


ipcMain.on('salvar-busca', async (event, busca) => {
  try {
    // Insere a busca na tabela 'buscas' usando uma Promessa
    const buscaId = await insertBusca(busca.buscaCompleta);
    console.log('Busca salva com sucesso! ID:', buscaId);

    // Chamada da função resultados com buscaId
    await resultados(busca.buscaCompleta, buscaId);

  } catch (err) {
    console.error('Erro ao salvar a busca:', err);
  }
});

// // Insere a busca realizada na db
// function insertBusca(buscaCompleta) {
//   return new Promise((resolve, reject) => {
//     db.run('INSERT INTO buscas (busca) VALUES (?)', [buscaCompleta], function (err) {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(this.lastID);
//       }
//     });
//   });
// }


ipcMain.on('deletar-busca', (event, data) => {
  // Deleta a busca selecionada pelo usuário
  // db.run("DELETE FROM buscas WHERE id = ? ;", [id.id], (err) => {
  //   if (err) {
  //     console.error('Erro ao excluir a busca:', err);
  //   } else {
  //     console.log('Busca excluída com sucesso!');
  //     reload('Gerar Listas');
  //     showNotification('Busca n°: ' + id.id, 'Busca excluída com sucesso');
  //   }
  // });

  deleteBusca(data.id, data.buscaCompleta);
});

// Verifica as credenciais de login fornecidas pelo usuário
ipcMain.handle('verificar-login', async (event, { username, password }) => {
  createMainWindow();
  return true; // Retorna true para indicar o login bem-sucedido
  try {
    // Autenticar usuário usando o Firebase Authentication
    const userCredential = await firebase.auth().signInWithEmailAndPassword(username, password);
    const user = userCredential.user;

    if (user) {
      // Se a autenticação for bem-sucedida, abre a janela principal
      createMainWindow();
      return true; // Retorna true para indicar o login bem-sucedido
    } else {
      // Se a autenticação falhar, mostra mensagem de erro
      return false; // Retorna false para indicar o login falhou
    }
  } catch (error) {
    console.error('Erro ao autenticar:', error);
    return false; // Retorna false para indicar o login falhou
  }
});

// Adicione essa função para permitir o acesso ao banco de dados a partir do script.js
ipcMain.handle('buscas-salvas', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM buscas ORDER BY data_hora_inicio DESC', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});
ipcMain.handle('ultima-busca-salvas', async () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM buscas ORDER BY id DESC LIMIT 1', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});

ipcMain.handle('leads-salvos', async (event, buscaId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM resultados WHERE buscas_id = ? ORDER BY id ASC', [buscaId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
});
