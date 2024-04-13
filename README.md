# Captive Portal Linux

Olá comunidade estou a um tempo tentando criar um portal cativo 
de uma forma que fique bem modulável e de simples configuração.


- Linux para hospedar o hotspot com nmcli
- Iptables para filtrar todo trafego 
- Node.js para o portal cativo 

Bem casso queira fazer o mínimo possível são as 3 ferramentas que você vai usar.

## Ideia Principal 

Sempre que você se conectar a uma rede o Android vai acessar um site para testar a conexão com a internet, esse site geralmente e HTTP.

Partir do Android 5 o teste e feito em <a href="connectivitycheck.gstatic.com">connectivitycheck.gstatic.com</a>
Pode varia de acordo com fabricante 

Androides mais novos como 11+ checam o portal pelo <b>dhcp-option = 114</b>

Bem, sendo assim casso não receba uma resposta de  <a href="connectivitycheck.gstatic.com">connectivitycheck.gstatic.com</a> ele define que a rede não tem acesso à internet até que se prove o contrário.

Para o portal cativo temos que redirecionar o usuário para nosso Captive Portal ou <i> Exemplo:192.168.1.1:80</i>  

Para isso usaremos o iptables

somente redirecionar ele para o portal cativo não fara que a notificação de "Login" apareça para o usuário 

E necessário que a pagina em NODE.JS também envie um "code" uma "Resposta" para o usuário 
uma resposta HTTP 307 que significa que ele foi Temporary Redirect ou redirecionado temporariamente 

Assim o sistema entende que existe um portal para login e ele só pode acessar a internet quando Logar

### Exemplo:
O sistema checa <a href="connectivitycheck.gstatic.com">connectivitycheck.gstatic.com</a> e é redirecionado para <i>192.168.1.1:80</i> dentro da rota '192.168.1.1:80/' 
Nessa rota e enviado <b>res.redirect(307, '/Login')</b> assim a requisição terá uma resposta de 307 e o usuário cairá na página de Login.

### Como fazer o redirecionamento? 
O redirecionamento e simples 

Pense em uma rede <i>Exemplo: 192.168.1.1</i> 

````
iptables -t nat -A PREROUTING -s 192.168.1.0/24 -p tcp --sport 80 -j DNAT --to 192.168.1.1:80
``````

Basicamente todo tráfego da rede *192.168.1.0/24* que usar TCP na porta 80 vai ser redirecionado para *192.168.1.1:80*

O iptables tem a prioridade bem definida, então as primeiras regras serão priorizadas.

````
iptables -t nat -A PREROUTING -s 192.168.1.0/24 -p tcp --sport 443 -j DNAT --to 192.168.1.1:443
``````

Embora a <a href="connectivitycheck.gstatic.com">connectivitycheck.gstatic.com</a> seja HTTP vale lembrar que isso pode mudar ou varia segundo a fabricante, ou sistema etc...

Bem isso bloqueara todo acesso à internet? 

Não 

Isso bloqueara pacotes TCP na porta 80 e 443 que são comumente HTTP e HTTPS.

Para bloquear todo trafego usei de uma ideia simples como 

````
iptables -t nat -A PREROUTING -j DNAT --to 192.168.1.1
````

Edicionando isso na última linha fara todo tráfego de qualquer porta seja redirecionado para *192.168.1.1* 

A assim toda o usuário não acessar a internet 

Casso queira ver todas as regra criadas basta usar o comando 

````
iptables -t nat -L
````

#### Onde os comandos devem estar na ordem que foram apresentados aqui !



## Servidor Node.JS

### Vantagens

- Frameworks diversas funções 
- Portais com layouts modernos
- Validação com Banco de dados já criado 
- Melhor gerenciamento de métricas tempo de acesso etc...

Bem uma aplicação express. Bem simples com um captive portal o grande trunfo e 
que sempre que um **POST** e feito o servidor executa um comando que insere nas regras do iptable que o ip do cliente agora está liberado 

Comando de Liberação para ip de exemplo *192.168.1.130*
````
iptables -t nat -I PREROUTING 1 -s 192.168.1.130 -j ACCEPT
````
Esse comando com parâmetro -I insere em PREROUTING na linha 1 ou primeira linha que todo trafego vindo de *192.168.1.130* será aceito liberando acesso ao usuario.

#### Comando tambem e executado pelo node.js na parte do servidor 
````
async function SendComand(clientIp) {

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
`````

## HostSpot 

Bem a ideia de ser simples fez que usei particularmente o nmcli para criar um Hotspot principalmente pela estabilidade 


````
nmcli con add type wifi ifname wlan0 con-name Hostspot autoconnect yes ssid nome-da-rede
````

````
nmcli con modify Hostspot 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared
````

````
nmcli con up Hostspot
````

**Isso criara uma rede simples sem qualquer senha para conexão**

Vale ressaltar que o IP da rede pode variar *Exemplo: 192.168.1.1* de para *Exemplo: 192.168.100.1* ou até mesmo *Exemplo: 10.0.1.1*

Por isso cheque com

`````
ifconfig
``````

O nmcli pode ser mudado conforme a necessidade 
contando que o trafego passe a ser filtrado pelo iptables você tem o *"Core"* do captive portal 

Usei o **Hostpad, mas tive diversas instabilidades com a conexão 

O **dnsmasq** pode ser uma alternativa para DHCP e DNS 
e de simples configuração te dará um controle de dhcp-option mais simples e um servidor dns que não é nada mal.
