import { useEffect, useState } from 'react';

import { api } from '../services/api';

export function ExplainableAI() {

  const [data, setData] = useState(null);

  const [error, setError] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    let active = true;

    api.getExplanation().then(value => { if (active) setData(value); })

      .catch(err => { if (active) setError(err.message); })

      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };

  }, []);

  return <section className="animate-fade-in">

    <h2>Model feature importance</h2>

    {loading && <p>Loading model importance…</p>}

    {error && <p role="alert">{error}</p>}

    {data && <><p>{data.method} — {data.scope}</p><p>{data.limitation}</p>

      <table style={{width:'100%'}}><thead><tr><th>Feature</th><th>Importance</th></tr></thead>

        <tbody>{data.features.map(row => <tr key={row.feature}><td>{row.feature}</td><td>{row.importance.toFixed(6)}</td></tr>)}</tbody>

      </table></>}

  </section>;

}

