'use client';

import { useState } from 'react';

export interface Shot {
  image: string;
  lesson: number;
  score: number;
}

interface ShotFeedProps {
  shots: Shot[];
}

export function ShotFeed({ shots }: ShotFeedProps) {
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);

  return (
    <section className="panel shot-panel" aria-labelledby="shots-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR SESSION</span>
          <h2 id="shots-title">Shot feed <span className="shot-count">{shots.length}</span></h2>
        </div>
      </div>
      {shots.length ? (
        <div className="shot-list">
          {shots.map((shot, index) => (
            <button className="shot-thumbnail" key={`${shot.lesson}-${index}`} onClick={() => setSelectedShot(shot)} type="button">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={`Shot from lesson ${shot.lesson}`} src={shot.image} />
              <span>Lesson {shot.lesson} <strong>{shot.score}%</strong></span>
            </button>
          ))}
        </div>
      ) : <p className="empty-feed">Your captured frames will appear here.</p>}
      {selectedShot ? (
        <button aria-label="Close enlarged shot" className="lightbox" onClick={() => setSelectedShot(null)} type="button">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={`Enlarged shot from lesson ${selectedShot.lesson}`} src={selectedShot.image} />
        </button>
      ) : null}
    </section>
  );
}