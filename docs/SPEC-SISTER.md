# Spec: Sister (RAG de acolhimento nas pílulas)

> Status: decisões do grill incorporadas (ver seção Decisões). Falta receber a pesquisa real em `docs/pesquisa/`.

## Objetivo
Dentro das pílulas, uma "irmã mais velha" (a Sister) fala no tom da usuária e conecta a dificuldade dela do momento ao conteúdo técnico de cloud, baseado em fontes da AWS.

## Público e tom
| Faixa | Foco da Sister |
|---|---|
| 18–34 | Primeiro emprego, confiança, "será que sou boa o bastante" |
| 35–50 | Recomeço, tempo e rotina, competências que ela já tem |

A faixa vem da idade do cadastro, com limite a definir (ver pergunta 1 abaixo).

## Fora do escopo do MVP
- LLM e embeddings em runtime
- Backend e Bedrock
- Dados de pesquisa reais (o mock é marcado como `hipotese-mock`)
- Chat livre: a Sister fala por mensagens curadas, sem digitação da usuária

## Arquitetura em duas camadas
| Camada | O que faz | Quando roda |
|---|---|---|
| Corpus (offline) | Trechos (chunks) consultados no AWS Knowledge MCP e salvos em JSON, com fonte e tags | Em build, ou manualmente |
| Sister (runtime) | Recebe faixa, dificuldade e pílula; recupera chunks e compõe a mensagem | No app |

No MVP a recuperação é um mock determinístico (filtro por tags e pontuação). O contrato é o mesmo de um RAG real, então o miolo pode ser trocado depois sem mexer nas telas.

## Dados (mocks)
```
src/data/pesquisa/preocupacoes.json   # dificuldades por faixa (origem: hipotese-mock)
src/data/pesquisa/tom-sister.json     # tom por faixa e por momento
src/data/rag/corpus-aws.json          # chunks vindos do MCP
```

## Contratos
- **Preocupação:** `{ id, faixa, rotulo, tags[] }`
- **Chunk do corpus:** `{ id, fonte, tags[], texto, pilulaIds[] }`
- **Função pura:** `sister({ faixa, preocupacaoId, pilulaId, momento }) → { mensagem, chunkIds[], fontes[] }`, com `momento` = abertura | erro | fechamento
- Tom guiado por `tom-sister.json`, com variações por faixa e momento.

## Regras de comportamento
- A Sister só afirma o que está nos chunks; cada mensagem técnica cita a fonte.
- Sem chunk relevante, usa um acolhimento genérico, sem inventar conteúdo.
- Não presume vida pessoal (filhos, estado civil). Não diagnostica emoções.
- Cada mock exibe a origem `hipotese-mock` onde for usado.

## Pontos de integração
- Check-in "o que pesa hoje?" antes da pílula (estado em `useJornadaStore`)
- Abertura: passo `conceito` em `src/app/pilula/[id].tsx`
- Erro: componente `Feedback` no mesmo arquivo
- Fechamento: `src/app/resultado-pilula.tsx`
- Lógica: `src/lib/sister.ts` e `src/types/sister.ts`

## Critérios de aceite
1. Uma usuária de 22 e uma de 38 anos, na mesma pílula, recebem mensagens diferentes.
2. Trocar a preocupação do check-in muda a mensagem.
3. Toda mensagem técnica lista a fonte AWS.
4. A função pura tem testes com `node --test`, e `typecheck` passa.
5. Nada de dado pessoal real no repositório.

## Fatias
| # | Fatia | Entrega visível |
|---|---|---|
| 1 | Faixas etárias: corte 18–34 / 35–50 no perfil, na validação e nos testes | Carla (35) cai na faixa 35–50 |
| 2 | Dados mock: preocupações, tom e corpus da pílula 1 de cada trilha (via MCP) | JSONs validados por teste de schema |
| 3 | Núcleo: `lib/sister.ts`, tipos e testes | Testes verdes, sem UI |
| 4 | Abertura da pílula: check-in e fala da Sister no passo conceito | Fluxo ponta a ponta na pílula 1 |
| 5 | Erro e fechamento: Sister no feedback de erro e no resultado | Pílula completa com a Sister |
| 6 | Cobertura: corpus das demais pílulas e fontes visíveis na tela | Todas as pílulas atendidas |
| 7 | Amplify (web): `amplify.yml`, build web e publicação | URL pública do protótipo |
| 8 | (Depois) RAG real: Bedrock Knowledge Base e função serverless | Sister gerando respostas reais |

As fatias 1 a 5 já mostram o valor. A 7 só depende de o app compilar para web e pode andar em paralelo.

## Decisões (grill)
| # | Pergunta | Decisão |
|---|---|---|
| 1 | Corte das faixas | 18–34 e 35–50, sem sobreposição. Carla (35) passa para a segunda faixa. |
| 2 | Origem da faixa | Idade define o tom; o perfil (início/transição) define o foco. |
| 3 | Fonte das preocupações | Pesquisa real, entregue como arquivo em `docs/pesquisa/`. Até lá, mock marcado `hipotese-mock`. |
| 4 | Fora de 18–50 | Usa a faixa mais próxima: menos de 18 usa 18–34; mais de 50 usa 35–50. |
| 5 | Canal | Só texto na tela (balões do mascote). |
| 6 | Barra da demo | Pílula 1 de cada trilha (fatias 1 a 5). |
| 7 | Amplify | Só hospedar a demo web; backend e RAG real ficam para depois. |

## Pendências
- Receber a pesquisa em `docs/pesquisa/` e estruturar em `preocupacoes.json`, citando a fonte de cada item.
- Antes da fatia 7, conferir nas docs do Expo SDK 58 a saída web com expo-router.
