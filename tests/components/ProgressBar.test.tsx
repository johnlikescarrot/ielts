import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../../src/components/common/ProgressBar';

describe('ProgressBar Component', () => {
  it('renders with default props', () => {
    render(<ProgressBar value={50} />);
    // Since label and showPercentage default to true/undefined but label is undefined,
    // showPercentage defaults to true, so 50% should be in the document
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders with custom labels and sublabels', () => {
    render(
      <ProgressBar
        value={75}
        max={100}
        label="Task Progress"
        sublabel="75/100"
      />
    );
    expect(screen.getByText('Task Progress')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('hides percentage when showPercentage is false', () => {
    render(
      <ProgressBar
        value={50}
        label="Hidden Percent"
        showPercentage={false}
      />
    );
    expect(screen.getByText('Hidden Percent')).toBeInTheDocument();
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('clamps value to a maximum of 100%', () => {
    render(<ProgressBar value={150} max={100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('clamps value to a minimum of 0%', () => {
    render(<ProgressBar value={-50} max={100} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('rounds percentage correctly', () => {
    // 1/3 is ~33.333% -> rounds to 33%
    render(<ProgressBar value={1} max={3} />);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('applies color variants correctly', () => {
    const { container, rerender } = render(<ProgressBar value={20} color="emerald" />);
    // Check if the inner div has the corresponding background class
    expect(container.querySelector('.bg-emerald-600')).toBeInTheDocument();

    rerender(<ProgressBar value={20} color="amber" />);
    expect(container.querySelector('.bg-amber-500')).toBeInTheDocument();

    rerender(<ProgressBar value={20} color="rose" />);
    expect(container.querySelector('.bg-rose-600')).toBeInTheDocument();

    rerender(<ProgressBar value={20} color="purple" />);
    expect(container.querySelector('.bg-purple-600')).toBeInTheDocument();

    rerender(<ProgressBar value={20} color="indigo" />);
    expect(container.querySelector('.bg-indigo-600')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ProgressBar value={50} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
