import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Flashcard,
  Mascot,
  OptionCard,
  ProgressBar,
  Screen,
  SisterBalao,
  type MascotMood,
} from '@/components';
import { XP, xpDaPilula } from '@/lib/gamification';
import {
  avancar,
  ehRepeticao,
  iniciarSessao,
  questaoAtual,
  responder,
  resumir,
  terminou,
  type Sessao,
} from '@/lib/sessao';
import { PREOCUPACOES } from '@/lib/sisterApp';
import { obterPilula, ROTULO_NIVEL } from '@/lib/trilhas';
import { useSister } from '@/lib/useSister';
import { useAuthStore } from '@/store/useAuthStore';
import { useJornadaStore } from '@/store/useJornadaStore';
import { useProgressoStore } from '@/store/useProgressoStore';
import { colors, radius, spacing } from '@/theme';
import type { QuestaoPilula } from '@/types/conteudo';

type Etapa = 'checkin' | 'conceito' | 'flashcards' | 'questoes';
// Resposta dada na questão atual (null = ainda não respondeu).
type Resposta = { escolhida: number; acertou: boolean; repeticao: boolean } | null;

// 7. Player da pílula: conceito → flashcards → questões (com repetição das erradas).
export default function PlayerPilula() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const achada = obterPilula(String(id));

  const concluirPilula = useProgressoStore((s) => s.concluirPilula);
  const marcarPilulaConvidada = useAuthStore((s) => s.marcarPilulaConvidada);
  const [inicio] = useState(() => Date.now());

  const definirPreocupacao = useJornadaStore((s) => s.definirPreocupacao);
  const { faixa, preocupacaoId, balao } = useSister(String(id));

  const [etapa, setEtapa] = useState<Etapa>('checkin');
  const [iCard, setICard] = useState(0);
  const [virado, setVirado] = useState(false);
  const [sessao, setSessao] = useState<Sessao>(() =>
    iniciarSessao(achada?.pilula.questoes.map((q) => q.id) ?? []),
  );
  const [resposta, setResposta] = useState<Resposta>(null);
  const [reverConteudo, setReverConteudo] = useState(false);

  const questoesPorId = useMemo(
    () => new Map((achada?.pilula.questoes ?? []).map((q) => [q.id, q] as const)),
    [achada],
  );

  if (!achada) return <Redirect href="/home" />;
  const { trilha, pilula } = achada;

  // Progresso geral: 1 conceito + flashcards + questões (a fila cresce com as repetições).
  const totalPassos = 1 + pilula.flashcards.length + sessao.fila.length;
  const passosFeitos =
    etapa === 'checkin' || etapa === 'conceito' ? 0 : etapa === 'flashcards' ? 1 + iCard : 1 + pilula.flashcards.length + sessao.pos;

  // ---------- Flashcards ----------
  const proximoCard = () => {
    setVirado(false);
    if (iCard < pilula.flashcards.length - 1) setICard(iCard + 1);
    else setEtapa('questoes');
  };

  // ---------- Questões ----------
  const qId = questaoAtual(sessao);
  const questao = qId ? questoesPorId.get(qId) : undefined;

  const escolher = (i: number) => {
    if (!questao || resposta) return;
    const acertou = i === questao.correta;
    setResposta({ escolhida: i, acertou, repeticao: ehRepeticao(sessao) });
    setSessao(responder(sessao, acertou));
  };

  const continuar = () => {
    const proxima = avancar(sessao);
    setResposta(null);
    setReverConteudo(false);
    if (!terminou(proxima)) {
      setSessao(proxima);
      return;
    }
    finalizar(proxima);
  };

  const finalizar = (final: Sessao) => {
    const r = resumir(final);
    const xp = xpDaPilula(r);
    concluirPilula(trilha.id, pilula.id, xp);
    marcarPilulaConvidada();
    router.replace({
      pathname: '/resultado-pilula',
      params: {
        pilulaId: pilula.id,
        xp: String(xp),
        acertos: String(r.acertosPrimeira),
        total: String(r.total),
        segundos: String(Math.round((Date.now() - inicio) / 1000)),
        perfeita: r.perfeita ? '1' : '0',
      },
    });
  };

  const humor: MascotMood = !resposta ? 'pensativo' : resposta.acertou ? 'animado' : 'triste';

  return (
    <Screen>
      <ProgressBar valor={passosFeitos / totalPassos} rotulo={`Progresso da pílula: ${passosFeitos} de ${totalPassos}`} />

      {etapa === 'checkin' && (
        <>
          <SisterBalao mensagem="Antes de começar: o que pesa hoje? Escolha o que mais combina com você agora." />
          <View style={styles.opcoes} accessibilityRole="radiogroup">
            {PREOCUPACOES.filter((p) => p.faixa === faixa).map((p) => (
              <OptionCard
                key={p.id}
                titulo={p.rotulo}
                selecionado={preocupacaoId === p.id}
                onPress={() => {
                  definirPreocupacao(p.id);
                  setEtapa('conceito');
                }}
              />
            ))}
          </View>
          <Button
            title="Prefiro pular"
            variant="secondary"
            onPress={() => {
              definirPreocupacao(null);
              setEtapa('conceito');
            }}
          />
        </>
      )}

      {etapa === 'conceito' && (
        <>
          <SisterBalao {...balao('abertura')} />
          <View style={styles.chips}>
            <Chip texto={ROTULO_NIVEL[pilula.nivel]} />
            <Chip texto={`⏱️ ${pilula.duracaoMin} min`} />
          </View>
          <AppText variant="titulo" accessibilityRole="header">{pilula.titulo}</AppText>
          <View style={styles.card}>
            <AppText variant="subtitulo">💡 Conceito</AppText>
            <AppText>{pilula.conceito.texto}</AppText>
          </View>
          <View style={[styles.card, styles.cardRosa]}>
            <AppText variant="corpoBold">No dia a dia</AppText>
            <AppText>{pilula.conceito.exemplo}</AppText>
          </View>
          <Button title="Entendi, vamos aos flashcards" onPress={() => setEtapa('flashcards')} />
        </>
      )}

      {etapa === 'flashcards' && (
        <>
          <AppText variant="rotulo" color="textMuted">
            Flashcard {iCard + 1} de {pilula.flashcards.length}
          </AppText>
          <Flashcard
            key={iCard}
            frente={pilula.flashcards[iCard].frente}
            verso={pilula.flashcards[iCard].verso}
            virado={virado}
            onVirar={() => setVirado((v) => !v)}
          />
          {virado ? (
            <View style={styles.linha}>
              <Button title="Não sabia" variant="secondary" onPress={proximoCard} style={styles.flex} />
              <Button title="Sabia" onPress={proximoCard} style={styles.flex} />
            </View>
          ) : (
            <AppText color="textMuted" align="center">Pense na resposta e toque no cartão para conferir.</AppText>
          )}
        </>
      )}

      {etapa === 'questoes' && questao && (
        <>
          <View style={styles.topoQuestao}>
            <Mascot mood={humor} size={72} />
            <View style={styles.flex}>
              <AppText variant="rotulo" color="textMuted">
                {resposta?.repeticao || (!resposta && ehRepeticao(sessao))
                  ? '🔁 Revisão: você errou esta antes'
                  : `Questão ${sessao.pos + 1} de ${pilula.questoes.length}`}
              </AppText>
              <AppText variant="legenda" color="textMuted">
                {questao.categoria === 'negocio' ? 'Visão de negócio' : 'Técnica'}
              </AppText>
            </View>
          </View>

          <View style={[styles.card, styles.cardRosa]}>
            <AppText>📍 {questao.cenario}</AppText>
          </View>
          <AppText variant="subtitulo" accessibilityRole="header">{questao.pergunta}</AppText>

          <View style={styles.opcoes} accessibilityRole="radiogroup">
            {questao.opcoes.map((texto, i) => (
              <Opcao
                key={`${questao.id}-${sessao.pos}-${i}`}
                texto={texto}
                estado={estadoOpcao(questao, resposta, i)}
                onPress={() => escolher(i)}
              />
            ))}
          </View>

          {resposta && (
            <Feedback
              questao={questao}
              resposta={resposta}
              rever={reverConteudo}
              onRever={() => setReverConteudo((v) => !v)}
              conceito={pilula.conceito.texto}
            />
          )}
          {resposta && !resposta.acertou && (
            <SisterBalao {...balao('erro')} mood="pensativo" mascote={false} />
          )}
          {resposta && (
            <Button
              title={terminou(avancar(sessao)) ? 'Ver resultado' : 'Continuar'}
              onPress={continuar}
            />
          )}
        </>
      )}
    </Screen>
  );
}

// ---------- Peças da tela ----------

type EstadoOpcao = 'livre' | 'certa' | 'errada' | 'travada';

function estadoOpcao(q: QuestaoPilula, r: Resposta, i: number): EstadoOpcao {
  if (!r) return 'livre';
  if (i === q.correta) return 'certa';
  if (i === r.escolhida) return 'errada';
  return 'travada';
}

function Opcao({ texto, estado, onPress }: { texto: string; estado: EstadoOpcao; onPress: () => void }) {
  // Além da cor, um símbolo indica certo/errado (não depender só de cor).
  const prefixo = estado === 'certa' ? '✓ ' : estado === 'errada' ? '✗ ' : '';
  const rotulo = estado === 'certa' ? `${texto}, resposta correta` : estado === 'errada' ? `${texto}, sua resposta, incorreta` : texto;
  return (
    <Pressable
      onPress={onPress}
      disabled={estado !== 'livre'}
      accessibilityRole="radio"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: estado !== 'livre', selected: estado === 'errada' || estado === 'certa' }}
      style={({ pressed }) => [
        styles.opcao,
        estado === 'certa' && styles.opcaoCerta,
        estado === 'errada' && styles.opcaoErrada,
        estado === 'travada' && styles.opcaoTravada,
        pressed && styles.opcaoPressionada,
      ]}
    >
      <AppText
        variant="corpoBold"
        color={estado === 'certa' ? 'successText' : estado === 'errada' ? 'errorText' : 'text'}
      >
        {prefixo}
        {texto}
      </AppText>
    </Pressable>
  );
}

interface FeedbackProps {
  questao: QuestaoPilula;
  resposta: NonNullable<Resposta>;
  rever: boolean;
  onRever: () => void;
  conceito: string;
}

function Feedback({ questao, resposta, rever, onRever, conceito }: FeedbackProps) {
  if (resposta.acertou) {
    const ganho = resposta.repeticao ? XP.ACERTO_REPETICAO : XP.ACERTO_PRIMEIRA;
    return (
      <View style={[styles.feedback, styles.feedbackOk]} accessibilityLiveRegion="polite">
        <AppText variant="corpoBold" color="successText">Isso aí! +{ganho} XP 💜</AppText>
        <AppText color="successText">{questao.explicacao}</AppText>
      </View>
    );
  }

  return (
    <View style={[styles.feedback, styles.feedbackErro]} accessibilityLiveRegion="polite">
      <AppText variant="corpoBold" color="errorText">
        Quase! A resposta certa é: {questao.opcoes[questao.correta]}
      </AppText>
      <AppText color="errorText">{questao.explicacao}</AppText>
      <AppText variant="legenda" color="errorText">Esta questão volta no fim da pílula.</AppText>
      <Button title={rever ? 'Fechar conteúdo' : 'Rever conteúdo'} variant="secondary" onPress={onRever} />
      {rever && (
        <View style={styles.trecho}>
          <AppText variant="rotulo" color="primaryDark">Trecho do conceito</AppText>
          <AppText variant="corpoBold">“{questao.referenciaConceito}”</AppText>
          <AppText variant="legenda" color="textMuted">{conceito}</AppText>
        </View>
      )}
    </View>
  );
}

function Chip({ texto }: { texto: string }) {
  return (
    <View style={styles.chip}>
      <AppText variant="rotulo" color="primaryDark">{texto}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  linha: { flexDirection: 'row', gap: spacing.md },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  cardRosa: { backgroundColor: colors.pinkLight, borderColor: colors.pinkLight },
  topoQuestao: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  opcoes: { gap: spacing.md },
  opcao: {
    minHeight: 56,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  opcaoPressionada: { borderBottomWidth: 2, marginTop: 3 },
  opcaoCerta: { backgroundColor: colors.successLight, borderColor: colors.success },
  opcaoErrada: { backgroundColor: colors.errorLight, borderColor: colors.error },
  opcaoTravada: { opacity: 0.6 },
  feedback: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.md },
  feedbackOk: { backgroundColor: colors.successLight },
  feedbackErro: { backgroundColor: colors.errorLight },
  trecho: { gap: spacing.xs, padding: spacing.md, backgroundColor: colors.bg, borderRadius: radius.sm },
});
