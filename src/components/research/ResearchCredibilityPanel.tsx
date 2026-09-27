import React from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Badge as AstryxBadge } from '@astryxdesign/core/Badge';
import { Button as AstryxButton } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { ExternalLink, GraduationCap, LibraryBig, ShieldCheck } from 'lucide-react';
import { SkillType } from '../../types';
import { useI18n } from '../../i18n/i18nContext';
import {
  IELTS_RESEARCH_REFERENCES,
  buildScholarSearchUrl,
  createScholarCitationKit,
  generateEvidenceStudyPlan,
  summarizeEvidenceCoverage,
} from '../../research/evidenceEngine';

export interface ResearchCredibilityPanelProps {
  targetBand: number;
  onSelectSkill: (skill: SkillType | 'dashboard' | 'settings') => void;
}

export const ResearchCredibilityPanel: React.FC<ResearchCredibilityPanelProps> = ({
  targetBand,
  onSelectSkill,
}) => {
  const { language, t } = useI18n();
  const summary = summarizeEvidenceCoverage();
  const weeklyPlan = generateEvidenceStudyPlan({
    targetBand,
    weeklyMinutes: 150,
    prioritySkills: ['writing', 'speaking', 'vocabulary'],
    language,
  });
  const citationKit = createScholarCitationKit(language);
  const featuredReferences = IELTS_RESEARCH_REFERENCES.slice(0, 3);

  return (
    <Card
      padding={5}
      elevation="low"
      className="border border-indigo-100 dark:border-indigo-900/70 bg-white dark:bg-slate-800 rounded-3xl shadow-sm"
      data-testid="research-credibility-panel"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <AstryxBadge label="Astryx UI" variant="purple" />
            <AstryxBadge label="Google Scholar Kit" variant="blue" />
            <AstryxBadge label="No Login" variant="success" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
              <GraduationCap className="w-5 h-5" aria-hidden="true" />
              <Text type="label" weight="bold" color="accent">
                {t('research.eyebrow')}
              </Text>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {t('research.title')}
            </h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-3xl">
              {t('research.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 p-4 border border-indigo-100 dark:border-indigo-900">
              <div className="text-2xl font-black text-indigo-700 dark:text-indigo-300">
                {summary.totalReferences}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                {t('research.references')}
              </div>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-100 dark:border-emerald-900">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {summary.yearRange}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                {t('research.yearRange')}
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/70 p-4 border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100">
                5/5
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {t('research.skillCoverage')}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {summary.topTags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <AstryxButton
              label={t('research.ctaWriting')}
              variant="primary"
              size="sm"
              onClick={() => onSelectSkill('writing')}
            />
            <AstryxButton
              label={t('research.ctaVocabulary')}
              variant="secondary"
              size="sm"
              onClick={() => onSelectSkill('vocabulary')}
            />
            <a
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
              href={`data:text/markdown;charset=utf-8,${encodeURIComponent(citationKit)}`}
              download="ielts-slayer-scholar-kit.md"
            >
              <LibraryBig className="w-3.5 h-3.5" aria-hidden="true" />
              {t('research.downloadKit')}
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <h3 className="font-bold text-sm">{t('research.planTitle')}</h3>
            </div>
            <div className="space-y-2">
              {weeklyPlan.map(item => (
                <div key={item.skill} className="flex items-start justify-between gap-3 text-xs">
                  <span className="font-semibold capitalize text-slate-700 dark:text-slate-200">
                    {item.skill}
                  </span>
                  <span className="text-right text-slate-500 dark:text-slate-400">
                    {item.minutes} {t('common.minutes')} · {item.referenceIds.length} refs
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {featuredReferences.map(reference => (
              <a
                key={reference.id}
                href={buildScholarSearchUrl(reference)}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:border-indigo-300 dark:hover:border-indigo-600 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {reference.authors} ({reference.year})
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {reference.title}
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-500 shrink-0" aria-hidden="true" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
