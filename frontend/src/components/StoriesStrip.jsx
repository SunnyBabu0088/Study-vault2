const stories = [
  { seed: 'You', name: 'You', you: true, presence: 'presence-online' },
  { seed: 'Aly', name: 'Aly', you: false, presence: 'presence-online' },
  { seed: 'Mia', name: 'Mia', you: false, presence: 'presence-typing' },
  { seed: 'Noah', name: 'Noah', you: false, presence: 'presence-offline' },
  { seed: 'Zoe', name: 'Zoe', you: false, presence: 'presence-online' },
  { seed: 'Leo', name: 'Leo', you: false, presence: 'presence-offline' },
];

export default function StoriesStrip() {
  return (
    <section className="px-2 py-5 sm:px-4" aria-labelledby="stories-title">
      <div className="mb-4">
        <p className="m-0 text-xs font-bold uppercase tracking-[.15em]">Your circle</p>
        <h2 id="stories-title" className="m-0 mt-1 font-bold">
          Study stories
        </h2>
      </div>
      <div className="story-strip flex gap-5 overflow-x-auto pb-1">
        {stories.map((story) => (
          <article key={story.seed} className="w-[70px] shrink-0 text-center">
            <div className={`story-ring ${story.you ? 'you' : ''} relative mx-auto h-[62px] w-[62px] rounded-full`}>
              <img
                className="h-full w-full rounded-full border-2 border-white object-cover"
                src={`https://api.dicebear.com/6.x/avataaars/svg?seed=${story.seed}`}
                alt={story.name}
                loading="lazy"
              />
              <span
                className={`presence-dot ${story.presence} absolute bottom-0 right-0 h-4 w-4 rounded-full`}
              ></span>
            </div>
            <p className="mt-2 truncate text-xs font-bold">{story.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
