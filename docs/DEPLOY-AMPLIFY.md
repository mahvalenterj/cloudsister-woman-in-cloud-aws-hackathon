# Publicar a demo web no AWS Amplify

A demo é um SPA (`web.output: "single"` em `app.json`). O build roda `npx expo export --platform web`
e publica a pasta `dist/` (ver `amplify.yml`). Sem backend: tudo roda no navegador.

## Passo a passo
1. No console do Amplify: **Create new app → Host web app** e conecte este repositório, branch `main`.
2. O Amplify detecta o `amplify.yml` da raiz. Confirme que o diretório de saída é `dist`.
3. Em **Hosting → Rewrites and redirects**, adicione a regra de SPA (sem ela, abrir ou recarregar
   `/home`, `/pilula/ca-01` etc. direto pela URL devolve 404):

   | Source address | Target address | Type |
   |---|---|---|
   | `/<*>` | `/index.html` | 404 (Rewrite) |

   Pela CLI: `aws amplify update-app --app-id <ID> --custom-rules source=/<*>,target=/index.html,status=404-200`
4. Rode o deploy. A URL pública sai como `https://main.<id>.amplifyapp.com`.

## Pontos de atenção
- **Node:** Expo SDK 58 e React Native 0.88 exigem Node `^22.13`. O `amplify.yml` faz `nvm install 22`; se a
  imagem de build não tiver o `nvm`, escolha uma imagem com Node 22 em **Build settings → Build image**.
- **Dados da demo:** usuárias, progresso e check-in ficam no `localStorage` de cada navegador.
- **Fora do escopo:** backend e RAG real (Bedrock) continuam para depois (fatia 8).

## Testar o build antes de publicar
```bash
npx expo export --platform web
npx serve dist -s   # -s = fallback para index.html, como a regra do Amplify
```
