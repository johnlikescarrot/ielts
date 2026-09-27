import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudyPlan } from '../../src/components/dashboard/StudyPlan';
import { I18nProvider } from '../../src/i18n/i18nContext';

describe('StudyPlan', () => {
  it('renders bilingual-ready task copy and routes each task to its skill', async () => {
    const onSelectSkill = vi.fn();
    render(
      <I18nProvider>
        <StudyPlan
          plan={{
            date: '2026-09-27',
            targetMinutes: 30,
            tasks: [
              { id: 'vocab', skill: 'vocabulary', minutes: 10, reason: 'due-vocabulary', dueCardCount: 12 },
              { id: 'writing', skill: 'writing', minutes: 10, reason: 'focus-skill' },
              { id: 'reading', skill: 'reading', minutes: 10, reason: 'balance' },
            ],
          }}
          onSelectSkill={onSelectSkill}
        />
      </I18nProvider>
    );

    expect(screen.getByText('Your adaptive plan for today')).toBeInTheDocument();
    expect(screen.getByText('Review 12 due vocabulary cards')).toBeInTheDocument();
    expect(screen.getByText('Strengthen Writing Evaluator')).toBeInTheDocument();
    expect(screen.getByText('Keep Reading active')).toBeInTheDocument();
    expect(screen.getByText('30 min plan')).toBeInTheDocument();

    const startButtons = screen.getAllByRole('button', { name: 'Start' });
    await userEvent.click(startButtons[0]);
    await userEvent.click(startButtons[1]);
    await userEvent.click(startButtons[2]);
    expect(onSelectSkill.mock.calls).toEqual([
      ['vocabulary'],
      ['writing'],
      ['reading'],
    ]);
  });
});
