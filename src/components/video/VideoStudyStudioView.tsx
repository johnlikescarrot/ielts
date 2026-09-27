import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { BookOpenCheck, ExternalLink, FileText, ListChecks, PlayCircle, Plus, Sparkles, Trash2, Video } from 'lucide-react';
import { storageService } from '../../storage/storageService';
import { useI18n } from '../../i18n/i18nContext';
import {
  buildVideoStudyPlan,
  buildVideoUrlAtTime,
  formatTimestamp,
  validateVideoStudyInput,
  VideoStudySession,
} from '../../video/transcriptStudio';

function createSessionId(): string {
  return `video_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const VideoStudyStudioView: React.FC = () => {
  const { t } = useI18n();
  const [sessions, setSessions] = useState<VideoStudySession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>();
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [message, setMessage] = useState<string>();
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  const selectedSession = sessions.find(session => session.id === selectedSessionId) || sessions[0];
  const studyPlan = useMemo(
    () => selectedSession ? buildVideoStudyPlan(selectedSession.transcript) : undefined,
    [selectedSession],
  );

  const loadSessions = async () => {
    const savedSessions = await storageService.getVideoSessions();
    setSessions(savedSessions);
    setSelectedSessionId(current => current || savedSessions[0]?.id);
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const startNewLesson = () => {
    setSelectedSessionId(undefined);
    setTitle('');
    setSourceUrl('');
    setTranscript('');
    setMessage(undefined);
    setRevealedAnswers({});
  };

  const saveLesson = async () => {
    const validation = validateVideoStudyInput(sourceUrl, transcript);
    if (!validation.source) {
      setMessage(validation.error);
      return;
    }

    const now = new Date().toISOString();
    const session: VideoStudySession = {
      id: createSessionId(),
      title: title.trim() || t('video.untitledLesson'),
      source: validation.source,
      transcript: transcript.trim(),
      createdAt: now,
      updatedAt: now,
    };

    await storageService.saveVideoSession(session);
    setSessions(previous => [session, ...previous.filter(existing => existing.id !== session.id)]);
    setSelectedSessionId(session.id);
    setMessage(t('video.savedLocally'));
    setRevealedAnswers({});
  };

  const deleteLesson = async (sessionId: string) => {
    const session = sessions.find(item => item.id === sessionId);
    if (!session || !window.confirm(t('video.confirmDelete'))) return;

    await storageService.removeVideoSession(sessionId);
    const remaining = sessions.filter(item => item.id !== sessionId);
    setSessions(remaining);
    setSelectedSessionId(remaining[0]?.id);
    setRevealedAnswers({});
    setMessage(t('video.deletedLesson'));
  };

  const openAtTimestamp = (seconds: number) => {
    if (!selectedSession) return;
    window.open(buildVideoUrlAtTime(selectedSession.source, seconds), '_blank', 'noopener,noreferrer');
  };

  return (
    <VStack as="section" gap={6} padding={6} maxWidth={1120} aria-labelledby="video-studio-title">
      <VStack gap={2}>
        <HStack gap={2} align="center" wrap="wrap">
          <Badge label={t('video.localOnlyBadge')} variant="success" icon={<Sparkles aria-hidden="true" />} />
          <Badge label={t('video.noLoginBadge')} variant="info" icon={<Video aria-hidden="true" />} />
        </HStack>
        <Heading id="video-studio-title" level={1}>{t('video.title')}</Heading>
        <Text color="secondary">{t('video.subtitle')}</Text>
      </VStack>

      <Card variant="blue" padding={4}>
        <VStack gap={2}>
          <Text weight="semibold">{t('video.privacyTitle')}</Text>
          <Text color="secondary">{t('video.privacyDescription')}</Text>
        </VStack>
      </Card>

      <Grid columns={{ minWidth: 320, max: 2, repeat: 'fit' }} gap={4}>
        <Card padding={4}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={2}>{t('video.createTitle')}</Heading>
              <Text color="secondary">{t('video.createDescription')}</Text>
            </VStack>
            <TextInput
              label={t('video.lessonTitle')}
              value={title}
              onChange={setTitle}
              isOptional
              placeholder={t('video.lessonTitlePlaceholder')}
              width="100%"
            />
            <TextInput
              label={t('video.urlLabel')}
              value={sourceUrl}
              onChange={setSourceUrl}
              isRequired
              placeholder="https://www.youtube.com/watch?v=..."
              description={t('video.urlDescription')}
              width="100%"
            />
            <TextArea
              label={t('video.transcriptLabel')}
              value={transcript}
              onChange={setTranscript}
              isRequired
              rows={10}
              maxLength={50000}
              placeholder={t('video.transcriptPlaceholder')}
              description={t('video.transcriptDescription')}
              width="100%"
            />
            {message && <Text role="status" color="secondary">{message}</Text>}
            <HStack gap={2} wrap="wrap">
              <Button label={t('video.buildLesson')} variant="primary" icon={<Sparkles aria-hidden="true" />} onClick={() => void saveLesson()} />
              <Button label={t('video.newLesson')} variant="secondary" icon={<Plus aria-hidden="true" />} onClick={startNewLesson} />
            </HStack>
          </VStack>
        </Card>

        <Card padding={4}>
          <VStack gap={4}>
            <VStack gap={1}>
              <Heading level={2}>{t('video.libraryTitle')}</Heading>
              <Text color="secondary">{t('video.libraryDescription')}</Text>
            </VStack>
            {sessions.length === 0 ? (
              <Section variant="muted" padding={4}>
                <VStack gap={2} align="center">
                  <FileText aria-hidden="true" />
                  <Text weight="semibold">{t('video.emptyTitle')}</Text>
                  <Text color="secondary">{t('video.emptyDescription')}</Text>
                </VStack>
              </Section>
            ) : (
              <VStack gap={2}>
                {sessions.map(session => (
                  <Section key={session.id} variant={selectedSession?.id === session.id ? 'muted' : 'transparent'} padding={3}>
                    <HStack gap={3} align="center" wrap="wrap">
                      <VStack gap={0.5} width="100%">
                        <Text weight="semibold">{session.title}</Text>
                        <Text type="supporting" color="secondary">
                          {session.source.platform === 'youtube' ? 'YouTube' : 'Bilibili'}
                        </Text>
                      </VStack>
                      <HStack gap={1} wrap="wrap">
                        <Button label={t('video.openLesson')} size="sm" variant="secondary" onClick={() => setSelectedSessionId(session.id)} />
                        <Button label={t('video.deleteLesson')} size="sm" variant="destructive" icon={<Trash2 aria-hidden="true" />} onClick={() => void deleteLesson(session.id)} />
                      </HStack>
                    </HStack>
                  </Section>
                ))}
              </VStack>
            )}
          </VStack>
        </Card>
      </Grid>

      {selectedSession && studyPlan && (
        <VStack gap={4} aria-live="polite">
          <HStack gap={3} align="center" wrap="wrap">
            <VStack gap={0.5} width="100%">
              <Heading level={2}>{selectedSession.title}</Heading>
              <Text color="secondary">{t('video.readyDescription', { minutes: studyPlan.estimatedStudyMinutes })}</Text>
            </VStack>
            <Link href={selectedSession.source.canonicalUrl} isExternalLink isStandalone>
              {t('video.openSourceVideo')}
            </Link>
          </HStack>

          <Grid columns={{ minWidth: 180, max: 3, repeat: 'fit' }} gap={3}>
            <Card padding={3} variant="purple">
              <VStack gap={1}>
                <Text type="supporting" color="secondary">{t('video.statWords')}</Text>
                <Heading level={3}>{studyPlan.wordCount}</Heading>
              </VStack>
            </Card>
            <Card padding={3} variant="green">
              <VStack gap={1}>
                <Text type="supporting" color="secondary">{t('video.statVocabulary')}</Text>
                <Heading level={3}>{studyPlan.vocabulary.length}</Heading>
              </VStack>
            </Card>
            <Card padding={3} variant="orange">
              <VStack gap={1}>
                <Text type="supporting" color="secondary">{t('video.statQuestions')}</Text>
                <Heading level={3}>{studyPlan.clozeQuestions.length}</Heading>
              </VStack>
            </Card>
          </Grid>

          <Grid columns={{ minWidth: 320, max: 2, repeat: 'fit' }} gap={4}>
            <Card padding={4}>
              <VStack gap={3}>
                <HStack gap={2} align="center">
                  <ListChecks aria-hidden="true" />
                  <Heading level={2}>{t('video.clozeTitle')}</Heading>
                </HStack>
                {studyPlan.clozeQuestions.length > 0 ? studyPlan.clozeQuestions.map((question, index) => (
                  <Section key={question.id} variant="transparent" padding={2}>
                    <VStack gap={2}>
                      <HStack gap={2} align="center" wrap="wrap">
                        <Badge label={`${index + 1}`} variant="purple" />
                        <Button
                          label={formatTimestamp(question.startSeconds)}
                          size="sm"
                          variant="ghost"
                          icon={<PlayCircle aria-hidden="true" />}
                          onClick={() => openAtTimestamp(question.startSeconds)}
                        />
                      </HStack>
                      <Text>{question.prompt}</Text>
                      {revealedAnswers[question.id] ? (
                        <Text weight="semibold">{t('video.answer')}: {question.answer}</Text>
                      ) : (
                        <Button label={t('video.revealAnswer')} size="sm" variant="secondary" onClick={() => setRevealedAnswers(previous => ({ ...previous, [question.id]: true }))} />
                      )}
                    </VStack>
                  </Section>
                )) : <Text color="secondary">{t('video.noQuestions')}</Text>}
              </VStack>
            </Card>

            <Card padding={4}>
              <VStack gap={3}>
                <HStack gap={2} align="center">
                  <BookOpenCheck aria-hidden="true" />
                  <Heading level={2}>{t('video.vocabularyTitle')}</Heading>
                </HStack>
                {studyPlan.vocabulary.length > 0 ? studyPlan.vocabulary.map(item => (
                  <Section key={item.word} variant="transparent" padding={2}>
                    <VStack gap={1}>
                      <HStack gap={2} align="center" wrap="wrap">
                        <Text weight="semibold">{item.word}</Text>
                        <Badge label={`AWL ${item.sublist}`} variant="blue" />
                        <Badge label={item.cefr} variant="teal" />
                      </HStack>
                      <Text>{item.definition}</Text>
                      <Text color="secondary">{item.definitionVi} · {t('video.occurrences', { count: item.occurrences })}</Text>
                    </VStack>
                  </Section>
                )) : <Text color="secondary">{t('video.noVocabulary')}</Text>}
              </VStack>
            </Card>
          </Grid>

          <Card padding={4}>
            <VStack gap={3}>
              <HStack gap={2} align="center">
                <ExternalLink aria-hidden="true" />
                <Heading level={2}>{t('video.transcriptTimeline')}</Heading>
              </HStack>
              {studyPlan.segments.slice(0, 12).map(segment => (
                <Section key={segment.id} variant="transparent" padding={2}>
                  <HStack gap={3} align="start" wrap="wrap">
                    <Button
                      label={formatTimestamp(segment.startSeconds)}
                      size="sm"
                      variant="ghost"
                      onClick={() => openAtTimestamp(segment.startSeconds)}
                    />
                    <Text>{segment.text}</Text>
                  </HStack>
                </Section>
              ))}
            </VStack>
          </Card>
        </VStack>
      )}
    </VStack>
  );
};
