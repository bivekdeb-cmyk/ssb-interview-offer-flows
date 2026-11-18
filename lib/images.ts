// Placeholder imagery from Unsplash (swap for real SSB assets later).
const u = (id: string, w = 800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

export const IMG = {
  campus: u("photo-1541339907198-e08756dedf3f", 1200),
  cohort: u("photo-1522202176988-66273c2fd55f", 1200),
  classroom: u("photo-1517245386807-bb43f82c33c4", 900),
  meeting: u("photo-1552664730-d307ca884978", 900),
  laptop: u("photo-1531482615713-2afd69097998", 900),
  graduation: u("photo-1523050854058-8df90110c9f1", 1200),
  counsellor: u("photo-1573496359142-b8d87734a5a2", 200),
  interviewer: u("photo-1507003211169-0a1dd7228f2e", 200),
  lead: u("photo-1494790108377-be9c29b29330", 200),
};
