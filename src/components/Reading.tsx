import {Badge, Card, Heading, Text} from '@astryxdesign/core';
import type {StudyState} from '../types';
import type {CopyKey} from '../lib/i18n';

export function Reading({
  state,
  t,
}: {
  state: StudyState;
  t: (key: CopyKey) => string;
}) {
  return (
    <div className="view-stack">
      <div className="section-heading">
        <div>
          <Heading level={1}>{t('capturedReading')}</Heading>
          <Text as="p" color="secondary">
            {t('noCaptures')}
          </Text>
        </div>
        <Badge variant="teal" label={state.captures.length} />
      </div>
      {state.captures.length === 0 ? (
        <Card padding={6} variant="muted">
          <div className="empty-state">
            <span aria-hidden="true">“</span>
            <Heading level={2}>{t('noCaptures')}</Heading>
          </div>
        </Card>
      ) : (
        <div className="capture-list">
          {state.captures.map((capture) => (
            <Card key={capture.id} padding={4}>
              <article className="capture">
                <blockquote>{capture.text}</blockquote>
                <footer>
                  <Text as="span" type="supporting" color="secondary">
                    {capture.sourceTitle || t('source')}
                  </Text>
                  {capture.cardId ? (
                    <Badge variant="success" label={t('vocabulary')} />
                  ) : null}
                </footer>
              </article>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
