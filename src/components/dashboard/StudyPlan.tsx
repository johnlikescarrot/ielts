import React from 'react';
import { ArrowRight, BookOpen, Film, Headphones, Layers, Mic, PenTool, Sparkles } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { SkillType } from '../../types';
import { StudyPlan as StudyPlanData, StudyPlanTask } from '../../study/studyPlanner';
import { useI18n } from '../../i18n/i18nContext';

export interface StudyPlanProps {
  plan: StudyPlanData;
  onSelectSkill: (skill: SkillType) => void;
}

const skillIcons: Record<SkillType, React.FC<{ className?: string }>> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenTool,
  speaking: Mic,
  vocabulary: Layers,
  'video-lab': Film,
  'mock-test': Sparkles,
  analytics: Sparkles,
};

function getTaskCopy(task: StudyPlanTask, t: (key: string, params?: Record<string, string | number>) => string) {
  if (task.reason === 'due-vocabulary') {
    return {
      title: t('dash.planVocabularyTitle', { count: task.dueCardCount || 0 }),
      description: t('dash.planVocabularyDescription'),
    };
  }

  const skillName = t(`nav.${task.skill}`);
  if (task.reason === 'focus-skill') {
    return {
      title: t('dash.planFocusTitle', { skill: skillName }),
      description: t('dash.planFocusDescription'),
    };
  }

  return {
    title: t('dash.planBalanceTitle', { skill: skillName }),
    description: t('dash.planBalanceDescription'),
  };
}

export const StudyPlan: React.FC<StudyPlanProps> = ({ plan, onSelectSkill }) => {
  const { t } = useI18n();

  return (
    <Card variant="blue" padding={4} className="study-plan-card" data-testid="study-plan">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('dash.planTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('dash.planSubtitle')}</p>
            </div>
          </div>
          <span className="self-start rounded-full bg-indigo-100 dark:bg-indigo-950 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            {t('dash.planMinutes', { minutes: plan.targetMinutes })}
          </span>
        </div>

        <ol className="grid gap-2" aria-label={t('dash.planTitle')}>
          {plan.tasks.map((task, index) => {
            const Icon = skillIcons[task.skill];
            const copy = getTaskCopy(task, t);
            return (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-900/50 p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-500 dark:text-slate-400">
                  {index + 1}
                </span>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                  <Icon className="w-4 h-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">{copy.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{copy.description}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-300">{task.minutes}m</span>
                  <Button
                    label={t('dash.planStart')}
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelectSkill(task.skill)}
                    endContent={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Card>
  );
};
