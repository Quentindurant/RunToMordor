import { useCallback, useMemo } from 'react';
import * as Speech from 'expo-speech';

const SPEECH_OPTIONS: Speech.SpeechOptions = {
  language: 'fr-FR',
  rate: 0.92,
  pitch: 1.0,
};

export const useAudioAnnouncer = () => {
  const speak = useCallback((text: string, interrupt = false) => {
    if (interrupt) Speech.stop();
    Speech.speak(text, SPEECH_OPTIONS);
  }, []);

  const announceOrcAmbush = useCallback((targetKmh: number) => {
    Speech.stop();
    Speech.speak(
      `Embuscade d'Orques ! Accélérez à ${targetKmh} kilomètres heure pendant 2 minutes ou vous perdrez de la vie !`,
      SPEECH_OPTIONS
    );
  }, []);

  const announceNazgulScan = useCallback((maxKmh: number) => {
    Speech.stop();
    Speech.speak(
      `Scan de Nazgûl ! Ralentissez en dessous de ${maxKmh} kilomètres heure pendant 2 minutes !`,
      SPEECH_OPTIONS
    );
  }, []);

  const announceRecovery = useCallback((eventType: 'orc_ambush' | 'nazgul_scan') => {
    Speech.stop();
    const text = eventType === 'orc_ambush'
      ? 'Bien ! Phase de récupération. Ralentissez et récupérez de la vie.'
      : 'Il est parti ! Reprenez votre allure. Vous récupérez de la vie.';
    Speech.speak(text, SPEECH_OPTIONS);
  }, []);

  const announceSpeedWarning = useCallback((eventType: 'orc_ambush' | 'nazgul_scan') => {
    const text = eventType === 'orc_ambush'
      ? 'Vous perdez de la vie ! Accélérez !'
      : 'Vous perdez de la vie ! Ralentissez !';
    Speech.speak(text, SPEECH_OPTIONS);
  }, []);

  const announceEventComplete = useCallback(() => {
    Speech.stop();
    Speech.speak('Épreuve terminée. Bien joué, aventurier.', SPEECH_OPTIONS);
  }, []);

  const announcePaceUpdate = useCallback((distanceKm: number, paceStr: string) => {
    Speech.speak(`${distanceKm.toFixed(1)} kilomètres. Allure : ${paceStr} par kilomètre.`, SPEECH_OPTIONS);
  }, []);

  const announceRunStart = useCallback(() => {
    Speech.stop();
    Speech.speak('Run démarré. Bonne chance dans la Terre du Milieu !', SPEECH_OPTIONS);
  }, []);

  const announceRunStop = useCallback((distanceKm: number) => {
    Speech.stop();
    Speech.speak(`Run terminé. Vous avez parcouru ${distanceKm.toFixed(1)} kilomètres.`, SPEECH_OPTIONS);
  }, []);

  const stop = useCallback(() => Speech.stop(), []);

  return useMemo(() => ({
    speak,
    announceOrcAmbush,
    announceNazgulScan,
    announceRecovery,
    announceSpeedWarning,
    announceEventComplete,
    announcePaceUpdate,
    announceRunStart,
    announceRunStop,
    stop,
  }), [
    speak,
    announceOrcAmbush,
    announceNazgulScan,
    announceRecovery,
    announceSpeedWarning,
    announceEventComplete,
    announcePaceUpdate,
    announceRunStart,
    announceRunStop,
    stop,
  ]);
};

export type AudioAnnouncer = ReturnType<typeof useAudioAnnouncer>;
