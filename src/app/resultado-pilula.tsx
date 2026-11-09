import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { AppText, Button, Mascot, Screen, SisterBalao } from '@/components';
import { convidadaPrecisaCriarConta } from '@/lib/convidada';
import { useSister } from '@/lib/useSister';
import { useAuthStore } from '@/store/useAuthStore';
import { colors, radius, spacing } from '@/theme';

function formatarTempo(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// 8. Resultado da pílula: XP ganho, acertos e tempo, com comemoração.
export default function ResultadoPilula() {
  const router = useRouter();
  const p = useLocalSearchParams<{
    pilulaId: string;
    xp: string;
    acertos: string;
    total: string;
    segundos: string;
    perfeita: string;
  }>();
  const { balao } = useSister(String(p.pilulaId ?? ''));
  const pedirConta = useAuthStore((s) => s.isGuest && convidadaPrecisaCriarConta(s.progressoConvidada));

  const xp = Number(p.xp ?? 0);
  const perfeita = p.perfeita === '1';

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <Screen semHeader>
      <View style={styles.topo}>
        <Animated.View entering={ZoomIn.springify()}>
          <AppText style={styles.festa} accessibilityElementsHidden importantForAccessibility="no">
            🎉
          </AppText>
        </Animated.View>
        <Mascot mood="animado" size={110} />
        <AppText variant="titulo" align="center" accessibilityRole="header">
          Pílula concluída! +{xp} XP
        </AppText>
        {perfeita && (
          <AppText variant="corpoBold" color="successText">⭐ Pílula perfeita: nenhum erro!</AppText>
        )}
      </View>

      <View style={styles.stats}>
        <Stat rotulo="XP ganho" valor={`+${xp}`} />
        <Stat rotulo="De primeira" valor={`${p.acertos}/${p.total}`} />
        <Stat rotulo="Tempo" valor={formatarTempo(Number(p.segundos ?? 0))} />
      </View>

      <SisterBalao {...balao('fechamento')} mascote={false} />

      {pedirConta && (
        <View style={styles.conta}>
          <AppText variant="subtitulo">Crie sua conta para salvar seu progresso</AppText>
          <AppText color="textMuted">Você já fez o questionário e a 1ª pílula. Com a conta, o XP fica guardado.</AppText>
          <Button title="Criar conta" onPress={() => router.push('/cadastro')} />
        </View>
      )}

      <Button title="Voltar para a trilha" variant={pedirConta ? 'secondary' : 'primary'} onPress={voltar} />
    </Screen>
  );
}

function Stat({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={styles.stat} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <AppText variant="subtitulo" color="primaryDark">{valor}</AppText>
      <AppText variant="legenda" color="textMuted">{rotulo}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  topo: { alignItems: 'center', gap: spacing.md, marginTop: spacing.xl },
  festa: { fontSize: 56, lineHeight: 68 },
  stats: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  conta: { gap: spacing.sm, padding: spacing.xl, backgroundColor: colors.pinkLight, borderRadius: radius.lg },
});
