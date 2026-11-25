# 🌻 F + I

Site de presente com contador, galeria, versículos e mapa. Funciona 100% no GitHub Pages (sem servidor).

## Publicar no GitHub

1. Crie um repositório **público** no GitHub (ex.: `fi`).
2. Envie todos os arquivos desta pasta para ele (arraste no navegador em *Add file → Upload files*, ou use `git push`).
3. Vá em **Settings → Pages**, em *Branch* escolha `main` e a pasta `/ (root)`, e salve.
4. Em ~1 minuto o site fica em `https://SEU-USUARIO.github.io/fi/`.

## Painel fab

Endereço: `https://SEU-USUARIO.github.io/fi/fab/`

Para o painel conseguir salvar, ele precisa de um token do GitHub:

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Em *Repository access* escolha **Only select repositories** e marque só o repositório do site.
3. Em *Permissions → Repository permissions* coloque **Contents: Read and write**.
4. Copie o token, abra o `/fab/`, cole o token e clique em Entrar.

O token fica guardado apenas no navegador onde você entrou. Quem abrir o `/fab/` sem o token não consegue alterar nada.

## O que dá para editar no fab

- Título, frase, texto e data/hora de início do contador (já vem com 12/07/2026 às 17:00)
- Fotos: envio de várias de uma vez, legenda, ordem e remoção. A proporção original é mantida; só o tamanho do arquivo é reduzido (lado maior de 1800 px) para o site carregar rápido
- Versículos: adicionar, editar, reordenar e remover
- Mapa: digite o nome do lugar, endereço ou coordenadas (ex.: `-4.8590,-43.3560`) e ajuste o zoom
- Rodapé

Depois de **Salvar alterações**, o GitHub Pages leva cerca de 1 minuto para publicar.

## Observações

- O mapa usa o embed gratuito do Google Maps (sem chave de API).
- Como o repositório precisa ser público para o Pages gratuito, as fotos ficam acessíveis a quem tiver o link do repositório.
- Os dois versículos que vêm de exemplo podem ser trocados no fab.
