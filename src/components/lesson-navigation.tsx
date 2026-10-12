import type { Lesson } from '@/lib/types';

interface LessonNavigationProps {
  lessons: Lesson[];
  current: number;
  completed: Set<number>;
  onSelect: (index: number) => void;
}

export function LessonNavigation({ lessons, current, completed, onSelect }: LessonNavigationProps) {
  return (
    <nav className="lesson-navigation" aria-label="Lessons">
      {lessons.map((lesson, index) => (
        <button
          aria-label={`Lesson ${index + 1}: ${lesson.name}`}
          aria-current={current === index ? 'step' : undefined}
          className={`${current === index ? 'is-current' : ''} ${completed.has(index) ? 'is-complete' : ''}`}
          key={lesson.name}
          onClick={() => onSelect(index)}
          title={lesson.name}
          type="button"
        >
          {index + 1}
        </button>
      ))}
    </nav>
  );
}