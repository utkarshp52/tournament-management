import TopBar from '../components/TopBar';

function ComingSoon({ icon, title, phase, desc }) {
  return (
    <>
      <TopBar title={`${icon} ${title}`} />
      <div style={{ padding: '64px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>{icon}</div>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{title}</h2>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '16px' }}>{desc}</p>
        <span className="badge badge-warning">📋 {phase}</span>
      </div>
    </>
  );
}

export function MatchesPage() {
  return <ComingSoon icon="📅" title="Match Schedule" phase="Phase 3" desc="Fixture generation, scheduling, and venue/umpire assignment coming in Phase 3." />;
}

export function ResultsPage() {
  return <ComingSoon icon="✅" title="Match Results" phase="Phase 3" desc="Result entry and automatic standings update coming in Phase 3." />;
}

export function StandingsPage() {
  return <ComingSoon icon="📋" title="Points Table" phase="Phase 4" desc="Live standings, wins/losses, and rankings coming in Phase 4." />;
}

export function StatisticsPage() {
  return <ComingSoon icon="📈" title="Statistics" phase="Phase 4" desc="Team and player performance statistics coming in Phase 4." />;
}

export function KnockoutPage() {
  return <ComingSoon icon="🥇" title="Knockout Bracket" phase="Phase 4" desc="Semi-finals, finals, and champion declaration coming in Phase 4." />;
}
