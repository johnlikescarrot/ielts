import React, { useEffect, useMemo, useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack, Section, VStack } from '@astryxdesign/core/Layout';
import { List, ListItem } from '@astryxdesign/core/List';
import { Heading, Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Captions, CheckCircle2, ListRestart, Plus, Sparkles } from 'lucide-react';
import {
  createVocabularyFromQuestion,
  createVideoPracticeSession,
  getPracticeProgress,
  validateTranscriptInput,
  verifyAnswer,
} from '../../video/transcriptPractice';
import { VideoPracticeSession } from '../../video/types';
import { storageService } from '../../storage/storageService';
import { useI18n } from '../../i18n/i18nContext';

const DEMO_TRANSCRIPT = `WEBVTT

00:00:01.000 --> 00:00:05.000
The analysis of coastal ecosystems provides significant evidence for climate policy.

00:00:05.200 --> 00:00:10.000
Researchers assess environmental data to identify practical solutions for communities.

00:00:10.200 --> 00:00:15.000
A sustainable approach can benefit learners and local authorities alike.`;

type FeedbackState = 'idle' | 'correct' | 'incorrect' | 'revealed';

function formatTimecode(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const remainder = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${remainder}`;
}

export const VideoPracticeView: React.FC = () => {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [session, setSession] = useState<VideoPracticeSession | null>(null);
  const [savedSessions, setSavedSessions] = useState<VideoPracticeSession[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<FeedbackState>('idle');
  const [error, setError] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [wordAdded, setWordAdded] = useState(false);

  const loadSavedSessions = async () => {
    setSavedSessions(await storageService.getVideoSessions());
  };

  useEffect(() => {
    void loadSavedSessions();
  }, []);

  const currentQuestion = session?.questions[activeQuestionIndex];
  const progress = useMemo(
    () =>
      session
        ? getPracticeProgress(session.questions, answers)
        : { answered: 0, correct: 0, total: 0, accuracyPercent: 0 },
    [answers, session],
  );

  const resetPractice = () => {
    setActiveQuestionIndex(0);
    setAnswers({});
    setAnswer('');
    setFeedback('idle');
    setError('');
    setIsComplete(false);
    setWordAdded(false);
  };

  const handleCreate = async () => {
    if (validateTranscriptInput(transcript)) {
      setError(t('video.invalidTranscript'));
      return;
    }

    try {
      const created = createVideoPracticeSession({ title, sourceUrl, transcript });
      await storageService.saveVideoSession(created);
      setSession(created);
      resetPractice();
      await loadSavedSessions();
    } catch {
      setError(t('video.insufficientVocabulary'));
    }
  };

  const handleLoadDemo = () => {
    setTitle('Coastal ecosystems: transcript demo');
    setSourceUrl('');
    setTranscript(DEMO_TRANSCRIPT);
    setError('');
  };

  const handleLoadSession = (savedSession: VideoPracticeSession) => {
    setSession(savedSession);
    setTitle(savedSession.title);
    setSourceUrl(savedSession.sourceUrl || '');
    setTranscript(savedSession.cues.map((cue) => cue.text).join(' '));
    resetPractice();
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion) {
      return;
    }

    setAnswers((previous) => ({ ...previous, [currentQuestion.id]: answer }));
    setFeedback(verifyAnswer(currentQuestion.answer, answer) ? 'correct' : 'incorrect');
    setError('');
  };

  const handleRevealAnswer = () => {
    if (!currentQuestion) {
      return;
    }
    setFeedback('revealed');
    setError('');
  };

  const handleContinue = async () => {
    if (!session) {
      return;
    }

    if (activeQuestionIndex < session.questions.length - 1) {
      setActiveQuestionIndex((index) => index + 1);
      setAnswer('');
      setFeedback('idle');
      setWordAdded(false);
      return;
    }

    const finalProgress = getPracticeProgress(session.questions, answers);
    await storageService.addTestAttempt({
      skill: 'video',
      testId: session.id,
      testTitle: session.title,
      rawScore: finalProgress.correct,
      totalQuestions: finalProgress.total,
      estimatedBand: 0,
      timeSpentSeconds: session.stats.estimatedMinutes * 60,
      answers,
    });
    setIsComplete(true);
  };

  const handleAddWord = async () => {
    if (!currentQuestion) {
      return;
    }
    const vocabulary = createVocabularyFromQuestion(currentQuestion);
    if (vocabulary) {
      await storageService.addCustomVocabulary(vocabulary);
      setWordAdded(true);
    }
  };

  const returnToCreator = () => {
    setSession(null);
    resetPractice();
  };

  return (
    <VStack as="section" gap={6} padding={6} width="100%" aria-labelledby="video-practice-title">
      <VStack gap={2}>
        <HStack gap={2} vAlign="center" wrap="wrap">
          <Captions aria-hidden="true" />
          <Heading id="video-practice-title" level={1}>
            {t('video.title')}
          </Heading>
        </HStack>
        <Text color="secondary" display="block">
          {t('video.subtitle')}
        </Text>
      </VStack>

      <Banner
        status="info"
        title={t('video.privacyTitle')}
        description={t('video.privacyDescription')}
        collapsible={false}
      />

      {!session && (
        <Section padding={0} variant="transparent">
          <VStack gap={4}>
            <Heading level={2}>{t('video.createHeading')}</Heading>
            <TextInput
              label={t('video.sourceTitle')}
              description={t('video.sourceTitleHelp')}
              value={title}
              onChange={setTitle}
              placeholder={t('video.titlePlaceholder')}
              width="100%"
            />
            <TextInput
              label={t('video.sourceUrl')}
              description={t('video.sourceUrlHelp')}
              value={sourceUrl}
              onChange={setSourceUrl}
              placeholder="https://www.youtube.com/watch?v=…"
              width="100%"
              isOptional
            />
            <TextArea
              label={t('video.transcript')}
              description={t('video.transcriptHelp')}
              value={transcript}
              onChange={setTranscript}
              placeholder={t('video.transcriptPlaceholder')}
              rows={12}
              maxLength={60_000}
              width="100%"
              isRequired
              status={error ? { type: 'error', message: error } : undefined}
            />
            <HStack gap={2} wrap="wrap">
              <Button
                label={t('video.create')}
                variant="primary"
                icon={<Sparkles aria-hidden="true" />}
                onClick={() => void handleCreate()}
              />
              <Button
                label={t('video.loadDemo')}
                variant="secondary"
                icon={<Plus aria-hidden="true" />}
                onClick={handleLoadDemo}
              />
            </HStack>
          </VStack>
        </Section>
      )}

      {!session && savedSessions.length > 0 && (
        <Section padding={0} variant="transparent">
          <List header={<Heading level={2}>{t('video.savedHeading')}</Heading>} density="balanced" hasDividers>
            {savedSessions.map((savedSession) => (
              <ListItem
                key={savedSession.id}
                label={savedSession.title}
                description={t('video.metrics', {
                  words: savedSession.stats.wordCount,
                  cues: savedSession.stats.cueCount,
                  minutes: savedSession.stats.estimatedMinutes,
                })}
                onClick={() => handleLoadSession(savedSession)}
              />
            ))}
          </List>
        </Section>
      )}

      {session && !isComplete && currentQuestion && (
        <VStack gap={4}>
          <HStack gap={2} wrap="wrap" vAlign="center">
            <Heading level={2}>{t('video.practiceHeading')}</Heading>
            <Text color="secondary" type="supporting">
              {t('video.questionOf', { question: activeQuestionIndex + 1, total: session.questions.length })}
            </Text>
          </HStack>
          <Text color="secondary" display="block">
            {t('video.metrics', {
              words: session.stats.wordCount,
              cues: session.stats.cueCount,
              minutes: session.stats.estimatedMinutes,
            })}
          </Text>
          {session.sourceUrl && (
            <Text color="secondary" type="supporting" display="block">
              {t('video.sourceReference')}: {session.sourceUrl}
            </Text>
          )}
          <Card elevation="low">
            <VStack gap={4}>
              {currentQuestion.timestampSeconds !== undefined && (
                <Text type="supporting" color="secondary">
                  {t('video.timecode', { time: formatTimecode(currentQuestion.timestampSeconds) })}
                </Text>
              )}
              <Text type="large" display="block">
                {currentQuestion.clozeText}
              </Text>
              <TextInput
                label={t('video.answerLabel')}
                value={answer}
                onChange={setAnswer}
                placeholder={t('video.answerPlaceholder')}
                width="100%"
                onEnter={handleCheckAnswer}
                isDisabled={feedback !== 'idle'}
              />
              <HStack gap={2} wrap="wrap">
                <Button
                  label={t('video.check')}
                  variant="primary"
                  icon={<CheckCircle2 aria-hidden="true" />}
                  onClick={handleCheckAnswer}
                  isDisabled={!answer.trim() || feedback !== 'idle'}
                />
                <Button
                  label={t('video.reveal')}
                  variant="ghost"
                  onClick={handleRevealAnswer}
                  isDisabled={feedback !== 'idle'}
                />
                {currentQuestion.academicWord && (
                  <Button
                    label={wordAdded ? t('video.wordAdded') : t('video.addWord')}
                    variant="secondary"
                    onClick={() => void handleAddWord()}
                    isDisabled={wordAdded}
                  />
                )}
              </HStack>
            </VStack>
          </Card>
          {feedback !== 'idle' && (
            <Banner
              status={feedback === 'correct' ? 'success' : 'warning'}
              title={feedback === 'correct' ? t('video.correctTitle') : t('video.incorrectTitle')}
              description={t('video.answerWas', { answer: currentQuestion.answer })}
              collapsible={false}
              endContent={
                <Button
                  label={activeQuestionIndex === session.questions.length - 1 ? t('video.finish') : t('video.next')}
                  variant="secondary"
                  onClick={() => void handleContinue()}
                />
              }
            />
          )}
          <Button
            label={t('video.restart')}
            variant="ghost"
            icon={<ListRestart aria-hidden="true" />}
            onClick={resetPractice}
          />
        </VStack>
      )}

      {session && isComplete && (
        <Card elevation="low">
          <VStack gap={4}>
            <Heading level={2}>{t('video.resultTitle')}</Heading>
            <Text type="large" display="block">
              {t('video.resultDescription', {
                correct: progress.correct,
                total: progress.total,
                accuracy: progress.accuracyPercent,
              })}
            </Text>
            <HStack gap={2} wrap="wrap">
              <Button
                label={t('video.restart')}
                variant="primary"
                icon={<ListRestart aria-hidden="true" />}
                onClick={resetPractice}
              />
              <Button label={t('video.createAnother')} variant="secondary" onClick={returnToCreator} />
            </HStack>
          </VStack>
        </Card>
      )}
    </VStack>
  );
};
