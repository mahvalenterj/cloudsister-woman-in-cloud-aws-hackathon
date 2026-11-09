import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Mascot, type MascotMood } from './Mascot';

interface SisterBalaoProps {
  // A mensagem da Sister já termina com a fonte AWS: "(Fonte: título)".
  mensagem: string;
  // Fontes da mensagem, abertas na AWS ao tocar.
  fontes?: { titulo: string; url: string }[];
  mood?: MascotMood;
  // false quando a tela já mostra o mascote (ex.: no topo das questões).
  mascote?: boolean;
}

// Fala da Sister: o mascote ao lado de um balão de texto, com link para a fonte AWS.
export function SisterBalao({ mensagem, fontes = [], mood = 'feliz', mascote = true }: SisterBalaoProps) {
  return (
    <View style={styles.linha}>
      {mascote && <Mascot mood={mood} size={64} />}
      <View style={styles.balao}>
        <AppText variant="rotulo" color="primaryDark">Sister</AppText>
        <AppText>{mensagem}</AppText>
        {fontes.map((f) => (
          <Pressable
            key={f.url}
            onPress={() => Linking.openURL(f.url).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel={`Abrir a fonte na AWS: ${f.titulo}`}
            hitSlop={8}
          >
            <AppText variant="legenda" color="primaryDark" style={styles.link}>
              Abrir a fonte na AWS ↗
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  balao: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    backgroundColor: colors.pinkLight,
    borderRadius: radius.lg,
  },
  link: { textDecorationLine: 'underline' },
});
