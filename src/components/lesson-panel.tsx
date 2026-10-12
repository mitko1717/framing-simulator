import type { Lesson, Metrics } from '@/lib/types';

interface LessonPanelProps {
  lesson: Lesson;
  lessonNumber: number;
  metrics: Metrics | null;
  onNext: () => void;
}

export function LessonPanel({ lesson, lessonNumber, metrics, onNext }: LessonPanelProps) {
  const results = metrics ? lesson.checks.map(([, check]) => check(metrics)) : [];
  const complete = results.length > 0 && results.every(Boolean);

  return (
    <section className="panel lesson-panel" aria-labelledby="lesson-title">
      <div className="lesson-copy">
        <span className="eyebrow">LESSON {String(lessonNumber).padStart(2, '0')}</span>
        <h2 id="lesson-title">{lesson.name}</h2>
        <p>{lesson.description}</p>
      </div>
      <ul className="check-list">
        {lesson.checks.map(([label, , detail], index) => (
          <li className={results[index] ? 'is-passed' : ''} key={label}>
            <span className="check-mark" aria-hidden="true">{results[index] ? '✓' : '○'}</span>
            <span>{label}</span>
            {detail && metrics ? <small>{detail(metrics)}</small> : null}
          </li>
        ))}
      </ul>
      <div className="lesson-footer" aria-live="polite">
        <p className={complete ? 'status-message is-complete' : 'status-message'}>
          {complete
            ? lessonNumber < 8 ? 'Lesson complete. Take the shot or continue.' : 'Great frame. Press the shutter.'
            : `${results.filter(Boolean).length}/${lesson.checks.length} requirements met`}
        </p>
        {complete && lessonNumber < 8 ? <button className="text-action" onClick={onNext} type="button">Next lesson <span aria-hidden="true">→</span></button> : null}
      </div>
    </section>
  );
}