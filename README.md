
# SkidrowTampermonkey

## Descrição

Este script para Tampermonkey adiciona botões diretamente na página principal do site, permitindo acessar rapidamente os links de torrent associados a cada jogo listado.

Ao carregar a página, o script identifica automaticamente as publicações de jogos e adiciona botões de ação ao lado de cada título. Quando acionado, o script visita a página correspondente ao jogo, localiza o link de torrent ou magnet e executa a ação desejada sem que o usuário precise navegar manualmente pela postagem.

## Funcionalidades

* Adiciona botões de ação ao lado dos jogos listados.
* Busca automaticamente links magnet e arquivos `.torrent`.
* Utiliza cache local para evitar consultas repetidas à mesma página.
* Exibe mensagens de status durante a busca e execução das ações.
* Permite abrir o link encontrado diretamente.
* Permite copiar o link encontrado para a área de transferência.
* Possui integração opcional com servidores Transmission através da API RPC.
* Funciona nas páginas principais e páginas de navegação do site.

## Como funciona

1. O script analisa os elementos da página em busca de publicações de jogos.
2. Para cada jogo encontrado, adiciona botões de ação próximos ao título.
3. Ao clicar em um botão, o script carrega a página do jogo em segundo plano.
4. O link magnet ou torrent é extraído automaticamente.
5. O usuário pode:
   * Abrir o link diretamente.
   * Copiar o link para utilização posterior.
   * Enviar o torrent para um servidor Transmission configurado.

## Requisitos

* Navegador compatível com extensões de userscript.
* Tampermonkey instalado.
* Permissões de acesso configuradas no cabeçalho do script.
* (Opcional) Servidor Transmission com RPC habilitado para envio remoto de downloads.

## Instalação

1. Instale a extensão Tampermonkey.
2. Instale o script através do link de distribuição ou importando o arquivo `.user.js`.
3. Atualize a página do site.
4. Os botões serão exibidos automaticamente ao lado dos jogos disponíveis.

## Observações

O script realiza as consultas de forma assíncrona para minimizar a navegação manual do usuário e melhorar a experiência de utilização. Os resultados obtidos podem ser armazenados temporariamente em memória durante a sessão para reduzir requisições repetidas.
